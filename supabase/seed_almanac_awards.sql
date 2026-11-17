-- Finishes the monthly awards from the almanac (data/league-2025-26.json): links the rows imported
-- before the roster existed, names and confirms Defender of the Month, and adds July to October.
-- Data, not schema. Apply once, e.g. `supabase db query --remote -f supabase/seed_almanac_awards.sql`.
-- Safe to run again.

-- 1. Link awards to players by nickname (the first import ran before the roster was loaded).
update monthly_awards ma
set player_id = p.id
from players p
where ma.player_id is null and lower(p.nickname) = lower(ma.winner_nickname);

-- 2. The points-based award is Defender of the Month; the almanac names it and the Golden Glove.
update monthly_awards
set award_key = 'dotm', award_name = 'Defender of the Month', confirmed = true
where award_key = 'unknown5';
update monthly_awards set confirmed = true where award_key = 'goldenGlove';

-- 3. July to October, the months the first import stopped short of.
insert into monthly_awards (award_key, award_name, metric, year, month, player_id, winner_nickname, stat, confirmed)
select a.award_key, a.award_name, a.metric, a.year, a.month, p.id, a.winner_nickname, a.stat, true
from (values
  ('potm', 'Player of the Month', 'G+A', 2026, 7, 'Ekitike', '12 G+A'),
  ('potm', 'Player of the Month', 'G+A', 2026, 8, 'Fred', '19 G+A'),
  ('potm', 'Player of the Month', 'G+A', 2026, 9, 'Uzkhov', '12 G+A'),
  ('potm', 'Player of the Month', 'G+A', 2026, 10, 'zeazou', '15 G+A'),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 7, 'Ekitike', '9 goals'),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 8, 'zeazou', '15 goals'),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 9, 'Uzkhov', '10 goals'),
  ('goldenBoot', 'Golden Boot', 'goals', 2026, 10, 'zeazou', '12 goals'),
  ('playmaker', 'Playmaker', 'assists', 2026, 7, 'Bald Hermit', '6 assists'),
  ('playmaker', 'Playmaker', 'assists', 2026, 8, 'Chukkie', '10 assists'),
  ('playmaker', 'Playmaker', 'assists', 2026, 9, 'Wale', '6 assists'),
  ('playmaker', 'Playmaker', 'assists', 2026, 10, 'oreos', '5 assists'),
  ('playmaker', 'Playmaker', 'assists', 2026, 10, 'Ekitike', '5 assists'),
  ('playmaker', 'Playmaker', 'assists', 2026, 10, 'Emmanuel', '5 assists'),
  ('playmaker', 'Playmaker', 'assists', 2026, 10, 'Triumph', '5 assists'),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 7, 'Machado', '7 CS'),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 8, 'Jerrie', '11 CS'),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 9, 'Dan J', '10 CS'),
  ('goldenGlove', 'Golden Glove', 'clean sheets', 2026, 10, 'Jerrie', '5 CS'),
  ('dotm', 'Defender of the Month', 'pts', 2026, 7, 'Machado', '61 pts'),
  ('dotm', 'Defender of the Month', 'pts', 2026, 8, 'Chukkie', '134 pts'),
  ('dotm', 'Defender of the Month', 'pts', 2026, 9, 'Dan J', '73 pts'),
  ('dotm', 'Defender of the Month', 'pts', 2026, 10, 'Oliver', '74 pts')
) as a(award_key, award_name, metric, year, month, winner_nickname, stat)
left join players p on lower(p.nickname) = lower(a.winner_nickname)
where not exists (
  select 1 from monthly_awards x
  where x.award_key = a.award_key and x.year = a.year and x.month = a.month and lower(x.winner_nickname) = lower(a.winner_nickname)
);
