-- =============================================================================
-- TEST DATA SEED, not applied automatically, not referenced by any app code.
--
-- NOT YET RUN. This file is a draft for review only. Nobody has executed it
-- against any database. Nothing in the running app changes until it's
-- explicitly approved and applied (and even then, only against local dev).
--
-- Purpose: a full, fictional-but-realistic dataset so every screen built so
-- far is exercisable without depending on, or risking, Raphael's real
-- 70-player roster (kept safe and separate in seed_real_roster.sql).
--
-- Every name below is invented. None correspond to real members of the
-- group, and none reuse a nickname seen anywhere in this project's real
-- data. The 6 "pro" comparison targets and 4 clubs are equally fictional,
-- standing in for what would normally come from a live API-Football call
-- (so testing comparisons/favourite-club search doesn't burn the real
-- account's 100-request/day cap).
--
-- Assumes it's running against an otherwise-empty local dev database (the
-- "replace" plan: reset or manually truncate the app tables first). This
-- file does not do that reset itself, and does not touch seed_real_roster.sql.
--
-- Deliberately excluded: the memorial page / tributes. Ade Salami is a real
-- person; this file does not fabricate mourning posts for him, fake account
-- or not. Test that page manually, as it has been.
--
-- Login accounts this creates (local only, password below, never used
-- anywhere but this local instance):
--   test-admin@allstars.local    -> Segun "Segsy" Adewale      (admin)
--   test-member1@allstars.local  -> Adaeze "Deza" Okonkwo      (regular member)
--   test-member2@allstars.local  -> Chinedu "Chino" Igwe       (regular member)
--   test-claimant1@allstars.local -> no player row yet (tests the claim flow)
--   test-claimant2@allstars.local -> no player row yet (tests the claim flow)
-- Password for all five: testpass123
-- =============================================================================

begin;

-- -----------------------------------------------------------------------
-- 0. Auth users (5): 3 linked to seeded players below, 2 left unlinked so
-- there's something real to claim a record with.
-- -----------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000a001', 'authenticated', 'authenticated', 'test-admin@allstars.local', crypt('testpass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000a002', 'authenticated', 'authenticated', 'test-member1@allstars.local', crypt('testpass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000a003', 'authenticated', 'authenticated', 'test-member2@allstars.local', crypt('testpass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000a004', 'authenticated', 'authenticated', 'test-claimant1@allstars.local', crypt('testpass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-00000000a005', 'authenticated', 'authenticated', 'test-claimant2@allstars.local', crypt('testpass123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into auth.identities (id, provider_id, user_id, identity_data, provider, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false), 'email', now(), now()
from auth.users u
where u.email like '%@allstars.local';

-- -----------------------------------------------------------------------
-- 1. Players (38): 30 "regulars" with full profiles and a season of real
-- legacy history, 8 "occasional" players who are sparse or brand new,
-- mostly unclaimed on purpose (the pool the Join/claim flow tests against).
-- -----------------------------------------------------------------------

create temporary table seed_players (
  rn int generated always as identity,
  nickname text,
  full_name text,
  positions position_type[],
  foot foot_type,
  height_cm numeric(5,1),
  weight_kg numeric(5,1),
  favourite_number int,
  favourite_club text,
  bio text,
  is_regular boolean,
  legacy_goals int,
  legacy_assists int,
  legacy_appearances int,
  legacy_yellow_cards int,
  legacy_red_cards int,
  legacy_clean_sheets int,
  user_id uuid
);

insert into seed_players
  (nickname, full_name, positions, foot, height_cm, weight_kg, favourite_number, favourite_club, bio, is_regular, legacy_goals, legacy_assists, legacy_appearances, legacy_yellow_cards, legacy_red_cards, legacy_clean_sheets, user_id)
