-- Unpaid spots count until Saturday 20:00 (Lagos) before the matchday, then drop and go to standby.
-- A monthly spot bought into a full Sunday starts on standby for that Sunday.

create or replace function public.spot_pay_deadline(p_played_at timestamptz)
returns timestamptz
language sql
immutable
set search_path to 'public'
as $$
  with d as (select (p_played_at at time zone 'Africa/Lagos')::date as day)
  select least(
    ((d.day - ((extract(isodow from d.day)::int + 1) % 7)) + time '20:00') at time zone 'Africa/Lagos',
    p_played_at - interval '12 hours'
  )
  from d;
$$;
grant execute on function public.spot_pay_deadline(timestamptz) to anon, authenticated;

create or replace function public.price_set(p_kind payment_kind)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (select 1 from payment_prices where kind = p_kind);
$$;

create or replace function public.unpaid_spots_for(p_matchday uuid)
returns table(player_id uuid, kind text, amount numeric)
language sql
stable
security definer
set search_path to 'public'
as $$
  select wc.player_id, 'weekly', (select amount from payment_prices where kind = 'weekly')
  from weekly_claims wc
  where wc.matchday_id = p_matchday and price_set('weekly')
    and not exists (select 1 from payments p where p.weekly_claim_id = wc.id and p.status = 'paid')
  union all
  select mm.player_id, 'monthly', (select amount from payment_prices where kind = 'monthly')
  from matchdays md
  join monthly_memberships mm on mm.month = date_trunc('month', md.played_at at time zone 'Africa/Lagos')::date
  where md.id = p_matchday and price_set('monthly')
    and not exists (select 1 from availability a where a.matchday_id = md.id and a.player_id = mm.player_id and a.status = 'out')
    and not exists (select 1 from payments p where p.monthly_membership_id = mm.id and p.status = 'paid');
$$;
revoke execute on function public.unpaid_spots_for(uuid) from public, anon, authenticated;

-- Admins record a spot paid in cash or by transfer, so it isn't dropped at the deadline.
create or replace function public.mark_spot_paid(p_kind payment_kind, p_target uuid)
returns payments
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me players;
  wc weekly_claims;
  mm monthly_memberships;
  price numeric;
  p payments;
begin
  if not is_requesting_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  select * into me from players where user_id = auth.uid();
  select amount into price from payment_prices where kind = p_kind;
  if price is null then
    raise exception 'No price is set, so there''s nothing to mark';
  end if;
  if p_kind = 'weekly' then
    select * into wc from weekly_claims where id = p_target;
    if wc.id is null then raise exception 'That spot has gone'; end if;
    if exists (select 1 from payments where weekly_claim_id = wc.id and status = 'paid') then
      raise exception 'That spot is already paid';
    end if;
    insert into payments (kind, player_id, matchday_id, amount_kobo, status, weekly_claim_id, paid_at, note)
    values ('weekly', wc.player_id, wc.matchday_id, price * 100, 'paid', wc.id, now(), 'Cash or transfer, marked by ' || me.nickname)
    returning * into p;
  elsif p_kind = 'monthly' then
    select * into mm from monthly_memberships where id = p_target;
    if mm.id is null then raise exception 'That spot has gone'; end if;
    if exists (select 1 from payments where monthly_membership_id = mm.id and status = 'paid') then
      raise exception 'That spot is already paid';
    end if;
    insert into payments (kind, player_id, month, amount_kobo, status, monthly_membership_id, paid_at, note)
    values ('monthly', mm.player_id, mm.month, price * 100, 'paid', mm.id, now(), 'Cash or transfer, marked by ' || me.nickname)
    returning * into p;
  else
    raise exception 'Only weekly and monthly spots';
  end if;
  return p;
end;
$$;
revoke execute on function public.mark_spot_paid(payment_kind, uuid) from public, anon;
grant execute on function public.mark_spot_paid(payment_kind, uuid) to authenticated;

create or replace function public.drop_unpaid_spots()
returns int
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  md matchdays;
  u record;
  dropped int := 0;
