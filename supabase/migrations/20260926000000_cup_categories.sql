-- Salami Cup categories beyond Silverware: best defence, most goals, back-to-back wins and ever-presents.
-- Cup MVP and Wooden Spoon are handed out by admins, like Cup Hero.

create or replace function public.award_cup_extras()
returns integer
language plpgsql
security definer
set search_path = public
as $$
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

  return inserted;
end;
$$;

revoke all on function public.award_cup_extras() from public;

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
    select g.scorer_id as player_id, count(*) as n
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
  monthly as (
    select player_id, count(*) as n from monthly_awards
    where year = p_year and player_id is not null and confirmed and award_name not ilike 'unknown%' group by 1
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
  )
  select p.id as player_id, p.positions,
         coalesce(apps.n, 0) as apps, coalesce(scored.n, 0) as goals, coalesce(assisted.n, 0) as assists,
         coalesce(cleans.n, 0) as clean_sheets, rated.avg as avg_rating, coalesce(rated.games, 0) as rated_games,
         coalesce(motm.n, 0) as motm, coalesce(monthly.n, 0) as monthly, coalesce(early.n, 0) as first_claims,
         coalesce(mentioned.n, 0) as mentions, coalesce(on_time.n, 0) as dues_on_time, (select n from quarters) as dues_quarters,
         coalesce(days_played.n, 0) as days_played, (select n from matchdays_played) as season_days
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
  left join days_played on days_played.player_id = p.id;

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
  select player_id, 'new-month-same-me', y_key, monthly || 'x monthly winner', 'Won ' || monthly || ' monthly awards in ' || y_key, now(), now() + interval '12 months'
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
$function$

;

create or replace function public.badge_is_locked(p_badge_key text, p_period_key text, p_status badge_status)
returns boolean
language sql
immutable
as $$
  select p_status = 'live' and (
    p_period_key ~ '^\d{4}$'
    or p_badge_key in ('silverware', 'cup-hero', 'iron-curtain', 'firepower', 'back-to-back', 'cup-mvp', 'wooden-spoon')
  );
$$;

create or replace function public.guard_player_badges()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- Results-based yearly titles wait for the year to finish; hand-picked ones can go up any time.
    if new.period_key ~ '^\d{4}$'
       and new.period_key::int >= extract(year from now() at time zone 'Europe/London')
       and new.badge_key not in ('heart-of-the-team', 'card-collector', 'cup-hero', 'cup-mvp', 'wooden-spoon') then
      return null;
    end if;
    return new;
  end if;

  if badge_is_locked(old.badge_key, old.period_key, old.status)
     and coalesce(current_setting('astro.cup_rollover', true), '') <> 'on' then
    raise exception 'Live yearly and cup badges can''t be changed' using errcode = '42501';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- Every per-cup badge runs until the next cup with a winner.
create or replace function public.roll_cup_badges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cup_keys text[] := array['silverware', 'cup-hero', 'iron-curtain', 'firepower', 'back-to-back', 'cup-mvp', 'wooden-spoon'];
begin
  perform set_config('astro.cup_rollover', 'on', true);
  update player_badges b
  set expires_at = coalesce(
    (select min(w.awarded_at) from player_badges w where w.badge_key = 'silverware' and w.awarded_at > b.awarded_at),
    '2999-12-31'::timestamptz
  )
  where b.badge_key = any(cup_keys)
    and b.expires_at is distinct from coalesce(
      (select min(w.awarded_at) from player_badges w where w.badge_key = 'silverware' and w.awarded_at > b.awarded_at),
      '2999-12-31'::timestamptz
    );
  perform set_config('astro.cup_rollover', 'off', true);
  return null;
end;
$$;
