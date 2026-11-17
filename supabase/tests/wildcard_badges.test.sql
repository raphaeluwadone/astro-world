-- Wildcard badges: each one is handed out by the event itself, once per player.
begin;
select plan(14);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'wild-admin@test.local');
insert into players (id, nickname, full_name, is_admin, user_id, added_as_guest) values
  ('00000000-0000-0000-0000-000000000a01', 'W Admin', 'W Admin', true, '00000000-0000-0000-0000-0000000000a1', false),
  ('00000000-0000-0000-0000-000000000b01', 'W Decline', 'W Decline', false, null, false),
  ('00000000-0000-0000-0000-000000000b02', 'W Walker', 'W Walker', false, null, false),
  ('00000000-0000-0000-0000-000000000b03', 'W Hammy', 'W Hammy', false, null, false),
  ('00000000-0000-0000-0000-000000000b04', 'W Sub', 'W Sub', false, null, false),
  ('00000000-0000-0000-0000-000000000b05', 'W Guest', 'W Guest', false, null, true),
  ('00000000-0000-0000-0000-000000000b06', 'W Hothead', 'W Hothead', false, null, false),
  ('00000000-0000-0000-0000-000000000b07', 'W Own', 'W Own', false, null, false),
  ('00000000-0000-0000-0000-000000000b08', 'W Regular', 'W Regular', false, null, false);
insert into matchdays (id, played_at, status, capacity) values ('00000000-0000-0000-0000-00000000d001', now() + interval '3 days', 'open', 30);
insert into teams (id, matchday_id, greek_name, colour) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000d001', 'Alpha', '#38bdf8'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000d001', 'Beta', '#e0483f');
insert into pitch_games (id, matchday_id, team_a_id, team_b_id) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000e002');

create function wild_has(p uuid, k text) returns boolean language sql as $$
  select exists (select 1 from player_badges where player_id = p and badge_key = k and period_key = 'wild' and status = 'live')
$$;

-- Computer Says No
insert into payments (reference, kind, player_id, matchday_id, amount_kobo, status, hold_until) values
  ('astro_w_decl', 'weekly', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-00000000d001', 300000, 'pending', now() + interval '10 minutes');
select ok(not wild_has('00000000-0000-0000-0000-000000000b01', 'wild-declined'), 'a pending payment earns nothing yet');
select fail_payment('astro_w_decl', 'Declined');
select ok(wild_has('00000000-0000-0000-0000-000000000b01', 'wild-declined'), 'a declined payment earns Computer Says No');
update payments set status = 'pending' where reference = 'astro_w_decl';
select fail_payment('astro_w_decl', 'Declined again');
select is((select count(*)::int from player_badges where badge_key = 'wild-declined'), 1, 'and only the once');

-- Left the Pitch
insert into payments (reference, kind, player_id, matchday_id, amount_kobo, status, hold_until) values
  ('astro_w_walk', 'weekly', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-00000000d001', 300000, 'pending', now() + interval '10 minutes');
select award_left_the_pitch();
select ok(not wild_has('00000000-0000-0000-0000-000000000b02', 'wild-left-pitch'), 'a checkout still inside its hold earns nothing');
update payments set hold_until = now() - interval '2 minutes' where reference = 'astro_w_walk';
select award_left_the_pitch();
select ok(not wild_has('00000000-0000-0000-0000-000000000b02', 'wild-left-pitch'), 'nor does one just past the hold, in case they are slow');
update payments set hold_until = now() - interval '20 minutes' where reference = 'astro_w_walk';
select award_left_the_pitch();
select ok(wild_has('00000000-0000-0000-0000-000000000b02', 'wild-left-pitch'), 'an abandoned checkout earns Left the Pitch');

-- Pulled a Hamstring
insert into weekly_claims (id, matchday_id, player_id) values
  ('00000000-0000-0000-0000-00000000ec03', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b03');
insert into payments (reference, kind, player_id, matchday_id, amount_kobo, status, weekly_claim_id, paid_at) values
  ('astro_w_ham', 'weekly', '00000000-0000-0000-0000-000000000b03', '00000000-0000-0000-0000-00000000d001', 300000, 'paid', '00000000-0000-0000-0000-00000000ec03', now());
delete from weekly_claims where id = '00000000-0000-0000-0000-00000000ec03';
select ok(wild_has('00000000-0000-0000-0000-000000000b03', 'wild-pulled-out'), 'giving up a paid spot before the draw earns Pulled a Hamstring');

-- Super Sub
insert into weekly_claims (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b08');
select ok(not wild_has('00000000-0000-0000-0000-000000000b08', 'wild-super-sub'), 'a normal claim is not a Super Sub');
insert into matchday_standby_entries (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b04');
insert into weekly_claims (matchday_id, player_id) values ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-000000000b04');
select ok(wild_has('00000000-0000-0000-0000-000000000b04', 'wild-super-sub'), 'claiming from standby earns Super Sub');

-- Mystery Trialist
insert into team_members (team_id, player_id) values ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b08');
select ok(not wild_has('00000000-0000-0000-0000-000000000b08', 'wild-trialist'), 'a regular joining a side is not a trialist');
insert into team_members (team_id, player_id) values ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b05');
select ok(wild_has('00000000-0000-0000-0000-000000000b05', 'wild-trialist'), 'a walk-in who gets a shirt earns Mystery Trialist');

-- Early Bath
insert into pitch_cards (game_id, team_id, player_id, kind) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b06', 'yellow');
select ok(not wild_has('00000000-0000-0000-0000-000000000b06', 'wild-early-bath'), 'a yellow on its own is not an early bath');
insert into pitch_cards (game_id, team_id, player_id, kind) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-000000000b06', 'red');
select ok(wild_has('00000000-0000-0000-0000-000000000b06', 'wild-early-bath'), 'a yellow then a red in one game earns Early Bath');

-- Wrong End
insert into pitch_goals (game_id, team_id, scorer_id, own_goal) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-000000000b07', true);
select ok(wild_has('00000000-0000-0000-0000-000000000b07', 'wild-wrong-end'), 'an own goal earns Wrong End');

select * from finish();
rollback;
