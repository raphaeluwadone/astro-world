-- Captains' pick: snake order, who may pick, undo, and one open selection per matchday.
begin;
select plan(29);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'draft-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'draft-cap1@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', 'draft-cap2@test.local'),
  ('00000000-0000-0000-0000-0000000000a4', 'draft-cap3@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'D Admin', 'Draft Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'D Cap One', 'Draft Cap One', false, '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-000000000b02', 'D Cap Two', 'Draft Cap Two', false, '00000000-0000-0000-0000-0000000000a3'),
  ('00000000-0000-0000-0000-000000000b03', 'D Cap Three', 'Draft Cap Three', false, '00000000-0000-0000-0000-0000000000a4'),
  ('00000000-0000-0000-0000-000000000c01', 'D P1', 'Draft P1', false, null),
  ('00000000-0000-0000-0000-000000000c02', 'D P2', 'Draft P2', false, null),
  ('00000000-0000-0000-0000-000000000c03', 'D P3', 'Draft P3', false, null),
  ('00000000-0000-0000-0000-000000000c04', 'D P4', 'Draft P4', false, null),
  ('00000000-0000-0000-0000-000000000c05', 'D P5', 'Draft P5', false, null),
  ('00000000-0000-0000-0000-000000000c06', 'D P6', 'Draft P6', false, null);
insert into matchdays (id, played_at, status) values ('00000000-0000-0000-0000-00000000d001', '2030-03-17 10:00Z', 'open');

select is(
  (select array_agg(draft_slot_for_pick(g, 3) order by g) from generate_series(1, 9) g),
  array[1, 2, 3, 3, 2, 1, 1, 2, 3],
  'three sides turn round at each end'
);
select is(
  (select array_agg(draft_slot_for_pick(g, 6) order by g) from generate_series(1, 13) g),
  array[1, 2, 3, 4, 5, 6, 6, 5, 4, 3, 2, 1, 1],
  'six sides go 1 to 6, then 6 back to 1'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select throws_ok(
  $$select start_draft('00000000-0000-0000-0000-00000000d001', 3,
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-000000000b03']::uuid[],
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-000000000b03','00000000-0000-0000-0000-000000000c01','00000000-0000-0000-0000-000000000c02','00000000-0000-0000-0000-000000000c03','00000000-0000-0000-0000-000000000c04','00000000-0000-0000-0000-000000000c05','00000000-0000-0000-0000-000000000c06']::uuid[])$$,
  '42501', null, 'only admins can start a selection'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select lives_ok(
  $$create temp table sess as
    select start_draft('00000000-0000-0000-0000-00000000d001', 3,
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-000000000b03']::uuid[],
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-000000000b03','00000000-0000-0000-0000-000000000c01','00000000-0000-0000-0000-000000000c02','00000000-0000-0000-0000-000000000c03','00000000-0000-0000-0000-000000000c04','00000000-0000-0000-0000-000000000c05','00000000-0000-0000-0000-000000000c06']::uuid[]) as id$$,
  'an admin can start a selection'
);
select is(
  (select count(*)::int from notifications where user_id = '00000000-0000-0000-0000-0000000000a2' and kind = 'draft_turn'),
  1,
  'the first captain is told they are on the clock'
);
select throws_ok(
  $$select start_draft('00000000-0000-0000-0000-00000000d001', 2,
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02']::uuid[],
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-000000000c01']::uuid[])$$,
  'A selection is already running for this matchday',
  'only one selection can run at a time'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select throws_ok(
  $$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c01')$$,
  '42501', 'It''s not your turn', 'a captain cannot pick out of turn'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select lives_ok($$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c01')$$, 'captain one picks first');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select lives_ok($$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c02')$$, 'captain two picks second');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}', true);
select lives_ok($$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c03')$$, 'captain three picks third');
select lives_ok($$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c04')$$, 'captain three goes again as the order turns round');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select lives_ok($$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c05')$$, 'captain two picks fifth');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select lives_ok($$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c06')$$, 'an admin can pick for the captain on the clock');
select is(
  (select picked_by from draft_picks where session_id = (select id from sess) and pick_no = 6),
  '00000000-0000-0000-0000-000000000a01'::uuid,
  'the pick records the admin who made it'
);
select is(
  (select array_agg(slot order by pick_no) from draft_picks where session_id = (select id from sess)),
  array[1, 2, 3, 3, 2, 1],
  'the picks followed the snake'
);
select is((select status from draft_sessions where id = (select id from sess)), 'complete', 'the selection completes when the pool runs out');
select throws_ok(
  $$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c01')$$,
  'The selection isn''t running', 'no more picks once it is complete'
);

select lives_ok($$select draft_undo((select id from sess))$$, 'an admin can undo the last pick');
select is(
  (select status || ':' || (select count(*) from draft_picks where session_id = (select id from sess)) from draft_sessions where id = (select id from sess)),
  'live:5',
  'undoing reopens a completed selection'
);
select throws_ok(
  $$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c05')$$,
  'They''ve already been picked', 'a player cannot be picked twice'
);
select throws_ok(
  $$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000b02')$$,
  'They''ve already been picked', 'a captain cannot be picked'
);
select throws_ok(
  $$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000a01')$$,
  'That player isn''t in the pool', 'only the confirmed pool can be picked'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select throws_ok($$select draft_undo((select id from sess))$$, '42501', null, 'only admins can undo');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select lives_ok($$select draft_pick((select id from sess), '00000000-0000-0000-0000-000000000c06')$$, 're-picking after an undo completes it again');
select lives_ok($$select draft_mark_published((select id from sess))$$, 'an admin marks the selection published');
select lives_ok(
  $$create temp table sess2 as
    select start_draft('00000000-0000-0000-0000-00000000d001', 2,
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02']::uuid[],
      array['00000000-0000-0000-0000-000000000b01','00000000-0000-0000-0000-000000000b02','00000000-0000-0000-0000-000000000c01','00000000-0000-0000-0000-000000000c02']::uuid[]) as id$$,
  'a published selection no longer blocks a new one'
);
select lives_ok($$select draft_cancel((select id from sess2))$$, 'an admin can cancel a running selection');
select is((select status from draft_sessions where id = (select id from sess2)), 'cancelled', 'a cancelled selection stops');
select is(
  (select count(*)::int from pg_policies where tablename in ('draft_sessions', 'draft_captains', 'draft_picks') and cmd <> 'SELECT'),
  0,
  'the draft tables can only be changed through the functions'
);

select * from finish();
rollback;
