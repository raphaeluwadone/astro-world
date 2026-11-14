-- Winner-stays rotation: the day's opening order and goal target, plus the target each game was played to.

create table pitch_sessions (
  matchday_id uuid primary key references matchdays(id) on delete cascade,
  team_order uuid[] not null,
  goal_target integer not null default 2 check (goal_target between 1 and 9),
  length_min integer not null default 10 check (length_min between 1 and 90),
  updated_at timestamptz not null default now()
);

alter table pitch_games add column goal_target integer not null default 2 check (goal_target between 1 and 9);

alter table pitch_sessions enable row level security;
create policy pitch_sessions_select on pitch_sessions for select to authenticated using (true);
create policy pitch_sessions_admin on pitch_sessions for all to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

alter publication supabase_realtime add table pitch_sessions;