begin
  for md in
    select * from matchdays
    where status = 'open' and now() >= spot_pay_deadline(played_at) and now() < played_at
  loop
    for u in select * from unpaid_spots_for(md.id) loop
      if u.kind = 'weekly' then
        delete from weekly_claims where matchday_id = md.id and player_id = u.player_id;
      else
        insert into availability (matchday_id, player_id, status) values (md.id, u.player_id, 'out')
        on conflict (matchday_id, player_id) do update set status = 'out', responded_at = now();
      end if;
      perform notify(
        player_user(u.player_id), 'spot_dropped',
        jsonb_build_object('matchday_id', md.id, 'played_at', md.played_at, 'kind', u.kind, 'amount', u.amount),
        '/matchday', null, 'dropped:' || md.id || ':' || u.player_id || ':' || extract(epoch from now())::bigint,
        'spot-dropped', 'email_matchday'
      );
      dropped := dropped + 1;
    end loop;
  end loop;
  return dropped;
end;
$$;
revoke execute on function public.drop_unpaid_spots() from public, anon, authenticated;

select cron.schedule('unpaid-spots', '*/5 * * * *', 'select public.drop_unpaid_spots()');

-- Placing a monthly member on standby isn't a spot opening up.
create or replace function public.notify_monthly_opt_out()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if coalesce(current_setting('astro.quiet_opt_out', true), '') = 'on' then
    return null;
  end if;
  if new.status = 'out' and (tg_op = 'INSERT' or old.status is distinct from 'out')
     and player_is_monthly_member_for(new.player_id, new.matchday_id) then
    perform notify_spot_opened(new.matchday_id, 'out:' || new.player_id || ':' || extract(epoch from now()));
  end if;
  return null;
end;
$$;

create or replace function public.monthly_join_full_sunday()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  md matchdays;
begin
  for md in
    select * from matchdays
    where status = 'open'
      and date_trunc('month', played_at at time zone 'Africa/Lagos')::date = new.month
      and weekly_spots_remaining(id) < 0
  loop
    perform set_config('astro.quiet_opt_out', 'on', true);
    insert into availability (matchday_id, player_id, status) values (md.id, new.player_id, 'out')
    on conflict (matchday_id, player_id) do update set status = 'out', responded_at = now();
    perform set_config('astro.quiet_opt_out', 'off', true);
    insert into matchday_standby_entries (matchday_id, player_id) values (md.id, new.player_id)
    on conflict do nothing;
  end loop;
  return null;
end;
$$;

create trigger monthly_memberships_full_sunday after insert on monthly_memberships
  for each row execute function monthly_join_full_sunday();

-- A monthly member who is out can only come back while there's room, and not unpaid after the deadline.
create or replace function public.guard_monthly_back_in()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  md matchdays;
begin
  if not (tg_op = 'UPDATE' and old.status = 'out' and new.status = 'in') then
    return new;
  end if;
  select * into md from matchdays where id = new.matchday_id;
  if now() >= spot_pay_deadline(md.played_at) and price_set('monthly')
     and not exists (
       select 1 from monthly_memberships mm join payments p on p.monthly_membership_id = mm.id and p.status = 'paid'
       where mm.player_id = new.player_id
         and mm.month = date_trunc('month', md.played_at at time zone 'Africa/Lagos')::date
     ) then
    raise exception 'Pay for your monthly spot to get back in for this Sunday';
  end if;
  if weekly_spots_remaining(md.id) <= 0 then
    raise exception 'This Sunday is full. You''re on standby and will hear if a spot opens.';
  end if;
  delete from matchday_standby_entries where matchday_id = md.id and player_id = new.player_id;
  return new;
end;
$$;

create trigger availability_guard_monthly_back_in before update on availability
  for each row execute function guard_monthly_back_in();

-- Getting a weekly spot takes you off standby.
create or replace function public.leave_standby_on_claim()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  delete from matchday_standby_entries where matchday_id = new.matchday_id and player_id = new.player_id;
  return null;
end;
$$;

create trigger weekly_claims_leave_standby after insert on weekly_claims
  for each row execute function leave_standby_on_claim();
