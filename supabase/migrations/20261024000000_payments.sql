-- Online payments through Paystack for weekly spots, monthly spots and quarterly dues.
-- Free self-claims keep working; a claim counts as paid only once settle_payment has run
-- after the provider confirmed the charge server-side. The browser never marks anything paid.

create type payment_kind as enum ('weekly', 'monthly', 'dues');
create type payment_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refund_due', 'refunded');

create table payment_prices (
  kind payment_kind primary key check (kind in ('weekly', 'monthly')),
  amount numeric(10, 2) not null check (amount > 0),
  updated_by uuid references players(id),
  updated_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'astro_' || replace(gen_random_uuid()::text, '-', ''),
  kind payment_kind not null,
  player_id uuid not null references players(id) on delete cascade,
  matchday_id uuid references matchdays(id) on delete set null,
  month date,
  dues_quarter_id uuid references dues_quarters(id) on delete set null,
  amount_kobo bigint not null check (amount_kobo > 0),
  status payment_status not null default 'pending',
  -- While pending with a future hold_until, the payer's spot is reserved so nobody else takes it mid-checkout.
  hold_until timestamptz,
  weekly_claim_id uuid references weekly_claims(id) on delete set null,
  monthly_membership_id uuid references monthly_memberships(id) on delete set null,
  dues_payment_id uuid references dues_payments(id) on delete set null,
  provider_ref text,
  note text,
  paid_at timestamptz,
  refunded_by uuid references players(id),
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (kind = 'weekly' and month is null and dues_quarter_id is null)
    or (kind = 'monthly' and month is not null and matchday_id is null and dues_quarter_id is null)
    or (kind = 'dues' and month is null and matchday_id is null)
  )
);

create index payments_player_idx on payments (player_id, created_at desc);
create index payments_matchday_idx on payments (matchday_id) where matchday_id is not null;
create index payments_month_idx on payments (month) where month is not null;
create index payments_status_idx on payments (status) where status in ('pending', 'refund_due');

alter table payment_prices enable row level security;
alter table payments enable row level security;

create policy payment_prices_select_all on payment_prices for select to authenticated using (true);
create policy payment_prices_insert_admin on payment_prices for insert to authenticated with check (is_requesting_admin());
create policy payment_prices_update_admin on payment_prices for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

-- Who has or hasn't paid stays between the player and the admins, same as dues. Writes only happen through the functions below.
create policy payments_select_own_or_admin on payments for select to authenticated
using (is_own_player(player_id) or is_requesting_admin());

-- ---------------------------------------------------------------------------
-- Holds count against the spots, so a free claim can't take a spot someone is paying for.
-- ---------------------------------------------------------------------------

create or replace function weekly_spots_remaining(p_matchday_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select md.capacity
    - (
        select count(*) from monthly_memberships mm
        where mm.month = date_trunc('month', md.played_at)::date
          and not exists (
            select 1 from availability a
            where a.matchday_id = md.id
              and a.player_id = mm.player_id
              and a.status = 'out'
          )
      )
    - (select count(*) from weekly_claims wc where wc.matchday_id = md.id)
    - (
        select count(distinct p.player_id) from payments p
        where p.kind = 'weekly' and p.matchday_id = md.id
          and p.status = 'pending' and p.hold_until > now()
          and not exists (select 1 from weekly_claims wc where wc.matchday_id = md.id and wc.player_id = p.player_id)
      )
  from matchdays md
  where md.id = p_matchday_id;
$$;

create function monthly_spots_remaining(p_month date)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select 10
    - (select count(*) from monthly_memberships where month = p_month)::int
    - (
        select count(distinct p.player_id) from payments p
        where p.kind = 'monthly' and p.month = p_month
          and p.status = 'pending' and p.hold_until > now()
          and not exists (select 1 from monthly_memberships mm where mm.month = p_month and mm.player_id = p.player_id)
      )::int;
$$;

revoke all on function monthly_spots_remaining(date) from public;
grant execute on function monthly_spots_remaining(date) to authenticated;

drop policy monthly_memberships_insert_own on monthly_memberships;
create policy monthly_memberships_insert_own on monthly_memberships for insert to authenticated
with check (
  player_id = (select id from players where user_id = auth.uid())
  and monthly_spots_remaining(month) > 0
);

-- ---------------------------------------------------------------------------
-- start_payment: the signed-in player opens a payment. The amount always comes from the
-- database, never from the browser. Any earlier pending payment for the same thing is
-- cancelled, so the player only ever holds one spot.
-- ---------------------------------------------------------------------------

create function start_payment(
  p_kind payment_kind,
  p_matchday_id uuid default null,
  p_month date default null,
  p_dues_quarter_id uuid default null
)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select id from players where user_id = auth.uid());
  md matchdays;
  price numeric;
  existing uuid;
  holds boolean := false;
  result payments;
