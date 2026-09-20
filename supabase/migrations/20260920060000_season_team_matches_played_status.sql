-- Real bug, found via seed data verification: season_team_matches()
-- still filtered on matchday_status = 'complete', the value 'played'
-- replaced when the played/cancelled migration landed. Every finished
-- matchday since then was silently invisible to "The Six" standings,
-- always rendering an all-zero table, with nothing forcing a loud
-- failure because no real 'played' matchday with real match results had
-- gone through this path in a fresh state until now.
create or replace function season_team_matches(p_season_start timestamptz)
returns table (greek_name text, played_at timestamptz, goals_for int, goals_against int)
language sql
stable
security definer
set search_path = public
as $$
  select ta.greek_name, md.played_at, m.score_a, m.score_b
  from matches m
  join teams ta on ta.id = m.team_a_id
  join matchdays md on md.id = m.matchday_id
  where md.status = 'played' and md.played_at >= p_season_start
  union all
  select tb.greek_name, md.played_at, m.score_b, m.score_a
  from matches m
  join teams tb on tb.id = m.team_b_id
  join matchdays md on md.id = m.matchday_id
  where md.status = 'played' and md.played_at >= p_season_start;
$$;
