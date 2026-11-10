-- Whoever nominated someone can take it back for a short while, which covers changing their mind before leaving the profile.
create policy player_comparisons_delete_own_nomination on public.player_comparisons for delete to authenticated
  using (
    source = 'community'
    and created_by = (select id from players where user_id = auth.uid())
    and created_at > now() - interval '1 hour'
  );
