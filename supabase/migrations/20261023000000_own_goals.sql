-- Own goals: the scorer is from the side that conceded, team_id/squad_id is the side that benefited.
-- They count on the scoreboard and come off the scorer's own goal tally. Hat-tricks and goal milestones only count real goals.

alter table public.goals add column own_goal boolean not null default false;
alter table public.goals add constraint goals_own_goal_no_assist check (not own_goal or assist_id is null);
alter table public.pitch_goals add column own_goal boolean not null default false;
alter table public.pitch_goals add constraint pitch_goals_own_goal_no_assist check (not own_goal or assist_id is null);
alter table public.cup_goals add column own_goal boolean not null default false;

CREATE OR REPLACE FUNCTION public.award_badges(p_year integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  inserted int := 0;
  rc int;
  y_start timestamptz;
  y_end timestamptz;
  y_key text;
  min_games constant int := 5;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can award badges';
  end if;

  -- Weekly: Man of the Match, ties included. Mechanical, so live straight away.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at, status, auto_live_at)
  select s.nominee_id, 'week-motm', s.matchday_id::text,
         s.vote_count || ' votes', 'Voted Man of the Match',
         md.played_at, next_matchday_at(md.played_at), 'live', md.played_at
  from matchday_motm_summary() s
  join matchdays md on md.id = s.matchday_id and md.status = 'played'
  where s.vote_count = (select max(vote_count) from matchday_motm_summary() x where x.matchday_id = s.matchday_id)
    and not motm_open_for(s.matchday_id)
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Weekly: kept a clean sheet in at least one match that day.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at, status, auto_live_at)
  select distinct on (mp.player_id, md.id)
         mp.player_id, 'week-clean-sheet', md.id::text,
         null, 'Kept a clean sheet', md.played_at, next_matchday_at(md.played_at), 'live', md.played_at
  from match_players mp
  join matches m on m.id = mp.match_id
  join matchdays md on md.id = m.matchday_id and md.status = 'played'
  where (mp.team_id = m.team_a_id and m.score_b = 0) or (mp.team_id = m.team_b_id and m.score_a = 0)
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Monthly: the existing confirmed monthly awards, worn through the following month.
  insert into player_badges (player_id, badge_key, period_key, title, stat, detail, awarded_at, expires_at, status, auto_live_at)
  select ma.player_id,
         'month-' || trim(both '-' from lower(regexp_replace(ma.award_name, '[^a-zA-Z0-9]+', '-', 'g'))),
         ma.year || '-' || lpad(ma.month::text, 2, '0'),
         ma.award_name, ma.stat, ma.award_name || ', ' || to_char(make_date(ma.year, ma.month, 1), 'FMMonth YYYY'),
         make_date(ma.year, ma.month, 1) + interval '1 month',
         make_date(ma.year, ma.month, 1) + interval '2 months',
         'live', now()
  from monthly_awards ma
  where ma.player_id is not null and ma.confirmed and ma.award_name not ilike 'unknown%'
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Milestone: hat-trick in a single match.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select g.scorer_id, 'bag-of-three', g.match_id::text, count(*) || ' goals',
         'Scored ' || count(*) || ' in one match', max(m.played_at), max(m.played_at) + interval '12 months'
  from goals g join matches m on m.id = g.match_id
  where not g.own_goal
  group by g.scorer_id, g.match_id
  having count(*) >= 3
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Milestone: 100 career goals, legacy goals included.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select c.player_id, 'centurion', 'career', c.goals || ' goals', 'Passed 100 career goals', now(), now() + interval '12 months'
  from player_career_stats() c
  where c.goals >= 100
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Cup: every player in the squad that topped a finished cup. Points, then goal difference, then goals scored.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  with results as (
    select cq.id as cup_id, cq.label, cq.scheduled_at, s.id as squad_id, s.name,
           sum(case when (m.squad_a_id = s.id and m.score_a > m.score_b) or (m.squad_b_id = s.id and m.score_b > m.score_a) then 3
                    when m.score_a = m.score_b then 1 else 0 end) as pts,
           sum(case when m.squad_a_id = s.id then m.score_a - m.score_b else m.score_b - m.score_a end) as gd,
           sum(case when m.squad_a_id = s.id then m.score_a else m.score_b end) as gf
    from cup_quarters cq
    join cup_squads s on s.cup_quarter_id = cq.id
    join cup_matches m on m.cup_quarter_id = cq.id and s.id in (m.squad_a_id, m.squad_b_id)
    where cq.status = 'played' and m.score_a is not null and m.score_b is not null
    group by cq.id, cq.label, cq.scheduled_at, s.id, s.name
  ),
  ranked as (
    select *, rank() over (partition by cup_id order by pts desc, gd desc, gf desc) as rk from results
  )
  select csp.player_id, 'silverware', r.cup_id::text, r.pts || ' pts',
         'Won the ' || r.label || ' Salami Cup with ' || r.name, r.scheduled_at, r.scheduled_at + interval '12 months'
  from ranked r
  join cup_squad_players csp on csp.cup_squad_id = r.squad_id
  where r.rk = 1
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  inserted := inserted + award_cup_extras();

  -- Monthly: most cards in a finished month, ties included.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at, status, auto_live_at)
  with monthly_cards as (
    select c.player_id, date_trunc('month', m.played_at at time zone 'Africa/Lagos') as month, count(*) as n
    from cards c join matches m on m.id = c.match_id
    group by 1, 2
  ),
  ranked as (
    select *, max(n) over (partition by month) as top from monthly_cards
    where month + interval '1 month' <= now() at time zone 'Africa/Lagos'
  )
  select player_id, 'month-most-booked', to_char(month, 'YYYY-MM'), n || case when n = 1 then ' card' else ' cards' end,
         'Most cards in ' || to_char(month, 'FMMonth YYYY'),
         (month + interval '1 month') at time zone 'Africa/Lagos', (month + interval '2 months') at time zone 'Africa/Lagos', 'live', now()
  from ranked where n = top
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  if p_year is null then
    return inserted;
  end if;

  y_start := make_timestamptz(p_year, 1, 1, 0, 0, 0, 'Europe/London');
  y_end := y_start + interval '1 year';
  y_key := p_year::text;

  create temp table season_stats on commit drop as
  with apps as (
    select mp.player_id, count(*) as n
    from match_players mp join matches m on m.id = mp.match_id
    where m.played_at >= y_start and m.played_at < y_end group by 1
  ),
  scored as (
    select g.scorer_id as player_id, count(*) filter (where not g.own_goal) - count(*) filter (where g.own_goal) as n
    from goals g join matches m on m.id = g.match_id
    where m.played_at >= y_start and m.played_at < y_end group by 1
  ),
  assisted as (
    select g.assist_id as player_id, count(*) as n
    from goals g join matches m on m.id = g.match_id
    where g.assist_id is not null and m.played_at >= y_start and m.played_at < y_end group by 1
  ),
  cleans as (
    select mp.player_id, count(*) as n
    from match_players mp join matches m on m.id = mp.match_id
    where m.played_at >= y_start and m.played_at < y_end
      and ((mp.team_id = m.team_a_id and m.score_b = 0) or (mp.team_id = m.team_b_id and m.score_a = 0))
    group by 1
  ),
  rated as (
    select r.subject_id as player_id, round(avg(r.score), 2) as avg, count(distinct r.match_id) as games
    from ratings r join matches m on m.id = r.match_id
    where m.played_at >= y_start and m.played_at < y_end group by 1
  ),
  motm as (
    select pb.player_id, count(*) as n from player_badges pb
    join matchdays md on md.id::text = pb.period_key
    where pb.badge_key = 'week-motm' and md.played_at >= y_start and md.played_at < y_end group by 1
  ),
  -- Back to back: the same monthly award in consecutive months, the second of them this year.
  monthly as (
    select cur.player_id, count(*) as n,
           string_agg(cur.award_name || ', ' || to_char(make_date(prev.year, prev.month, 1), 'FMMon') || ' and '
             || to_char(make_date(cur.year, cur.month, 1), 'FMMon'), '; ' order by cur.month) as runs
    from monthly_awards cur
    join monthly_awards prev on prev.player_id = cur.player_id and prev.award_key = cur.award_key
      and make_date(prev.year, prev.month, 1) = make_date(cur.year, cur.month, 1) - interval '1 month'
      and prev.confirmed and prev.award_name not ilike 'unknown%'
    where cur.year = p_year and cur.player_id is not null and cur.confirmed and cur.award_name not ilike 'unknown%'
    group by 1
  ),
  first_claims as (
    select distinct on (wc.matchday_id) wc.player_id
    from weekly_claims wc join matchdays md on md.id = wc.matchday_id
    where md.played_at >= y_start and md.played_at < y_end
    order by wc.matchday_id, wc.claimed_at
  ),
  early as (select player_id, count(*) as n from first_claims group by 1),
  mentioned as (
    select pm.mentioned_player_id as player_id, count(*) as n
    from post_mentions pm join posts p on p.id = pm.post_id
    where p.created_at >= y_start and p.created_at < y_end group by 1
  ),
  quarters as (select count(*) as n from dues_quarters where year = p_year and due_date <= now()::date),
  on_time as (
    select dp.player_id, count(*) as n
    from dues_payments dp join dues_quarters dq on dq.id = dp.dues_quarter_id
    where dq.year = p_year and dp.paid_at::date <= dq.due_date group by 1
  ),
  matchdays_played as (
    select count(*) as n from matchdays where status = 'played' and played_at >= y_start and played_at < y_end
  ),
  days_played as (
    select mp.player_id, count(distinct m.matchday_id) as n
    from match_players mp join matches m on m.id = mp.match_id
    where m.played_at >= y_start and m.played_at < y_end group by 1
  ),
  booked as (
    select c.player_id, count(*) as n
    from cards c join matches m on m.id = c.match_id
    where m.played_at >= y_start and m.played_at < y_end group by 1
  )
  select p.id as player_id, p.positions,
         coalesce(apps.n, 0) as apps, coalesce(scored.n, 0) as goals, coalesce(assisted.n, 0) as assists,
         coalesce(cleans.n, 0) as clean_sheets, rated.avg as avg_rating, coalesce(rated.games, 0) as rated_games,
         coalesce(motm.n, 0) as motm, coalesce(monthly.n, 0) as monthly, monthly.runs as monthly_runs, coalesce(early.n, 0) as first_claims,
         coalesce(mentioned.n, 0) as mentions, coalesce(on_time.n, 0) as dues_on_time, (select n from quarters) as dues_quarters,
         coalesce(days_played.n, 0) as days_played, (select n from matchdays_played) as season_days,
         coalesce(booked.n, 0) as cards
  from players p
  left join apps on apps.player_id = p.id
  left join scored on scored.player_id = p.id
  left join assisted on assisted.player_id = p.id
  left join cleans on cleans.player_id = p.id
  left join rated on rated.player_id = p.id
  left join motm on motm.player_id = p.id
  left join monthly on monthly.player_id = p.id
  left join early on early.player_id = p.id
  left join mentioned on mentioned.player_id = p.id
  left join on_time on on_time.player_id = p.id
  left join days_played on days_played.player_id = p.id
  left join booked on booked.player_id = p.id;

  -- Top of a single metric, ties included, only when the top value is above zero.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select player_id, badge_key, y_key, stat, detail, now(), now() + interval '12 months'
  from (
    select player_id, 'cr7-syndrome' as badge_key, goals || ' goals' as stat, 'Top scorer of ' || y_key as detail,
           goals as v, max(goals) over () as top from season_stats
    union all
    select player_id, 'mesuts-apprentice', assists || ' assists', 'Most assists of ' || y_key, assists, max(assists) over () from season_stats
    union all
    select player_id, 'clean-freak', clean_sheets || ' clean sheets', 'Most clean sheets of ' || y_key, clean_sheets, max(clean_sheets) over () from season_stats
    union all
    select player_id, 'most-capped', apps || ' appearances', 'Most appearances of ' || y_key, apps, max(apps) over () from season_stats
    union all
    select player_id, 'main-character', motm || ' MOTM wins', 'Most Man of the Match wins in ' || y_key, motm, max(motm) over () from season_stats
    union all
    select player_id, 'early-bird', first_claims || ' first claims', 'First to claim a weekly spot most often in ' || y_key, first_claims, max(first_claims) over () from season_stats
    union all
    select player_id, 'trending', mentions || ' mentions', 'Most tagged in the group chat in ' || y_key, mentions, max(mentions) over () from season_stats
    union all
    select player_id, 'card-collector', cards || case when cards = 1 then ' card' else ' cards' end, 'Most cards of ' || y_key, cards, max(cards) over () from season_stats
    union all
    select player_id, 'fair-play', apps || ' appearances, no cards', 'Most appearances without a card in ' || y_key, apps, max(apps) over ()
    from season_stats where cards = 0 and apps >= min_games
  ) t
  where v = top and top > 0
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Best average rating, overall and among defenders and keepers.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select player_id, badge_key, y_key, avg_rating || ' average', detail, now(), now() + interval '12 months'
  from (
    select player_id, 'messi-ah' as badge_key, avg_rating, 'Best average rating of ' || y_key as detail,
           max(avg_rating) over () as top
    from season_stats where rated_games >= min_games
    union all
    select player_id, 'ramos-energy', avg_rating, 'Best-rated defender or keeper of ' || y_key,
           max(avg_rating) over ()
    from season_stats where rated_games >= min_games and positions && array['GK', 'DEF']::position_type[]
  ) t
  where avg_rating = top
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Thresholds rather than leaders.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select player_id, 'new-month-same-me', y_key,
         case when monthly = 1 then 'Back to back' else monthly || ' back-to-back wins' end,
         'Back to back: ' || monthly_runs, now(), now() + interval '12 months'
  from season_stats where monthly >= 1
  union all
  select player_id, 'sunday-disciple', y_key, days_played || ' of ' || season_days || ' matchdays', 'Played every matchday of ' || y_key, now(), now() + interval '12 months'
  from season_stats where season_days >= 5 and days_played = season_days
  union all
  select player_id, 'good-standing', y_key, dues_on_time || ' of ' || dues_quarters || ' quarters', 'Paid every quarter on time in ' || y_key, now(), now() + interval '12 months'
  from season_stats where dues_quarters >= 1 and dues_on_time >= dues_quarters
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  return inserted;
end;
$function$;

