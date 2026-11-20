-- Members admin: players who've left are marked rather than deleted, so their history stays.
-- Admin and left status are admin-only, and Astro can't be left without an admin.

alter table players
  add column left_at timestamptz,
  add column left_by uuid references players(id) on delete set null;

create or replace function public.protect_locked_player_fields()
returns trigger
language plpgsql
as $$
begin
  if not is_requesting_admin() then
    new.is_admin := old.is_admin;
    new.joined_at := old.joined_at;
    new.user_id := old.user_id;
    new.left_at := old.left_at;
    new.left_by := old.left_by;
  end if;
  return new;
end;
$$;

create or replace function public.guard_member_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.left_at is not null and old.left_at is null then
    if new.id = requesting_player_id() then
      raise exception 'You can''t mark yourself as left.';
    end if;
    new.is_admin := false;
    delete from article_writers where player_id = new.id;
  end if;

  if old.is_admin and not new.is_admin then
    if new.id = requesting_player_id() then
      raise exception 'You can''t remove your own admin access.';
    end if;
    if not exists (select 1 from players where is_admin and left_at is null and id <> new.id) then
      raise exception 'Astro needs at least one admin.';
    end if;
  end if;

  if new.is_admin and new.left_at is not null then
    raise exception 'Bring them back before making them an admin.';
  end if;
  return new;
end;
$$;

-- Named to fire after players_protect_locked_fields (triggers run alphabetically).
create trigger players_roles_guard before update on players for each row execute function guard_member_roles();
