-- RLS policies for the two anonymity-critical tables: ratings and
-- matchday_motm_votes. This is deliberately its own migration, separate
-- from the schema, because getting this right matters more than moving
-- fast (see project memory: "votes need to be fully anonymous, even
-- from admins").
--
-- The guarantee this migration implements is APP-LEVEL anonymity (the
-- decision made explicitly over structural anonymity, because votes
-- need to stay editable until the close time): no player, and nothing
-- reachable through the anon/authenticated API roles, can ever learn
-- who cast a particular vote. A raw row still technically links
-- rater/voter to their score in the database — someone with direct
-- Postgres access (e.g. the Supabase dashboard's SQL editor, or the
-- service_role key) could still see it. The app itself must NEVER use
-- the service_role key for anything that touches these tables (or
-- really at all — see src/lib/supabase.ts).
--
-- Shape of the solution:
--   1. Each table's own RLS policies let a player see/insert/update
--      ONLY their own vote rows (never anyone else's) — this is what
--      supports "editable until close" while keeping every other row
--      invisible even to its own subject/nominee.
--   2. Two SECURITY DEFINER functions (match_ratings_summary,
--      matchday_motm_summary) expose the AGGREGATE only (average
--      score, nomination counts) to any authenticated player, without
--      ever returning who voted. These are how the app shows "this
--      player's match rating is 7.4" or "the MOTM winner" without
--      anyone being able to reverse-engineer individual votes from it.
--   3. A handful of small SECURITY DEFINER helper functions do the
--      eligibility checks (is this really your own player row, did the
--      subject/nominee actually play, is voting still open) so these
--      policies don't depend on read-access policies existing yet on
--      players/matchdays/matches/match_players — those are a separate,
--      later decision (e.g. "can players see each other's height/
--      weight") that this migration deliberately doesn't make.

-- ---------------------------------------------------------------------------
-- Voting window: both ratings and MOTM nominations close the Saturday
-- after the Sunday they're for (giving everyone the full week to vote),
-- at 23:59 *UK local time* (not UTC — this is exactly the kind of
-- timezone bug flagged as a risk earlier). Assumption carried over from
-- the design discussion: MOTM closes on the same schedule as ratings.
-- Flag if that's wrong.
-- ---------------------------------------------------------------------------

create function voting_closes_at(p_played_at timestamptz)
returns timestamptz
language sql
immutable
as $$
  select (
    (p_played_at at time zone 'Europe/London')::date
    + 6 -- Sunday -> Saturday
    + time '23:59:00'
  ) at time zone 'Europe/London';
$$;

-- ---------------------------------------------------------------------------
-- Eligibility helpers. SECURITY DEFINER + a pinned search_path so these
-- work regardless of what (if any) read policies exist on the tables
-- they check, and can't be tricked via a hijacked search_path.
-- ---------------------------------------------------------------------------

create function is_own_player(p_player_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from players
    where id = p_player_id and user_id = auth.uid()
  );
$$;

create function played_in_match(p_player_id uuid, p_match_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from match_players
    where player_id = p_player_id and match_id = p_match_id
  );
$$;

create function played_in_matchday(p_player_id uuid, p_matchday_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from match_players mp
    join matches m on m.id = mp.match_id
    where mp.player_id = p_player_id and m.matchday_id = p_matchday_id
  );
$$;

create function ratings_open_for(p_match_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select now() < voting_closes_at(m.played_at)
  from matches m
  where m.id = p_match_id;
$$;

create function motm_open_for(p_matchday_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select now() < voting_closes_at(md.played_at)
  from matchdays md
  where md.id = p_matchday_id;
$$;

revoke all on function is_own_player(uuid) from public;
revoke all on function played_in_match(uuid, uuid) from public;
revoke all on function played_in_matchday(uuid, uuid) from public;
revoke all on function ratings_open_for(uuid) from public;
revoke all on function motm_open_for(uuid) from public;
grant execute on function is_own_player(uuid) to authenticated;
grant execute on function played_in_match(uuid, uuid) to authenticated;
grant execute on function played_in_matchday(uuid, uuid) to authenticated;
grant execute on function ratings_open_for(uuid) to authenticated;
grant execute on function motm_open_for(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ratings: see/insert/update only your own vote. No delete policy
-- (deletes are blocked entirely, by default, until there's a reason to
-- allow them). The rater does not need to have played in the match;
-- the subject does (see: rating eligibility, project memory).
-- ---------------------------------------------------------------------------

create policy ratings_select_own
on ratings for select
to authenticated
using (is_own_player(rater_id));

create policy ratings_insert_own
on ratings for insert
to authenticated
with check (
  is_own_player(rater_id)
  and played_in_match(subject_id, match_id)
  and ratings_open_for(match_id)
);

create policy ratings_update_own
on ratings for update
to authenticated
using (is_own_player(rater_id))
with check (
  is_own_player(rater_id)
  and played_in_match(subject_id, match_id)
  and ratings_open_for(match_id)
);

-- ---------------------------------------------------------------------------
-- matchday_motm_votes: same shape as ratings. Nomination pool is the
-- whole matchday (any player who played that day), not just your own
-- match — confirmed in the design discussion.
-- ---------------------------------------------------------------------------

create policy motm_select_own
on matchday_motm_votes for select
to authenticated
using (is_own_player(voter_id));

create policy motm_insert_own
on matchday_motm_votes for insert
to authenticated
with check (
  is_own_player(voter_id)
  and played_in_matchday(nominee_id, matchday_id)
  and motm_open_for(matchday_id)
);

create policy motm_update_own
on matchday_motm_votes for update
to authenticated
using (is_own_player(voter_id))
with check (
  is_own_player(voter_id)
  and played_in_matchday(nominee_id, matchday_id)
  and motm_open_for(matchday_id)
);

-- ---------------------------------------------------------------------------
-- Aggregate-only read access. This is the ONLY way anyone (any
-- authenticated player, not just the rater/subject) reads a match
-- rating or a MOTM tally — the raw tables never expose more than a
-- player's own vote to them.
-- ---------------------------------------------------------------------------

create function match_ratings_summary()
returns table (match_id uuid, subject_id uuid, avg_rating numeric, vote_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select match_id, subject_id, round(avg(score), 1) as avg_rating, count(*) as vote_count
  from ratings
  group by match_id, subject_id;
$$;

create function matchday_motm_summary()
returns table (matchday_id uuid, nominee_id uuid, vote_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select matchday_id, nominee_id, count(*) as vote_count
  from matchday_motm_votes
  group by matchday_id, nominee_id;
$$;

revoke all on function match_ratings_summary() from public;
revoke all on function matchday_motm_summary() from public;
grant execute on function match_ratings_summary() to authenticated;
grant execute on function matchday_motm_summary() to authenticated;
