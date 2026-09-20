-- The Salami Cup: a genuinely separate competition from the weekly
-- matchday (BACKEND.md section 8 is explicit: "cup matches cannot
-- simply be matchdays with a flag" — different squad-forming rule,
-- different withdrawal/standby rule, no ballot). Kept as its own set of
-- tables rather than overloading matchdays/teams.
--
-- Scoped down from the full design on purpose (see project memory):
-- the design's live squad draft is undesigned by its own admission, so
-- squads here come from the same random draw already built for Sunday
-- (src/features/matchday/draw/drawTeams.ts), run by an admin once
-- entries close, with an editable name per squad rather than the fixed
-- Greek-alphabet names Sunday teams use. Fixtures are freely added by
-- an admin (same pattern as regular results entry), not auto-generated
-- round robin, since the "everyone plays twice" rule in the design
-- assumed a fixed 3 squads and this build allows any multiple of 6
-- entrants. Cup goals are intentionally NOT linked into `goals`/season
-- totals per an explicit product decision (cup stats stay their own
-- thing) — no per-goal scorer tracking at all yet, only the score.

create type cup_status as enum ('open', 'drawn', 'live', 'played', 'cancelled');

create table cup_quarters (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  venue text,
  scheduled_at timestamptz not null,
  entries_close_at timestamptz not null,
  withdrawal_deadline timestamptz not null,
  status cup_status not null default 'open',
  created_at timestamptz not null default now()
);

create table cup_entrants (
  id uuid primary key default gen_random_uuid(),
  cup_quarter_id uuid not null references cup_quarters(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cup_quarter_id, player_id)
);

create table cup_squads (
  id uuid primary key default gen_random_uuid(),
  cup_quarter_id uuid not null references cup_quarters(id) on delete cascade,
  name text not null,
  colour text not null
);

create table cup_squad_players (
  cup_squad_id uuid not null references cup_squads(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  primary key (cup_squad_id, player_id)
);

create table cup_matches (
  id uuid primary key default gen_random_uuid(),
  cup_quarter_id uuid not null references cup_quarters(id) on delete cascade,
  squad_a_id uuid not null references cup_squads(id),
  squad_b_id uuid not null references cup_squads(id),
  score_a int,
  score_b int,
  played_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cup_matches_distinct_squads check (squad_a_id <> squad_b_id)
);

-- ---------------------------------------------------------------------------
-- RLS. Same shape as matchday_rls.sql: public read on everything, admin
-- writes the derived output (squads, fixtures, results, status), a
-- player only writes their own entry.
-- ---------------------------------------------------------------------------

create function cup_entries_open(p_cup_quarter_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select status = 'open' and now() < entries_close_at
  from cup_quarters
  where id = p_cup_quarter_id;
$$;

revoke all on function cup_entries_open(uuid) from public;
grant execute on function cup_entries_open(uuid) to authenticated;

alter table cup_quarters enable row level security;
alter table cup_entrants enable row level security;
alter table cup_squads enable row level security;
alter table cup_squad_players enable row level security;
alter table cup_matches enable row level security;

create policy cup_quarters_select_all on cup_quarters for select to authenticated using (true);
create policy cup_quarters_write_admin on cup_quarters for insert to authenticated with check (is_requesting_admin());
create policy cup_quarters_update_admin on cup_quarters for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

create policy cup_entrants_select_all on cup_entrants for select to authenticated using (true);
create policy cup_entrants_insert_own on cup_entrants for insert to authenticated
  with check (is_own_player(player_id) and cup_entries_open(cup_quarter_id));
create policy cup_entrants_delete_own_or_admin on cup_entrants for delete to authenticated
  using (is_own_player(player_id) or is_requesting_admin());

create policy cup_squads_select_all on cup_squads for select to authenticated using (true);
create policy cup_squads_write_admin on cup_squads for insert to authenticated with check (is_requesting_admin());
create policy cup_squads_update_admin on cup_squads for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

create policy cup_squad_players_select_all on cup_squad_players for select to authenticated using (true);
create policy cup_squad_players_write_admin on cup_squad_players for insert to authenticated with check (is_requesting_admin());
create policy cup_squad_players_delete_admin on cup_squad_players for delete to authenticated using (is_requesting_admin());

create policy cup_matches_select_all on cup_matches for select to authenticated using (true);
create policy cup_matches_write_admin on cup_matches for insert to authenticated with check (is_requesting_admin());
create policy cup_matches_update_admin on cup_matches for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());
create policy cup_matches_delete_admin on cup_matches for delete to authenticated using (is_requesting_admin());
