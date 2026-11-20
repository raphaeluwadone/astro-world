-- Own goals count on the scoreboard and come off the scorer's goal tally.
begin;
select plan(8);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'og-admin@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'T Admin', 'Test Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'T One', 'Test One', false, null),
  ('00000000-0000-0000-0000-000000000b02', 'T Two', 'Test Two', false, null);
insert into matchdays (id, played_at, status) values ('00000000-0000-0000-0000-00000000d001', now() - interval '1 day', 'played');
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f');
insert into matches (id, matchday_id, team_a_id, team_b_id, score_a, score_b, played_at) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002', 3, 0, now() - interval '1 day');
insert into match_players (match_id, player_id, team_id) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000e001'),
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-00000000e002');

-- T One scores twice; T Two scores once for Beta in another game and puts one in their own net for Alpha.
insert into goals (match_id, team_id, scorer_id, own_goal) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', false),
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', false),
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b02', true);

insert into matches (id, matchday_id, team_a_id, team_b_id, score_a, score_b, played_at) values
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002', 0, 2, now() - interval '1 day');
insert into goals (match_id, team_id, scorer_id, own_goal) values
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b02', false),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b02', false);

select throws_ok(
  $$insert into goals (match_id, team_id, scorer_id, assist_id, own_goal) values
    ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000b01', true)$$,
  '23514', null, 'an own goal can''t have an assist'
);

select is(
  (select goals::int from player_career_stats() where player_id = '00000000-0000-0000-0000-000000000b02'),
  1, 'an own goal comes off the scorer''s career goals'
);
select is(
  (select own_goals::int from player_career_stats() where player_id = '00000000-0000-0000-0000-000000000b02'),
  1, 'career stats count own goals separately'
);
select is(
  (select goals::int from player_career_stats() where player_id = '00000000-0000-0000-0000-000000000b01'),
  2, 'normal goals still count'
);
select is(
  (select array[goals, own_goals]::int[] from compare_stats(now() - interval '1 year') where player_id = '00000000-0000-0000-0000-000000000b02'),
  array[1, 1], 'Compare nets own goals and shows them'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

insert into cup_quarters (id, label, scheduled_at, entries_close_at, withdrawal_deadline, status) values
  ('00000000-0000-0000-0000-00000000c101', 'Q1 2025', '2025-03-01 10:00Z', '2025-02-25 10:00Z', '2025-02-27 10:00Z', 'played');
insert into cup_squads (id, cup_quarter_id, name, colour) values
  ('00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000c101', 'Reds', '#e0483f'),
  ('00000000-0000-0000-0000-00000000e102', '00000000-0000-0000-0000-00000000c101', 'Blues', '#38bdf8');
insert into cup_squad_players (cup_squad_id, player_id) values
  ('00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-00000000e102', '00000000-0000-0000-0000-000000000b02');
insert into cup_matches (id, cup_quarter_id, squad_a_id, squad_b_id) values
  ('00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-00000000c101', '00000000-0000-0000-0000-00000000e101', '00000000-0000-0000-0000-00000000e102');

select throws_ok(
  $$select record_cup_result('00000000-0000-0000-0000-00000000f101', 1, 0, '[
    {"squad_id":"00000000-0000-0000-0000-00000000e101","scorer_id":"00000000-0000-0000-0000-000000000b01","own_goal":true}]')$$,
  'A scorer isn''t in the right squad for that goal', 'an own goal''s scorer must be from the other squad'
);

select record_cup_result('00000000-0000-0000-0000-00000000f101', 1, 0, '[
  {"squad_id":"00000000-0000-0000-0000-00000000e101","scorer_id":"00000000-0000-0000-0000-000000000b02","own_goal":true}]');
select is(
  (select own_goal from cup_goals where cup_match_id = '00000000-0000-0000-0000-00000000f101'),
  true, 'a cup own goal is saved as one'
);

select award_cup_extras();
select is(
  (select count(*)::int from player_badges where badge_key = 'cup-hero' and period_key = '00000000-0000-0000-0000-00000000c101'),
  0, 'an own goal doesn''t make anyone Cup Hero'
);

select * from finish();
rollback;