begin
  if me is null then
    raise exception 'Sign in to pay';
  end if;

  if p_kind = 'weekly' then
    select * into md from matchdays where id = p_matchday_id for update;
    if md.id is null then
      raise exception 'That matchday doesn''t exist';
    end if;
    if md.status <> 'open' then
      raise exception 'Claims for this matchday are closed';
    end if;
    if player_is_monthly_member_for(me, md.id) then
      raise exception 'You already hold a monthly spot';
    end if;
    update payments set status = 'cancelled', hold_until = null
    where player_id = me and kind = 'weekly' and matchday_id = md.id and status = 'pending';
    select id into existing from weekly_claims where matchday_id = md.id and player_id = me;
    if existing is not null and exists (select 1 from payments where weekly_claim_id = existing and status = 'paid') then
      raise exception 'Your spot is already paid for';
    end if;
    if existing is null then
      if weekly_spots_remaining(md.id) <= 0 then
        raise exception 'No spots left';
      end if;
      holds := true;
    end if;
    select amount into price from payment_prices where kind = 'weekly';

  elsif p_kind = 'monthly' then
    if p_month is null or p_month <> date_trunc('month', p_month)::date then
      raise exception 'Pick a month';
    end if;
    if p_month < date_trunc('month', now() at time zone 'Africa/Lagos')::date then
      raise exception 'That month is over';
    end if;
    perform pg_advisory_xact_lock(hashtext('monthly:' || p_month));
    update payments set status = 'cancelled', hold_until = null
    where player_id = me and kind = 'monthly' and month = p_month and status = 'pending';
    select id into existing from monthly_memberships where month = p_month and player_id = me;
    if existing is not null and exists (select 1 from payments where monthly_membership_id = existing and status = 'paid') then
      raise exception 'Your monthly spot is already paid for';
    end if;
    if existing is null then
      if monthly_spots_remaining(p_month) <= 0 then
        raise exception 'All 10 monthly spots are taken';
      end if;
      holds := true;
    end if;
    select amount into price from payment_prices where kind = 'monthly';

  else
    select amount into price from dues_quarters where id = p_dues_quarter_id;
    if price is null then
      raise exception 'That dues quarter doesn''t exist';
    end if;
    if exists (select 1 from dues_payments where dues_quarter_id = p_dues_quarter_id and player_id = me) then
      raise exception 'You''ve already paid this quarter';
    end if;
    update payments set status = 'cancelled'
    where player_id = me and kind = 'dues' and dues_quarter_id = p_dues_quarter_id and status = 'pending';
  end if;

  if price is null then
    raise exception 'An admin hasn''t set a price yet';
  end if;

  insert into payments (kind, player_id, matchday_id, month, dues_quarter_id, amount_kobo, hold_until)
  values (
    p_kind, me,
    case when p_kind = 'weekly' then md.id end,
    case when p_kind = 'monthly' then p_month end,
    case when p_kind = 'dues' then p_dues_quarter_id end,
    round(price * 100)::bigint,
    case when holds then now() + interval '15 minutes' end
  )
  returning * into result;
  return result;
end;
$$;

