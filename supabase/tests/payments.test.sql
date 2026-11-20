-- Paystack payments: holds, server-side settlement, idempotency and refund flags.
begin;
select plan(27);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'pay-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'pay-a@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', 'pay-b@test.local'),
  ('00000000-0000-0000-0000-0000000000a4', 'pay-c@test.local'),
  ('00000000-0000-0000-0000-0000000000a5', 'pay-d@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'Pay Admin', 'Pay Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'Pay A', 'Pay A', false, '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-000000000b02', 'Pay B', 'Pay B', false, '00000000-0000-0000-0000-0000000000a3'),
  ('00000000-0000-0000-0000-000000000b03', 'Pay C', 'Pay C', false, '00000000-0000-0000-0000-0000000000a4'),
  ('00000000-0000-0000-0000-000000000b04', 'Pay D', 'Pay D', false, '00000000-0000-0000-0000-0000000000a5');

-- A Sunday far from any real month, with 27 of its 30 spots already claimed.
insert into matchdays (id, played_at, status, capacity) values ('00000000-0000-0000-0000-00000000d001', '2031-03-09 07:45+01', 'open', 30);
insert into players (id, nickname, full_name)
select ('00000000-0000-0000-0000-0000000f' || lpad(g::text, 4, '0'))::uuid, 'Filler ' || g, 'Filler ' || g from generate_series(1, 27) g;
insert into weekly_claims (matchday_id, player_id)
select '00000000-0000-0000-0000-00000000d001', ('00000000-0000-0000-0000-0000000f' || lpad(g::text, 4, '0'))::uuid from generate_series(1, 27) g;
insert into dues_quarters (id, year, quarter, amount, due_date) values ('00000000-0000-0000-0000-00000000e001', 2031, 1, 12000, '2031-01-15');

delete from payment_prices;

create temp table refs (name text primary key, reference text);
grant all on refs to authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select throws_ok(
  $$select start_payment('weekly', '00000000-0000-0000-0000-00000000d001')$$,
  'An admin hasn''t set a price yet', 'no price, no payment'
);

insert into payment_prices (kind, amount) values ('weekly', 3000), ('monthly', 10000);

