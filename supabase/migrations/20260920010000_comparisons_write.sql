-- The real write path for pro-player comparisons. 20260917000000's own
-- comment called this "visual only... out of scope until that module
-- gets built" -- it's getting built now. Self-claims cap at three ("Own
-- three" in the UI); community nominations are uncapped, the existing
-- unique (player_id, pro_player_id) constraint already stops the same
-- pro being nominated twice for the same person.

create policy player_comparisons_insert_self on player_comparisons for insert
  to authenticated
  with check (
    source = 'self'
    and player_id = (select id from players where user_id = auth.uid())
    and created_by = (select id from players where user_id = auth.uid())
    and (
      select count(*) from player_comparisons pc
      where pc.player_id = player_comparisons.player_id and pc.source = 'self'
    ) < 3
  );

create policy player_comparisons_insert_community on player_comparisons for insert
  to authenticated
  with check (
    source = 'community'
    and created_by = (select id from players where user_id = auth.uid())
  );

create policy player_comparisons_delete_own_self on player_comparisons for delete
  to authenticated
  using (
    source = 'self'
    and player_id = (select id from players where user_id = auth.uid())
  );

-- Votes can be cast, switched, or withdrawn; all three stay scoped to
-- the voter's own row via the (comparison_id, voter_id) primary key.
create policy comparison_votes_insert_own on comparison_votes for insert
  to authenticated
  with check (voter_id = (select id from players where user_id = auth.uid()));

create policy comparison_votes_update_own on comparison_votes for update
  to authenticated
  using (voter_id = (select id from players where user_id = auth.uid()))
  with check (voter_id = (select id from players where user_id = auth.uid()));

create policy comparison_votes_delete_own on comparison_votes for delete
  to authenticated
  using (voter_id = (select id from players where user_id = auth.uid()));
