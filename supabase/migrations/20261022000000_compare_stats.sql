-- Numbers for Compare mode. p_since null means career (legacy figures included); otherwise tracked Sundays from then on.
-- Cup columns are always every Salami Cup played.

create or replace function public.compare_stats(p_since timestamptz default null)
returns table (
  player_id uuid,
  appearances bigint,
  goals bigint,
  assists bigint,
  clean_sheets bigint,
  avg_rating numeric,
  motm bigint,
  cups_played bigint,
  cups_won bigint,
  cup_games bigint,
  cup_wins bigint,
  cup_goals bigint,
  cup_clean_sheets bigint,
  cup_heroes bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with m as (
    select * from matches where p_since is null or played_at >= p_since
  ),
  apps as (
    select mp.player_id, count(*) as n from match_players mp join m on m.id = mp.match_id group by 1
  ),
  scored as (
    select scorer_id as player_id, count(*) as n from (
      select g.scorer_id from goals g join m on m.id = g.match_id
      union all
      select cg.scorer_id from cup_goals cg where p_since is null
    ) s group by 1
  ),
  assisted as (
    select g.assist_id as player_id, count(*) as n from goals g join m on m.id = g.match_id
    where g.assist_id is not null group by 1
  ),
  cleans as (
    select mp.player_id, count(*) as n from match_players mp join m on m.id = mp.match_id
    where (mp.team_id = m.team_a_id and m.score_b = 0) or (mp.team_id = m.team_b_id and m.score_a = 0)
    group by 1
  ),
  rated as (
    select r.subject_id as player_id, round(avg(r.score), 1) as avg from ratings r join m on m.id = r.match_id group by 1
  ),
  motm_per_matchday as (
    select distinct on (s.matchday_id) s.matchday_id, s.nominee_id
    from matchday_motm_summary() s join matchdays md on md.id = s.matchday_id
    where p_since is null or md.played_at >= p_since
    order by s.matchday_id, s.vote_count desc
  ),
  motm as (select nominee_id as player_id, count(*) as n from motm_per_matchday group by 1),
  cup_sides as (
    select csp.player_id, cs.cup_quarter_id, cs.id as squad_id
    from cup_squad_players csp join cup_squads cs on cs.id = csp.cup_squad_id
  ),
  cup_played as (
    select cm.id, cm.squad_a_id as squad_id, cm.score_a as gf, cm.score_b as ga from cup_matches cm where cm.score_a is not null
    union all
    select cm.id, cm.squad_b_id, cm.score_b, cm.score_a from cup_matches cm where cm.score_a is not null
  ),
  cup_record as (
    select s.player_id, count(distinct s.cup_quarter_id) as cups, count(cp.id) as games,
           count(cp.id) filter (where cp.gf > cp.ga) as wins, count(cp.id) filter (where cp.ga = 0) as cleans
    from cup_sides s left join cup_played cp on cp.squad_id = s.squad_id
    group by 1
  ),
  cup_scored as (select scorer_id as player_id, count(*) as n from cup_goals group by 1),
  cup_badges as (
    select pb.player_id,
           count(*) filter (where pb.badge_key = 'silverware') as won,
           count(*) filter (where pb.badge_key = 'cup-hero') as heroes
    from player_badges pb where pb.badge_key in ('silverware', 'cup-hero') group by 1
  )
  select
    p.id,
    coalesce(apps.n, 0) + case when p_since is null then p.legacy_appearances else 0 end,
    coalesce(scored.n, 0) + case when p_since is null then p.legacy_goals else 0 end,
    coalesce(assisted.n, 0) + case when p_since is null then p.legacy_assists else 0 end,
    coalesce(cleans.n, 0) + case when p_since is null then p.legacy_clean_sheets else 0 end,
    rated.avg,
    coalesce(motm.n, 0),
    coalesce(cup_record.cups, 0),
    coalesce(cup_badges.won, 0),
    coalesce(cup_record.games, 0),
    coalesce(cup_record.wins, 0),
    coalesce(cup_scored.n, 0),
    coalesce(cup_record.cleans, 0),
    coalesce(cup_badges.heroes, 0)
  from players p
  left join apps on apps.player_id = p.id
  left join scored on scored.player_id = p.id
  left join assisted on assisted.player_id = p.id
  left join cleans on cleans.player_id = p.id
  left join rated on rated.player_id = p.id
  left join motm on motm.player_id = p.id
  left join cup_record on cup_record.player_id = p.id
  left join cup_scored on cup_scored.player_id = p.id
  left join cup_badges on cup_badges.player_id = p.id
  where p.left_at is null;
$$;

revoke execute on function public.compare_stats(timestamptz) from public, anon;
grant execute on function public.compare_stats(timestamptz) to authenticated;
