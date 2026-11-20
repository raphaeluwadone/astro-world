-- Draw rules: the admin's default switches for the team draw, and pairs who are never drawn together.

create table draw_settings (
  id boolean primary key default true check (id),
  rules jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references players(id) on delete set null
);
insert into draw_settings (id) values (true);

create table draw_never_pairs (
  player_a uuid not null references players(id) on delete cascade,
  player_b uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references players(id) on delete set null,
  primary key (player_a, player_b),
  check (player_a < player_b)
);

alter table draw_settings enable row level security;
alter table draw_never_pairs enable row level security;

-- Everyone can see which rules the draw uses; only admins change them.
create policy draw_settings_read on draw_settings for select to authenticated using (true);
create policy draw_settings_write on draw_settings for update to authenticated
  using (is_requesting_admin()) with check (is_requesting_admin());
create policy draw_never_pairs_admin on draw_never_pairs for all to authenticated
  using (is_requesting_admin()) with check (is_requesting_admin());

-- Ratings are private to the rater, so the draw reads them through this admin-only function.
-- p_matchday narrows ratings to one matchday ("last game week"); otherwise p_since bounds them.
create or replace function public.draw_player_stats(p_players uuid[], p_season_start timestamptz, p_since timestamptz default null, p_matchday uuid default null)
returns table (player_id uuid, avg_rating numeric, rating_count bigint, season_goals bigint, sundays bigint)
language sql
stable
security definer
set search_path = public
as $$
  with rated as (
    select r.subject_id, avg(r.score) as avg_rating, count(*) as n
    from ratings r join matches m on m.id = r.match_id
    where r.subject_id = any(p_players)
      and (p_matchday is null or m.matchday_id = p_matchday)
      and (p_since is null or m.played_at >= p_since)
    group by r.subject_id
  ),
  scored as (
    select scorer_id, count(*) as n from (
      select g.scorer_id from goals g join matches m on m.id = g.match_id where m.played_at >= p_season_start
      union all
      select pg.scorer_id from pitch_goals pg join pitch_games gm on gm.id = pg.game_id join matchdays md on md.id = gm.matchday_id
      where md.played_at >= p_season_start and pg.scorer_id is not null
    ) s
    where scorer_id = any(p_players)
    group by scorer_id
  ),
  played as (
    select player_id, count(distinct matchday_id) as n from (
      select mp.player_id, m.matchday_id from match_players mp join matches m on m.id = mp.match_id
      union
      select tm.player_id, t.matchday_id from team_members tm join teams t on t.id = tm.team_id join matchdays md on md.id = t.matchday_id
      where md.played_at < now()
    ) p
    where player_id = any(p_players)
    group by player_id
  )
  select p.id, round(rated.avg_rating, 2), coalesce(rated.n, 0), coalesce(scored.n, 0), p.legacy_appearances + coalesce(played.n, 0)
  from players p
  left join rated on rated.subject_id = p.id
  left join scored on scored.scorer_id = p.id
  left join played on played.player_id = p.id
  where p.id = any(p_players) and is_requesting_admin();
$$;

revoke execute on function public.draw_player_stats(uuid[], timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.draw_player_stats(uuid[], timestamptz, timestamptz, uuid) to authenticated;