values
  -- 30 regulars
  ('Segsy',  'Segun Adewale',     array['UTIL','ATT']::position_type[], 'right', 178.0, 74.0, 10, 'Arsenal',        'Been organising this since before it had a name.', true, 41, 19, 118, 6, 0, 0, 'a0000000-0000-0000-0000-00000000a001'),
  ('Deza',   'Adaeze Okonkwo',    array['ATT']::position_type[],        'left',  165.0, 58.0, 9,  'Chelsea',        'Small but she will out-run your whole back line.',  true, 63, 22, 102, 2, 0, 0, 'a0000000-0000-0000-0000-00000000a002'),
  ('Chino',  'Chinedu Igwe',      array['DEF']::position_type[],        'right', 182.0, 79.0, 4,  'Liverpool',      'Reads the game two passes ahead of everyone else.', true, 3,  8,  109, 4, 0, 21, 'a0000000-0000-0000-0000-00000000a003'),
  ('Bal',    'Ibrahim Balogun',   array['GK']::position_type[],         'right', 188.0, 84.0, 1,  'Manchester City','Shot-stopper, terrible at penalties, own or against.', true, 0, 1, 95, 1, 0, 34, null),
  ('Deras',  'Chidera Nwosu',     array['UTIL']::position_type[], 'right', 174.0, 70.0, 8,  'Real Madrid',    'Midfield engine, never asks for the ball, always gets it.', true, 12, 31, 121, 3, 0, 0, null),
  ('Femzy',  'Femi Okoro',        array['ATT']::position_type[],        'right', 180.0, 76.0, 11, 'Barcelona',      'Finisher. Everything else is somebody else''s job.', true, 58, 14, 99, 5, 1, 0, null),
  ('Ngozzy', 'Ngozi Eze',         array['DEF','UTIL']::position_type[], 'left',  170.0, 65.0, 5,  'Arsenal',        'Will mark your best player out of the game and say nothing about it.', true, 4, 6, 88, 2, 0, 19, null),
  ('Tobs',   'Tobi Adeyemi',      array['UTIL']::position_type[],        'right', 176.0, 71.0, 7,  'Manchester United', 'Set-piece taker, still hasn''t scored one in the group.', true, 9, 26, 104, 3, 0, 0, null),
  ('Uchie',  'Uche Obi',          array['ATT','UTIL']::position_type[],  'right', 173.0, 68.0, 17, 'Liverpool',      'Nutmegged three people last month, still talking about it.', true, 34, 21, 91, 2, 0, 0, null),
  ('Kels',   'Kelechi Nnamdi',    array['DEF']::position_type[],        'right', 185.0, 81.0, 6,  'Chelsea',        'Wins every header. Every single one.', true, 2, 3, 113, 5, 0, 24, null),
  ('Dami',   'Damilola Fashola',  array['UTIL']::position_type[],       'both',  177.0, 73.0, 22, 'Arsenal',        'Plays wherever he''s needed and never complains.', true, 15, 15, 107, 1, 0, 0, null),
  ('Big Em', 'Emeka Uduak',       array['DEF','GK']::position_type[],   'right', 190.0, 88.0, 2,  'Real Madrid',    'Fills in at keeper when Bal is late. Bal is often late.', true, 1, 2, 84, 3, 0, 9, null),
  ('Roti',   'Rotimi Bello',      array['UTIL']::position_type[],        'left',  171.0, 66.0, 14, 'Barcelona',      'Left foot, short passes, never loses the ball.', true, 7, 24, 96, 2, 0, 0, null),
  ('Mara',   'Amara Chukwuma',    array['ATT']::position_type[],        'right', 168.0, 60.0, 19, 'Manchester City','Pace that the group still hasn''t figured out how to defend.', true, 47, 11, 87, 1, 0, 0, null),
  ('Yem',    'Yemi Owolabi',      array['DEF']::position_type[],        'right', 183.0, 80.0, 3,  'Liverpool',      'Captain material, just refuses the armband every time.', true, 5, 9, 116, 4, 1, 22, null),
  ('Obi',    'Obinna Okafor',     array['UTIL','ATT']::position_type[],  'right', 175.0, 72.0, 21, 'Chelsea',        'Box-to-box, mostly box-to-box.', true, 19, 20, 93, 2, 0, 0, null),
  ('Foli',   'Folake Adebayo',    array['UTIL']::position_type[],       'left',  164.0, 57.0, 16, 'Arsenal',        'Turns up early, leaves last, plays every position badly on purpose.', true, 8, 13, 78, 0, 0, 0, null),
  ('Bimz',   'Bimpe Salako',      array['ATT']::position_type[],        'right', 167.0, 59.0, 23, 'Real Madrid',    'Scores against her cousin''s team on purpose every time.', true, 29, 10, 82, 1, 0, 0, null),
  ('Kayzo',  'Kayode Fagbenle',   array['UTIL']::position_type[],        'right', 174.0, 69.0, 18, 'Barcelona',      'Talks more than he tackles. Tackles fine, talks more.', true, 11, 18, 101, 4, 0, 0, null),
  ('Nekky',  'Nneka Okwuosa',     array['DEF']::position_type[],        'left',  169.0, 63.0, 15, 'Chelsea',        'Slide tackles from angles that shouldn''t work. They work.', true, 2, 5, 85, 2, 0, 18, null),
  ('Bams',   'Segun Bamgbose',    array['GK']::position_type[],         'right', 186.0, 82.0, 13, 'Liverpool',      'Understudy keeper, wants Bal''s spot, hasn''t said so out loud.', true, 0, 0, 41, 0, 0, 15, null),
  ('Ify',    'Ifeanyi Umeh',      array['UTIL']::position_type[], 'right', 176.0, 72.0, 20, 'Manchester City','Plays like he''s auditioning for a team that doesn''t exist.', true, 13, 17, 97, 3, 0, 0, null),
  ('Dobs',   'Adaobi Chukwu',     array['ATT']::position_type[],        'left',  166.0, 58.0, 24, 'Arsenal',        'Youngest regular, already the group''s top scorer some months.', true, 39, 9, 63, 0, 0, 0, null),
  ('T-Fash', 'Tunde Fashina',     array['UTIL','DEF']::position_type[],  'right', 178.0, 74.0, 25, 'Manchester United', 'Converted striker, still shoots more than he should from the back.', true, 6, 11, 89, 3, 0, 12, null),
  ('Effy',   'Bassey Effiong',    array['DEF']::position_type[],        'right', 181.0, 77.0, 27, 'Real Madrid',    'Never books a card, never wins the ball back either.', true, 1, 3, 76, 0, 0, 14, null),
  ('Chichi', 'Chiamaka Nwankwo',  array['ATT','UTIL']::position_type[], 'right', 170.0, 62.0, 28, 'Barcelona',      'Direct running, blunt finishing, still terrifying to play against.', true, 22, 14, 71, 1, 0, 0, null),
  ('Lekky',  'Lekan Oyelaran',    array['UTIL']::position_type[],        'left',  173.0, 68.0, 29, 'Chelsea',        'Deep-lying playmaker, or so he calls it.', true, 4, 28, 94, 2, 0, 0, null),
  ('Fis',    'Fisayo Adetutu',    array['DEF','UTIL']::position_type[], 'right', 177.0, 73.0, 30, 'Manchester City','Plays it safe until the one time a season he doesn''t.', true, 3, 7, 68, 1, 0, 11, null),
  ('Goddy',  'Godwin Etim',       array['GK']::position_type[],         'right', 189.0, 85.0, 31, 'Liverpool',      'Third-choice keeper, first-choice at complaining about it.', true, 0, 0, 22, 0, 0, 6, null),
  ('Sadey',  'Sarah Nwachukwu',   array['UTIL','ATT']::position_type[],  'right', 169.0, 61.0, 32, 'Arsenal',        'Free-kick specialist, has scored exactly one.', true, 17, 16, 74, 1, 0, 0, null),
  -- 8 occasional, sparse history, mostly unclaimed (claim-flow test pool)
  ('Precy',  'Precious Idowu',    array['ATT']::position_type[], null, null, null, null, null, null, false, 2, 1, 4, 0, 0, 0, null),
  ('Mikey D','Michael Danjuma',   array['UTIL']::position_type[], null, null, null, null, null, null, false, 0, 2, 3, 0, 0, 0, null),
  ('Ruthie', 'Ruth Okonjo',       array['DEF']::position_type[], null, null, null, null, null, null, false, 0, 0, 2, 0, 0, 1, null),
  ('Sammy A','Samuel Adegoke',    array['UTIL']::position_type[], null, null, null, null, null, null, false, 1, 0, 5, 1, 0, 0, null),
  ('Bless',  'Blessing Umoh',     array['GK']::position_type[], null, null, null, null, null, null, false, 0, 0, 1, 0, 0, 0, null),
  ('Dave O', 'David Okereke',     array['ATT','UTIL']::position_type[], null, null, null, null, null, null, false, 0, 1, 2, 0, 0, 0, null),
  ('Gracie', 'Grace Ibrahim',     array['DEF']::position_type[], null, null, null, null, null, null, false, 0, 0, 0, 0, 0, 0, null),
  ('PJ',     'Peter Nwokolo',     array['UTIL']::position_type[], null, null, null, null, null, null, false, 0, 0, 3, 0, 0, 0, null);

