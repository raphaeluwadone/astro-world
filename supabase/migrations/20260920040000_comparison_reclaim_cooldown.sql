-- Real answer to design open question 13: yes, you can reclaim someone
-- who got voted off, but only a month after the drop, not the same
-- afternoon. The old plain unique constraint blocked re-picking a
-- dropped name forever (the soft-deleted row still occupied the slot),
-- which was a real bug, not a design choice: replaced with a partial
-- unique index that only guards *active* rows, so history can pile up
-- across repeated drops and reclaims.
alter table player_comparisons drop constraint player_comparisons_player_id_pro_player_id_key;

create unique index player_comparisons_active_unique
  on player_comparisons (player_id, pro_player_id)
  where dropped_at is null;

drop policy player_comparisons_insert_self on player_comparisons;
create policy player_comparisons_insert_self on player_comparisons for insert
  to authenticated
  with check (
    source = 'self'
    and player_id = (select id from players where user_id = auth.uid())
    and created_by = (select id from players where user_id = auth.uid())
    and (
      select count(*) from player_comparisons pc
      where pc.player_id = player_comparisons.player_id and pc.source = 'self' and pc.dropped_at is null
    ) < 3
    and not exists (
      select 1 from player_comparisons pc
      where pc.player_id = player_comparisons.player_id
        and pc.pro_player_id = player_comparisons.pro_player_id
        and pc.dropped_at > now() - interval '1 month'
    )
  );

drop policy player_comparisons_insert_community on player_comparisons;
create policy player_comparisons_insert_community on player_comparisons for insert
  to authenticated
  with check (
    source = 'community'
    and created_by = (select id from players where user_id = auth.uid())
    and not exists (
      select 1 from player_comparisons pc
      where pc.player_id = player_comparisons.player_id
        and pc.pro_player_id = player_comparisons.pro_player_id
        and pc.dropped_at > now() - interval '1 month'
    )
  );
