-- Cancelling a matchday flags paid weekly spots for refunds and tells everyone who was in or waiting.
begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'cx-weekly@test.local'),
  ('00000000-0000-0000-0000-0000000000c2', 'cx-monthly@test.local'),
  ('00000000-0000-0000-0000-0000000000c3', 'cx-standby@test.local'),
  ('00000000-0000-0000-0000-0000000000c4', 'cx-out@test.local'),
  ('00000000-0000-0000-0000-0000000000c5', 'cx-pending@test.local');
insert into players (id, nickname, full_name, user_id) values
  ('00000000-0000-0000-0000-000000000c01', 'CX Weekly', 'Cx Weekly', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-000000000c02', 'CX Monthly', 'Cx Monthly', '00000000-0000-0000-0000-0000000000c2'),
  ('00000000-0000-0000-0000-000000000c03', 'CX Standby', 'Cx Standby', '00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-000000000c04', 'CX Out', 'Cx Out', '00000000-0000-0000-0000-0000000000c4'),
  ('00000000-0000-0000-0000-000000000c05', 'CX Pending', 'Cx Pending', '00000000-0000-0000-0000-0000000000c5');
insert into matchdays (id, played_at, status) values
  ('00000000-0000-0000-0000-00000000cd01', '2031-03-09 10:00+00', 'open');
insert into monthly_memberships (player_id, month) values
  ('00000000-0000-0000-0000-000000000c02', '2031-03-01'),
  ('00000000-0000-0000-0000-000000000c04', '2031-03-01');
insert into availability (matchday_id, player_id, status) values
  ('00000000-0000-0000-0000-00000000cd01', '00000000-0000-0000-0000-000000000c04', 'out');
insert into weekly_claims (id, matchday_id, player_id) values
  ('00000000-0000-0000-0000-00000000cc01', '00000000-0000-0000-0000-00000000cd01', '00000000-0000-0000-0000-000000000c01'),
  ('00000000-0000-0000-0000-00000000cc05', '00000000-0000-0000-0000-00000000cd01', '00000000-0000-0000-0000-000000000c05');
insert into matchday_standby_entries (matchday_id, player_id) values
  ('00000000-0000-0000-0000-00000000cd01', '00000000-0000-0000-0000-000000000c03');
insert into payments (reference, kind, player_id, matchday_id, amount_kobo, status, weekly_claim_id, paid_at) values
  ('astro_cx_paid', 'weekly', '00000000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-00000000cd01', 300000, 'paid', '00000000-0000-0000-0000-00000000cc01', now()),
  ('astro_cx_pending', 'weekly', '00000000-0000-0000-0000-000000000c05', '00000000-0000-0000-0000-00000000cd01', 300000, 'pending', null, null);

update matchdays set status = 'cancelled' where id = '00000000-0000-0000-0000-00000000cd01';

select is(
  (select status::text from payments where reference = 'astro_cx_paid'),
  'refund_due', 'a paid weekly spot is flagged for a refund'
);
select is(
  (select note from payments where reference = 'astro_cx_paid'),
  'Matchday was cancelled', 'with the reason'
);
select is(
  (select (data->>'refund')::numeric from notifications where kind = 'matchday_cancelled' and user_id = '00000000-0000-0000-0000-0000000000c1'),
  3000::numeric, 'the weekly player is told about their refund'
);
select is(
  (select data->>'role' from notifications where kind = 'matchday_cancelled' and user_id = '00000000-0000-0000-0000-0000000000c2'),
  'monthly', 'a monthly member is told'
);
select ok(
  exists (select 1 from notifications where kind = 'matchday_cancelled' and user_id = '00000000-0000-0000-0000-0000000000c3'),
  'someone on standby is told'
);
select ok(
  not exists (select 1 from notifications where kind = 'matchday_cancelled' and user_id = '00000000-0000-0000-0000-0000000000c4'),
  'a monthly member who opted out of that Sunday is left alone'
);

select settle_payment('astro_cx_pending', 300000, 'NGN', 'trx_cx_late');
select is(
  (select status::text from payments where reference = 'astro_cx_pending'),
  'refund_due', 'a checkout that clears after the cancel goes on the refund list'
);

update matchdays set status = 'open' where id = '00000000-0000-0000-0000-00000000cd01';
update matchdays set status = 'cancelled' where id = '00000000-0000-0000-0000-00000000cd01';
select is(
  (select count(*)::int from notifications where kind = 'matchday_cancelled' and user_id = '00000000-0000-0000-0000-0000000000c1'),
  1, 'cancelling again doesn''t notify twice'
);
select is(
  (select count(*)::int from email_outbox where template = 'matchday-cancelled'),
  0, 'no email unless the player opted in to matchday emails'
);

select * from finish();
rollback;
