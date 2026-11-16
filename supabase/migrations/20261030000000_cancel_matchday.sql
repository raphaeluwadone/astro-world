-- Cancelling a matchday flags paid weekly spots for a refund and tells everyone who was in or waiting.
-- Monthly spots aren't refunded (rule 1.6), they still cover the month's other Sundays.

create or replace function public.on_matchday_cancelled()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  m record;
  month_start date := date_trunc('month', new.played_at at time zone 'Europe/London')::date;
begin
  if new.status <> 'cancelled' or old.status = 'cancelled' then
    return null;
  end if;

  update payments set status = 'refund_due', note = 'Matchday was cancelled'
  where matchday_id = new.id and kind = 'weekly' and status = 'paid';

  for m in
    with affected as (
      select player_id, 'weekly' as role from weekly_claims where matchday_id = new.id
      union all
      select player_id, 'standby' from matchday_standby_entries where matchday_id = new.id
      union all
      select mm.player_id, 'monthly' from monthly_memberships mm
      where mm.month = month_start
        and not exists (select 1 from availability a where a.matchday_id = new.id and a.player_id = mm.player_id and a.status = 'out')
    )
    select a.player_id, min(a.role) as role,
           (select (sum(p.amount_kobo) / 100)::int from payments p
            where p.matchday_id = new.id and p.player_id = a.player_id and p.kind = 'weekly'
              and p.status = 'refund_due' and p.note = 'Matchday was cancelled') as refund
    from affected a
    group by a.player_id
  loop
    perform notify(
      player_user(m.player_id), 'matchday_cancelled',
      jsonb_build_object('matchday_id', new.id, 'played_at', new.played_at, 'role', m.role, 'refund', m.refund),
      '/matchday', null, 'cancelled:' || new.id || ':' || m.player_id, 'matchday-cancelled', 'email_matchday'
    );
  end loop;
  return null;
end;
$$;

create trigger matchdays_cancelled after update of status on matchdays
  for each row execute function on_matchday_cancelled();

-- A checkout that clears after the cancel goes straight to the refund list.
create or replace function public.refund_payment_for_cancelled_matchday()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'paid' and new.kind = 'weekly'
     and exists (select 1 from matchdays where id = new.matchday_id and status = 'cancelled') then
    new.status := 'refund_due';
    new.note := 'Matchday was cancelled';
  end if;
  return new;
end;
$$;

create trigger payments_refund_cancelled_matchday before update of status on payments
  for each row execute function refund_payment_for_cancelled_matchday();
