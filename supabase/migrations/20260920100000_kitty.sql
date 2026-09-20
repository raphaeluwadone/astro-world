-- Kitty: quarterly dues + causes. The design itself has no real payment
-- system behind it anywhere (no ledger, no transaction records, dues
-- status is literally a 4-character "PPPO" string in the mock data) --
-- this mirrors that exactly: self-attested status, real money changes
-- hands outside the app, an admin marks it here for the record.
--
-- Confirmed with Raphael before building: (1) an admin marks a payment
-- or contribution, not a member self-report, since dues don't gate
-- anything and there'd be nothing to check a false self-claim against;
-- (2) dues stay deliberately NOT wired to the ballot, matching the
-- design's own explicit red-banner warning that doing so would be a
-- real rule change needing the Rules page and notice first, not a
-- silent gate; (3) the quarterly amount is admin-editable, not
-- hardcoded, since the design's own ₦12,000 figure is flagged as an
-- unconfirmed placeholder.
--
-- Privacy matches the design's own stated rule for both halves: "the
-- list of who hasn't [paid dues] is visible to the admins, not
-- everyone" and "amounts are never shown next to names" for causes.
-- Same shape as the ratings anonymity pattern already in this schema:
-- the raw table is admin/own-row only, a SECURITY DEFINER function
-- exposes just the public aggregate (a count, a sum, or a bare list of
-- names with no amount attached).

create table dues_quarters (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  quarter smallint not null check (quarter between 1 and 4),
  amount numeric(10, 2) not null,
  due_date date not null,
  created_at timestamptz not null default now(),
  unique (year, quarter)
);

create table dues_payments (
  id uuid primary key default gen_random_uuid(),
  dues_quarter_id uuid not null references dues_quarters(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  marked_by uuid not null references players(id),
  paid_at timestamptz not null default now(),
  unique (dues_quarter_id, player_id)
);

create type cause_status as enum ('suggested', 'open', 'met', 'closed');

create table causes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  target_amount numeric(10, 2),
  deadline date,
  status cause_status not null default 'suggested',
  suggested_by uuid references players(id),
  created_at timestamptz not null default now()
);

create table cause_contributions (
  id uuid primary key default gen_random_uuid(),
  cause_id uuid not null references causes(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  amount numeric(10, 2) not null,
  marked_by uuid not null references players(id),
  created_at timestamptz not null default now(),
  unique (cause_id, player_id)
);

-- ---------------------------------------------------------------------------
-- Public aggregates: what everyone sees. Mirrors match_ratings_summary's
-- shape exactly (a SECURITY DEFINER function returning only the number
-- or the name, never the row that would let someone reconstruct who
-- owes what or gave how much).
-- ---------------------------------------------------------------------------

create function dues_paid_count(p_dues_quarter_id uuid)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) from dues_payments where dues_quarter_id = p_dues_quarter_id;
$$;

revoke all on function dues_paid_count(uuid) from public;
grant execute on function dues_paid_count(uuid) to authenticated;

create function cause_raised_amount(p_cause_id uuid)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(amount), 0) from cause_contributions where cause_id = p_cause_id;
$$;

revoke all on function cause_raised_amount(uuid) from public;
grant execute on function cause_raised_amount(uuid) to authenticated;

create function cause_contributors(p_cause_id uuid)
returns table (player_id uuid, nickname text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.nickname
  from cause_contributions cc
  join players p on p.id = cc.player_id
  where cc.cause_id = p_cause_id
  order by cc.created_at asc;
$$;

revoke all on function cause_contributors(uuid) from public;
grant execute on function cause_contributors(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table dues_quarters enable row level security;
alter table dues_payments enable row level security;
alter table causes enable row level security;
alter table cause_contributions enable row level security;

create policy dues_quarters_select_all on dues_quarters for select to authenticated using (true);
create policy dues_quarters_write_admin on dues_quarters for insert to authenticated with check (is_requesting_admin());
create policy dues_quarters_update_admin on dues_quarters for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

-- Own row or admin only: this is exactly what keeps "who hasn't paid"
-- from being derivable by anyone comparing the roster against this
-- table themselves.
create policy dues_payments_select_own_or_admin on dues_payments for select to authenticated
using (is_own_player(player_id) or is_requesting_admin());
create policy dues_payments_write_admin on dues_payments for insert to authenticated with check (is_requesting_admin());
create policy dues_payments_delete_admin on dues_payments for delete to authenticated using (is_requesting_admin());

create policy causes_select_all on causes for select to authenticated using (true);

-- A member can only ever insert a bare suggestion (no target, no
-- deadline, status stays 'suggested'): "the admins set the target and
-- the closing date," never the member proposing it.
create policy causes_insert_suggestion on causes for insert to authenticated
with check (
  status = 'suggested'
  and target_amount is null
  and deadline is null
  and suggested_by = (select id from players where user_id = auth.uid())
);
create policy causes_insert_admin on causes for insert to authenticated with check (is_requesting_admin());
create policy causes_update_admin on causes for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

create policy cause_contributions_select_own_or_admin on cause_contributions for select to authenticated
using (is_own_player(player_id) or is_requesting_admin());
create policy cause_contributions_write_admin on cause_contributions for insert to authenticated with check (is_requesting_admin());
create policy cause_contributions_update_admin on cause_contributions for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());
