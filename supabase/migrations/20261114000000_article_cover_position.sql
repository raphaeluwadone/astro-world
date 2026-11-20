-- Where the cover image is anchored inside its crop, as a CSS object-position like "50% 30%".

alter table articles
  add column cover_position text
    check (cover_position ~ '^(100|[1-9]?[0-9])% (100|[1-9]?[0-9])%$');
