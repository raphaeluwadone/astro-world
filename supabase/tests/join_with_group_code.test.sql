-- Joining with the group code: claiming a name, adding a new one, and what stays locked.
begin;
select plan(19);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'join-a@test.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'join-b@test.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'join-c@test.local'),
  ('00000000-0000-0000-0000-0000000000c4', 'join-d@test.local');
insert into players (id, nickname, full_name, user_id, left_at) values
  ('00000000-0000-0000-0000-00000000e001', 'Join Free', 'Join Free', null, null),
  ('00000000-0000-0000-0000-00000000e002', 'Join Left', 'Join Left', null, now()),
  ('00000000-0000-0000-0000-00000000e003', 'Join Owned', 'Join Owned', '00000000-0000-0000-0000-0000000000c4', null);

delete from app_config where key = 'group_code';

select ok(not group_code_ok('anything'), 'with no code set, nobody can join');
insert into app_config (key, value) values ('group_code', 'Sunday30');
select ok(group_code_ok('Sunday30'), 'the right code works');
select ok(group_code_ok('  sunday30 '), 'and ignores case and spaces');
select ok(not group_code_ok('Sunday31'), 'a wrong code fails');
select ok(not group_code_ok(null), 'a missing code fails');

set local role anon;
select ok(group_code_ok('Sunday30'), 'a visitor who is not signed in can check the code');
select throws_ok(
  $$select join_group('Sunday30', null, 'Nope', 'Nope', null, null, null)$$,
  '42501', null, 'but a visitor cannot join without an account'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select join_group('wrong', '00000000-0000-0000-0000-00000000e001', null, null, null, null, null)$$,
  'P0001', 'That group code isn''t right. Ask in the group chat.', 'a wrong code cannot claim a name'
);
select is(
  join_group('Sunday30', '00000000-0000-0000-0000-00000000e001', null, null, 'wale_', 3::smallint, 19::smallint),
  '00000000-0000-0000-0000-00000000e001'::uuid,
  'the right code claims a free name straight away'
);
select is(
  (select user_id from players where id = '00000000-0000-0000-0000-00000000e001'),
  '00000000-0000-0000-0000-0000000000c1'::uuid,
  'and links the account to that player'
);
select ok(
  (select onboarded_at is not null and instagram_handle = 'wale_' and birthday_month = 3 and birthday_day = 19 from players where id = '00000000-0000-0000-0000-00000000e001'),
  'carrying their details and skipping the forced tour'
);
select is(
  join_group('Sunday30', null, 'Someone Else', 'Someone Else', null, null, null),
  '00000000-0000-0000-0000-00000000e001'::uuid,
  'joining twice just returns the same player'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select throws_ok(
  $$select join_group('Sunday30', '00000000-0000-0000-0000-00000000e001', null, null, null, null, null)$$,
  'P0001', 'That name was just taken. Pick again.', 'a name someone already holds cannot be taken again'
);
select throws_ok(
  $$select join_group('Sunday30', '00000000-0000-0000-0000-00000000e002', null, null, null, null, null)$$,
  'P0001', 'That name was just taken. Pick again.', 'a player who has left cannot be claimed'
);
select throws_ok(
  $$select join_group('Sunday30', null, 'A', 'A', null, null, null)$$,
  'P0001', 'Add a nickname of at least 2 letters', 'a new player needs a real nickname'
);
select lives_ok(
  $$select join_group('Sunday30', null, 'Newbie', 'New Person', null, null, null)$$,
  'someone not on the list can join with a new name'
);
select ok(
  (select user_id = '00000000-0000-0000-0000-0000000000c2' and full_name = 'New Person' and onboarded_at is not null from players where nickname = 'Newbie'),
  'and that name is created and linked to them'
);

-- The app leaves out whatever is blank, so omitted arguments must work.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c3","role":"authenticated"}', true);
select lives_ok(
  $$select join_group(p_code := 'Sunday30', p_nickname := 'Named Only')$$,
  'a join with only the code and a nickname works'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);

-- Joining does not open the lock on anything else.
update players set user_id = '00000000-0000-0000-0000-0000000000c3', is_admin = true where id = (select id from players where user_id = '00000000-0000-0000-0000-0000000000c2');
reset role;
select ok(
  (select user_id = '00000000-0000-0000-0000-0000000000c2' and not is_admin from players where nickname = 'Newbie'),
  'players still cannot change their own link or make themselves admin'
);

select * from finish();
rollback;
