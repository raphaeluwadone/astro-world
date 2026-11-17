-- What the group's almanac says about a player: a short write-up, a few notable facts, and goals and
-- assists for each month of 2026. Read-only for players, written by admins or the seed.

create table public.player_almanac (
  player_id uuid primary key references public.players(id) on delete cascade,
  -- Plain text with **bold** and _italic_ only.
  write_up text,
  facts text[] not null default '{}',
  -- {"1": {"g": 7, "a": 6, "dotm": 12}, ...}, keyed by month number. "dotm" is the Defender of the Month score, when there is one.
  months jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_almanac enable row level security;
create policy player_almanac_select on public.player_almanac for select to authenticated using (true);
create policy player_almanac_admin on public.player_almanac for all to authenticated
  using (is_requesting_admin()) with check (is_requesting_admin());
