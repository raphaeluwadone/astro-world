-- Real data from the group's own historical almanac (scraped 18 Sep 2026,
-- see the design handoff's data/README.md), not invented. Same "legacy
-- baseline added to real in-app totals" pattern as legacy_goals/legacy_assists:
-- cards and clean sheets aren't tracked per-match in this app yet (that's
-- real, unbuilt work of its own), so these are a historical starting point,
-- not a substitute for building match-level tracking later.
alter table players add column legacy_yellow_cards integer not null default 0;
alter table players add column legacy_red_cards integer not null default 0;
alter table players add column legacy_clean_sheets integer not null default 0;

comment on column players.legacy_yellow_cards is
  'Yellow cards from before this app tracked matches. Only one player (Kunle) had a real recorded value (0) in the scrape; everyone else defaults to 0 pending fuller data, same as legacy_appearances.';
comment on column players.legacy_red_cards is 'Same provenance as legacy_yellow_cards.';
comment on column players.legacy_clean_sheets is
  'Clean sheets attach to everyone who played in a match that finished 0-x, not just keepers, per the almanac scrape.';

-- Real monthly award winners (Player of the Month, Golden Boot, Playmaker,
-- Golden Glove, plus one unlabelled points-based award), 6 months, ties
-- allowed. winner_nickname is kept alongside player_id because "Ohis"
-- resolves to two different roster rows and the source data can't say
-- which: those three rows are inserted with player_id left null rather
-- than guessed, and can be backfilled once that's resolved.
create table monthly_awards (
  id uuid primary key default gen_random_uuid(),
  award_key text not null,
  award_name text not null,
  metric text not null,
  year integer not null,
  month smallint not null check (month between 1 and 12),
  player_id uuid references players (id) on delete set null,
  winner_nickname text not null,
  stat text not null,
  confirmed boolean not null default true,
  created_at timestamptz not null default now()
);

create index monthly_awards_player_id_idx on monthly_awards (player_id);

comment on table monthly_awards is
  'Real award history scraped from the group''s almanac (data/awards-monthly.json), not invented. confirmed=false means the award name/metric was inferred, not read directly (the source''s label column came through empty for two of the five awards).';

alter table monthly_awards enable row level security;
create policy monthly_awards_select_all on monthly_awards for select to authenticated using (true);

update players set legacy_yellow_cards = 0, legacy_red_cards = 0, legacy_clean_sheets = 3 where nickname = 'Skinny N';

insert into monthly_awards (award_key, award_name, metric, year, month, player_id, winner_nickname, stat, confirmed)
select a.award_key, a.award_name, a.metric, a.year, a.month, p.id, a.winner_nickname, a.stat, a.confirmed
from (values
  ('potm', 'Player of the Month', 'G+A', 2026, 1, 'AK', '13 G+A', true),
  ('potm', 'Player of the Month', 'G+A', 2026, 1, 'Skinny N', '13 G+A', true),
  ('potm', 'Player of the Month', 'G+A', 2026, 2, 'DB', '12 G+A', true),
  ('potm', 'Player of the Month', 'G+A', 2026, 3, 'Ohis', '20 G+A', true),
  ('potm', 'Player of the Month', 'G+A', 2026, 4, 'Skinny N', '21 G+A', true),
  ('potm', 'Player of the Month', 'G+A', 2026, 5, 'Wale', '15 G+A', true),
  ('potm', 'Player of the Month', 'G+A', 2026, 6, 'Skinny N', '16 G+A', true),

  ('goldenBoot', 'Golden Boot', 'goals', 2026, 1, 'Skinny N', '9 goals', true),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 2, 'DB', '8 goals', true),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 3, 'Tomi', '9 goals', true),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 3, 'Ohis', '9 goals', true),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 4, 'Skinny N', '15 goals', true),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 5, 'zeazou', '12 goals', true),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 6, 'Skinny N', '12 goals', true),

  ('playmaker', 'Playmaker', 'assists', 2026, 1, 'Yaya', '10 assists', true),
  ('playmaker', 'Playmaker', 'assists', 2026, 2, 'Skinny N', '6 assists', true),
  ('playmaker', 'Playmaker', 'assists', 2026, 3, 'Ohis', '11 assists', true),
  ('playmaker', 'Playmaker', 'assists', 2026, 4, 'Ebuka', '11 assists', true),
  ('playmaker', 'Playmaker', 'assists', 2026, 5, 'Wale', '11 assists', true),
  ('playmaker', 'Playmaker', 'assists', 2026, 6, 'Gbaja', '7 assists', true),

  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 1, 'Bass', '9 CS', false),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 2, 'Ajegs', '7 CS', false),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 3, 'Bald Hermit', '4 CS', false),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 3, 'Bass', '4 CS', false),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 4, 'Bass', '8 CS', false),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 5, 'Jerrie', '7 CS', false),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 6, 'Jerrie', '8 CS', false),

  ('unknown5', 'Unknown (points-based)', 'pts', 2026, 4, 'Triumph', '78 pts', false),
  ('unknown5', 'Unknown (points-based)', 'pts', 2026, 5, 'Dan J', '128 pts', false),
  ('unknown5', 'Unknown (points-based)', 'pts', 2026, 6, 'Triumph', '85 pts', false)
) as a(award_key, award_name, metric, year, month, winner_nickname, stat, confirmed)
-- "Ohis" resolves to two players (see roster comment above): excluded
-- from the join entirely so it can't fan out into two award rows or
-- silently pick one of them, player_id stays null for those three.
left join players p on p.nickname = a.winner_nickname and a.winner_nickname <> 'Ohis';