insert into players (
  id, user_id, nickname, full_name, positions, preferred_foot, height_cm, weight_kg,
  favourite_number, favourite_club, bio, is_admin, joined_at, onboarded_at,
  legacy_goals, legacy_assists, legacy_appearances, legacy_yellow_cards, legacy_red_cards, legacy_clean_sheets
)
select
  gen_random_uuid(), sp.user_id, sp.nickname, sp.full_name, sp.positions, sp.foot, sp.height_cm, sp.weight_kg,
  sp.favourite_number, sp.favourite_club, sp.bio, (sp.nickname = 'Segsy'),
  now() - (sp.rn || ' days')::interval - interval '200 days',
  case when sp.user_id is not null then now() - (sp.rn || ' days')::interval - interval '190 days' else null end,
  sp.legacy_goals, sp.legacy_assists, sp.legacy_appearances, sp.legacy_yellow_cards, sp.legacy_red_cards, sp.legacy_clean_sheets
from seed_players sp;

-- Give every seeded player a stable, queryable id for the rest of this
-- file without hand-writing UUIDs: joins seed_players -> players by the
-- unique nickname just inserted.
alter table seed_players add column player_id uuid;
update seed_players sp set player_id = p.id from players p where p.nickname = sp.nickname;

-- -----------------------------------------------------------------------
-- 2. Matchdays: one open (this week's ballot, live) and one played (full
-- history: teams, matches, goals, ratings, MOTM). Deliberately NOT a
-- third 'drawn' one too: fetchNextMatchday() only ever surfaces a single
-- "next" matchday (soonest by date among non-final statuses), so a
-- second non-final row here would just silently shadow the open one
-- rather than being independently testable. To test the drawn/results
-- flow, advance this same open matchday through the real admin actions
-- (run the ballot, run the draw, file results) instead of pre-seeding
-- a second one.
-- -----------------------------------------------------------------------

