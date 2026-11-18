-- Accounts that signed up but never finished joining can be linked to a roster name by an admin.

-- Sign-ups with no player yet. Emails are only ever returned to admins.
create or replace function public.admin_stuck_accounts()
returns table(user_id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not is_requesting_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return query
  select u.id, u.email::text, u.created_at, u.last_sign_in_at
  from auth.users u
  where not exists (select 1 from players p where p.user_id = u.id)
    and not exists (select 1 from player_claims c where c.claimant_user_id = u.id and c.status = 'pending')
  order by u.created_at desc;
end;
$$;

-- Links one of those accounts to an unclaimed roster name, the same way join_group does.
create or replace function public.admin_link_account(p_user uuid, p_player uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid;
  result uuid;
begin
  if not is_requesting_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users where id = p_user) then
    raise exception 'That account doesn''t exist';
  end if;
  if exists (select 1 from players where user_id = p_user) then
    raise exception 'That account is already linked to a name';
  end if;
  select id into me from players where user_id = auth.uid();

  perform set_config('app.linking_player', 'on', true);
  update players
  set user_id = p_user, onboarded_at = coalesce(onboarded_at, now())
  where id = p_player and user_id is null and left_at is null
  returning id into result;
  perform set_config('app.linking_player', 'off', true);
  if result is null then
    raise exception 'That name is already taken or has left the group';
  end if;

  insert into player_claims (player_id, claimant_user_id, status, reviewed_by, reviewed_at)
  values (result, p_user, 'approved', me, now());
  return result;
end;
$$;

revoke all on function public.admin_stuck_accounts() from public, anon;
revoke all on function public.admin_link_account(uuid, uuid) from public, anon;
grant execute on function public.admin_stuck_accounts() to authenticated;
grant execute on function public.admin_link_account(uuid, uuid) to authenticated;
