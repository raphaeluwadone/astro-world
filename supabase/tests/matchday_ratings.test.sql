-- Matchday ratings: who can rate, one rating per player per day, and the open-to-everyone switch.
begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'rate-admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'rate-one@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', 'rate-watcher@test.local');
insert into players (id, nickname, full_name, is_admin, user_id) values
  ('00000000-0000-0000-0000-000000000a01', 'T Admin', 'Test Admin', true, '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-000000000b01', 'T One', 'Test One', false, '00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-000000000b02', 'T Two', 'Test Two', false, null),
  ('00000000-0000-0000-0000-000000000b03', 'T Three', 'Test Three', false, null),
  ('00000000-0000-0000-0000-000000000b04', 'T Watcher', 'Test Watcher', false, '00000000-0000-0000-0000-0000000000a3');
insert into matchdays (id, played_at, status) values ('00000000-0000-0000-0000-00000000d001', now() - interval '1 day', 'played');
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f'),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000d001', 'Gamma', '#4ade80');
-- One plays Alpha v Beta then Alpha v Gamma; Three only plays Gamma, so One and Three met once and Two never met Three.
insert into matches (id, matchday_id, team_a_id, team_b_id, score_a, score_b, played_at) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002', 1, 0, now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e003', 0, 0, now() - interval '23 hours');
insert into match_players (match_id, player_id, team_id) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000e001'),
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-00000000e002'),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000e001'),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-00000000e003');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select lives_ok($$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 7)$$, 'a player rates someone they played');
select lives_ok($$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b03', 6)$$, 'and anyone else from the matchday');
select lives_ok($$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 8.5)$$, 'rating again changes the score');
select is(
  (select array[count(*), max(score)]::numeric[] from ratings where rater_id = '00000000-0000-0000-0000-000000000b01' and subject_id = '00000000-0000-0000-0000-000000000b02'),
  array[1, 8.5]::numeric[], 'one rating per player per matchday'
);
select throws_ok($$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b01', 9)$$, 'You can''t rate yourself');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);
select is((select can_rate from rating_matchday()), false, 'someone who wasn''t there can''t rate by default');
select throws_ok($$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 5)$$, '42501', null, 'and the database refuses it');

update rating_settings set open_to_everyone = true;
select lives_ok($$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 5)$$, 'once it is open to everyone, they can');

update matchdays set played_at = now() - interval '30 days' where id = '00000000-0000-0000-0000-00000000d001';
select throws_ok($$select rate_player('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b02', 5)$$, 'Ratings for this matchday are closed');

select * from finish();
rollback;
