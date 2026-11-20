-- The 5-minute re-check: which payments it picks up, backoff, recovery of a stuck payment and the unmatched list.
begin;
select plan(16);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'rec-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'rec-a@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'Rec Admin', 'Rec Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'Rec A', 'Rec A', false, '00000000-0000-0000-0000-0000000000a2');
insert into matchdays (id, played_at, status, capacity) values ('00000000-0000-0000-0000-00000000d001', '2031-04-13 07:45+01', 'open', 30);

-- Only the test rows matter here, so hide everything else from the batch.
update payments set checked_at = now(), check_count = 100 where player_id <> '00000000-0000-0000-0000-000000000b01';

insert into payments (reference, kind, player_id, matchday_id, amount_kobo, status, hold_until, created_at) values
  ('astro_rec_pending', 'weekly', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000d001', 300000, 'pending', now() - interval '1 minute', now() - interval '20 minutes'),
  ('astro_rec_cancelled', 'weekly', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000d001', 300000, 'cancelled', null, now() - interval '30 minutes'),
  ('astro_rec_old', 'weekly', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000d001', 300000, 'pending', null, now() - interval '5 days'),
  ('astro_rec_failed', 'weekly', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000d001', 300000, 'failed', null, now() - interval '10 minutes');

create temp table batch as select reference from payments_to_reconcile(25);
select set_eq(
  'select reference from batch',
  $$values ('astro_rec_pending'), ('astro_rec_cancelled')$$,
  'the re-check picks up recent pending and cancelled payments, not failed or old ones'
);
select is(
  (select check_count from payments where reference = 'astro_rec_pending'),
  1, 'and stamps each one it hands out'
);
select is(
  (select count(*)::int from payments_to_reconcile(25)),
  0, 'a payment just checked waits before it is checked again'
);
update payments set checked_at = now() - interval '4 minutes' where reference = 'astro_rec_pending';
select is(
  (select count(*)::int from payments_to_reconcile(25) where reference = 'astro_rec_pending'),
  1, 'and comes back once the backoff has passed'
);

-- Paystack says the stuck one succeeded after its hold ran out: the spot is recovered.
select is(
  (select status::text from settle_payment('astro_rec_pending', 300000, 'NGN', 'trx_rec')),
  'paid', 'a stuck payment is recorded when the re-check settles it'
);
select is(
  (select count(*)::int from weekly_claims where matchday_id = '00000000-0000-0000-0000-00000000d001' and player_id = '00000000-0000-0000-0000-000000000b01'),
  1, 'and its spot is confirmed'
);
-- The older tab was paid too.
select is(
  (select status::text from settle_payment('astro_rec_cancelled', 300000, 'NGN', 'trx_rec2')),
  'refund_due', 'a second payment for the same spot is flagged for a refund, not lost'
);

-- Unmatched: Paystack has a charge Astro can't place.
select is(
  (select reason from record_paystack_unmatched('trx_x', 'astro_unknown', 500000, 'NGN', 'x@example.com', now(), 'No record')),
  'No record', 'an unknown Paystack charge is listed for admins'
);
select is(
  (select reason from record_paystack_unmatched('trx_x', 'astro_unknown', 500000, 'NGN', 'x@example.com', now(), 'Still no record')),
  'Still no record', 'seeing it again updates the same entry'
);
select is((select count(*)::int from paystack_unmatched where provider_ref = 'trx_x'), 1, 'without duplicating it');

insert into payments (reference, kind, player_id, matchday_id, amount_kobo, status) values
  ('astro_rec_late', 'weekly', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000d001', 300000, 'pending');
select record_paystack_unmatched('trx_late', 'astro_rec_late', 300000, 'NGN', null, now(), 'Astro has it as pending');
select settle_payment('astro_rec_late', 300000, 'NGN', 'trx_late');
select ok(
  (select resolved_at is not null from paystack_unmatched where provider_ref = 'trx_late'),
  'an unmatched entry closes itself once the payment is recorded'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from paystack_unmatched), 0, 'players can''t see the unmatched list');
select throws_ok(
  $$select payments_to_reconcile(25)$$,
  '42501', null, 'the browser can''t run the re-check batch'
);
select is((select count(*)::int from app_config where key = 'payments_reconcile_secret'), 0, 'players can''t read the cron secret');
select throws_ok($$select dispatch_payments_reconcile()$$, '42501', null, 'the browser can''t trigger the cron dispatch');
reset role;
select ok(
  (select length(value) >= 64 from app_config where key = 'payments_reconcile_secret'),
  'the cron secret exists and is long enough'
);

select * from finish();
rollback;
