-- Supports the new "Join" flow: a new arrival gives a nickname + surname,
-- gets matched against the pre-existing (unclaimed) player roster, and
-- either claims one of those records (pending admin approval, since it
-- carries other people's votes) or sets up a brand new one (immediate,
-- nothing to approve).

-- Admins can add the pre-existing (not-yet-signed-up) roster directly —
-- these rows have no user_id until someone claims or is matched to them.
-- There was previously no way to insert a player row except self-signup.
create policy players_insert_admin on players for insert
  to authenticated
  with check (is_requesting_admin());

alter table players add column instagram_handle text;
alter table players add column birthday_month smallint check (birthday_month between 1 and 12);
alter table players add column birthday_day smallint check (birthday_day between 1 and 31);

create type player_claim_status as enum ('pending', 'approved', 'rejected');

create table player_claims (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  claimant_user_id uuid not null references auth.users(id) on delete cascade,
  status player_claim_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_by uuid references players(id),
  reviewed_at timestamptz
);

-- Only one live (pending) claim per record at a time — doesn't block a
-- second attempt after a rejection, since the earlier row is no longer 'pending'.
create unique index player_claims_one_pending_per_player
  on player_claims (player_id) where status = 'pending';

alter table player_claims enable row level security;

-- A claimant can see their own claim(s) (to know if they're still
-- pending); admins can see everything, to review the queue.
create policy player_claims_select_own on player_claims for select
  to authenticated
  using (claimant_user_id = auth.uid() or is_requesting_admin());

-- You can only claim a record nobody has already claimed (players.user_id
-- is null) and that has no other pending claim on it right now — the
-- partial unique index above enforces the second half at the DB level too.
create policy player_claims_insert_own on player_claims for insert
  to authenticated
  with check (
    claimant_user_id = auth.uid()
    and exists (select 1 from players p where p.id = player_id and p.user_id is null)
  );

-- Approving/rejecting is an admin action. Approval itself (linking
-- players.user_id to the claimant) is a separate, explicit update against
-- `players` — already covered by the existing players_update_own_or_admin
-- policy and its locked-fields trigger's admin exception, so no new
-- players policy is needed for that part.
create policy player_claims_update_admin on player_claims for update
  to authenticated
  using (is_requesting_admin())
  with check (is_requesting_admin());
