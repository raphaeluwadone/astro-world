-- Departed players lose access; Pitch-side swaps move the claim and rewrite the teams post.
begin;
select plan(8);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'swap-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'gone@test.local');
insert into players (id, nickname, full_name, is_admin, user_id, left_at) values
  ('00000000-0000-0000-0000-000000000a01', 'T Admin', 'Test Admin', true, '00000000-0000-0000-0000-0000000000a1', null),
  ('00000000-0000-0000-0000-000000000a02', 'T Gone', 'Test Gone', false, '00000000-0000-0000-0000-0000000000a2', now()),
  ('00000000-0000-0000-0000-000000000b01', 'T Out', 'Test Out', false, null, null),
  ('00000000-0000-0000-0000-000000000b02', 'T In', 'Test In', false, null, null),
  ('00000000-0000-0000-0000-000000000b03', 'T Other', 'Test Other', false, null, null);

select is(
  custom_access_token_hook('{"user_id":"00000000-0000-0000-0000-0000000000a2","claims":{}}') -> 'error' ->> 'http_code',
  '403',
  'no token for a player who has left'
);
select is(
  custom_access_token_hook('{"user_id":"00000000-0000-0000-0000-0000000000a1","claims":{"role":"authenticated"}}'),
  '{"user_id":"00000000-0000-0000-0000-0000000000a1","claims":{"role":"authenticated"}}'::jsonb,
  'an active player''s token passes through unchanged'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is(requesting_player_id(), null, 'a departed player is not treated as a player');

-- Swap
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
insert into matchdays (id, played_at, status) values ('00000000-0000-0000-0000-00000000d001', '2030-03-17 10:00Z', 'drawn');
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f');
insert into team_members (team_id, player_id) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b03');
insert into weekly_claims (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b01');
insert into posts (author_id, kind, matchday_id, content)
values ('00000000-0000-0000-0000-000000000a01', 'teams', '00000000-0000-0000-0000-00000000d001', 'old line-up');

select lives_ok(
  $$select swap_team_player('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000b02')$$,
  'an admin can swap a player'
);
select is(
  (select player_id from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001'),
  '00000000-0000-0000-0000-000000000b02'::uuid,
  'the weekly claim moves to the player coming in'
);
select ok(
  (select content like '%T In%' and content like '%_Swap: %in for %' and content not like 'old line-up%' from posts where matchday_id = '00000000-0000-0000-0000-00000000d001' and kind = 'teams'),
  'the teams post shows the new side and the swap'
);
select throws_ok(
  $$select swap_team_player('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000b03')$$,
  'T Other is already on Beta',
  'cannot swap in someone already on another side'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select throws_ok(
  $$select swap_team_player('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000b01')$$,
  '42501',
  null,
  'only admins can swap'
);

select * from finish();
rollback;
