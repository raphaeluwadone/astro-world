-- Lets a freshly-signed-up auth user create their OWN players row.
-- Signup model (confirmed 2026-09-16): signing up creates a brand-new
-- player, not a claim of a pre-loaded one. The existing partial unique
-- index on players.user_id already guarantees one player row per real
-- account, so this policy only needs to check identity, not one-ness.

create policy players_insert_own
on players for insert
to authenticated
with check (user_id = auth.uid());
