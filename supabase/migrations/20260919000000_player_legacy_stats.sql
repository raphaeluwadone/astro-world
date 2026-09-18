-- Real historical goals/assists/appearances from before this app existed
-- (the group's own season leaderboard), not fabricated matches to back
-- into a number. Stored as a baseline per player and added on top of the
-- app's own real match-derived totals in player_career_stats(), so a
-- player's career number stays one honest figure instead of two.
alter table players add column legacy_goals integer not null default 0;
alter table players add column legacy_assists integer not null default 0;
alter table players add column legacy_appearances integer not null default 0;

comment on column players.legacy_goals is
  'Goals from before this app tracked matches, imported from the group''s own records. Added to real in-app goals, never fabricated match data.';
comment on column players.legacy_assists is
  'Assists from before this app tracked matches, same provenance as legacy_goals.';
comment on column players.legacy_appearances is
  'Appearances from before this app tracked matches, same provenance as legacy_goals.';

create or replace function player_career_stats()
returns table (
  player_id uuid,
  appearances bigint,
  goals bigint,
  assists bigint,
  motm_count bigint,
  avg_rating numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with apps as (
    select player_id, count(*) as n from match_players group by player_id
  ),
  scored as (
    select scorer_id as player_id, count(*) as n from goals group by scorer_id
  ),
  assisted as (
    select assist_id as player_id, count(*) as n from goals where assist_id is not null group by assist_id
  ),
  motm_per_matchday as (
    select distinct on (matchday_id) matchday_id, nominee_id, vote_count
    from matchday_motm_summary()
    order by matchday_id, vote_count desc
  ),
  motm as (
    select nominee_id as player_id, count(*) as n from motm_per_matchday group by nominee_id
  ),
  avg_ratings as (
    select subject_id as player_id, round(avg(score), 1) as avg_rating
    from ratings
    group by subject_id
  )
  select
    p.id as player_id,
    p.legacy_appearances + coalesce(apps.n, 0) as appearances,
    p.legacy_goals + coalesce(scored.n, 0) as goals,
    p.legacy_assists + coalesce(assisted.n, 0) as assists,
    coalesce(motm.n, 0) as motm_count,
    avg_ratings.avg_rating
  from players p
  left join apps on apps.player_id = p.id
  left join scored on scored.player_id = p.id
  left join assisted on assisted.player_id = p.id
  left join motm on motm.player_id = p.id
  left join avg_ratings on avg_ratings.player_id = p.id;
$$;

revoke all on function player_career_stats() from public;
grant execute on function player_career_stats() to authenticated;