insert into matchdays (id, played_at, venue, status, capacity)
values
  ('b0000000-0000-0000-0000-00000000d001', now() + interval '4 days' + interval '9 hours 30 minutes', 'Gbaja Boys Junior High School', 'open', 30),
  ('b0000000-0000-0000-0000-00000000d003', now() - interval '5 days' + interval '9 hours 30 minutes', 'Gbaja Boys Junior High School', 'played', 30);

-- Availability for the open matchday: all 30 regulars respond in, 3 of
-- the occasional players say out, the other 5 say nothing at all ("no
-- reply counts as unavailable" per the real rule, so they get no row).
insert into availability (matchday_id, player_id, status, responded_at)
select 'b0000000-0000-0000-0000-00000000d001', player_id, 'in', now() - (rn || ' hours')::interval
from seed_players where is_regular;

insert into availability (matchday_id, player_id, status, responded_at)
select 'b0000000-0000-0000-0000-00000000d001', player_id, 'out', now() - interval '1 day'
from seed_players where nickname in ('Precy', 'Mikey D', 'Ruthie');

-- Played matchday: identical shape (5 sides of 6), plus real fixtures,
-- goals, ratings and MOTM votes so history/rankings/profiles have real
-- numbers to show.
insert into teams (id, matchday_id, greek_name, colour)
values
  ('c0000000-0000-0000-0000-00000000f001', 'b0000000-0000-0000-0000-00000000d003', 'Alpha', '#38bdf8'),
  ('c0000000-0000-0000-0000-00000000f002', 'b0000000-0000-0000-0000-00000000d003', 'Beta', '#e0483f'),
  ('c0000000-0000-0000-0000-00000000f003', 'b0000000-0000-0000-0000-00000000d003', 'Gamma', '#a63fff'),
  ('c0000000-0000-0000-0000-00000000f004', 'b0000000-0000-0000-0000-00000000d003', 'Delta', '#4ade80'),
  ('c0000000-0000-0000-0000-00000000f005', 'b0000000-0000-0000-0000-00000000d003', 'Epsilon', '#f2a93b');

insert into team_members (team_id, player_id)
select
  (array['c0000000-0000-0000-0000-00000000f001','c0000000-0000-0000-0000-00000000f002','c0000000-0000-0000-0000-00000000f003','c0000000-0000-0000-0000-00000000f004','c0000000-0000-0000-0000-00000000f005'])[((rn - 1) / 6) + 1]::uuid,
  player_id
from seed_players where is_regular;

insert into availability (matchday_id, player_id, status, responded_at)
select 'b0000000-0000-0000-0000-00000000d003', player_id, 'in', now() - interval '8 days'
from seed_players where is_regular;

insert into matchday_ballot_entries (matchday_id, player_id, status)
select 'b0000000-0000-0000-0000-00000000d003', player_id, 'balloted'
from seed_players where is_regular;

insert into matches (id, matchday_id, team_a_id, team_b_id, score_a, score_b, played_at)
values
  ('d0000000-0000-0000-0000-000000001001', 'b0000000-0000-0000-0000-00000000d003', 'c0000000-0000-0000-0000-00000000f001', 'c0000000-0000-0000-0000-00000000f002', 3, 1, now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000001002', 'b0000000-0000-0000-0000-00000000d003', 'c0000000-0000-0000-0000-00000000f003', 'c0000000-0000-0000-0000-00000000f004', 2, 2, now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000001003', 'b0000000-0000-0000-0000-00000000d003', 'c0000000-0000-0000-0000-00000000f005', 'c0000000-0000-0000-0000-00000000f001', 1, 4, now() - interval '5 days'),
  ('d0000000-0000-0000-0000-000000001004', 'b0000000-0000-0000-0000-00000000d003', 'c0000000-0000-0000-0000-00000000f002', 'c0000000-0000-0000-0000-00000000f003', 2, 0, now() - interval '5 days');

insert into match_players (match_id, player_id, team_id)
select m.id, tm.player_id, tm.team_id
from matches m
join team_members tm on tm.team_id in (m.team_a_id, m.team_b_id)
where m.matchday_id = 'b0000000-0000-0000-0000-00000000d003';

-- Goals: a handful per fixture, scorer/assist drawn from that match's
-- own players, matching the "scorer and assist must have played" rule.
insert into goals (match_id, team_id, scorer_id, assist_id, minute)
select
  'd0000000-0000-0000-0000-000000001001'::uuid, 'c0000000-0000-0000-0000-00000000f001'::uuid,
  (select player_id from seed_players where nickname = 'Femzy'), (select player_id from seed_players where nickname = 'Segsy'), 8
union all select
  'd0000000-0000-0000-0000-000000001001', 'c0000000-0000-0000-0000-00000000f001',
  (select player_id from seed_players where nickname = 'Deza'), null, 22
union all select
  'd0000000-0000-0000-0000-000000001001', 'c0000000-0000-0000-0000-00000000f001',
  (select player_id from seed_players where nickname = 'Segsy'), (select player_id from seed_players where nickname = 'Deza'), 51
union all select
  'd0000000-0000-0000-0000-000000001001', 'c0000000-0000-0000-0000-00000000f002',
  (select player_id from seed_players where nickname = 'Uchie'), (select player_id from seed_players where nickname = 'Kayzo'), 34
union all select
  'd0000000-0000-0000-0000-000000001002', 'c0000000-0000-0000-0000-00000000f003',
  (select player_id from seed_players where nickname = 'Mara'), (select player_id from seed_players where nickname = 'Lekky'), 12
union all select
  'd0000000-0000-0000-0000-000000001002', 'c0000000-0000-0000-0000-00000000f003',
  (select player_id from seed_players where nickname = 'Chichi'), null, 40
union all select
  'd0000000-0000-0000-0000-000000001002', 'c0000000-0000-0000-0000-00000000f004',
  (select player_id from seed_players where nickname = 'Obi'), (select player_id from seed_players where nickname = 'Roti'), 19
union all select
  'd0000000-0000-0000-0000-000000001002', 'c0000000-0000-0000-0000-00000000f004',
  (select player_id from seed_players where nickname = 'Dobs'), (select player_id from seed_players where nickname = 'Ify'), 55
union all select
  'd0000000-0000-0000-0000-000000001003', 'c0000000-0000-0000-0000-00000000f001',
  (select player_id from seed_players where nickname = 'Femzy'), (select player_id from seed_players where nickname = 'Deza'), 6
union all select
  'd0000000-0000-0000-0000-000000001003', 'c0000000-0000-0000-0000-00000000f001',
  (select player_id from seed_players where nickname = 'Segsy'), null, 29
union all select
  'd0000000-0000-0000-0000-000000001003', 'c0000000-0000-0000-0000-00000000f001',
  (select player_id from seed_players where nickname = 'Deza'), (select player_id from seed_players where nickname = 'Femzy'), 44
union all select
  'd0000000-0000-0000-0000-000000001003', 'c0000000-0000-0000-0000-00000000f001',
  (select player_id from seed_players where nickname = 'Bimz'), null, 58
union all select
  'd0000000-0000-0000-0000-000000001003', 'c0000000-0000-0000-0000-00000000f005',
  (select player_id from seed_players where nickname = 'Sadey'), (select player_id from seed_players where nickname = 'Fis'), 37
union all select
  'd0000000-0000-0000-0000-000000001004', 'c0000000-0000-0000-0000-00000000f002',
  (select player_id from seed_players where nickname = 'Uchie'), (select player_id from seed_players where nickname = 'Chino'), 15
union all select
  'd0000000-0000-0000-0000-000000001004', 'c0000000-0000-0000-0000-00000000f002',
  (select player_id from seed_players where nickname = 'Kayzo'), (select player_id from seed_players where nickname = 'Uchie'), 48;

-- Ratings: everyone who played in a fixture rates the other 11 in that
-- same fixture, respecting "can't rate yourself" and "never individually
-- visible" (this is raw historical data, not a live vote, so no RLS
-- concern inserting it directly). Scores are randomised on purpose.
insert into ratings (match_id, rater_id, subject_id, score)
select mp1.match_id, mp1.player_id, mp2.player_id,
  (round((1 + random() * 9) * 2) / 2)::numeric(3,1)
