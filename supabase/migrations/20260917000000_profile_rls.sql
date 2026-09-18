-- RLS for the tables the Profile page needs to read: tags, player_tags,
-- pro_players, player_comparisons, comparison_votes. None of these carry
-- an anonymity requirement (unlike ratings/MOTM) — the design explicitly
-- has tag creators and up/down-voters be visible — so a plain public
-- SELECT is enough, no SECURITY DEFINER aggregation needed.
--
-- Deliberately NOT included: insert/vote policies for tag creation, tag
-- application, or comparison up/down-voting. Those interaction flows are
-- still "visual only" per the design status doc — out of scope until
-- that module gets built.

create policy tags_select_all on tags for select to authenticated using (true);
create policy player_tags_select_all on player_tags for select to authenticated using (true);
create policy pro_players_select_all on pro_players for select to authenticated using (true);
create policy player_comparisons_select_all on player_comparisons for select to authenticated using (true);
create policy comparison_votes_select_all on comparison_votes for select to authenticated using (true);

-- Player-scoped rating history (career + recent form + season filtering
-- all derive from this): every match this player was rated in, with the
-- match's date and their average score for it. SECURITY DEFINER for the
-- same reason as the other rating aggregates — bypasses the "only your
-- own rater rows" restriction on the raw table, but the return shape
-- has no rater identity in it, ever.
create function player_match_ratings(p_player_id uuid)
returns table (match_id uuid, played_at timestamptz, avg_rating numeric)
language sql
security definer
set search_path = public
stable
as $$
  select r.match_id, m.played_at, round(avg(r.score), 1) as avg_rating
  from ratings r
  join matches m on m.id = r.match_id
  where r.subject_id = p_player_id
  group by r.match_id, m.played_at
  order by m.played_at desc;
$$;

revoke all on function player_match_ratings(uuid) from public;
grant execute on function player_match_ratings(uuid) to authenticated;
