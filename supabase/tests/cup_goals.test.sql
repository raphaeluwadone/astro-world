-- Cup scorers and Cup Hero.
begin;
select plan(7);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'cup-admin@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'T Admin', 'Test Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'T One', 'Test One', false, null),
  ('00000000-0000-0000-0000-000000000b02', 'T Two', 'Test Two', false, null),
  ('00000000-0000-0000-0000-000000000b03', 'T Three', 'Test Three', false, null);
insert into cup_quarters (id, label, scheduled_at, entries_close_at, withdrawal_deadline, status) values
  ('00000000-0000-0000-0000-00000000c001', 'Q1 2025', '2025-03-01 10:00Z', '2025-02-25 10:00Z', '2025-02-27 10:00Z', 'played');
insert into cup_squads (id, cup_quarter_id, name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000c001', 'Reds', '#e0483f'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000c001', 'Blues', '#38bdf8');
insert into cup_squad_players (cup_squad_id, player_id) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b02'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b03');
insert into cup_matches (id, cup_quarter_id, squad_a_id, squad_b_id) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002');

select throws_ok(
  $$select record_cup_result('00000000-0000-0000-0000-00000000f001', 1, 0, '[]')$$,
  '42501', null, 'only admins can record a cup result'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select throws_ok(
  $$select record_cup_result('00000000-0000-0000-0000-00000000f001', 1, 0, '[
    {"squad_id":"00000000-0000-0000-0000-00000000e001","scorer_id":"00000000-0000-0000-0000-000000000b01"},
    {"squad_id":"00000000-0000-0000-0000-00000000e001","scorer_id":"00000000-0000-0000-0000-000000000b02"}]')$$,
  'More scorers than goals', 'scorers can''t outnumber goals'
);

select record_cup_result('00000000-0000-0000-0000-00000000f001', 2, 1, '[
  {"squad_id":"00000000-0000-0000-0000-00000000e001","scorer_id":"00000000-0000-0000-0000-000000000b02"}]');
select record_cup_result('00000000-0000-0000-0000-00000000f001', 3, 2, '[
  {"squad_id":"00000000-0000-0000-0000-00000000e001","scorer_id":"00000000-0000-0000-0000-000000000b01"},
  {"squad_id":"00000000-0000-0000-0000-00000000e001","scorer_id":"00000000-0000-0000-0000-000000000b01"},
  {"squad_id":"00000000-0000-0000-0000-00000000e002","scorer_id":"00000000-0000-0000-0000-000000000b03"},
  {"squad_id":"00000000-0000-0000-0000-00000000e002","scorer_id":"00000000-0000-0000-0000-000000000b03"}]');

select is(
  (select array[score_a, score_b] from cup_matches where id = '00000000-0000-0000-0000-00000000f001'),
  array[3, 2], 'the score is saved'
);
select is(
  (select count(*)::int from cup_goals where cup_match_id = '00000000-0000-0000-0000-00000000f001'),
  4, 'saving again replaces the scorers'
);

select lives_ok('select award_cup_extras()', 'award_cup_extras runs');
select results_eq(
  $$select player_id, stat from player_badges where badge_key = 'cup-hero' and period_key = '00000000-0000-0000-0000-00000000c001' order by player_id$$,
  $$values ('00000000-0000-0000-0000-000000000b01'::uuid, '2 goals'), ('00000000-0000-0000-0000-000000000b03'::uuid, '2 goals')$$,
  'joint top scorers both get Cup Hero'
);

select is(
  (select goals from player_career_stats() where player_id = '00000000-0000-0000-0000-000000000b01'),
  2::bigint, 'cup goals count towards career goals'
);

select * from finish();
rollback;
