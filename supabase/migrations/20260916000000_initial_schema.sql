-- Astro initial schema
--
-- Scope: tables, enums, constraints, and indexes only. This is the data
-- model designed in the planning conversation with Claude Code — see
-- project memory for the product rules each table encodes.
--
-- RLS is enabled (fail-closed) on every table below as a safety default,
-- but NO policies are written here. Policy design — especially for
-- `ratings` and `matchday_motm_votes`, where the anonymity guarantee
-- lives entirely in the RLS layer — is a dedicated follow-up migration.
-- Until that migration exists, every table is fully locked to the API.
--
-- Deliberately NOT modelled yet (see project memory): the winner-stays-on
-- match queue/sequencing algorithm and cards (yellow/red). `matches` below
-- is a minimal shell that exists only so ratings/MOTM/tags/comparisons
-- have something real to reference.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type position_type as enum ('GK', 'DEF', 'ATT', 'UTIL');
create type foot_type as enum ('left', 'right', 'both');
create type availability_status as enum ('in', 'out');
-- open: availability being collected · balloted: stage-1 "who plays" decided
-- (30 balloted + standby) · drawn: stage-2 team draw done · complete: played.
create type matchday_status as enum ('open', 'balloted', 'drawn', 'complete');
create type ballot_entry_status as enum ('balloted', 'standby');
create type tag_source as enum ('self', 'community');
create type comparison_source as enum ('self', 'community');
create type vote_direction as enum ('up', 'down');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------

create table players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  nickname text not null,
  full_name text not null,
  positions position_type[] not null default '{}',
  preferred_foot foot_type,
  height_cm numeric(5, 1),
  weight_kg numeric(5, 1),
  favourite_number integer,
  favourite_club text,
  bio text,
  photo_url text,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column players.is_admin is
  'Locked field: only changeable by an existing admin (enforced by a trigger, not just RLS — see the matchday RLS migration). Single flat flag for now; role tiers (Matchday admin / Treasurer etc.) are an explicitly deferred admin-hardening item.';

comment on column players.user_id is
  'Null means a guest player with no login. Guests can be a match/rating subject but cannot cast votes (no auth account to do it with).';

comment on column players.favourite_number is
  'A favourite number, not a jersey number: player-editable, deliberately NOT unique — several players may share one (corrected 2026-09-16).';

-- Partial unique index: many guests can have a null user_id, but a real
-- account can only ever back one player row.
create unique index players_user_id_key on players (user_id) where user_id is not null;
create index players_positions_idx on players using gin (positions);

create trigger players_set_updated_at
  before update on players
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Matchdays, availability, teams, the draw
-- ---------------------------------------------------------------------------

create table matchdays (
  id uuid primary key default gen_random_uuid(),
  played_at timestamptz not null,
  venue text,
  status matchday_status not null default 'open',
  created_at timestamptz not null default now()
);

-- No stored `motm_player_id`: like achievements, the matchday's MOTM is
-- computed from `matchday_motm_votes` (most nominations wins) rather than
-- stored and risking drifting out of sync with the votes.

create index matchdays_played_at_idx on matchdays (played_at desc);