from match_players mp1
join match_players mp2 on mp2.match_id = mp1.match_id and mp2.player_id <> mp1.player_id;

-- MOTM: a few votes per fixture nominating a real participant.
insert into matchday_motm_votes (matchday_id, voter_id, nominee_id)
values
  ('b0000000-0000-0000-0000-00000000d003', (select player_id from seed_players where nickname = 'Chino'), (select player_id from seed_players where nickname = 'Segsy')),
  ('b0000000-0000-0000-0000-00000000d003', (select player_id from seed_players where nickname = 'Yem'),   (select player_id from seed_players where nickname = 'Segsy')),
  ('b0000000-0000-0000-0000-00000000d003', (select player_id from seed_players where nickname = 'Dami'), (select player_id from seed_players where nickname = 'Deza')),
  ('b0000000-0000-0000-0000-00000000d003', (select player_id from seed_players where nickname = 'Tobs'), (select player_id from seed_players where nickname = 'Segsy')),
  ('b0000000-0000-0000-0000-00000000d003', (select player_id from seed_players where nickname = 'Bal'),  (select player_id from seed_players where nickname = 'Femzy'));

-- -----------------------------------------------------------------------
-- 3. Monthly awards (a couple of months, real seeded winners).
-- -----------------------------------------------------------------------

