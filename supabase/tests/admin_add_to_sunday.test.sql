-- An admin adds a player to a Sunday, with the payment waived, even when it is full.
begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'aa-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'aa-player@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'AA Admin', 'AA Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'AA Standby', 'AA Standby', false, null),
  ('00000000-0000-0000-0000-000000000b02', 'AA Waived', 'AA Waived', false, null),
  ('00000000-0000-0000-0000-000000000b03', 'AA Unpaid', 'AA Unpaid', false, null),
  ('00000000-0000-0000-0000-000000000b04', 'AA Plain', 'AA Plain', false, '00000000-0000-0000-0000-0000000000a2');
insert into payment_prices (kind, amount) values ('weekly', 3000), ('monthly', 7000) on conflict (kind) do update set amount = excluded.amount;
insert into matchdays (id, played_at, status, capacity) values ('00000000-0000-0000-0000-00000000d001', now() + interval '2 hours', 'open', 30);
-- Thirty claims fill the Sunday.
insert into players (nickname, full_name) select 'AA Filler ' || n, 'AA Filler ' || n from generate_series(1, 29) n;
insert into weekly_claims (matchday_id, player_id)
  select '00000000-0000-0000-0000-00000000d001', id from players where nickname like 'AA Filler %';
insert into weekly_claims (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b01');
insert into matchday_standby_entries (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02');

-- A player can't use it.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$select admin_add_to_matchday('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b03')$$,
  '42501', 'Admins only', 'a player cannot add anyone');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select lives_ok(
  $$select admin_add_to_matchday('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02')$$,
  'an admin adds a standby player to a full Sunday');
select is(
  (select count(*)::int from matchday_standby_entries where player_id = '00000000-0000-0000-0000-000000000b02'),
  0, 'who leaves standby');
select is(
  (select waived_by from weekly_claims where player_id = '00000000-0000-0000-0000-000000000b02'),
  '00000000-0000-0000-0000-000000000a01'::uuid, 'and the claim records who waived it');
select throws_ok(
  $$select admin_add_to_matchday('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02')$$,
  'P0001', 'AA Waived already has a spot', 'adding them twice is refused');
select lives_ok(
  $$select admin_add_to_matchday('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b03', false)$$,
  'an admin can also add someone who still has to pay');
reset role;

select is(
  (select count(*)::int from unpaid_spots_for('00000000-0000-0000-0000-00000000d001') where kind = 'weekly' and player_id = '00000000-0000-0000-0000-000000000b02'),
  0, 'a waived spot is not unpaid');
select is(
  (select count(*)::int from unpaid_spots_for('00000000-0000-0000-0000-00000000d001') where kind = 'weekly' and player_id = '00000000-0000-0000-0000-000000000b03'),
  1, 'but an unwaived one still is');
select ok(
  (select count(*) from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001') > 30,
  'and the Sunday can go over its spots');

select * from finish();
rollback;
