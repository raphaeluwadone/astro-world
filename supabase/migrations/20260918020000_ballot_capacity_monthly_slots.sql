-- Real ballot-pool selection, per Raphael's clarification (2026-09-18):
--
-- 1. Entry into the ballot pool is strictly first-come-first-served by
--    when someone indicates, NOT a random draw. Randomization only ever
--    happens later, on game day, splitting the pool into teams (that's
--    the existing drawTeams algorithm, unchanged).
-- 2. Ten of the ~30 spots are "monthly": the first 10 to indicate for a
--    given month hold that spot for every Sunday in the month, no weekly
--    re-indicating needed. The remaining ~20 spots are filled fresh each
--    week, first-come-first-served by availability.responded_at.
-- 3. Almost always 30 (five teams of six), but an admin can occasionally
--    open a sixth team's worth of extra spots (36) for a given week.

alter table matchdays add column capacity integer not null default 30;
alter table matchdays add constraint matchdays_capacity_check check (capacity in (30, 36));

create table monthly_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  month date not null,
  claimed_at timestamptz not null default now(),
  unique (player_id, month)
);

create index monthly_memberships_month_idx on monthly_memberships (month);

alter table monthly_memberships enable row level security;

create policy monthly_memberships_select_all on monthly_memberships for select
  to authenticated using (true);

-- The "first 10" cap is enforced here, not just in the UI, same as every
-- other capacity rule in this schema (e.g. player_tags' two-self-tags cap).
create policy monthly_memberships_insert_own on monthly_memberships for insert
  to authenticated
  with check (
    player_id = (select id from players where user_id = auth.uid())
    and (
      select count(*) from monthly_memberships mm
      where mm.month = monthly_memberships.month
    ) < 10
  );

-- Letting someone give up their own monthly spot (e.g. moving away) is a
-- reasonable self-service action; nobody else's row is reachable via this
-- policy since it's scoped to your own player_id.
create policy monthly_memberships_delete_own on monthly_memberships for delete
  to authenticated
  using (player_id = (select id from players where user_id = auth.uid()));
