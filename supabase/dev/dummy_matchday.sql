-- Local only. A dummy matchday today with 30 paid weekly spots, ready for the draw on Pitch-side.
-- Run:   docker exec -i supabase_db_astro psql -U postgres < supabase/dev/dummy_matchday.sql
-- Undo:  docker exec -i supabase_db_astro psql -U postgres < supabase/dev/dummy_matchday_cleanup.sql

begin;

insert into matchdays (id, played_at, status, capacity, venue)
values ('d0d0d0d0-0000-4000-8000-000000000030', date_trunc('day', now()) + interval '9 hours 30 minutes', 'open', 30, 'Dummy Sunday, Gbaja Boys');

-- Segsy (the local test admin) first, so the live card shows "You"; then 29 more active players.
insert into weekly_claims (matchday_id, player_id, claimed_at)
select 'd0d0d0d0-0000-4000-8000-000000000030', id, now() - (30 - n) * interval '1 minute'
from (
  select id, row_number() over (order by (id = '63d7c7f0-485f-42d0-8323-035e4ebf6ef7') desc, legacy_appearances desc, nickname) as n
  from players
  where left_at is null
) p
where n <= 30;

select count(*) as confirmed from weekly_claims where matchday_id = 'd0d0d0d0-0000-4000-8000-000000000030';

commit;
