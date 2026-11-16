-- Captains' pick: one captain per side, taking turns in a snake (1 to N, then N back to 1) until the pool is gone.

create table draft_sessions (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references matchdays(id) on delete cascade,
  team_count int not null check (team_count between 2 and 6),
  -- Everyone confirmed when it started, captains included. Frozen so a late claim can't change the pool mid-draft.
  pool uuid[] not null,
  status text not null default 'live' check (status in ('live', 'complete', 'published', 'cancelled')),
  created_by uuid references players(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index draft_sessions_one_open on draft_sessions (matchday_id) where status in ('live', 'complete');

create table draft_captains (
  session_id uuid not null references draft_sessions(id) on delete cascade,
  slot int not null check (slot between 1 and 6),
  player_id uuid not null references players(id),
  primary key (session_id, slot),
  unique (session_id, player_id)
);

create table draft_picks (
  session_id uuid not null references draft_sessions(id) on delete cascade,
  pick_no int not null check (pick_no >= 1),
  slot int not null check (slot between 1 and 6),
  player_id uuid not null references players(id),
  picked_by uuid references players(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (session_id, pick_no),
  unique (session_id, player_id)
);

alter table draft_sessions enable row level security;
alter table draft_captains enable row level security;
alter table draft_picks enable row level security;
-- Everyone watches the selection; writes only go through the functions below.
create policy draft_sessions_read on draft_sessions for select to authenticated using (true);
create policy draft_captains_read on draft_captains for select to authenticated using (true);
create policy draft_picks_read on draft_picks for select to authenticated using (true);

alter publication supabase_realtime add table draft_sessions, draft_captains, draft_picks;

-- Pick 1 is team 1. After team N it turns round: N, N-1 ... 1, then 1 again.
create function public.draft_slot_for_pick(p_pick int, p_teams int)
returns int
language sql
immutable
as $$
  select case
    when ((p_pick - 1) / p_teams) % 2 = 0 then ((p_pick - 1) % p_teams) + 1
    else p_teams - ((p_pick - 1) % p_teams)
  end
$$;

-- Tells whoever is next on the clock. Captains with no login are skipped: an admin picks for them.
create function public.draft_notify_turn(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s draft_sessions;
  n int;
  v_slot int;
  who uuid;
begin
  select * into s from draft_sessions where id = p_session;
  if s.status <> 'live' then
    return;
  end if;
  select count(*) + 1 into n from draft_picks where session_id = p_session;
  v_slot := draft_slot_for_pick(n, s.team_count);
  select p.user_id into who from draft_captains c join players p on p.id = c.player_id where c.session_id = p_session and c.slot = v_slot;
  perform notify(
    who,
    'draft_turn',
    jsonb_build_object('team', (array['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'])[v_slot], 'pick', n),
    '/community',
    null,
    'draft_turn:' || p_session || ':' || n || ':' || (extract(epoch from clock_timestamp()) * 1000)::bigint
  );
end;
$$;
revoke execute on function public.draft_notify_turn(uuid) from public, anon, authenticated;

create function public.start_draft(p_matchday uuid, p_team_count int, p_captains uuid[], p_pool uuid[])
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  pool uuid[];
  i int;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can start the selection' using errcode = '42501';
  end if;
  if (select status::text from matchdays where id = p_matchday) is distinct from 'open' then
    raise exception 'This matchday isn''t open for a draw';
  end if;
  if p_team_count not between 2 and 6 then
    raise exception 'Pick between 2 and 6 sides';
  end if;
  if coalesce(cardinality(p_captains), 0) <> p_team_count then
    raise exception 'Choose one captain for each side';
  end if;
  if (select count(distinct c) from unnest(p_captains) c) <> p_team_count then
    raise exception 'A player can only captain one side';
  end if;
  select array_agg(distinct x) into pool from unnest(p_pool) x;
  if not (p_captains <@ pool) then
    raise exception 'Captains have to be among the confirmed players';
  end if;

  begin
    insert into draft_sessions (matchday_id, team_count, pool, created_by)
    values (p_matchday, p_team_count, pool, requesting_player_id())
    returning id into sid;
  exception when unique_violation then
    raise exception 'A selection is already running for this matchday';
  end;

  for i in 1..p_team_count loop
    insert into draft_captains (session_id, slot, player_id) values (sid, i, p_captains[i]);
  end loop;

  if cardinality(pool) <= p_team_count then
    update draft_sessions set status = 'complete' where id = sid;
  else
    perform draft_notify_turn(sid);
  end if;
  return sid;
end;
$$;
revoke execute on function public.start_draft(uuid, int, uuid[], uuid[]) from public, anon;

-- The captain on the clock picks, or an admin picks for them.
create function public.draft_pick(p_session uuid, p_player uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s draft_sessions;
  n int;
  v_slot int;
  cap uuid;
begin
  select * into s from draft_sessions where id = p_session for update;
  if not found then
    raise exception 'That selection doesn''t exist';
  end if;
  if s.status <> 'live' then
    raise exception 'The selection isn''t running';
  end if;

  select count(*) + 1 into n from draft_picks where session_id = p_session;
  v_slot := draft_slot_for_pick(n, s.team_count);
  select c.player_id into cap from draft_captains c where c.session_id = p_session and c.slot = v_slot;

  if not (is_requesting_admin() or requesting_player_id() = cap) then
    raise exception 'It''s not your turn' using errcode = '42501';
  end if;
  if not (p_player = any (s.pool)) then
    raise exception 'That player isn''t in the pool';
  end if;
  if exists (select 1 from draft_captains where session_id = p_session and player_id = p_player)
     or exists (select 1 from draft_picks where session_id = p_session and player_id = p_player) then
    raise exception 'They''ve already been picked';
  end if;

  insert into draft_picks (session_id, pick_no, slot, player_id, picked_by)
  values (p_session, n, v_slot, p_player, requesting_player_id());

  if cardinality(s.pool) - s.team_count - n <= 0 then
    update draft_sessions set status = 'complete' where id = p_session;
  else
    perform draft_notify_turn(p_session);
  end if;
end;
$$;
revoke execute on function public.draft_pick(uuid, uuid) from public, anon;

create function public.draft_undo(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s draft_sessions;
  last_no int;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can undo a pick' using errcode = '42501';
  end if;
  select * into s from draft_sessions where id = p_session for update;
  if not found or s.status not in ('live', 'complete') then
    raise exception 'The selection isn''t running';
  end if;
  select max(pick_no) into last_no from draft_picks where session_id = p_session;
  if last_no is null then
    raise exception 'Nothing to undo yet';
  end if;
  delete from draft_picks where session_id = p_session and pick_no = last_no;
  update draft_sessions set status = 'live' where id = p_session;
  perform draft_notify_turn(p_session);
end;
$$;
revoke execute on function public.draft_undo(uuid) from public, anon;

create function public.draft_cancel(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can cancel the selection' using errcode = '42501';
  end if;
  update draft_sessions set status = 'cancelled' where id = p_session and status in ('live', 'complete');
end;
$$;
revoke execute on function public.draft_cancel(uuid) from public, anon;

-- Called once the teams have been written, so the board goes quiet and the Community comes back.
create function public.draft_mark_published(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can publish the teams' using errcode = '42501';
  end if;
  update draft_sessions set status = 'published' where id = p_session and status = 'complete';
end;
$$;
revoke execute on function public.draft_mark_published(uuid) from public, anon;