-- C claims for free, so 2 spots are left.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
set local role authenticated;
insert into weekly_claims (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b03');
reset role;

-- A and D start paying for the last two, which holds them.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into refs select 'a', reference from start_payment('weekly', '00000000-0000-0000-0000-00000000d001');
select is(
  (select amount_kobo from payments where reference = (select reference from refs where name = 'a')),
  300000::bigint, 'the amount comes from the price table, in kobo'
);
select ok(
  (select hold_until > now() from payments where reference = (select reference from refs where name = 'a')),
  'starting a payment for a new spot holds it'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a5","role":"authenticated"}', true);
insert into refs select 'd', reference from start_payment('weekly', '00000000-0000-0000-0000-00000000d001');
select is(weekly_spots_remaining('00000000-0000-0000-0000-00000000d001'), 0, 'held spots count as taken');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
select throws_ok(
  $$insert into weekly_claims (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02')$$,
  '42501', null, 'a free claim can''t take a spot someone is paying for'
);
select is(
  (select count(*)::int from payments where player_id = '00000000-0000-0000-0000-000000000b01'),
  0, 'players can''t see each other''s payments'
);
select throws_ok(
  $$select settle_payment('anything', 300000, 'NGN', '1')$$,
  '42501', null, 'the browser can''t settle a payment'
);
select throws_ok(
  $$select mark_payment_refunded(gen_random_uuid())$$,
  'Only admins can do that', 'players can''t mark refunds'
);
reset role;
select throws_ok(
  $$select start_payment('weekly', '00000000-0000-0000-0000-00000000d001')$$,
  'No spots left', 'nobody can start paying for a spot that''s held'
);

-- Paystack confirms A's charge.
select is(
  (select status::text from settle_payment((select reference from refs where name = 'a'), 300000, 'NGN', 'trx_a')),
  'paid', 'a verified charge marks the payment paid'
);
select is(
  (select count(*)::int from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001' and player_id = '00000000-0000-0000-0000-000000000b01'),
  1, 'and confirms the spot'
);
select is(
  (select status::text from settle_payment((select reference from refs where name = 'a'), 300000, 'NGN', 'trx_a')),
  'paid', 'settling the same reference again is harmless'
);
select is(
  (select count(*)::int from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001' and player_id = '00000000-0000-0000-0000-000000000b01'),
  1, 'and doesn''t add a second claim'
);

-- D's hold runs out, B takes the spot for free, then D's payment clears.
update payments set hold_until = now() - interval '1 minute' where reference = (select reference from refs where name = 'd');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
insert into weekly_claims (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02');
reset role;
select is(
  (select status::text from settle_payment((select reference from refs where name = 'd'), 300000, 'NGN', 'trx_d')),
  'refund_due', 'a payment that clears after the spot has gone is flagged for a refund'
);
select is(
  (select count(*)::int from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001'),
  30, 'and never overfills the matchday'
);

-- C pays for the spot they claimed for free.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
insert into refs select 'c', reference from start_payment('weekly', '00000000-0000-0000-0000-00000000d001');
select ok(
  (select hold_until is null from payments where reference = (select reference from refs where name = 'c')),
  'paying for a spot you already hold doesn''t hold another'
);
select is(
  (select weekly_claim_id from settle_payment((select reference from refs where name = 'c'), 300000, 'NGN', 'trx_c')),
  (select id from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001' and player_id = '00000000-0000-0000-0000-000000000b03'),
  'the payment attaches to the existing claim'
);
select throws_ok(
  $$select start_payment('weekly', '00000000-0000-0000-0000-00000000d001')$$,
  'Your spot is already paid for', 'a paid spot can''t be paid again'
);

-- A pulls out before claims close.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
delete from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001' and player_id = '00000000-0000-0000-0000-000000000b01';
reset role;
select is(
  (select status::text from payments where reference = (select reference from refs where name = 'a')),
  'refund_due', 'giving up a paid spot before the deadline flags a refund'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(
  (select status::text from mark_payment_refunded((select id from payments where reference = (select reference from refs where name = 'a')))),
  'refunded', 'an admin marks the refund as settled'
);

-- Dues: a wrong amount never counts.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
insert into refs select 'dues1', reference from start_payment('dues', p_dues_quarter_id => '00000000-0000-0000-0000-00000000e001');
select is(
  (select status::text from settle_payment((select reference from refs where name = 'dues1'), 100, 'NGN', 'trx_x')),
  'failed', 'a charge for the wrong amount fails'
);
insert into refs select 'dues2', reference from start_payment('dues', p_dues_quarter_id => '00000000-0000-0000-0000-00000000e001');
select is(
  (select status::text from settle_payment((select reference from refs where name = 'dues2'), 1200000, 'NGN', 'trx_dues')),
  'paid', 'the right amount pays the dues'
);
select is(
  (select count(*)::int from dues_payments where dues_quarter_id = '00000000-0000-0000-0000-00000000e001' and player_id = '00000000-0000-0000-0000-000000000b01'),
  1, 'and marks the quarter paid'
);
select throws_ok(
  $$select start_payment('dues', p_dues_quarter_id => '00000000-0000-0000-0000-00000000e001')$$,
  'You''ve already paid this quarter', 'paid dues can''t be paid again'
);

-- Monthly.
insert into refs select 'm', reference from start_payment('monthly', p_month => '2031-03-01');
select is(monthly_spots_remaining('2031-03-01'), 9, 'a monthly payment holds one of the ten');
select is(
  (select status::text from settle_payment((select reference from refs where name = 'm'), 1000000, 'NGN', 'trx_m')),
  'paid', 'a verified monthly charge is paid'
);
select is(
  (select count(*)::int from monthly_memberships where month = '2031-03-01' and player_id = '00000000-0000-0000-0000-000000000b01'),
  1, 'and confirms the monthly spot'
);

select * from finish();
rollback;
