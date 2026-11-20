-- Per-game and whole-day ratings average into one day rating per rater and player.
begin;
select plan(15);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a2', 'pg-one@test.local');
insert into players (id, nickname, full_name, user_id) values
  ('00000000-0000-0000-0000-000000000b01', 'T One', 'Test One', '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-000000000b02', 'T Two', 'Test Two', null),
  ('00000000-0000-0000-0000-000000000b03', 'T Three', 'Test Three', null);
-- Today in Lagos, so game-by-game ratings are open whatever time the tests run.
insert into matchdays (id, played_at, status) values
  ('00000000-0000-0000-0000-00000000d001', (now() at time zone 'Africa/Lagos')::date::timestamp at time zone 'Africa/Lagos', 'drawn'),
  ('00000000-0000-0000-0000-00000000d002', ((now() at time zone 'Africa/Lagos')::date - 1 + time '10:00')::timestamp at time zone 'Africa/Lagos', 'drawn');
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f'),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000d001', 'Gamma', '#4ade80'),
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000d002', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-00000000d002', 'Beta', '#e0483f');
insert into team_members (team_id, player_id) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b02'),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-000000000b03'),
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-000000000b02');
-- Game 1: Alpha v Beta. Game 2: Beta v Gamma. Game 3 is still running.
insert into pitch_games (id, matchday_id, team_a_id, team_b_id, ended_at, created_at) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002', now() - interval '90 minutes', now() - interval '100 minutes'),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000e003', now() - interval '60 minutes', now() - interval '70 minutes'),
  ('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e003', null, now() - interval '10 minutes'),
  ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000e005', now() - interval '1 day', now() - interval '1 day');

select is(
  (select array_agg(game_no order by game_no) from rating_games('00000000-0000-0000-0000-00000000d001')),
  array[1, 2], 'only ended games are listed, in order'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 7, '00000000-0000-0000-0000-00000000f001');
select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 8, '00000000-0000-0000-0000-00000000f002');
select is(
  (select score from ratings where subject_id = '00000000-0000-0000-0000-000000000b02'),
  7.5, 'game ratings average into the day rating'
);

select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 9);
select is(
  (select score from ratings where subject_id = '00000000-0000-0000-0000-000000000b02'),
  8.00, 'a whole-day rating counts as one more score'
);

select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', null, '00000000-0000-0000-0000-00000000f002');
select is(
  (select score from ratings where subject_id = '00000000-0000-0000-0000-000000000b02'),
  8.00, 'clearing a game rating drops it from the average'
);
select is(
  (select count(*)::int from rating_inputs where subject_id = '00000000-0000-0000-0000-000000000b02'),
  2, 'the cleared score is gone'
);

select throws_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b03', 6, '00000000-0000-0000-0000-00000000f001')$$,
  'That player wasn''t in that game', 'a player can only be rated in a game they played'
);
select throws_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 6, '00000000-0000-0000-0000-00000000f003')$$,
  'That player wasn''t in that game', 'a running game can''t be rated yet'
);

select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', null);
select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', null, '00000000-0000-0000-0000-00000000f001');
select is(
  (select count(*)::int from ratings where subject_id = '00000000-0000-0000-0000-000000000b02'),
  0, 'clearing every score removes the day rating'
);

select throws_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 7.25, '00000000-0000-0000-0000-00000000f001')$$,
  '23514', null, 'a single score still has to be a half step'
);

select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 6, '00000000-0000-0000-0000-00000000f001');
select finish_game_ratings('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000f001');
select throws_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 9, '00000000-0000-0000-0000-00000000f001')$$,
  'You''ve locked in your ratings for that game', 'Done locks a game''s scores'
);
select throws_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', null, '00000000-0000-0000-0000-00000000f001')$$,
  'You''ve locked in your ratings for that game', 'and they can''t be cleared'
);
select lives_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 8, '00000000-0000-0000-0000-00000000f002')$$,
  'other games stay open'
);

-- Yesterday's matchday: only the whole-day rating is left.
select is(per_game_ratings_open('00000000-0000-0000-0000-00000000d002'), false, 'game-by-game ratings close when the matchday ends');
select throws_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-000000000b02', 7, '00000000-0000-0000-0000-00000000f004')$$,
  'Game-by-game ratings closed with the matchday. Give a final rating instead.', 'a game can''t be rated after the matchday'
);
select lives_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d002', '00000000-0000-0000-0000-000000000b02', 7)$$,
  'the whole-day rating still can'
);

select * from finish();
rollback;