insert into monthly_awards (award_key, award_name, metric, year, month, player_id, winner_nickname, stat)
values
  ('potm', 'Player of the Month', 'rating', extract(year from now() - interval '1 month')::int, extract(month from now() - interval '1 month')::int, (select player_id from seed_players where nickname = 'Segsy'), 'Segsy', '8.4 avg rating'),
  ('golden_boot', 'Golden Boot', 'goals', extract(year from now() - interval '1 month')::int, extract(month from now() - interval '1 month')::int, (select player_id from seed_players where nickname = 'Femzy'), 'Femzy', '7 goals'),
  ('playmaker', 'Playmaker', 'assists', extract(year from now() - interval '1 month')::int, extract(month from now() - interval '1 month')::int, (select player_id from seed_players where nickname = 'Lekky'), 'Lekky', '6 assists'),
  ('potm', 'Player of the Month', 'rating', extract(year from now() - interval '2 months')::int, extract(month from now() - interval '2 months')::int, (select player_id from seed_players where nickname = 'Deza'), 'Deza', '8.7 avg rating'),
  ('golden_glove', 'Golden Glove', 'clean_sheets', extract(year from now() - interval '2 months')::int, extract(month from now() - interval '2 months')::int, (select player_id from seed_players where nickname = 'Bal'), 'Bal', '4 clean sheets');

-- -----------------------------------------------------------------------
-- 4. Tags: one approved and showing, one still pending, one self tag.
-- -----------------------------------------------------------------------

insert into tags (id, label, created_by, is_approved, approved_at)
values
  ('e0000000-0000-0000-0000-000000002001', 'Engine Room', (select player_id from seed_players where nickname = 'Chino'), true, now() - interval '10 days'),
  ('e0000000-0000-0000-0000-000000002002', 'Set-Piece Specialist', (select player_id from seed_players where nickname = 'Tobs'), false, null);

insert into tag_creation_votes (tag_id, voter_id)
values
  ('e0000000-0000-0000-0000-000000002001', (select player_id from seed_players where nickname = 'Chino')),
  ('e0000000-0000-0000-0000-000000002001', (select player_id from seed_players where nickname = 'Yem')),
  ('e0000000-0000-0000-0000-000000002001', (select player_id from seed_players where nickname = 'Kels')),
  ('e0000000-0000-0000-0000-000000002002', (select player_id from seed_players where nickname = 'Tobs')),
  ('e0000000-0000-0000-0000-000000002002', (select player_id from seed_players where nickname = 'Roti'));

insert into player_tags (player_id, tag_id, source)
values
  ((select player_id from seed_players where nickname = 'Deras'), 'e0000000-0000-0000-0000-000000002001', 'community');

insert into tags (id, label, created_by, is_approved, approved_at)
values ('e0000000-0000-0000-0000-000000002003', 'Left Foot Wizard', (select player_id from seed_players where nickname = 'Deza'), true, now() - interval '20 days');

insert into player_tags (player_id, tag_id, source)
values ((select player_id from seed_players where nickname = 'Deza'), 'e0000000-0000-0000-0000-000000002003', 'self');

