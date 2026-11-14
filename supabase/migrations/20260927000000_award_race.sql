-- Where the requesting player stands in this month's and this year's award races.
-- Only aggregates leave the function: leader names and values, plus the caller's own value and rank.

create or replace function public.award_race()
returns table (badge_key text, scope text, mine numeric, my_rank int, leader numeric, leaders text[], contenders int)
language sql
stable
security definer
set search_path = public
as $$
  with me as (select id from players where user_id = auth.uid()),
  windows as (
    select 'month' as scope,
           date_trunc('month', now() at time zone 'Europe/London') at time zone 'Europe/London' as w_start,
           2 as min_rated
    union all
    select 'year', date_trunc('year', now() at time zone 'Europe/London') at time zone 'Europe/London', 5
  ),
  apps as (
    select w.scope, mp.player_id, count(*) as n
    from windows w join matches m on m.played_at >= w.w_start join match_players mp on mp.match_id = m.id group by 1, 2
  ),
  scored as (
    select w.scope, g.scorer_id as player_id, count(*) as n
    from windows w join matches m on m.played_at >= w.w_start join goals g on g.match_id = m.id group by 1, 2
  ),
  assisted as (
    select w.scope, g.assist_id as player_id, count(*) as n
    from windows w join matches m on m.played_at >= w.w_start join goals g on g.match_id = m.id
    where g.assist_id is not null group by 1, 2
  ),
  cleans as (
    select w.scope, mp.player_id, count(*) as n
    from windows w join matches m on m.played_at >= w.w_start join match_players mp on mp.match_id = m.id
    where (mp.team_id = m.team_a_id and m.score_b = 0) or (mp.team_id = m.team_b_id and m.score_a = 0)
    group by 1, 2
  ),
  rated as (
    select w.scope, r.subject_id as player_id, round(avg(r.score), 2) as avg, count(distinct r.match_id) as games, w.min_rated
    from windows w join matches m on m.played_at >= w.w_start join ratings r on r.match_id = m.id
    group by 1, 2, w.min_rated
  ),
  motm as (
    select w.scope, pb.player_id, count(*) as n
    from windows w join matchdays md on md.played_at >= w.w_start
    join player_badges pb on pb.period_key = md.id::text and pb.badge_key = 'week-motm'
    group by 1, 2
  ),
  metrics as (
    select 'month-golden-boot' as badge_key, scope, player_id, n::numeric as v from scored where scope = 'month'
    union all select 'month-playmaker', scope, player_id, n from assisted where scope = 'month'
    union all select 'month-golden-glove', scope, player_id, n from cleans where scope = 'month'
    union all select 'month-player-of-the-month', scope, player_id, avg from rated where scope = 'month' and games >= min_rated
    union all select 'cr7-syndrome', scope, player_id, n from scored where scope = 'year'
    union all select 'mesuts-apprentice', scope, player_id, n from assisted where scope = 'year'
    union all select 'clean-freak', scope, player_id, n from cleans where scope = 'year'
    union all select 'messi-ah', scope, player_id, avg from rated where scope = 'year' and games >= min_rated
    union all select 'main-character', scope, player_id, n from motm where scope = 'year'
    union all select 'most-capped', scope, player_id, n from apps where scope = 'year'
  ),
  ranked as (
    select m.*, rank() over (partition by m.badge_key order by m.v desc) as rk, max(m.v) over (partition by m.badge_key) as top
    from metrics m where m.v > 0
  ),
  keys as (
    select k, s from (values
      ('month-golden-boot', 'month'), ('month-playmaker', 'month'), ('month-golden-glove', 'month'), ('month-player-of-the-month', 'month'),
      ('cr7-syndrome', 'year'), ('mesuts-apprentice', 'year'), ('clean-freak', 'year'), ('messi-ah', 'year'),
      ('main-character', 'year'), ('most-capped', 'year')
    ) t(k, s)
  )
  select k.k, k.s,
         (select r.v from ranked r, me where r.badge_key = k.k and r.player_id = me.id),
         (select r.rk::int from ranked r, me where r.badge_key = k.k and r.player_id = me.id),
         (select max(r.top) from ranked r where r.badge_key = k.k),
         coalesce((select array_agg(p.nickname order by p.nickname) from ranked r join players p on p.id = r.player_id
                   where r.badge_key = k.k and r.rk = 1), '{}'),
         (select count(*)::int from ranked r where r.badge_key = k.k)
  from keys k;
$$;

revoke all on function public.award_race() from public;
grant execute on function public.award_race() to authenticated;
