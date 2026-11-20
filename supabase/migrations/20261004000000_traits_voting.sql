-- Traits (the tags table): anyone invents one, three votes put it in the pool,
-- and three votes on a player put an approved trait on their card.

create unique index if not exists tags_label_lower_key on public.tags (lower(btrim(label)));
alter table public.tags add constraint tags_label_length check (char_length(btrim(label)) between 2 and 24);

create policy tags_insert_own on public.tags for insert to authenticated
  with check (is_own_player(created_by) and not is_approved and approved_at is null);
create policy tags_delete_own_pending on public.tags for delete to authenticated
  using (is_own_player(created_by) and not is_approved);

create policy tag_creation_votes_select_all on public.tag_creation_votes for select to authenticated using (true);
create policy tag_creation_votes_insert_own on public.tag_creation_votes for insert to authenticated
  with check (is_own_player(voter_id));
create policy tag_creation_votes_delete_own on public.tag_creation_votes for delete to authenticated
  using (is_own_player(voter_id));

create policy player_tag_votes_select_all on public.player_tag_votes for select to authenticated using (true);
create policy player_tag_votes_insert_own on public.player_tag_votes for insert to authenticated
  with check (
    is_own_player(voter_id)
    and voter_id <> player_id
    and exists (select 1 from tags t where t.id = tag_id and t.is_approved)
  );
create policy player_tag_votes_delete_own on public.player_tag_votes for delete to authenticated
  using (is_own_player(voter_id));

create or replace function public.tag_creator_votes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into tag_creation_votes (tag_id, voter_id) values (new.id, new.created_by) on conflict do nothing;
  return null;
end;
$$;
create trigger tags_creator_votes after insert on public.tags
  for each row execute function public.tag_creator_votes();

create or replace function public.tag_creation_approve()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update tags set is_approved = true, approved_at = now()
  where id = new.tag_id and not is_approved
    and (select count(*) from tag_creation_votes where tag_id = new.tag_id) >= 3;
  return null;
end;
$$;
create trigger tag_creation_votes_approve after insert on public.tag_creation_votes
  for each row execute function public.tag_creation_approve();

-- Community traits live and die by their votes: three on, and off again if they fall below.
create or replace function public.player_trait_votes_apply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r player_tag_votes := coalesce(new, old);
  n int;
begin
  select count(*) into n from player_tag_votes where player_id = r.player_id and tag_id = r.tag_id;
  if n >= 3 then
    insert into player_tags (player_id, tag_id, source) values (r.player_id, r.tag_id, 'community') on conflict do nothing;
  else
    delete from player_tags where player_id = r.player_id and tag_id = r.tag_id and source = 'community';
  end if;
  return null;
end;
$$;
create trigger player_tag_votes_apply after insert or delete on public.player_tag_votes
  for each row execute function public.player_trait_votes_apply();
