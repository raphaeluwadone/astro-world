-- Tracks whether a player has been through the first-visit welcome flow
-- (five steps + done). Null means "show it"; any account created before
-- this column existed is treated as already onboarded (backfilled to now)
-- so existing demo/test accounts don't get thrown into the flow.
alter table players add column onboarded_at timestamptz;
update players set onboarded_at = now() where onboarded_at is null;