-- -----------------------------------------------------------------------
-- 5. Player claims: two pending, against two of the unclaimed occasional
-- players, from two fresh accounts with no player row yet.
-- -----------------------------------------------------------------------

insert into player_claims (player_id, claimant_user_id, status)
values
  ((select player_id from seed_players where nickname = 'Precy'), 'a0000000-0000-0000-0000-00000000a004', 'pending'),
  ((select player_id from seed_players where nickname = 'Mikey D'), 'a0000000-0000-0000-0000-00000000a005', 'pending');

-- -----------------------------------------------------------------------
-- 6. Comparisons ("I am him" / "you are him"): fictional pros and clubs
-- standing in for a live API-Football response, exercising every state
-- the feature has (active, at cap, at risk, dropped + cooldown).
-- -----------------------------------------------------------------------

insert into pro_players (id, external_id, name, nationality, role, apps, goals, assists, photo_url)
values
  ('f0000000-0000-0000-0000-000000003001', 'seed-pro-1', 'Marco Dubois', 'France', 'Attacker', 87, 34, 21, null),
  ('f0000000-0000-0000-0000-000000003002', 'seed-pro-2', 'Lars Eriksen', 'Denmark', 'Midfielder', 91, 12, 29, null),
  ('f0000000-0000-0000-0000-000000003003', 'seed-pro-3', 'Diego Fontana', 'Argentina', 'Defender', 76, 4, 6, null),
  ('f0000000-0000-0000-0000-000000003004', 'seed-pro-4', 'Kwame Asante', 'Ghana', 'Midfielder', 68, 9, 15, null),
  ('f0000000-0000-0000-0000-000000003005', 'seed-pro-5', 'Viktor Nowak', 'Poland', 'Attacker', 82, 27, 10, null),
  ('f0000000-0000-0000-0000-000000003006', 'seed-pro-6', 'Rui Santana', 'Portugal', 'Defender', 94, 3, 8, null);

insert into pro_clubs (id, external_id, name, country, logo_url)
values
  ('f0000000-0000-0000-0000-000000004001', 'seed-club-1', 'Meridian FC', 'England', null),
  ('f0000000-0000-0000-0000-000000004002', 'seed-club-2', 'Dockside United', 'England', null),
  ('f0000000-0000-0000-0000-000000004003', 'seed-club-3', 'Rovers Athletic', 'Scotland', null),
  ('f0000000-0000-0000-0000-000000004004', 'seed-club-4', 'Union Sportiva', 'Italy', null);

-- Deza: 3 active self-claims, at cap (tests "Swap one out").
insert into player_comparisons (id, player_id, pro_player_id, source, created_by, created_at)
values
  ('10000000-0000-0000-0000-000000005001', (select player_id from seed_players where nickname = 'Deza'), 'f0000000-0000-0000-0000-000000003001', 'self', (select player_id from seed_players where nickname = 'Deza'), now() - interval '30 days'),
  ('10000000-0000-0000-0000-000000005002', (select player_id from seed_players where nickname = 'Deza'), 'f0000000-0000-0000-0000-000000003002', 'self', (select player_id from seed_players where nickname = 'Deza'), now() - interval '25 days'),
  ('10000000-0000-0000-0000-000000005003', (select player_id from seed_players where nickname = 'Deza'), 'f0000000-0000-0000-0000-000000003003', 'self', (select player_id from seed_players where nickname = 'Deza'), now() - interval '15 days');

-- Chino: 1 active self-claim sitting at risk (net -10, needs 10 distinct
-- voters), 1 already dropped (net -15, still in its 1-month cooldown).
insert into player_comparisons (id, player_id, pro_player_id, source, created_by, created_at, dropped_at)
values
  ('10000000-0000-0000-0000-000000005004', (select player_id from seed_players where nickname = 'Chino'), 'f0000000-0000-0000-0000-000000003004', 'self', (select player_id from seed_players where nickname = 'Chino'), now() - interval '18 days', null),
  ('10000000-0000-0000-0000-000000005005', (select player_id from seed_players where nickname = 'Chino'), 'f0000000-0000-0000-0000-000000003005', 'self', (select player_id from seed_players where nickname = 'Chino'), now() - interval '40 days', now() - interval '10 days');

insert into comparison_votes (comparison_id, voter_id, direction)
select '10000000-0000-0000-0000-000000005004', player_id, 'down'
from seed_players where is_regular and rn <= 10;

insert into comparison_votes (comparison_id, voter_id, direction)
select '10000000-0000-0000-0000-000000005005', player_id, 'down'
from seed_players where is_regular and rn <= 15;

