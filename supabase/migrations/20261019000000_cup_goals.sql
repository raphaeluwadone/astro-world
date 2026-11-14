-- Cup scorers, and Cup Hero for the top scorer at each played cup.

create table cup_goals (
  id uuid primary key default gen_random_uuid(),
  cup_match_id uuid not null references cup_matches(id) on delete cascade,
  squad_id uuid not null references cup_squads(id) on delete cascade,
  scorer_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index cup_goals_match on cup_goals (cup_match_id);

alter table cup_goals enable row level security;
create policy cup_goals_select_all on cup_goals for select to authenticated using (true);
create policy cup_goals_write_admin on cup_goals for all to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

-- Saves a cup score and its scorers together. p_goals is [{squad_id, scorer_id}].
create or replace function public.record_cup_result(p_match uuid, p_score_a int, p_score_b int, p_goals jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
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

  update cup_matches set score_a = p_score_a, score_b = p_score_b, played_at = coalesce(played_at, now()) where id = p_match;
  delete from cup_goals where cup_match_id = p_match;
  insert into cup_goals (cup_match_id, squad_id, scorer_id)
  select p_match, (g->>'squad_id')::uuid, (g->>'scorer_id')::uuid from jsonb_array_elements(p_goals) g;
end;
$$;

revoke execute on function public.record_cup_result(uuid, int, int, jsonb) from public, anon;
grant execute on function public.record_cup_result(uuid, int, int, jsonb) to authenticated;

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
    select c.cup_id, c.label, c.scheduled_at, cg.scorer_id, count(*) as n,
           rank() over (partition by c.cup_id order by count(*) desc) as rk
    from (select distinct cup_id, label, scheduled_at from cup_results) c
    join cup_matches m on m.cup_quarter_id = c.cup_id
    join cup_goals cg on cg.cup_match_id = m.id
    group by c.cup_id, c.label, c.scheduled_at, cg.scorer_id
  ) g
  where g.rk = 1
  on conflict do nothing;
  get diagnostics rc = row_count; inserted := inserted + rc;

  return inserted;
end;
$function$;
