-- Community posts get dislikes (a like and a dislike cancel each other) and one level of replies.

create table public.post_dislikes (
  post_id uuid not null references public.posts(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, player_id)
);
alter table public.post_dislikes enable row level security;
create policy post_dislikes_select_all on public.post_dislikes for select to authenticated using (true);
create policy post_dislikes_insert_own on public.post_dislikes for insert to authenticated
  with check (is_own_player(player_id));
create policy post_dislikes_delete_own on public.post_dislikes for delete to authenticated
  using (is_own_player(player_id));

create or replace function public.post_reaction_swap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'post_likes' then
    delete from post_dislikes where post_id = new.post_id and player_id = new.player_id;
  else
    delete from post_likes where post_id = new.post_id and player_id = new.player_id;
  end if;
  return null;
end;
$$;
create trigger post_likes_swap after insert on public.post_likes
  for each row execute function public.post_reaction_swap();
create trigger post_dislikes_swap after insert on public.post_dislikes
  for each row execute function public.post_reaction_swap();

create table public.post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.players(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index post_replies_post_idx on public.post_replies (post_id, created_at);
alter table public.post_replies enable row level security;
create policy post_replies_select_all on public.post_replies for select to authenticated using (true);
create policy post_replies_insert_own on public.post_replies for insert to authenticated
  with check (is_own_player(author_id));
create policy post_replies_delete_own_or_admin on public.post_replies for delete to authenticated
  using (is_own_player(author_id) or is_requesting_admin());

create or replace function public.notify_post_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p posts;
begin
  select * into p from posts where id = new.post_id;
  if p.author_id = new.author_id then
    return null;
  end if;
  perform notify(
    player_user(p.author_id), 'reply',
    jsonb_build_object('post_id', p.id, 'reply_id', new.id, 'excerpt', left(new.content, 140)),
    '/community?post=' || p.id, new.author_id, 'reply:' || new.id
  );
  return null;
end;
$$;
create trigger post_replies_notify after insert on public.post_replies
  for each row execute function public.notify_post_reply();
