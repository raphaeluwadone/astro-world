-- Career goals include Salami Cup goals. Monthly and yearly scoring awards stay Sunday-only.

CREATE OR REPLACE FUNCTION public.player_career_stats()
 RETURNS TABLE(player_id uuid, appearances bigint, goals bigint, assists bigint, motm_count bigint, avg_rating numeric, yellow_cards bigint, red_cards bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with apps as (
    select player_id, count(*) as n from match_players group by player_id
  ),
  scored as (
    select player_id, count(*) as n from (
      select scorer_id as player_id from goals
      union all
      select scorer_id from cup_goals
    ) g group by player_id
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
    select subject_id as player_id, round(avg(score), 1) as avg_rating from ratings group by subject_id
  ),
  booked as (
    select player_id, count(*) filter (where kind = 'yellow') as yellows, count(*) filter (where kind = 'red') as reds
    from cards group by player_id
  )
  select
    p.id,
    p.legacy_appearances + coalesce(apps.n, 0),
    p.legacy_goals + coalesce(scored.n, 0),
    p.legacy_assists + coalesce(assisted.n, 0),
    coalesce(motm.n, 0),
    avg_ratings.avg_rating,
    p.legacy_yellow_cards + coalesce(booked.yellows, 0),
    p.legacy_red_cards + coalesce(booked.reds, 0)
  from players p
  left join apps on apps.player_id = p.id
  left join scored on scored.player_id = p.id
  left join assisted on assisted.player_id = p.id
  left join motm on motm.player_id = p.id
  left join avg_ratings on avg_ratings.player_id = p.id
  left join booked on booked.player_id = p.id;
$function$;
