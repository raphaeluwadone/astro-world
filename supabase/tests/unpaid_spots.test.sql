-- Unpaid spots drop at Saturday 20:00 (Lagos); a monthly spot bought into a full Sunday starts on standby.
begin;
select plan(16);

insert into payment_prices (kind, amount) values ('weekly', 3000), ('monthly', 7000)
on conflict (kind) do update set amount = excluded.amount;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'up-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000e2', 'up-weekly@test.local'),
  ('00000000-0000-0000-0000-0000000000e3', 'up-monthly@test.local'),
  ('00000000-0000-0000-0000-0000000000e4', 'up-standby@test.local'),
  ('00000000-0000-0000-0000-0000000000e5', 'up-late@test.local');
insert into players (id, nickname, full_name, user_id, is_admin) values
  ('00000000-0000-0000-0000-000000000e01', 'UP Admin', 'Up Admin', '00000000-0000-0000-0000-0000000000e1', true),
  ('00000000-0000-0000-0000-000000000e02', 'UP Weekly', 'Up Weekly', '00000000-0000-0000-0000-0000000000e2', false),
  ('00000000-0000-0000-0000-000000000e03', 'UP Monthly', 'Up Monthly', '00000000-0000-0000-0000-0000000000e3', false),
  ('00000000-0000-0000-0000-000000000e04', 'UP Standby', 'Up Standby', '00000000-0000-0000-0000-0000000000e4', false),
  ('00000000-0000-0000-0000-000000000e05', 'UP Late', 'Up Late', '00000000-0000-0000-0000-0000000000e5', false),
  ('00000000-0000-0000-0000-000000000e06', 'UP Paid', 'Up Paid', null, false),
  ('00000000-0000-0000-0000-000000000e07', 'UP Cash', 'Up Cash', null, false);

select is(
  spot_pay_deadline('2031-03-09 08:30+00') at time zone 'Africa/Lagos',
  '2031-03-08 20:00'::timestamp, 'a Sunday game is paid for by Saturday 20:00 in Lagos'
);

-- Kick-off in two hours, so the deadline has passed.
insert into matchdays (id, played_at, status, capacity) values
  ('00000000-0000-0000-0000-00000000ed01', now() + interval '2 hours', 'open', 30);
insert into monthly_memberships (id, player_id, month) values
  ('00000000-0000-0000-0000-00000000ee01', '00000000-0000-0000-0000-000000000e03', date_trunc('month', (now() + interval '2 hours') at time zone 'Africa/Lagos')::date);
insert into weekly_claims (id, matchday_id, player_id) values
  ('00000000-0000-0000-0000-00000000ec02', '00000000-0000-0000-0000-00000000ed01', '00000000-0000-0000-0000-000000000e02'),
  ('00000000-0000-0000-0000-00000000ec06', '00000000-0000-0000-0000-00000000ed01', '00000000-0000-0000-0000-000000000e06'),
  ('00000000-0000-0000-0000-00000000ec07', '00000000-0000-0000-0000-00000000ed01', '00000000-0000-0000-0000-000000000e07');
insert into payments (reference, kind, player_id, matchday_id, amount_kobo, status, weekly_claim_id, paid_at) values
  ('astro_up_paid', 'weekly', '00000000-0000-0000-0000-000000000e06', '00000000-0000-0000-0000-00000000ed01', 300000, 'paid', '00000000-0000-0000-0000-00000000ec06', now());
insert into matchday_standby_entries (matchday_id, player_id) values
  ('00000000-0000-0000-0000-00000000ed01', '00000000-0000-0000-0000-000000000e04');

