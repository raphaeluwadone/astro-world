-- Favourite club becomes a real searchable pick with a real crest,
-- backed by the same API-Football integration as pro_players, cached
-- the same way, no season-gating on team search (unlike player stats,
-- confirmed live).
create table pro_clubs (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  country text,
  logo_url text,
  cached_at timestamptz not null default now()
);

alter table pro_clubs enable row level security;
create policy pro_clubs_select_all on pro_clubs for select to authenticated using (true);

-- The crest that goes with players.favourite_club. Kept as a plain URL
-- rather than a foreign key to pro_clubs: favourite_club itself has
-- always been free text, not a reference, and a club a player types
-- before this existed should still render, just without a badge.
alter table players add column favourite_club_logo_url text;
