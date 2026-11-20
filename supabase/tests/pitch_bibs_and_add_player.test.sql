-- Adding a player to a side, and bib colours on a Pitch-side game.
begin;
select plan(13);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'bib-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'bib-member@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'T Admin', 'Test Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000a02', 'T Member', 'Test Member', false, '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-000000000b01', 'T Alpha One', 'Test Alpha One', false, null),
  ('00000000-0000-0000-0000-000000000b02', 'T Beta One', 'Test Beta One', false, null),
  ('00000000-0000-0000-0000-000000000b03', 'T Guest', 'T Guest', false, null),
  ('00000000-0000-0000-0000-000000000b04', 'T Late', 'Test Late', false, null);

insert into matchdays (id, played_at, status) values ('00000000-0000-0000-0000-00000000d001', '2030-03-17 10:00Z', 'drawn');
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f');
insert into team_members (team_id, player_id) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b02');
insert into posts (author_id, kind, matchday_id, content)
values ('00000000-0000-0000-0000-000000000a01', 'teams', '00000000-0000-0000-0000-00000000d001', 'old line-up');
insert into pitch_games (id, matchday_id, team_a_id, team_b_id) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$select add_team_player('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b03')$$,
  'an admin can add a guest to a side'
);
select is(
  (select count(*)::int from team_members where team_id = '00000000-0000-0000-0000-00000000e001'),
  2,
  'the side now has the guest as well, nobody came off'
);
select ok(
  (select content like '%T Guest%' and content like '%_Added: %joins Alpha.%' and content not like 'old line-up%' from posts where matchday_id = '00000000-0000-0000-0000-00000000d001' and kind = 'teams'),
  'the teams post shows the new side and the addition'
);

select lives_ok(
  $$select swap_team_player('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000b04')$$,
  'a swap still works after an addition'
);
select ok(
  (select content like '%_Added: %joins Alpha.%' and content like '%_Swap: %in for %' from posts where matchday_id = '00000000-0000-0000-0000-00000000d001' and kind = 'teams'),
  'the teams post keeps both the addition and the swap'
);
select throws_ok(
  $$select add_team_player('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b02')$$,
  'T Beta One is already on Beta',
  'cannot add someone who is already on another side'
);
select throws_ok(
  $$select add_team_player('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b03')$$,
  'T Guest is already on Alpha',
  'cannot add the same guest to two sides'
);

select is(
  has_function_privilege('authenticated', 'public.append_teams_post_note(uuid, text)', 'execute'),
  false,
  'players cannot rewrite the teams post directly'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select throws_ok(
  $$select add_team_player('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b04')$$,
  '42501',
  null,
  'only admins can add players to a side'
);

select lives_ok(
  $$update pitch_games set bib_a = 'blue', bib_b = 'red' where id = '00000000-0000-0000-0000-00000000f001'$$,
  'a game can have blue and red bibs'
);
select throws_ok(
  $$update pitch_games set bib_a = 'red' where id = '00000000-0000-0000-0000-00000000f001'$$,
  '23514',
  null,
  'both sides cannot wear the same colour'
);
select throws_ok(
  $$update pitch_games set bib_a = 'purple' where id = '00000000-0000-0000-0000-00000000f001'$$,
  '23514',
  null,
  'only listed bib colours are allowed'
);
select lives_ok(
  $$update pitch_games set bib_a = null, bib_b = null where id = '00000000-0000-0000-0000-00000000f001'$$,
  'bibs can be cleared back to not chosen'
);

select * from finish();
rollback;
