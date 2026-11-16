-- Real roster import, replacing the wiped placeholder demo data. Not a
-- migration (this is data, not schema): apply once via psql after a
-- fresh `supabase db reset`. Goals, assists, clean sheets, cards and positions
-- are the group's 2025/26 season from the Astro Turf League site (see
-- data/league-2025-26.json, scraped 2026-11-12). legacy_appearances stays 0
-- until a record with appearance counts is available.
--
-- Resolved 2026-09-29: #19 and #45 were both "Ohis" with no
-- distinguishing detail. Raphael confirmed they're the same person, merged
-- into one row below with both rows' numbers summed. The site's separate
-- "Oreos" row only holds Salami Cup numbers, so oreos uses the Oriola row.
--
-- FJ, Mayor, Delani and Yusuf are on the site but weren't in the original
-- roster; added 2026-11-15. The site's "Ikhaz" is the roster's Ikah, so their
-- numbers are summed into one row. Gbemi plays but isn't on the site yet.
insert into players (nickname, full_name, positions, legacy_goals, legacy_assists, legacy_appearances, legacy_clean_sheets, legacy_yellow_cards, legacy_red_cards, bio) values
  ('Skinny N', 'Kunle', '{ATT}', 88, 29, 0, 3, 0, 0, null),
  ('Wale', 'Wale', '{ATT}', 38, 55, 0, 0, 3, 0, null),
  ('zeazou', 'Debo', '{ATT}', 73, 17, 0, 0, 1, 0, null),
  ('Fred', 'Fred', '{ATT}', 47, 28, 0, 0, 3, 0, null),
  ('Chukkie', 'Chuka Okonkwo', '{DEF}', 36, 38, 0, 70, 0, 1, null),
  ('Tomi', 'Tomi Akigbogun', '{ATT}', 60, 15, 0, 0, 2, 0, null),
  ('Dan J', 'Dan J', '{DEF}', 43, 18, 0, 46, 2, 0, null),
  ('AK', 'AK', '{ATT}', 43, 22, 0, 3, 4, 0, null),
  ('Gbaja', 'Gbaja', '{ATT}', 29, 34, 0, 0, 2, 0, null),
  ('Ebuka', 'Ebuka', '{ATT}', 27, 27, 0, 0, 2, 0, null),
  ('Uzkhov', 'Uzo', '{ATT}', 39, 18, 0, 2, 3, 0, null),
  ('Jerrie', 'Jerrie Rotimi', '{GK,DEF,UTIL}', 21, 28, 0, 36, 1, 0, null),
  ('E', 'Emma', '{ATT}', 24, 19, 0, 0, 2, 0, null),
  ('DB', 'Dozie', '{ATT}', 28, 29, 0, 0, 1, 0, null),
  ('Bald Hermit', 'Busayo', '{DEF}', 23, 24, 0, 41, 0, 0, null),
  ('oreos', 'Tosin Oriola', '{DEF}', 19, 27, 0, 44, 0, 0, null),
  ('Triumph', 'Triumph', '{DEF}', 13, 30, 0, 53, 5, 1, null),
  ('Black and fly', 'Moses', '{DEF}', 12, 26, 0, 15, 0, 0, null),
  ('Ohis', 'Ohis', '{ATT}', 31, 18, 0, 0, 0, 1, null),
  ('Allison', 'Allison', '{}', 21, 9, 0, 9, 3, 0, null),
  ('Yaya', 'Yaya', '{DEF}', 15, 22, 0, 10, 2, 0, null),
  ('Emmanuel', 'Emmanuel', '{DEF}', 17, 20, 0, 40, 5, 1, null),
  ('Faddy', 'Faddy Fadipe', '{DEF}', 11, 17, 0, 43, 0, 0, null),
  ('Ekitike', 'Olumide', '{ATT}', 21, 13, 0, 0, 2, 0, null),
  ('Tony Vodka', 'Tony', '{DEF}', 13, 8, 0, 47, 1, 0, null),
  ('Killz', 'Killz Oluaye', '{DEF}', 8, 11, 0, 54, 6, 2, null),
  ('Ajegs', 'Samuel', '{GK,DEF,UTIL}', 8, 12, 0, 34, 2, 0, null),
  ('Joe', 'Joe', '{ATT}', 12, 7, 0, 0, 1, 0, null),
  ('Ajibola', 'Ajibola Grey', '{ATT}', 7, 8, 0, 0, 2, 0, null),
  ('Vinny', 'Vince', '{DEF}', 8, 4, 0, 28, 0, 0, null),
  ('Iyi', 'Iyi', '{DEF,ATT}', 6, 4, 0, 0, 1, 1, null),
  ('Machado', 'Alayo', '{DEF}', 7, 5, 0, 46, 7, 3, null),
  ('Olamide', 'Olamide', '{ATT}', 6, 5, 0, 5, 5, 0, null),
  ('Oliver', 'Tosin Oliver', '{DEF}', 9, 11, 0, 37, 0, 1, null),
  ('Ikah', 'Ikah', '{ATT,DEF}', 7, 9, 0, 22, 0, 0, null),
  ('Dante', 'Dante', '{DEF}', 6, 13, 0, 33, 2, 2, null),
  ('Oreva', 'Oreva', '{ATT}', 10, 7, 0, 0, 1, 0, null),
  ('George', 'George', '{DEF}', 1, 8, 0, 8, 1, 0, null),
  ('Iyiola', 'Iyiola', '{DEF}', 10, 1, 0, 30, 0, 0, null),
  ('Famade', 'Famade', '{DEF}', 5, 3, 0, 20, 0, 0, null),
  ('Gbolahan', 'Gbolahan', '{ATT}', 8, 4, 0, 0, 2, 0, null),
  ('Ette', 'Ette', '{ATT}', 4, 4, 0, 0, 0, 0, null),
  ('Gabriel', 'Gabriel', '{ATT}', 2, 4, 0, 0, 0, 0, null),
  ('Seyi', 'Seyi', '{ATT}', 5, 0, 0, 0, 0, 0, null),
  ('Leonard', 'Leonard', '{DEF}', 5, 2, 0, 3, 0, 0, null),
  ('Folarin', 'Folarin', '{DEF}', 3, 3, 0, 12, 0, 0, null),
  ('Bass', 'Bass', '{GK,DEF,UTIL}', 1, 4, 0, 34, 0, 1, null),
  ('Bike', 'Doyin Ajibike', '{DEF}', 1, 3, 0, 6, 0, 0, null),
  ('Ukeme', 'Ukeme', '{DEF}', 3, 0, 0, 2, 0, 0, null),
  ('Anayo', 'Anayo', '{DEF}', 0, 3, 0, 0, 0, 0, null),
  ('Dozie', 'Dozie', '{ATT}', 2, 0, 0, 0, 0, 0, null),
  ('Nteoniro', 'Nteoniro', '{ATT}', 1, 1, 0, 0, 1, 0, null),
  ('Mustee', 'Mustee', '{ATT}', 1, 5, 0, 18, 1, 0, null),
  ('Tien', 'Tien', '{DEF}', 0, 2, 0, 4, 0, 0, null),
  ('Willis', 'Willis', '{ATT}', 0, 2, 0, 2, 1, 0, null),
  ('Laru', 'Laru', '{DEF}', 0, 2, 0, 4, 0, 0, null),
  ('Dami', 'Dami', '{DEF}', 0, 2, 0, 3, 0, 0, null),
  ('Harper', 'Harper', '{ATT}', 0, 2, 0, 0, 0, 0, null),
  ('Fredrick', 'Fredrick', '{ATT}', 1, 0, 0, 1, 0, 0, null),
  ('Mase', 'Obi', '{ATT}', 1, 0, 0, 0, 0, 0, null),
  ('Tobi', 'Tobi', '{ATT}', 4, 1, 0, 0, 0, 0, null),
  ('Dønatellø', 'Raphael Uwadone', '{ATT}', 1, 0, 0, 0, 0, 0, null),
  ('Mateta', 'Mateta', '{ATT}', 1, 0, 0, 0, 0, 0, null),
  ('Chisom', 'Chisom', '{DEF}', 1, 1, 0, 6, 1, 0, null),
  ('Falo', 'Falo', '{ATT}', 0, 0, 0, 0, 0, 0, null),
  ('Julius', 'Julius', '{ATT}', 4, 2, 0, 0, 2, 0, null),
  ('Topla', 'Topla', '{ATT}', 0, 0, 0, 0, 0, 0, null),
  ('CJ', 'CJ', '{ATT}', 0, 0, 0, 0, 0, 0, null),
  ('Damola', 'Damola', '{ATT}', 0, 0, 0, 0, 0, 0, null),
  ('FJ', 'FJ', '{ATT}', 2, 0, 0, 0, 0, 0, null),
  ('Mayor', 'Mayor', '{ATT}', 0, 0, 0, 0, 0, 0, null),
  ('Delani', 'Delani', '{ATT}', 0, 0, 0, 0, 0, 0, null),
  ('Yusuf', 'Yusuf', '{ATT}', 0, 0, 0, 0, 0, 0, null),
  ('Gbemi', 'Gbemi', '{}', 0, 0, 0, 0, 0, 0, null);

-- The Ohis merge above means the three real monthly_awards rows for
-- "Ohis" (20260919030000_real_almanac_data.sql deliberately left them
-- with player_id null, since the source data resolved to two rows and
-- couldn't say which) can finally link for real. Guarded by
-- "player_id is null" so re-running this is harmless either way.
update monthly_awards
set player_id = (select id from players where nickname = 'Ohis')
where winner_nickname = 'Ohis' and player_id is null;
