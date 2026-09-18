-- A claimant can't write instagram/birthday directly onto the record
-- they're claiming yet (players_update_own_or_admin requires owning the
-- row, and user_id is still null until approval) — so those details ride
-- along on the claim itself, and the approval step copies them across.
alter table player_claims add column instagram_handle text;
alter table player_claims add column birthday_month smallint check (birthday_month between 1 and 12);
alter table player_claims add column birthday_day smallint check (birthday_day between 1 and 31);
