-- Player card photos. Public to read; a player manages files under their own player id, admins manage anyone's.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-photos', 'player-photos', true, 3145728, array['image/webp', 'image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_manage_player_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when (storage.foldername(object_name))[1] !~ '^[0-9a-f-]{36}$' then false
    else is_requesting_admin() or is_own_player(((storage.foldername(object_name))[1])::uuid)
  end;
$$;

revoke all on function public.can_manage_player_photo(text) from public;
grant execute on function public.can_manage_player_photo(text) to authenticated;

create policy player_photos_read on storage.objects for select
  using (bucket_id = 'player-photos');

create policy player_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'player-photos' and public.can_manage_player_photo(name));

create policy player_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'player-photos' and public.can_manage_player_photo(name))
  with check (bucket_id = 'player-photos' and public.can_manage_player_photo(name));

create policy player_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'player-photos' and public.can_manage_player_photo(name));
