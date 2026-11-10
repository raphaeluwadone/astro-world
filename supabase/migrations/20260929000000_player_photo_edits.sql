-- Keep the uncropped upload and the crop settings so a card photo can be re-edited without stacking blur.
alter table public.players
  add column if not exists photo_original_url text,
  add column if not exists photo_edit jsonb;
