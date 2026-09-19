-- Real states this app never actually reached: nothing has ever
-- transitioned a matchday past 'drawn' (matches/goals/match_players were
-- only ever created by hand via SQL for testing), so there was no real
-- "results filed" state, and no way to call off a matchday at all.
-- 'complete' stays in the enum (Postgres can't cheaply drop enum values)
-- but is retired going forward in favour of the more accurate 'played';
-- ratings-open/closed stays a computed, time-based check (ratings_open_for)
-- rather than a second stored status that could drift from it.
alter type matchday_status add value 'played';
alter type matchday_status add value 'cancelled';
