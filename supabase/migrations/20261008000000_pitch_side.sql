-- Pitch-side: live check-ins, games and goals on matchday. Admins write; everyone can read, so it can be shown live.
-- Nothing here touches matches/goals until an admin files results from it.

create table pitch_checkins (
  matchday_id uuid not null references matchdays(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references players(id) on delete set null,
  primary key (matchday_id, player_id)
);

create table pitch_games (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references matchdays(id) on delete cascade,
  team_a_id uuid not null references teams(id) on delete cascade,
  team_b_id uuid not null references teams(id) on delete cascade,
  length_min integer not null default 10 check (length_min between 1 and 90),
  -- The clock: banked time plus, while running, time since running_since.
  elapsed_ms bigint not null default 0,
  running_since timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (team_a_id <> team_b_id)
);

create index pitch_games_matchday_idx on pitch_games (matchday_id, created_at);

create table pitch_goals (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references pitch_games(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  scorer_id uuid references players(id) on delete set null,
  assist_id uuid references players(id) on delete set null,
  minute integer,
  created_at timestamptz not null default now(),
  created_by uuid references players(id) on delete set null,
  check (assist_id is null or assist_id <> scorer_id)
);

create index pitch_goals_game_idx on pitch_goals (game_id, created_at);

alter table pitch_checkins enable row level security;
alter table pitch_games enable row level security;
alter table pitch_goals enable row level security;

create policy pitch_checkins_select on pitch_checkins for select to authenticated using (true);
create policy pitch_checkins_admin on pitch_checkins for all to authenticated using (is_requesting_admin()) with check (is_requesting_admin());
create policy pitch_games_select on pitch_games for select to authenticated using (true);
create policy pitch_games_admin on pitch_games for all to authenticated using (is_requesting_admin()) with check (is_requesting_admin());
create policy pitch_goals_select on pitch_goals for select to authenticated using (true);
create policy pitch_goals_admin on pitch_goals for all to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

alter publication supabase_realtime add table pitch_checkins, pitch_games, pitch_goals;
