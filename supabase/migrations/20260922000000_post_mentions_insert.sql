-- Authors record who they tagged when they post.
create policy post_mentions_insert_own on post_mentions for insert to authenticated
  with check (
    exists (
      select 1 from posts
      where posts.id = post_id
        and posts.author_id = (select id from players where user_id = auth.uid())
    )
  );
