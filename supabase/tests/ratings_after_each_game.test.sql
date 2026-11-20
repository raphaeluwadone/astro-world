-- Ratings open once a Pitch-side game ends, before the day's results are filed.
begin;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'early-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'early-one@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'T Admin', 'Test Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'T One', 'Test One', false, '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-000000000b02', 'T Two', 'Test Two', false, null),
  ('00000000-0000-0000-0000-000000000b03', 'T Three', 'Test Three', false, null);
insert into matchdays (id, played_at, status) values ('00000000-0000-0000-0000-00000000d001', now() - interval '2 hours', 'drawn');
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f'),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000d001', 'Gamma', '#4ade80');
insert into team_members (team_id, player_id) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b02'),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-000000000b03');
-- Alpha v Beta has ended; Gamma hasn't played yet.
insert into pitch_games (id, matchday_id, team_a_id, team_b_id, ended_at) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002', now() - interval '1 hour');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

select is(
  (select array[matchday_id::text, can_rate::text] from rating_matchday()),
  array['00000000-0000-0000-0000-00000000d001', 'true'], 'the matchday opens for rating once a game has ended'
);
select is(
  (select array_agg(greek_name order by greek_name) from matchday_rating_roster('00000000-0000-0000-0000-00000000d001')),
  array['Alpha', 'Beta'], 'only players from ended games are on the roster'
);
select lives_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 7)$$,
  'a player rates someone right after their game'
);
select throws_ok(
  $$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b03', 6)$$,
  'That player didn''t play this matchday', 'a player whose game hasn''t ended can''t be rated yet'
);
select is(
  (select match_id from ratings where subject_id = '00000000-0000-0000-0000-000000000b02'),
  null, 'an early rating has no match until results are filed'
);

reset role;
select set_config('request.jwt.claims', '', true);
insert into matches (id, matchday_id, team_a_id, team_b_id, score_a, score_b, played_at) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002', 1, 0, now() - interval '1 hour');
insert into match_players (match_id, player_id, team_id) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000e001'),
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-00000000e002');

select is(
  (select match_id from ratings where subject_id = '00000000-0000-0000-0000-000000000b02'),
  '00000000-0000-0000-0000-00000000c001'::uuid, 'filing the results attaches the early rating to its match'
);
select is(
  (select count(*)::int from player_match_ratings('00000000-0000-0000-0000-000000000b02')),
  1, 'the filed rating shows in the player''s match ratings'
);

select * from finish();
rollback;
