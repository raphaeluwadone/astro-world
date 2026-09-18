-- RLS for the Matchday module: players (admin flag + locked fields),
-- matchdays, availability, matchday_ballot_entries, teams, team_members,
-- matches, match_players.
--
-- The pattern here is much simpler than ratings/matchday_motm_votes:
-- everything in this module is PUBLIC to read (the whole point of "who's
-- replied", the drawn teams, and match history is that every member can
-- see them) — the only question is who can WRITE. Two shapes cover
-- every table below:
--   * a player can write only their OWN row (availability)
--   * only an admin can write at all (matchdays, the ballot/draw output,
--     matches) — these represent the outcome of an admin action (running
--     the ballot, running the draw, recording a result), not something
--     any member does directly.
--
-- Deliberately NOT included here: the actual ballot-selection algorithm
-- (which 30 of the 'in' respondents get balloted) and the team-draw
-- shuffle (5 sides of 6, no repeat pairings). Both are real business
-- logic, not access control, and the first one is blocked on a real
-- product decision anyway (the standby fairness rule is still
-- unconfirmed invented content — see project memory). This migration
-- only makes sure the RIGHT PEOPLE can write the RESULT once that logic
-- runs; it doesn't implement the logic itself.

-- ---------------------------------------------------------------------------
-- Admin helper + the trigger that makes `is_admin` (and a couple of
-- other identity-adjacent fields) a genuinely locked field, not just an
-- RLS row check. RLS is row-level, not column-level, so "you can update
-- your own player row" alone would let anyone promote themselves to
-- admin — this trigger closes that regardless of the RLS policy shape.
-- ---------------------------------------------------------------------------

create function is_requesting_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from players where user_id = auth.uid()),
    false
  );
$$;

revoke all on function is_requesting_admin() from public;
grant execute on function is_requesting_admin() to authenticated;

create function protect_locked_player_fields()
returns trigger
language plpgsql
as $$
begin
  if not is_requesting_admin() then
    new.is_admin := old.is_admin;
    new.joined_at := old.joined_at;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

create trigger players_protect_locked_fields
  before update on players
  for each row execute function protect_locked_player_fields();

-- ---------------------------------------------------------------------------
-- players: everyone (any authenticated member) can read the roster; a
-- player can update their own row (locked fields aside, see above), and
-- so can an admin (e.g. to fix something on someone else's behalf).
-- No insert policy yet — player rows are created by the signup flow,
-- which isn't designed yet.
-- ---------------------------------------------------------------------------

create policy players_select_all
on players for select
to authenticated
using (true);

create policy players_update_own_or_admin
on players for update
to authenticated
using (is_own_player(id) or is_requesting_admin())
with check (is_own_player(id) or is_requesting_admin());

-- ---------------------------------------------------------------------------
-- matchdays: public read; admin-only write (creating a matchday,
-- advancing its status through open -> balloted -> drawn -> complete).
-- ---------------------------------------------------------------------------

create policy matchdays_select_all
on matchdays for select
to authenticated
using (true);

create policy matchdays_write_admin
on matchdays for insert
to authenticated
with check (is_requesting_admin());

create policy matchdays_update_admin
on matchdays for update
to authenticated
using (is_requesting_admin())
with check (is_requesting_admin());

-- ---------------------------------------------------------------------------
-- availability: public read (the whole "58/104 replied" list is meant
-- to be visible to everyone); a player can only write their OWN
-- availability, and only while the matchday is still in the 'open'
-- stage — once the ballot has run (status moved on), marking yourself
-- in/out after the fact shouldn't silently change anything.
-- ---------------------------------------------------------------------------

create function matchday_is_open(p_matchday_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select status = 'open'
  from matchdays
  where id = p_matchday_id;
$$;

revoke all on function matchday_is_open(uuid) from public;
grant execute on function matchday_is_open(uuid) to authenticated;

create policy availability_select_all
on availability for select
to authenticated
using (true);

create policy availability_insert_own
on availability for insert
to authenticated
with check (is_own_player(player_id) and matchday_is_open(matchday_id));

create policy availability_update_own
on availability for update
to authenticated
using (is_own_player(player_id))
with check (is_own_player(player_id) and matchday_is_open(matchday_id));

-- ---------------------------------------------------------------------------
-- matchday_ballot_entries: public read (standby order affects you, and
-- "41 in the hat for 30 spots" is shown to everyone); admin-only write —
-- this table only ever gets written as the OUTPUT of running the ballot,
-- never by a player directly.
-- ---------------------------------------------------------------------------

create policy ballot_entries_select_all
on matchday_ballot_entries for select
to authenticated
using (true);

create policy ballot_entries_write_admin
on matchday_ballot_entries for insert
to authenticated
with check (is_requesting_admin());

create policy ballot_entries_update_admin
on matchday_ballot_entries for update
to authenticated
using (is_requesting_admin())
with check (is_requesting_admin());

-- ---------------------------------------------------------------------------
-- teams / team_members: public read (the drawn sides are the whole
-- point); admin-only write — output of running the team draw.
-- ---------------------------------------------------------------------------

create policy teams_select_all
on teams for select
to authenticated
using (true);

create policy teams_write_admin
on teams for insert
to authenticated
with check (is_requesting_admin());

create policy teams_update_admin
on teams for update
to authenticated
using (is_requesting_admin())
with check (is_requesting_admin());

create policy team_members_select_all
on team_members for select
to authenticated
using (true);

create policy team_members_write_admin
on team_members for insert
to authenticated
with check (is_requesting_admin());

create policy team_members_update_admin
on team_members for update
to authenticated
using (is_requesting_admin())
with check (is_requesting_admin());

-- ---------------------------------------------------------------------------
-- matches / match_players: public read (match history, lineups);
-- admin-only write — recording a result is an admin/pitch-side action,
-- not something a player does themselves.
-- ---------------------------------------------------------------------------

create policy matches_select_all
on matches for select
to authenticated
using (true);

create policy matches_write_admin
on matches for insert
to authenticated
with check (is_requesting_admin());

create policy matches_update_admin
on matches for update
to authenticated
using (is_requesting_admin())
with check (is_requesting_admin());

create policy match_players_select_all
on match_players for select
to authenticated
using (true);

create policy match_players_write_admin
on match_players for insert
to authenticated
with check (is_requesting_admin());

create policy match_players_update_admin
on match_players for update
to authenticated
using (is_requesting_admin())
with check (is_requesting_admin());
