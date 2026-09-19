-- "Take it down" on the memorial page: nobody is notified, and the
-- author can write another whenever they like (see Astro Modals.dc.html,
-- memorial · remove).
create policy tributes_delete_own on tributes for delete to authenticated
  using (author_id = (select id from players where user_id = auth.uid()));
