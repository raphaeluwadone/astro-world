-- goals: same shape as matches/match_players — public read (the goal
-- timeline is shown to everyone), admin-only write (recording a goal is
-- an admin/pitch-side action).

create policy goals_select_all
on goals for select
to authenticated
using (true);

create policy goals_write_admin
on goals for insert
to authenticated
with check (is_requesting_admin());

create policy goals_update_admin
on goals for update
to authenticated
using (is_requesting_admin())
with check (is_requesting_admin());