-- Segsy: 1 active community nomination, healthy net positive.
insert into player_comparisons (id, player_id, pro_player_id, source, created_by, created_at)
values ('10000000-0000-0000-0000-000000005006', (select player_id from seed_players where nickname = 'Segsy'), 'f0000000-0000-0000-0000-000000003006', 'community', (select player_id from seed_players where nickname = 'Deza'), now() - interval '12 days');

insert into comparison_votes (comparison_id, voter_id, direction)
select '10000000-0000-0000-0000-000000005006', player_id, 'up'
from seed_players where is_regular and rn between 1 and 5;

insert into comparison_votes (comparison_id, voter_id, direction)
select '10000000-0000-0000-0000-000000005006', player_id, 'down'
from seed_players where is_regular and rn between 6 and 7;

-- -----------------------------------------------------------------------
-- 7. Articles and community posts.
-- -----------------------------------------------------------------------

insert into articles (title, kicker, body, published_at)
values
  ('Alpha survive a scare against Epsilon', 'MATCH REPORT', 'Four goals, one disallowed, and a very late winner. Segsy''s hat-trick chance went begging but nobody''s complaining about the result.', now() - interval '4 days'),
  ('The monthly ten: how it actually works', 'EXPLAINER', 'A walkthrough of the first-come-first-served monthly slots, for the three people who still ask every month.', now() - interval '20 days'),
  ('Golden Boot race tightens', 'STATS', 'Femzy still leads, but Dobs is closing fast and has games in hand.', now() - interval '9 days');

insert into posts (author_id, content, created_at)
values
  ((select player_id from seed_players where nickname = 'Deza'), 'That second goal on Sunday still doesn''t feel real.', now() - interval '4 days'),
  ((select player_id from seed_players where nickname = 'Segsy'), 'Reminder: monthly ten opens 1st of the month, 08:00 sharp.', now() - interval '6 days'),
  ((select player_id from seed_players where nickname = 'Chino'), 'Whoever took the bibs home last week, they''re still not washed.', now() - interval '2 days'),
  ((select player_id from seed_players where nickname = 'Kayzo'), 'Rating Bal a 9 for that one save alone.', now() - interval '5 days');

-- -----------------------------------------------------------------------
-- 8. Salami Cup: one completed quarter with a real winner (so Honours
-- isn't empty), one open quarter taking entries right now.
-- -----------------------------------------------------------------------

insert into cup_quarters (id, label, venue, scheduled_at, entries_close_at, withdrawal_deadline, status)
values
  ('20000000-0000-0000-0000-000000006001', 'Q2 2026', 'Gbaja Boys Junior High School', now() - interval '70 days', now() - interval '73 days', now() - interval '71 days', 'played'),
  ('20000000-0000-0000-0000-000000006002', 'Q4 2026', 'Gbaja Boys Junior High School', now() + interval '18 days', now() + interval '15 days', now() + interval '17 days', 'open');

insert into cup_squads (id, cup_quarter_id, name, colour)
values
  ('20000000-0000-0000-0000-000000007001', '20000000-0000-0000-0000-000000006001', 'The Wanderers', '#f2a93b'),
  ('20000000-0000-0000-0000-000000007002', '20000000-0000-0000-0000-000000006001', 'The Grafters', '#38bdf8');

insert into cup_squad_players (cup_squad_id, player_id)
select
  case when rn <= 6 then '20000000-0000-0000-0000-000000007001' else '20000000-0000-0000-0000-000000007002' end::uuid,
  player_id
from seed_players where is_regular and rn <= 12;

insert into cup_matches (cup_quarter_id, squad_a_id, squad_b_id, score_a, score_b, played_at)
values ('20000000-0000-0000-0000-000000006001', '20000000-0000-0000-0000-000000007001', '20000000-0000-0000-0000-000000007002', 4, 3, now() - interval '70 days');

insert into cup_entrants (cup_quarter_id, player_id)
select '20000000-0000-0000-0000-000000006002', player_id
from seed_players where is_regular and rn between 1 and 12;

commit;

-- =============================================================================
-- End of draft. To apply once approved:
--   psql "$DATABASE_URL" -f supabase/seed_test_data.sql
-- To undo, since every id in this file uses a fixed, distinctive prefix
-- (auth.users a0000000-..., matchdays b0000000-..., teams c0000000-...,
-- matches/goals d0000000-..., tags/comparisons e0000000.../10000000...,
-- pro data f0000000-..., cup 20000000-...), every row this file inserts
-- can be deleted again by its id prefix without touching anything else.
-- =============================================================================