-- An admin takes cash from UP Cash.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e1","role":"authenticated"}', true);
select lives_ok(
  $$select mark_spot_paid('weekly', '00000000-0000-0000-0000-00000000ec07')$$,
  'an admin can mark a spot paid in cash'
);
select throws_ok(
  $$select mark_spot_paid('weekly', '00000000-0000-0000-0000-00000000ec07')$$,
  'That spot is already paid', 'but only once'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e2","role":"authenticated"}', true);
select throws_ok(
  $$select mark_spot_paid('weekly', '00000000-0000-0000-0000-00000000ec02')$$,
  '42501', null, 'players can''t mark themselves paid'
);
select set_config('request.jwt.claims', '', true);

select drop_unpaid_spots();
select is(
  (select count(*)::int from notifications where kind = 'spot_dropped' and data->>'matchday_id' = '00000000-0000-0000-0000-00000000ed01'
     and user_id in (select user_id from players where nickname like 'UP %')),
  2, 'the two unpaid test spots drop after the deadline'
);
select ok(
  not exists (select 1 from weekly_claims where id = '00000000-0000-0000-0000-00000000ec02'),
  'the unpaid weekly claim is gone'
);
select is(
  (select count(*)::int from weekly_claims where id in ('00000000-0000-0000-0000-00000000ec06', '00000000-0000-0000-0000-00000000ec07')),
  2, 'paid online and paid in cash both stay'
);
select is(
  (select status::text from availability where matchday_id = '00000000-0000-0000-0000-00000000ed01' and player_id = '00000000-0000-0000-0000-000000000e03'),
  'out', 'the unpaid monthly member is out for this Sunday'
);
select is(
  (select count(*)::int from notifications where kind = 'spot_dropped' and user_id in ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e3')),
  2, 'both are told'
);
select ok(
  exists (select 1 from notifications where kind = 'spot_open' and user_id = '00000000-0000-0000-0000-0000000000e4'),
  'standby hears a spot opened'
);
select is(drop_unpaid_spots(), 0, 'running again drops nothing more');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e3","role":"authenticated"}', true);
select throws_ok(
  $$update availability set status = 'in' where matchday_id = '00000000-0000-0000-0000-00000000ed01' and player_id = '00000000-0000-0000-0000-000000000e03'$$,
  'Pay for your monthly spot to get back in for this Sunday', 'an unpaid monthly member can''t opt back in after the deadline'
);
select set_config('request.jwt.claims', '', true);

-- A full Sunday later in the month: a new monthly member starts on standby.
insert into matchdays (id, played_at, status, capacity) values
  ('00000000-0000-0000-0000-00000000ed02', date_trunc('month', now() at time zone 'Africa/Lagos') + interval '40 days', 'open', 30);
insert into weekly_claims (matchday_id, player_id)
select '00000000-0000-0000-0000-00000000ed02', p.id from players p
where p.id not in ('00000000-0000-0000-0000-000000000e05', '00000000-0000-0000-0000-000000000e01')
  and not exists (select 1 from monthly_memberships mm join matchdays md on md.id = '00000000-0000-0000-0000-00000000ed02'
                  where mm.player_id = p.id and mm.month = date_trunc('month', md.played_at at time zone 'Africa/Lagos')::date)
limit (select weekly_spots_remaining('00000000-0000-0000-0000-00000000ed02'));
select is(weekly_spots_remaining('00000000-0000-0000-0000-00000000ed02'), 0, 'the later Sunday is full');

delete from notifications where kind = 'spot_open';
insert into monthly_memberships (player_id, month)
select '00000000-0000-0000-0000-000000000e05', date_trunc('month', played_at at time zone 'Africa/Lagos')::date
from matchdays where id = '00000000-0000-0000-0000-00000000ed02';
select ok(
  exists (select 1 from matchday_standby_entries where matchday_id = '00000000-0000-0000-0000-00000000ed02' and player_id = '00000000-0000-0000-0000-000000000e05')
  and weekly_spots_remaining('00000000-0000-0000-0000-00000000ed02') = 0,
  'a monthly spot bought into a full Sunday starts on standby'
);
select ok(
  not exists (select 1 from notifications where kind = 'spot_open'),
  'which doesn''t tell standby a spot opened'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000e5","role":"authenticated"}', true);
select throws_ok(
  $$update availability set status = 'in' where matchday_id = '00000000-0000-0000-0000-00000000ed02' and player_id = '00000000-0000-0000-0000-000000000e05'$$,
  'This Sunday is full. You''re on standby and will hear if a spot opens.', 'they can''t jump in while it''s full'
);

select * from finish();
rollback;
