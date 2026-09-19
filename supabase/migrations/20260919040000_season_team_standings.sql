-- Season-long team standings ("a side is a shirt, not a squad", per
-- BACKEND.md): Alpha through Zeta persist across the whole season and
-- accumulate league points even though the ballot refills them with
-- different people every Sunday. There's no stored points column
-- (BACKEND.md is explicit: derive from results, storing a running total
-- invites drift when a result is corrected) — this returns one row per
-- side per completed match, goals for/against from that side's own view
-- of the scoreline, and the client aggregates it into P/W/D/L/GF/GA/Pts
-- and recent form in one pass, since both need the same raw rows.
create function season_team_matches(p_season_start timestamptz)
returns table (greek_name text, played_at timestamptz, goals_for integer, goals_against integer)
language sql
security definer
set search_path = public
stable
as $$
  select ta.greek_name, md.played_at, m.score_a, m.score_b
  from matches m
  join teams ta on ta.id = m.team_a_id
  join matchdays md on md.id = m.matchday_id
  where md.status = 'complete' and md.played_at >= p_season_start
  union all
  select tb.greek_name, md.played_at, m.score_b, m.score_a
  from matches m
  join teams tb on tb.id = m.team_b_id
  join matchdays md on md.id = m.matchday_id
  where md.status = 'complete' and md.played_at >= p_season_start;
$$;

revoke all on function season_team_matches(timestamptz) from public;
grant execute on function season_team_matches(timestamptz) to authenticated;
