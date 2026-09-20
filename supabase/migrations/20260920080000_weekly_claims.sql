-- Real correction from Raphael: what the app calls "the ballot" (an
-- admin-triggered batch action sorting free availability responses into
-- balloted/standby) was backwards. In the real group, getting one of the
-- 30 Sunday spots (whether one of the 10 monthly or one of the 20
-- weekly) is strictly first-come-first-served BY PAYMENT, not a lottery
-- and not free availability marking. "The ballot" is actually the random
-- team-split step (what this codebase calls "the draw"). This migration
-- fixes the functional gap: weekly spots become a real paid-claim
-- action, exactly like the existing monthly_memberships pattern, rather
-- than a free "I'm in" toggle snapshotted later by an admin.
--
-- Payment itself is self-attested, same as monthly: no money moves
-- through the app, claiming a spot IS the record. Standby stays free;
-- a payment only happens once someone actually claims a spot (including
-- claiming a spot that just freed up), never upfront with a refund path.
--
-- matchday_ballot_entries is retired in favour of two clearer tables:
-- weekly_claims (paid, capped, FCFS) and matchday_standby_entries (free,
-- ordered, no cap). The matchday_status enum keeps 'balloted' (Postgres
-- can't cheaply drop an enum value) but nothing writes it going forward:
-- a matchday now goes straight from 'open' to 'drawn'.

create table weekly_claims (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references matchdays(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique (matchday_id, player_id)
);

create table matchday_standby_entries (
  matchday_id uuid not null references matchdays(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (matchday_id, player_id)
);

drop policy ballot_entries_select_all on matchday_ballot_entries;
drop policy ballot_entries_write_admin on matchday_ballot_entries;
drop policy ballot_entries_update_admin on matchday_ballot_entries;
drop table matchday_ballot_entries;
drop type ballot_entry_status;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function player_is_monthly_member_for(p_player_id uuid, p_matchday_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from monthly_memberships mm
    join matchdays md on md.id = p_matchday_id
    where mm.player_id = p_player_id
      and mm.month = date_trunc('month', md.played_at)::date
  );
$$;

revoke all on function player_is_monthly_member_for(uuid, uuid) from public;
grant execute on function player_is_monthly_member_for(uuid, uuid) to authenticated;

create function weekly_spots_remaining(p_matchday_id uuid)
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
      )
    - (select count(*) from weekly_claims wc where wc.matchday_id = md.id)
  from matchdays md
  where md.id = p_matchday_id;
$$;

revoke all on function weekly_spots_remaining(uuid) from public;
grant execute on function weekly_spots_remaining(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- weekly_claims: public read; a player claims/withdraws their own spot,
-- only while the matchday is open, only if they're not already a
-- monthly member (their spot's already guaranteed) and only while a
-- spot is actually free. Admin can act on anyone's behalf (e.g. undoing
-- a claim after a real-world dispute).
-- ---------------------------------------------------------------------------

alter table weekly_claims enable row level security;

create policy weekly_claims_select_all on weekly_claims for select to authenticated using (true);

create policy weekly_claims_insert_own on weekly_claims for insert to authenticated
with check (
  is_own_player(player_id)
  and matchday_is_open(matchday_id)
  and not player_is_monthly_member_for(player_id, matchday_id)
  and weekly_spots_remaining(matchday_id) > 0
);

create policy weekly_claims_delete_own_or_admin on weekly_claims for delete to authenticated
using (
  (is_own_player(player_id) and matchday_is_open(matchday_id))
  or is_requesting_admin()
);

-- ---------------------------------------------------------------------------
-- matchday_standby_entries: public read; a player joins/leaves their own
-- standby entry, only while open, only once weekly spots are genuinely
-- exhausted (otherwise they should just claim one directly).
-- ---------------------------------------------------------------------------

alter table matchday_standby_entries enable row level security;

create policy standby_select_all on matchday_standby_entries for select to authenticated using (true);

create policy standby_insert_own on matchday_standby_entries for insert to authenticated
with check (
  is_own_player(player_id)
  and matchday_is_open(matchday_id)
  and not player_is_monthly_member_for(player_id, matchday_id)
  and weekly_spots_remaining(matchday_id) <= 0
);

create policy standby_delete_own_or_admin on matchday_standby_entries for delete to authenticated
using (is_own_player(player_id) or is_requesting_admin());

-- ---------------------------------------------------------------------------
-- availability's real remaining purpose, narrowed: only a monthly member
-- opting out of one specific Sunday (rule 1.6). Everyone else now uses
-- weekly_claims/standby instead of a free in/out toggle.
-- ---------------------------------------------------------------------------

drop policy availability_insert_own on availability;
create policy availability_insert_own on availability for insert to authenticated
with check (
  is_own_player(player_id)
  and matchday_is_open(matchday_id)
  and player_is_monthly_member_for(player_id, matchday_id)
);

drop policy availability_update_own on availability;
create policy availability_update_own on availability for update to authenticated
using (is_own_player(player_id))
with check (
  is_own_player(player_id)
  and matchday_is_open(matchday_id)
  and player_is_monthly_member_for(player_id, matchday_id)
);
