-- Removes the dummy Sunday and everything it produced: claims, teams, Pitch-side games, feed posts, notifications and filed results.
begin;

delete from notifications where data->>'matchday_id' = 'd0d0d0d0-0000-4000-8000-000000000030';

delete from goals where match_id in (select id from matches where matchday_id = 'd0d0d0d0-0000-4000-8000-000000000030');
delete from match_players where match_id in (select id from matches where matchday_id = 'd0d0d0d0-0000-4000-8000-000000000030');
delete from matches where matchday_id = 'd0d0d0d0-0000-4000-8000-000000000030';
delete from matchdays where id = 'd0d0d0d0-0000-4000-8000-000000000030';

commit;