create table availability (
  matchday_id uuid not null references matchdays (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  status availability_status not null,
  responded_at timestamptz not null default now(),
  primary key (matchday_id, player_id)
);

-- No "no_reply" status: a player who hasn't responded simply has no row
-- here. "Ghosting" is (all active players) minus (players with a row).

create index availability_player_id_idx on availability (player_id);

-- ---------------------------------------------------------------------------
-- Ballot stage 1: "who plays". Group size (~104) exceeds matchday capacity
-- (30), so most weeks more players say 'in' than there's room for — this
-- table is the output of resolving that: which 'in' respondents got a
-- spot, and the standby order for everyone else.
--
-- A row here should only ever exist for a player whose `availability`
-- for this matchday is 'in' — not enforceable as a simple FK/CHECK
-- across tables, so enforce it at the application layer (same approach
-- as the ratings/match_players relationship).
--
-- standby_position is deliberately just an integer with nowhere to land
-- a fairness ALGORITHM yet: the "longest wait gets priority, two misses
-- guarantees a place" rule is explicitly unconfirmed invented content
-- from the design handoff, not a real product decision. Don't build
-- that algorithm against this column until it's actually decided —
-- this table only commits to "there is an order", not what produces it.
-- ---------------------------------------------------------------------------

create table matchday_ballot_entries (
  matchday_id uuid not null references matchdays (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  status ballot_entry_status not null,
  standby_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (matchday_id, player_id),
  check (
    (status = 'standby' and standby_position is not null)
    or (status = 'balloted' and standby_position is null)
  )
);

create index matchday_ballot_entries_player_id_idx on matchday_ballot_entries (player_id);
create index matchday_ballot_entries_standby_order_idx
  on matchday_ballot_entries (matchday_id, standby_position)
  where status = 'standby';

create trigger matchday_ballot_entries_set_updated_at
  before update on matchday_ballot_entries
  for each row execute function set_updated_at();

create table teams (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references matchdays (id) on delete cascade,
  greek_name text not null,
  colour text not null
);

create index teams_matchday_id_idx on teams (matchday_id);

create table team_members (
  team_id uuid not null references teams (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  primary key (team_id, player_id)
);

create index team_members_player_id_idx on team_members (player_id);

-- ---------------------------------------------------------------------------
-- Matches (minimal shell — see the file header)
-- ---------------------------------------------------------------------------

create table matches (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references matchdays (id) on delete cascade,
  team_a_id uuid not null references teams (id),
  team_b_id uuid not null references teams (id),
  score_a integer not null default 0,
  score_b integer not null default 0,
  played_at timestamptz not null default now(),
  check (team_a_id <> team_b_id)
);

create index matches_matchday_id_idx on matches (matchday_id);

create table match_players (
  match_id uuid not null references matches (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  team_id uuid not null references teams (id),
  primary key (match_id, player_id)
);

create index match_players_player_id_idx on match_players (player_id);

-- ---------------------------------------------------------------------------
-- Goals: simple and independent of the deferred queue/cards work (a
-- goal doesn't care how the queue advances), so built now rather than
-- blocked on that. Feeds the Match page's goal timeline.
-- ---------------------------------------------------------------------------

create table goals (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id) on delete cascade,
  team_id uuid not null references teams (id),
  scorer_id uuid not null references players (id),
  assist_id uuid references players (id),
  minute integer not null check (minute >= 0),
  created_at timestamptz not null default now(),
  check (scorer_id is distinct from assist_id)
);

create index goals_match_id_idx on goals (match_id);

-- ---------------------------------------------------------------------------
-- Ratings — the anonymity-critical table. Shape only; RLS policies are
-- the dedicated follow-up migration. The rater does not need to have
-- played in this match (any player with a profile may rate); the
-- subject must have (enforced by the match_players FK relationship at
-- the application layer for now — see note below).
-- ---------------------------------------------------------------------------

create table ratings (
  match_id uuid not null references matches (id) on delete cascade,
  rater_id uuid not null references players (id) on delete cascade,
  subject_id uuid not null references players (id) on delete cascade,
  -- half-point steps allowed: 1, 1.5, 2, ..., 10
  score numeric(3, 1) not null check (score between 1 and 10 and (score * 2) % 1 = 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (match_id, rater_id, subject_id),
  check (rater_id <> subject_id)
);

-- Note: nothing here stops rating a subject who wasn't actually in this
-- match (that would need a check against match_players, which Postgres
-- can't express as a simple FK/CHECK across tables). Enforce it either
-- with a trigger or at the application layer when we design the RLS
-- policies for this table.

create index ratings_subject_id_idx on ratings (subject_id);

create trigger ratings_set_updated_at
  before update on ratings
  for each row execute function set_updated_at();

create table matchday_motm_votes (
  matchday_id uuid not null references matchdays (id) on delete cascade,
  voter_id uuid not null references players (id) on delete cascade,
  nominee_id uuid not null references players (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (matchday_id, voter_id),
  check (voter_id <> nominee_id)
);

create index matchday_motm_votes_nominee_id_idx on matchday_motm_votes (nominee_id);

create trigger matchday_motm_votes_set_updated_at
  before update on matchday_motm_votes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Playstyle tags — two-tier: a shared pool, then per-player application.
-- The "N votes and it's real" threshold is application logic, not a
-- schema constraint (the actual number is still unconfirmed).
-- ---------------------------------------------------------------------------

create table tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  created_by uuid not null references players (id),
  is_approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table tag_creation_votes (
  tag_id uuid not null references tags (id) on delete cascade,
  voter_id uuid not null references players (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tag_id, voter_id)
);

create table player_tags (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  source tag_source not null,
  created_at timestamptz not null default now(),
  unique (player_id, tag_id)
);

create index player_tags_player_id_idx on player_tags (player_id);

create table player_tag_votes (
  player_id uuid not null references players (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  voter_id uuid not null references players (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (player_id, tag_id, voter_id)
);

-- ---------------------------------------------------------------------------
-- Pro-player comparisons ("I Am Him" / "You Are Him")
-- ---------------------------------------------------------------------------

create table pro_players (
  id uuid primary key default gen_random_uuid(),
  external_id text unique, -- API-Football's id, once that integration exists
  name text not null,
  nationality text,
  role text,
  apps integer,
  goals integer,
  assists integer,
  photo_url text,
  cached_at timestamptz not null default now()
);

create table player_comparisons (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  pro_player_id uuid not null references pro_players (id),
  source comparison_source not null,
  created_by uuid not null references players (id),
  created_at timestamptz not null default now(),
  unique (player_id, pro_player_id)
);

create index player_comparisons_player_id_idx on player_comparisons (player_id);

create table comparison_votes (
  comparison_id uuid not null references player_comparisons (id) on delete cascade,
  voter_id uuid not null references players (id) on delete cascade,
  direction vote_direction not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (comparison_id, voter_id)
);

create trigger comparison_votes_set_updated_at
  before update on comparison_votes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Community: posts, likes, mentions
-- ---------------------------------------------------------------------------

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references players (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index posts_created_at_idx on posts (created_at desc);

create table post_likes (
  post_id uuid not null references posts (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, player_id)
);

create table post_mentions (
  post_id uuid not null references posts (id) on delete cascade,
  mentioned_player_id uuid not null references players (id) on delete cascade,
  primary key (post_id, mentioned_player_id)
);

create index post_mentions_player_id_idx on post_mentions (mentioned_player_id);

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------

create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kicker text,
  cover_image_url text,
  body text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index articles_published_at_idx on articles (published_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security — enabled everywhere, no policies yet (see header).
-- ---------------------------------------------------------------------------

alter table players enable row level security;
alter table availability enable row level security;
alter table matchday_ballot_entries enable row level security;
alter table matchdays enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table matches enable row level security;
alter table match_players enable row level security;
alter table goals enable row level security;
alter table ratings enable row level security;
alter table matchday_motm_votes enable row level security;
alter table tags enable row level security;
alter table tag_creation_votes enable row level security;
alter table player_tags enable row level security;
alter table player_tag_votes enable row level security;
alter table pro_players enable row level security;
alter table player_comparisons enable row level security;
alter table comparison_votes enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_mentions enable row level security;
alter table articles enable row level security;