CREATE OR REPLACE FUNCTION public.award_race()
 RETURNS TABLE(badge_key text, scope text, mine numeric, my_rank integer, leader numeric, leaders text[], contenders integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    select w.scope, g.scorer_id as player_id, count(*) filter (where not g.own_goal) - count(*) filter (where g.own_goal) as n
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
$function$;

CREATE OR REPLACE FUNCTION public.club_moments()
 RETURNS TABLE(kind text, value bigint, player_id uuid, happened_at timestamp with time zone, detail text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with played as (
    select id, played_at, venue, row_number() over (order by played_at, id) as n
    from matchdays
    where status in ('played', 'complete')
  ),
  club_goals as (
    select g.id, m.played_at,
      (select coalesce(sum(legacy_goals), 0) from players) + row_number() over (order by m.played_at, g.minute, g.id) as n
    from goals g
    join matches m on m.id = g.match_id
  ),
  player_apps as (
    select mp.player_id, m.played_at,
      p.legacy_appearances + row_number() over (partition by mp.player_id order by m.played_at, m.id) as n
    from match_players mp
    join matches m on m.id = mp.match_id
    join players p on p.id = mp.player_id
  ),
  player_goals as (
    select g.scorer_id as player_id, m.played_at,
      p.legacy_goals + row_number() over (partition by g.scorer_id order by m.played_at, g.minute, g.id) as n
    from goals g
    join matches m on m.id = g.match_id
    join players p on p.id = g.scorer_id
    where not g.own_goal
  )
  select 'matchdays' as kind, n as value, null::uuid as player_id, played_at as happened_at, venue as detail from played where n in (1, 10, 25) or n % 50 = 0
  union all
  select 'club-goals', n, null, played_at, null from club_goals where n % 250 = 0
  union all
  select 'player-apps', n, player_id, played_at, null from player_apps where n % 50 = 0
  union all
  select 'player-goals', n, player_id, played_at, null from player_goals where n % 25 = 0
  order by happened_at desc;
$function$;

CREATE OR REPLACE FUNCTION public.draw_player_stats(p_players uuid[], p_season_start timestamp with time zone, p_since timestamp with time zone DEFAULT NULL::timestamp with time zone, p_matchday uuid DEFAULT NULL::uuid)
 RETURNS TABLE(player_id uuid, avg_rating numeric, rating_count bigint, season_goals bigint, sundays bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with rated as (
    select r.subject_id, avg(r.score) as avg_rating, count(*) as n
    from ratings r join matches m on m.id = r.match_id
    where r.subject_id = any(p_players)
      and (p_matchday is null or m.matchday_id = p_matchday)
      and (p_since is null or m.played_at >= p_since)
    group by r.subject_id
  ),
  scored as (
    select scorer_id, count(*) filter (where not own_goal) - count(*) filter (where own_goal) as n from (
      select g.scorer_id, g.own_goal from goals g join matches m on m.id = g.match_id where m.played_at >= p_season_start
      union all
      select pg.scorer_id, pg.own_goal from pitch_goals pg join pitch_games gm on gm.id = pg.game_id join matchdays md on md.id = gm.matchday_id
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
$function$;

CREATE OR REPLACE FUNCTION public.award_cup_extras()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  inserted int := 0;
  rc int;
begin
  drop table if exists cup_results;
  create temp table cup_results on commit drop as
  select cq.id as cup_id, cq.label, cq.scheduled_at, s.id as squad_id, s.name,
         sum(case when (m.squad_a_id = s.id and m.score_a > m.score_b) or (m.squad_b_id = s.id and m.score_b > m.score_a) then 3
                  when m.score_a = m.score_b then 1 else 0 end) as pts,
         sum(case when m.squad_a_id = s.id then m.score_a - m.score_b else m.score_b - m.score_a end) as gd,
         sum(case when m.squad_a_id = s.id then m.score_a else m.score_b end) as gf,
         sum(case when m.squad_a_id = s.id then m.score_b else m.score_a end) as ga
  from cup_quarters cq
  join cup_squads s on s.cup_quarter_id = cq.id
  join cup_matches m on m.cup_quarter_id = cq.id and s.id in (m.squad_a_id, m.squad_b_id)
  where cq.status = 'played' and m.score_a is not null and m.score_b is not null
  group by cq.id, cq.label, cq.scheduled_at, s.id, s.name;

  -- Iron Curtain: the squad that conceded fewest.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select csp.player_id, 'iron-curtain', r.cup_id::text, r.ga || ' conceded',
         'Best defence at the ' || r.label || ' Salami Cup with ' || r.name, r.scheduled_at, '2999-12-31'::timestamptz
  from (select *, rank() over (partition by cup_id order by ga) as rk from cup_results) r
  join cup_squad_players csp on csp.cup_squad_id = r.squad_id
  where r.rk = 1
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Firepower: the squad that scored most.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select csp.player_id, 'firepower', r.cup_id::text, r.gf || ' scored',
         'Most goals at the ' || r.label || ' Salami Cup with ' || r.name, r.scheduled_at, '2999-12-31'::timestamptz
  from (select *, rank() over (partition by cup_id order by gf desc) as rk from cup_results) r
  join cup_squad_players csp on csp.cup_squad_id = r.squad_id
  where r.rk = 1 and r.gf > 0
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Back to Back: won this cup and the one before it. The stat is the length of the run.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  with cups as (
    select cup_id, label, scheduled_at, row_number() over (order by scheduled_at) as n
    from (select distinct cup_id, label, scheduled_at from cup_results) c
  ),
  winners as (
    select r.cup_id, csp.player_id
    from (select *, rank() over (partition by cup_id order by pts desc, gd desc, gf desc) as rk from cup_results) r
    join cup_squad_players csp on csp.cup_squad_id = r.squad_id
    where r.rk = 1
  ),
  wins as (
    select w.player_id, c.cup_id, c.label, c.scheduled_at, c.n,
           c.n - row_number() over (partition by w.player_id order by c.n) as island
    from winners w join cups c on c.cup_id = w.cup_id
  ),
  runs as (
    select *, row_number() over (partition by player_id, island order by n) as run from wins
  )
  select player_id, 'back-to-back', cup_id::text, run || ' in a row',
         'Won the ' || label || ' Salami Cup, ' || run || ' in a row', scheduled_at, '2999-12-31'::timestamptz
  from runs
  where run >= 2
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Ever-present: played in every cup of a year that had at least two. Current-year rows are dropped by the guard.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  with cups as (
    select distinct cup_id, scheduled_at, extract(year from scheduled_at at time zone 'Europe/London')::int as y from cup_results
  ),
  per_year as (
    select y, count(*) as n, max(scheduled_at) as last_at from cups group by y having count(*) >= 2
  ),
  played as (
    select csp.player_id, c.y, count(distinct c.cup_id) as n
    from cups c
    join cup_squads s on s.cup_quarter_id = c.cup_id
    join cup_squad_players csp on csp.cup_squad_id = s.id
    group by 1, 2
  )
  select p.player_id, 'ever-present', p.y::text, p.n || ' of ' || p.n || ' cups',
         'Played every Salami Cup of ' || p.y, make_timestamptz(p.y + 1, 1, 1, 0, 0, 0, 'Europe/London'),
         make_timestamptz(p.y + 2, 1, 1, 0, 0, 0, 'Europe/London')
  from played p join per_year y on y.y = p.y and y.n = p.n
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  -- Cup Hero: the top scorer at each cup, ties included.
  insert into player_badges (player_id, badge_key, period_key, stat, detail, awarded_at, expires_at)
  select g.scorer_id, 'cup-hero', g.cup_id::text, g.n || case when g.n = 1 then ' goal' else ' goals' end,
         'Top scorer at the ' || g.label || ' Salami Cup', g.scheduled_at, '2999-12-31'::timestamptz
  from (
    select c.cup_id, c.label, c.scheduled_at, cg.scorer_id, count(*) filter (where not cg.own_goal) - count(*) filter (where cg.own_goal) as n,
           rank() over (partition by c.cup_id order by count(*) filter (where not cg.own_goal) - count(*) filter (where cg.own_goal) desc) as rk
    from (select distinct cup_id, label, scheduled_at from cup_results) c
    join cup_matches m on m.cup_quarter_id = c.cup_id
    join cup_goals cg on cg.cup_match_id = m.id
    group by c.cup_id, c.label, c.scheduled_at, cg.scorer_id
  ) g
  where g.rk = 1 and g.n > 0
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  return inserted;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_cup_result(p_match uuid, p_score_a integer, p_score_b integer, p_goals jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  m cup_matches;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can record cup results' using errcode = '42501';
  end if;
  select * into m from cup_matches where id = p_match;
  if m.id is null then
    raise exception 'That fixture no longer exists';
  end if;
  if p_score_a < 0 or p_score_b < 0 then
    raise exception 'Scores can''t be negative';
  end if;
  if exists (select 1 from jsonb_array_elements(p_goals) g where (g->>'squad_id')::uuid not in (m.squad_a_id, m.squad_b_id)) then
    raise exception 'A scorer is listed for a squad not in this fixture';
  end if;
  if (select count(*) from jsonb_array_elements(p_goals) g where (g->>'squad_id')::uuid = m.squad_a_id) > p_score_a
     or (select count(*) from jsonb_array_elements(p_goals) g where (g->>'squad_id')::uuid = m.squad_b_id) > p_score_b then
    raise exception 'More scorers than goals';
  end if;

  -- An own goal's scorer plays for the other squad; a normal scorer for the squad credited.
  if exists (
    select 1 from jsonb_array_elements(p_goals) g
    where (g->>'scorer_id') is not null
      and not exists (
        select 1 from cup_squad_players sp
        where sp.player_id = (g->>'scorer_id')::uuid
          and sp.cup_squad_id = case
            when coalesce((g->>'own_goal')::boolean, false)
              then case when (g->>'squad_id')::uuid = m.squad_a_id then m.squad_b_id else m.squad_a_id end
            else (g->>'squad_id')::uuid
          end
      )
  ) then
    raise exception 'A scorer isn''t in the right squad for that goal';
  end if;

  update cup_matches set score_a = p_score_a, score_b = p_score_b, played_at = coalesce(played_at, now()) where id = p_match;
  delete from cup_goals where cup_match_id = p_match;
  insert into cup_goals (cup_match_id, squad_id, scorer_id, own_goal)
  select p_match, (g->>'squad_id')::uuid, (g->>'scorer_id')::uuid, coalesce((g->>'own_goal')::boolean, false)
  from jsonb_array_elements(p_goals) g;
end;
$function$;

CREATE OR REPLACE FUNCTION public.post_pitch_report()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  a teams;
  b teams;
  sa int;
  sb int;
  game_no int;
  scorers text;
  lineups text;
  booked text;
  body text;
  post uuid;
  m record;
begin
  if new.ended_at is null then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.ended_at is not null and old.report is not distinct from new.report and old.edited_at is not distinct from new.edited_at then
    return null;
  end if;

  select * into a from teams where id = new.team_a_id;
  select * into b from teams where id = new.team_b_id;
  select count(*) filter (where team_id = a.id), count(*) filter (where team_id = b.id) into sa, sb
  from pitch_goals where game_id = new.id;
  select count(*) into game_no from pitch_games where matchday_id = new.matchday_id and created_at <= new.created_at;

  select string_agg(line, E'\n' order by ord) into scorers
  from (
    select case when g.team_id = a.id then 0 else 1 end as ord,
      '**' || t.greek_name || ':** ' || string_agg(
        coalesce(mention_token(g.scorer_id), 'scorer to add')
          || case when g.own_goal then ' (OG)' else '' end
          || case
               when g.minute is null then ''
               when g.minute > new.length_min then ' ' || new.length_min || '+' || (g.minute - new.length_min) || '′'
               else ' ' || g.minute || '′'
             end
          || coalesce(' (assist ' || mention_token(g.assist_id) || ')', ''),
        ', ' order by g.created_at
      ) as line
    from pitch_goals g join teams t on t.id = g.team_id
    where g.game_id = new.id
    group by g.team_id, t.greek_name
  ) s;

  -- Checked-in players if there are any, otherwise the drawn side.
  select string_agg(line, E'\n' order by ord) into lineups
  from (
    select case when t.id = a.id then 0 else 1 end as ord,
      t.greek_name || ': ' || string_agg(mention_token(tm.player_id), ', ' order by p.nickname) as line
    from teams t
    join team_members tm on tm.team_id = t.id
    join players p on p.id = tm.player_id
    where t.id in (a.id, b.id)
      and (
        not exists (select 1 from pitch_checkins c where c.matchday_id = new.matchday_id)
        or exists (select 1 from pitch_checkins c where c.matchday_id = new.matchday_id and c.player_id = tm.player_id)
      )
    group by t.id, t.greek_name
  ) l;

  select string_agg(line, E'\n' order by ord) into booked
  from (
    select case when c.team_id = a.id then 0 else 1 end as ord,
      '**' || t.greek_name || ':** ' || string_agg(
        case when c.kind = 'yellow' then '🟨 ' else '🟥 ' end || mention_token(c.player_id)
          || coalesce(' ' || c.minute || '′', '')
          || case when c.second_yellow then ' (second yellow)' else '' end,
        ', ' order by c.minute nulls last, c.second_yellow, c.created_at
      ) as line
    from pitch_cards c join teams t on t.id = c.team_id
    where c.game_id = new.id
    group by c.team_id, t.greek_name
  ) s;

  body := '**Full time, game ' || game_no || ': ' || a.greek_name || ' ' || sa || '–' || sb || ' ' || b.greek_name || '**'
    || coalesce(E'\n\n' || nullif(btrim(new.report), ''), '')
    || E'\n\n' || coalesce(scorers, 'No goals.')
    || coalesce(E'\n\n_Cards_' || E'\n' || booked, '')
    || coalesce(E'\n\n_Line-ups_' || E'\n' || lineups, '');

  insert into posts (author_id, kind, matchday_id, pitch_game_id, content)
  values (matchday_post_author(), 'report', new.matchday_id, new.id, body)
  on conflict (pitch_game_id) do update set content = excluded.content
  returning id into post;

  for m in
    select tm.player_id, t.greek_name as team,
      case when t.id = a.id then b.greek_name else a.greek_name end as opponent,
      case when t.id = a.id then sa else sb end as scored,
      case when t.id = a.id then sb else sa end as conceded
    from teams t join team_members tm on tm.team_id = t.id
    where t.id in (a.id, b.id)
  loop
    perform notify(
      player_user(m.player_id), 'pitch_result',
      jsonb_build_object('matchday_id', new.matchday_id, 'team', m.team, 'opponent', m.opponent, 'for', m.scored, 'against', m.conceded, 'game_no', game_no),
      '/community?post=' || post, null, 'result:' || new.id || ':' || m.player_id
    );
  end loop;
  return null;
end;
$function$;

-- Adds own_goals, so the return type changes.
DROP FUNCTION public.player_career_stats();
CREATE FUNCTION public.player_career_stats()
 RETURNS TABLE(player_id uuid, appearances bigint, goals bigint, assists bigint, motm_count bigint, avg_rating numeric, yellow_cards bigint, red_cards bigint, own_goals bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with apps as (
    select player_id, count(*) as n from match_players group by player_id
  ),
  scored as (
    select player_id, count(*) filter (where not own_goal) - count(*) filter (where own_goal) as n, count(*) filter (where own_goal) as og from (
      select scorer_id as player_id, own_goal from goals
      union all
      select scorer_id, own_goal from cup_goals
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
    p.legacy_red_cards + coalesce(booked.reds, 0),
    coalesce(scored.og, 0)
  from players p
  left join apps on apps.player_id = p.id
  left join scored on scored.player_id = p.id
  left join assisted on assisted.player_id = p.id
  left join motm on motm.player_id = p.id
  left join avg_ratings on avg_ratings.player_id = p.id
  left join booked on booked.player_id = p.id;
$function$;

-- Adds own goal columns, so the return type changes.
drop function public.compare_stats(timestamptz);
create function public.compare_stats(p_since timestamptz default null)
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
  cup_heroes bigint,
  own_goals bigint,
  cup_own_goals bigint
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
    select scorer_id as player_id, count(*) filter (where not own_goal) - count(*) filter (where own_goal) as n, count(*) filter (where own_goal) as og from (
      select g.scorer_id, g.own_goal from goals g join m on m.id = g.match_id
      union all
      select cg.scorer_id, cg.own_goal from cup_goals cg where p_since is null
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
  cup_scored as (
    select scorer_id as player_id, count(*) filter (where not own_goal) - count(*) filter (where own_goal) as n, count(*) filter (where own_goal) as og from cup_goals group by 1
  ),
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
    coalesce(cup_badges.heroes, 0),
    coalesce(scored.og, 0),
    coalesce(cup_scored.og, 0)
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
grant execute on function public.player_career_stats() to anon, authenticated;
