-- Players the admin marks as left lose access: no new tokens, and no player or admin rights in policies.

create or replace function public.requesting_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from players where user_id = auth.uid() and left_at is null;
$$;

create or replace function public.is_requesting_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from players where user_id = auth.uid() and left_at is null), false);
$$;

-- Auth calls this before issuing any access token, so it covers sign-in and session refresh.
-- Must be enabled per project: config.toml locally, Authentication > Hooks in the dashboard.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if exists (select 1 from players where user_id = (event->>'user_id')::uuid and left_at is not null) then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403,
      'message', 'This account is switched off because you’ve left Astro. Ask an admin if you’re coming back.'
    ));
  end if;
  return event;
end;
$$;

revoke execute on function public.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
