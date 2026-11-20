-- Yellow and red cards: logged live on Pitch-side, copied into the record when results are filed.
-- A second yellow in the same game also records a red.

create table pitch_cards (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references pitch_games(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  kind text not null check (kind in ('yellow', 'red')),
  minute int,
  second_yellow boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references players(id) on delete set null
);
create index pitch_cards_game_idx on pitch_cards (game_id);

create table cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  kind text not null check (kind in ('yellow', 'red')),
  minute int,
  second_yellow boolean not null default false,
  created_at timestamptz not null default now()
);
create index cards_match_idx on cards (match_id);
create index cards_player_idx on cards (player_id);

alter table pitch_cards enable row level security;
alter table cards enable row level security;
create policy pitch_cards_select on pitch_cards for select to authenticated using (true);
create policy pitch_cards_admin on pitch_cards for all to authenticated using (is_requesting_admin()) with check (is_requesting_admin());
create policy cards_select on cards for select to authenticated using (true);
create policy cards_admin on cards for all to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

alter publication supabase_realtime add table pitch_cards;

-- Keeps the second-yellow red in step with the yellows: added on the second, removed if one is taken back.
create or replace function public.sync_second_yellow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  game uuid;
  who uuid;
  yellows int;
begin
  if tg_table_name = 'pitch_cards' then
    game := coalesce(new.game_id, old.game_id);
  else
    game := coalesce(new.match_id, old.match_id);
  end if;
  who := coalesce(new.player_id, old.player_id);

  if tg_table_name = 'pitch_cards' then
    select count(*) into yellows from pitch_cards where game_id = game and player_id = who and kind = 'yellow';
    if tg_op = 'INSERT' and yellows >= 2 and not exists (select 1 from pitch_cards where game_id = game and player_id = who and kind = 'red') then
      insert into pitch_cards (game_id, team_id, player_id, kind, minute, second_yellow, created_by)
      values (game, new.team_id, who, 'red', new.minute, true, new.created_by);
    elsif yellows < 2 then
      delete from pitch_cards where game_id = game and player_id = who and second_yellow;
    end if;
  else
    select count(*) into yellows from cards where match_id = game and player_id = who and kind = 'yellow';
    if tg_op = 'INSERT' and yellows >= 2 and not exists (select 1 from cards where match_id = game and player_id = who and kind = 'red') then
      insert into cards (match_id, team_id, player_id, kind, minute, second_yellow)
      values (game, new.team_id, who, 'red', new.minute, true);
    elsif yellows < 2 then
      delete from cards where match_id = game and player_id = who and second_yellow;
    end if;
  end if;
  return null;
end;
$$;

create trigger pitch_cards_second_yellow_add after insert on pitch_cards
  for each row when (new.kind = 'yellow') execute function public.sync_second_yellow();
create trigger pitch_cards_second_yellow_undo after delete on pitch_cards
  for each row when (old.kind = 'yellow') execute function public.sync_second_yellow();
create trigger cards_second_yellow_add after insert on cards
  for each row when (new.kind = 'yellow') execute function public.sync_second_yellow();
create trigger cards_second_yellow_undo after delete on cards
  for each row when (old.kind = 'yellow') execute function public.sync_second_yellow();

-- Career totals now carry cards, legacy counts included.
drop function public.player_career_stats();
create function public.player_career_stats()
returns table (player_id uuid, appearances bigint, goals bigint, assists bigint, motm_count bigint, avg_rating numeric, yellow_cards bigint, red_cards bigint)
language sql
stable
security definer
set search_path = public
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
$$;
grant execute on function public.player_career_stats() to authenticated;

-- Full-time report lists the cards under each team.
create or replace function public.post_pitch_report()
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

-- Card Collector is worked out from cards now; Most Booked (monthly) and Fair Play (yearly) are new.
create or replace function public.award_badges(p_year integer DEFAULT NULL::integer)
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

-- Card Collector is results-based now, so it waits for the year to finish like the other yearly titles.
create or replace function public.guard_player_badges()
returns trigger
language plpgsql
as $function$
begin
  if tg_op = 'INSERT' then
    -- Results-based yearly titles wait for the year to finish; hand-picked ones can go up any time.
    if new.period_key ~ '^\d{4}$'
       and new.period_key::int >= extract(year from now() at time zone 'Europe/London')
       and new.badge_key not in ('heart-of-the-team', 'cup-hero', 'cup-mvp', 'wooden-spoon') then
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
$function$;
