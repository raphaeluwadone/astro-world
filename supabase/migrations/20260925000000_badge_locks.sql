-- Yearly titles are fixed for the year once live, and only awarded once the year is over.
-- Salami Cup badges are held until the next cup is won, not for a fixed time.

create or replace function public.badge_is_locked(p_badge_key text, p_period_key text, p_status badge_status)
returns boolean
language sql
immutable
as $$
  select p_status = 'live' and (p_period_key ~ '^\d{4}$' or p_badge_key in ('silverware', 'cup-hero'));
$$;

create or replace function public.guard_player_badges()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- Results-based yearly titles wait for the year to finish; hand-picked ones can go up any time.
    if new.period_key ~ '^\d{4}$'
       and new.period_key::int >= extract(year from now() at time zone 'Europe/London')
       and new.badge_key not in ('heart-of-the-team', 'card-collector', 'cup-hero') then
      return null;
    end if;
    return new;
  end if;

  if badge_is_locked(old.badge_key, old.period_key, old.status)
     and coalesce(current_setting('astro.cup_rollover', true), '') <> 'on' then
    raise exception 'Live yearly and cup badges can''t be changed' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger player_badges_guard
  before insert or update or delete on public.player_badges
  for each row execute function public.guard_player_badges();

-- Each cup badge runs until the next cup with a winner; the latest holders keep it indefinitely.
create or replace function public.roll_cup_badges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('astro.cup_rollover', 'on', true);
  update player_badges b
  set expires_at = coalesce(
    (select min(w.awarded_at) from player_badges w where w.badge_key = 'silverware' and w.awarded_at > b.awarded_at),
    '2999-12-31'::timestamptz
  )
  where b.badge_key in ('silverware', 'cup-hero')
    and b.expires_at is distinct from coalesce(
      (select min(w.awarded_at) from player_badges w where w.badge_key = 'silverware' and w.awarded_at > b.awarded_at),
      '2999-12-31'::timestamptz
    );
  perform set_config('astro.cup_rollover', 'off', true);
  return null;
end;
$$;

create trigger player_badges_cup_rollover
  after insert on public.player_badges
  for each statement execute function public.roll_cup_badges();

-- Bring existing cup badges onto the new rule.
select set_config('astro.cup_rollover', 'on', false);
update public.player_badges b
set expires_at = coalesce(
  (select min(w.awarded_at) from public.player_badges w where w.badge_key = 'silverware' and w.awarded_at > b.awarded_at),
  '2999-12-31'::timestamptz
)
where b.badge_key in ('silverware', 'cup-hero');
select set_config('astro.cup_rollover', 'off', false);
