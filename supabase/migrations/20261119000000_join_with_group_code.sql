-- Joining: a shared group code replaces the admin approval queue.
-- Someone who knows the code picks their name (or adds a new one) and is linked straight away.
-- The code lives in app_config under 'group_code'. With no code set, nobody can join.

create function group_code_ok(p_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from app_config
    where key = 'group_code' and lower(btrim(value)) = lower(btrim(coalesce(p_code, '')))
      and btrim(value) <> ''
  );
$$;

revoke all on function group_code_ok(text) from public;
grant execute on function group_code_ok(text) to anon, authenticated;

-- The linking function updates user_id on a row the caller doesn't own yet, so it flags itself for the lock trigger.
create or replace function public.protect_locked_player_fields()
returns trigger
language plpgsql
as $$
begin
  if not is_requesting_admin() and coalesce(current_setting('app.linking_player', true), '') <> 'on' then
    new.is_admin := old.is_admin;
    new.joined_at := old.joined_at;
    new.user_id := old.user_id;
    new.left_at := old.left_at;
    new.left_by := old.left_by;
  end if;
  return new;
end;
$$;

create function join_group(
  p_code text,
  p_player_id uuid default null,
  p_nickname text default null,
  p_full_name text default null,
  p_instagram text default null,
  p_birthday_month smallint default null,
  p_birthday_day smallint default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing uuid;
  result uuid;
  insta text := nullif(btrim(coalesce(p_instagram, '')), '');
begin
  if uid is null then
    raise exception 'Sign in first';
  end if;
  if not group_code_ok(p_code) then
    raise exception 'That group code isn''t right. Ask in the group chat.';
  end if;

  select id into existing from players where user_id = uid;
  if existing is not null then
    return existing;
  end if;

  if p_player_id is not null then
    perform set_config('app.linking_player', 'on', true);
    update players
    set user_id = uid,
        instagram_handle = insta,
        birthday_month = p_birthday_month,
        birthday_day = p_birthday_day,
        onboarded_at = coalesce(onboarded_at, now())
    where id = p_player_id and user_id is null and left_at is null
    returning id into result;
    perform set_config('app.linking_player', 'off', true);
    if result is null then
      raise exception 'That name was just taken. Pick again.';
    end if;
    insert into player_claims (player_id, claimant_user_id, status, reviewed_at)
    values (result, uid, 'approved', now());
  else
    if length(btrim(coalesce(p_nickname, ''))) < 2 then
      raise exception 'Add a nickname of at least 2 letters';
    end if;
    insert into players (user_id, nickname, full_name, instagram_handle, birthday_month, birthday_day, onboarded_at)
    values (
      uid,
      left(btrim(p_nickname), 30),
      left(coalesce(nullif(btrim(coalesce(p_full_name, '')), ''), btrim(p_nickname)), 60),
      insta,
      p_birthday_month,
      p_birthday_day,
      now()
    )
    returning id into result;
  end if;

  return result;
end;
$$;

revoke all on function join_group(text, uuid, text, text, text, smallint, smallint) from public, anon;
grant execute on function join_group(text, uuid, text, text, text, smallint, smallint) to authenticated;
