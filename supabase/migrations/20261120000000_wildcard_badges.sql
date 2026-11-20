-- Wildcard badges: seven hidden badges the app hands out the moment the thing happens.
-- Each one is a player_badges row with period_key 'wild', so a player earns each at most once.
-- Names, icons and copy live in src/features/badges/definitions.ts.

alter table public.players add column added_as_guest boolean not null default false;
comment on column public.players.added_as_guest is 'Typed in at Pitch-side as a walk-in with no account. Used for the Mystery Trialist badge.';

create or replace function public.award_wildcard(p_player uuid, p_key text, p_detail text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  b player_badges;
begin
  if p_player is null then
    return;
  end if;
  insert into player_badges (player_id, badge_key, period_key, detail, awarded_at, expires_at, status, auto_live_at)
  values (p_player, p_key, 'wild', p_detail, now(), now() + interval '12 months', 'live', now())
  on conflict (player_id, badge_key, period_key) do nothing
  returning * into b;
  if b.id is not null then
    perform notify_badge_won(b);
  end if;
end;
$$;

revoke all on function public.award_wildcard(uuid, text, text) from public, anon, authenticated;

-- Computer Says No: a payment the card provider turned down.
create or replace function public.wild_declined()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'failed' and old.status is distinct from 'failed' then
    perform award_wildcard(new.player_id, 'wild-declined', 'Paid with a card that got declined');
  end if;
  return null;
end;
$$;

create trigger payments_wild_declined after update of status on public.payments
  for each row execute function public.wild_declined();

-- Pulled a Hamstring: gave up a paid weekly spot before claims closed (the refund flag from flag_weekly_refund).
create or replace function public.wild_pulled_out()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'refund_due' and old.status is distinct from 'refund_due'
     and new.kind = 'weekly' and new.note = 'Gave up the spot before claims closed' then
    perform award_wildcard(new.player_id, 'wild-pulled-out', 'Paid for a spot, then pulled out before the draw');
  end if;
  return null;
end;
$$;

create trigger payments_wild_pulled_out after update of status on public.payments
  for each row execute function public.wild_pulled_out();

-- Super Sub: took a weekly spot while on standby. Runs before the claim, because the claim clears the standby entry.
create or replace function public.wild_super_sub()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from matchday_standby_entries where matchday_id = new.matchday_id and player_id = new.player_id) then
    perform award_wildcard(new.player_id, 'wild-super-sub', 'Came off standby and took the spot');
  end if;
  return new;
end;
$$;

create trigger weekly_claims_wild_super_sub before insert on public.weekly_claims
  for each row execute function public.wild_super_sub();

-- Mystery Trialist: a walk-in typed in at Pitch-side who ends up on a side.
create or replace function public.wild_mystery_trialist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from players where id = new.player_id and added_as_guest) then
    perform award_wildcard(new.player_id, 'wild-trialist', 'Turned up as a mystery guest and got a shirt');
  end if;
  return null;
end;
$$;

create trigger team_members_wild_trialist after insert on public.team_members
  for each row execute function public.wild_mystery_trialist();

-- Early Bath: a yellow and a red for the same player in one game.
create or replace function public.wild_early_bath()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from pitch_cards where game_id = new.game_id and player_id = new.player_id and kind = 'yellow')
     and exists (select 1 from pitch_cards where game_id = new.game_id and player_id = new.player_id and kind = 'red') then
    perform award_wildcard(new.player_id, 'wild-early-bath', 'A yellow and a red in one game');
  end if;
  return null;
end;
$$;

create trigger pitch_cards_wild_early_bath after insert on public.pitch_cards
  for each row execute function public.wild_early_bath();

-- Wrong End: scored at the wrong end, live at Pitch-side or in a filed result.
create or replace function public.wild_wrong_end()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.own_goal and new.scorer_id is not null then
    perform award_wildcard(new.scorer_id, 'wild-wrong-end', 'Put one past their own keeper');
  end if;
  return null;
end;
$$;

create trigger pitch_goals_wild_wrong_end after insert or update of own_goal, scorer_id on public.pitch_goals
  for each row execute function public.wild_wrong_end();
create trigger goals_wild_wrong_end after insert or update of own_goal, scorer_id on public.goals
  for each row execute function public.wild_wrong_end();

-- Left the Pitch: started paying, closed the page, and the checkout never finished.
-- Time based, so a job looks for it. The grace period keeps slow payers from getting it.
create or replace function public.award_left_the_pitch()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select distinct p.player_id
    from payments p
    where p.status = 'pending'
      and p.hold_until is not null
      and p.hold_until < now() - interval '5 minutes'
      and not exists (
        select 1 from payments q
        where q.player_id = p.player_id and q.kind = p.kind
          and q.matchday_id is not distinct from p.matchday_id and q.month is not distinct from p.month
          and q.status in ('paid', 'refund_due', 'refunded')
      )
  loop
    perform award_wildcard(r.player_id, 'wild-left-pitch', 'Started paying, then walked away');
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public.award_left_the_pitch() from public, anon, authenticated;

select cron.schedule('wildcard-left-the-pitch', '*/5 * * * *', 'select public.award_left_the_pitch()');
