-- A played cup can carry a recap: the final table, MVP and top scorers as recorded, for cups
-- from before the app (where there are no individual match results to work them out from).
-- Shape: {champion, champion_note, format, totals, table[], mvp{}, scorers[], assisters[]}.
alter table public.cup_quarters add column recap jsonb;