revoke all on function start_payment(payment_kind, uuid, date, uuid) from public;
grant execute on function start_payment(payment_kind, uuid, date, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- settle_payment: called only by the Edge Functions after Paystack confirmed the charge.
-- Safe to call any number of times for the same reference.
-- ---------------------------------------------------------------------------

create function settle_payment(p_reference text, p_amount_kobo bigint, p_currency text, p_provider_ref text)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  p payments;
  md matchdays;
  target uuid;
begin
  select * into p from payments where reference = p_reference for update;
  if p.id is null then
    raise exception 'Unknown payment %', p_reference;
  end if;
  if p.status in ('paid', 'refund_due', 'refunded') then
    return p;
  end if;

  if p_currency <> 'NGN' or p_amount_kobo <> p.amount_kobo then
    update payments set status = 'failed', hold_until = null, provider_ref = p_provider_ref,
      note = 'Paystack reported ' || p_currency || ' ' || p_amount_kobo || ', expected NGN ' || p.amount_kobo
    where id = p.id returning * into p;
    return p;
  end if;

  update payments set status = 'paid', paid_at = now(), hold_until = null, provider_ref = p_provider_ref
  where id = p.id returning * into p;

  if p.kind = 'weekly' then
    select * into md from matchdays where id = p.matchday_id for update;
    select id into target from weekly_claims where matchday_id = md.id and player_id = p.player_id;
    if target is not null then
      if exists (select 1 from payments where weekly_claim_id = target and status = 'paid' and id <> p.id) then
        update payments set status = 'refund_due', note = 'Paid twice for the same spot' where id = p.id returning * into p;
      else
        update payments set weekly_claim_id = target where id = p.id returning * into p;
      end if;
    elsif md.status = 'open' and not player_is_monthly_member_for(p.player_id, md.id) and weekly_spots_remaining(md.id) > 0 then
      insert into weekly_claims (matchday_id, player_id) values (md.id, p.player_id) returning id into target;
      update payments set weekly_claim_id = target where id = p.id returning * into p;
    else
      update payments set status = 'refund_due', note = 'The spot had gone by the time the payment cleared' where id = p.id returning * into p;
    end if;

  elsif p.kind = 'monthly' then
    perform pg_advisory_xact_lock(hashtext('monthly:' || p.month));
    select id into target from monthly_memberships where month = p.month and player_id = p.player_id;
    if target is not null then
      if exists (select 1 from payments where monthly_membership_id = target and status = 'paid' and id <> p.id) then
        update payments set status = 'refund_due', note = 'Paid twice for the same month' where id = p.id returning * into p;
      else
        update payments set monthly_membership_id = target where id = p.id returning * into p;
      end if;
    elsif monthly_spots_remaining(p.month) > 0 then
      insert into monthly_memberships (player_id, month) values (p.player_id, p.month) returning id into target;
      update payments set monthly_membership_id = target where id = p.id returning * into p;
    else
      update payments set status = 'refund_due', note = 'The monthly spots filled before the payment cleared' where id = p.id returning * into p;
    end if;

  else
    select id into target from dues_payments where dues_quarter_id = p.dues_quarter_id and player_id = p.player_id;
    if target is not null then
      update payments set status = 'refund_due', note = 'Dues were already paid for this quarter' where id = p.id returning * into p;
    else
      insert into dues_payments (dues_quarter_id, player_id, marked_by) values (p.dues_quarter_id, p.player_id, p.player_id)
      returning id into target;
      update payments set dues_payment_id = target where id = p.id returning * into p;
    end if;
  end if;

  return p;
end;
$$;

revoke all on function settle_payment(text, bigint, text, text) from public, anon, authenticated;
grant execute on function settle_payment(text, bigint, text, text) to service_role;

create function fail_payment(p_reference text, p_note text)
returns payments
language sql
security definer
set search_path = public
as $$
  update payments set status = 'failed', hold_until = null, note = p_note
  where reference = p_reference and status = 'pending'
  returning *;
$$;

revoke all on function fail_payment(text, text) from public, anon, authenticated;
grant execute on function fail_payment(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Refunds are settled by hand. Giving up a paid weekly spot before claims close flags it;
-- a monthly spot is never refunded (rule 1.6).
-- ---------------------------------------------------------------------------

create function flag_weekly_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if matchday_is_open(old.matchday_id) then
    update payments set status = 'refund_due', note = 'Gave up the spot before claims closed'
    where weekly_claim_id = old.id and status = 'paid';
  end if;
  return old;
end;
$$;

create trigger weekly_claims_flag_refund before delete on weekly_claims
  for each row execute function flag_weekly_refund();

create function flag_dues_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update payments set status = 'refund_due', note = 'An admin unmarked these dues'
  where dues_payment_id = old.id and status = 'paid';
  return old;
end;
$$;

create trigger dues_payments_flag_refund before delete on dues_payments
  for each row execute function flag_dues_refund();

create function mark_payment_refunded(p_payment_id uuid)
returns payments
language plpgsql
security definer
set search_path = public
as $$
declare
  result payments;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can do that';
  end if;
  update payments set status = 'refunded', refunded_at = now(),
    refunded_by = (select id from players where user_id = auth.uid())
  where id = p_payment_id and status = 'refund_due'
  returning * into result;
  if result.id is null then
    raise exception 'That payment isn''t waiting on a refund';
  end if;
  return result;
end;
$$;

revoke all on function mark_payment_refunded(uuid) from public;
grant execute on function mark_payment_refunded(uuid) to authenticated;
