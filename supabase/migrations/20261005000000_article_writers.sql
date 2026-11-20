-- Articles get authors and drafts. Admins write, and can hand write access to anyone (and take it back).

alter table articles
  add column author_id uuid references players(id) on delete set null,
  add column updated_at timestamptz not null default now();

create table article_writers (
  player_id uuid primary key references players(id) on delete cascade,
  granted_by uuid references players(id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table article_writers enable row level security;

create policy article_writers_select on article_writers for select to authenticated using (true);
create policy article_writers_insert_admin on article_writers for insert to authenticated with check (is_requesting_admin());
create policy article_writers_delete_admin on article_writers for delete to authenticated using (is_requesting_admin());

create or replace function public.can_write_articles()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_requesting_admin() or exists (select 1 from article_writers where player_id = requesting_player_id());
$$;

revoke all on function public.can_write_articles() from public;
grant execute on function public.can_write_articles() to authenticated;

drop policy if exists articles_select_all on articles;

-- Drafts and scheduled pieces stay with their author and the admins.
create policy articles_select on articles for select to authenticated
  using ((published_at is not null and published_at <= now()) or author_id = requesting_player_id() or is_requesting_admin());

create policy articles_insert on articles for insert to authenticated
  with check (can_write_articles() and author_id = requesting_player_id());

create policy articles_update on articles for update to authenticated
  using (is_requesting_admin() or (author_id = requesting_player_id() and can_write_articles()))
  with check (is_requesting_admin() or (author_id = requesting_player_id() and can_write_articles()));

create policy articles_delete on articles for delete to authenticated
  using (is_requesting_admin() or (author_id = requesting_player_id() and can_write_articles()));

create or replace function public.touch_article()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger articles_touch before update on articles for each row execute function touch_article();

-- Cover and body images, filed under the uploader's player id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-images', 'article-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy article_images_read on storage.objects for select
  using (bucket_id = 'article-images');

create policy article_images_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'article-images'
    and public.can_write_articles()
    and (storage.foldername(name))[1] = requesting_player_id()::text
  );

create policy article_images_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'article-images'
    and (is_requesting_admin() or (storage.foldername(name))[1] = requesting_player_id()::text)
  );
