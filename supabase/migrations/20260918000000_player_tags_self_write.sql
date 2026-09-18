-- Lets a player add/remove their own self-tags on the Edit Profile screen
-- ("Two of your own. The rest are voted onto you, and you can't take those
-- off.") Community-sourced tags stay read-only here on purpose: this
-- policy only ever matches source = 'self' rows for your own player_id, so
-- there's no path for a player to delete a tag the group voted onto them.
-- The 2-tag cap is enforced in the WITH CHECK too, not just the UI, since
-- RLS is the actual boundary everywhere else in this schema. The bare
-- `player_tags` reference inside the subquery is the row being inserted;
-- no separate alias is needed for that in a WITH CHECK clause.

create policy player_tags_insert_own_self on player_tags for insert
  to authenticated
  with check (
    source = 'self'
    and player_id = (select id from players where user_id = auth.uid())
    and (
      select count(*) from player_tags pt
      where pt.player_id = player_tags.player_id and pt.source = 'self'
    ) < 2
  );

create policy player_tags_delete_own_self on player_tags for delete
  to authenticated
  using (
    source = 'self'
    and player_id = (select id from players where user_id = auth.uid())
  );
