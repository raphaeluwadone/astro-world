-- Admins can put a player on a Sunday without a payment, even when the spots are full.
-- A waived claim is never dropped at the payment deadline and never flagged for a refund.

alter table public.weekly_claims
  add column waived_by uuid references public.players(id) on delete set null,
  add column waived_at timestamptz;

-- Same as before, but waived claims don't count as unpaid.
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
    and wc.waived_by is null
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

-- Adds a player to an open Sunday. With p_waive the payment is skipped; without it they hold the spot but still need to pay.
create or replace function public.admin_add_to_matchday(p_matchday uuid, p_player uuid, p_waive boolean default true)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me players;
  target players;
  claim_id uuid;
begin
  if not is_requesting_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if not matchday_is_open(p_matchday) then
    raise exception 'This matchday isn''t open any more';
  end if;
  select * into me from players where user_id = auth.uid();
  select * into target from players where id = p_player;
  if target.id is null or target.left_at is not null then
    raise exception 'That player isn''t in the group';
  end if;
  if player_is_monthly_member_for(p_player, p_matchday) then
    raise exception '% already holds a monthly spot', target.nickname;
  end if;
  if exists (select 1 from weekly_claims where matchday_id = p_matchday and player_id = p_player) then
    raise exception '% already has a spot', target.nickname;
  end if;

  insert into weekly_claims (matchday_id, player_id, waived_by, waived_at)
  values (p_matchday, p_player, case when p_waive then me.id end, case when p_waive then now() end)
  returning id into claim_id;
  return claim_id;
end;
$$;
revoke execute on function public.admin_add_to_matchday(uuid, uuid, boolean) from public, anon;
grant execute on function public.admin_add_to_matchday(uuid, uuid, boolean) to authenticated;
