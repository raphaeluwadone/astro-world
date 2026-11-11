-- Cards: the second-yellow red, filed cards, career totals and Most Booked.
begin;
select plan(8);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'cards-admin@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'T Admin', 'Test Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'T One', 'Test One', false, null),
  ('00000000-0000-0000-0000-000000000b02', 'T Two', 'Test Two', false, null);
update players set legacy_yellow_cards = 4, legacy_red_cards = 1 where id = '00000000-0000-0000-0000-000000000b01';
insert into matchdays (id, played_at, status) values ('00000000-0000-0000-0000-00000000d001', '2025-03-15 10:00Z', 'played');
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f');
insert into pitch_games (id, matchday_id, team_a_id, team_b_id) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002');

-- Pitch-side
insert into pitch_cards (game_id, team_id, player_id, kind, minute) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', 'yellow', 2);
select is((select count(*)::int from pitch_cards where kind = 'red'), 0, 'one yellow is just a yellow');

insert into pitch_cards (game_id, team_id, player_id, kind, minute) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', 'yellow', 6);
select is((select count(*)::int from pitch_cards where kind = 'red' and second_yellow and minute = 6), 1, 'a second yellow in the game adds a red at the same minute');

delete from pitch_cards where kind = 'yellow' and minute = 6;
select is((select count(*)::int from pitch_cards where kind = 'red'), 0, 'taking back a yellow removes the second-yellow red');

insert into pitch_cards (game_id, team_id, player_id, kind) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b02', 'red');
select is((select second_yellow from pitch_cards where kind = 'red'), false, 'a straight red is not marked as a second yellow');

-- Filed results
insert into matches (id, matchday_id, team_a_id, team_b_id, score_a, score_b, played_at) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002', 1, 0, '2025-03-15 10:00Z');
insert into cards (match_id, team_id, player_id, kind) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', 'yellow'),
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', 'yellow');
select is((select count(*)::int from cards where kind = 'red' and second_yellow), 1, 'filing two yellows for one player records the red too');

select is(
  (select array[yellow_cards, red_cards]::int[] from player_career_stats() where player_id = '00000000-0000-0000-0000-000000000b01'),
  array[6, 2],
  'career cards add the legacy counts to filed ones'
);

-- Most Booked for March 2025
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select lives_ok('select award_badges()', 'award_badges runs');
select is(
  (select stat from player_badges where badge_key = 'month-most-booked' and period_key = '2025-03' and player_id = '00000000-0000-0000-0000-000000000b01'),
  '3 cards',
  'most cards in a finished month wins Most Booked'
);

select * from finish();
rollback;
