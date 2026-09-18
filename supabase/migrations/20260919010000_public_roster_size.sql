-- A single honest, non-sensitive number for the signed-out landing page:
-- how many people are in the group. Everything else on `players` is
-- gated to `authenticated` (players_select_all), so a plain SELECT isn't
-- an option pre-auth, and this is safe to expose because it reveals
-- nothing about any individual player.
create function public_roster_size()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer from players;
$$;

revoke all on function public_roster_size() from public;
grant execute on function public_roster_size() to anon, authenticated;
