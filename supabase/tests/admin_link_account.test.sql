-- An admin links a sign-up that never finished joining to a roster name.
begin;
select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'al-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'al-player@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', 'al-stuck@test.local'),
  ('00000000-0000-0000-0000-0000000000a4', 'al-stuck2@test.local');
insert into players (id, nickname, full_name, is_admin, user_id, left_at) values
  ('00000000-0000-0000-0000-000000000a01', 'AL Admin', 'AL Admin', true, '00000000-0000-0000-0000-0000000000a1', null),
  ('00000000-0000-0000-0000-000000000a02', 'AL Player', 'AL Player', false, '00000000-0000-0000-0000-0000000000a2', null),
  ('00000000-0000-0000-0000-000000000b01', 'AL Free', 'AL Free', false, null, null),
  ('00000000-0000-0000-0000-000000000b02', 'AL Gone', 'AL Gone', false, null, now());

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$select * from admin_stuck_accounts()$$, '42501', 'Admins only', 'a player cannot list accounts');
select throws_ok(
  $$select admin_link_account('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000b01')$$,
  '42501', 'Admins only', 'a player cannot link one');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select ok(
  exists (select 1 from admin_stuck_accounts() where user_id = '00000000-0000-0000-0000-0000000000a3'),
  'a sign-up with no player is listed');
select ok(
  not exists (select 1 from admin_stuck_accounts() where user_id = '00000000-0000-0000-0000-0000000000a2'),
  'an account with a player is not');

select lives_ok(
  $$select admin_link_account('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000b01')$$,
  'an admin links the account to a free name');
select is(
  (select user_id from players where id = '00000000-0000-0000-0000-000000000b01'),
  '00000000-0000-0000-0000-0000000000a3'::uuid, 'the name now belongs to that account');
select ok(
  not exists (select 1 from admin_stuck_accounts() where user_id = '00000000-0000-0000-0000-0000000000a3'),
  'and it is no longer listed');
select throws_ok(
  $$select admin_link_account('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000b01')$$,
  'P0001', 'That name is already taken or has left the group', 'a taken name is refused');
select throws_ok(
  $$select admin_link_account('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000b02')$$,
  'P0001', 'That name is already taken or has left the group', 'so is a name that has left');
select throws_ok(
  $$select admin_link_account('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000b01')$$,
  'P0001', 'That account is already linked to a name', 'an account cannot be linked twice');
reset role;

select * from finish();
rollback;
