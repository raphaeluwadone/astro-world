-- Honours page: admin write-ups with reactions, plus club-wide totals and milestone moments.

create table public.honours_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.players(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  content text not null check (char_length(btrim(content)) between 1 and 4000),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index honours_posts_created_at_idx on public.honours_posts (created_at desc);
create unique index honours_posts_one_pinned on public.honours_posts ((true)) where pinned;

create trigger honours_posts_set_updated_at
  before update on public.honours_posts
  for each row execute function public.set_updated_at();

alter table public.honours_posts enable row level security;

create policy honours_posts_select_all on public.honours_posts
  for select to authenticated using (true);
create policy honours_posts_insert_admin on public.honours_posts
  for insert to authenticated with check (public.is_requesting_admin());
create policy honours_posts_update_admin on public.honours_posts
  for update to authenticated using (public.is_requesting_admin()) with check (public.is_requesting_admin());
create policy honours_posts_delete_admin on public.honours_posts
  for delete to authenticated using (public.is_requesting_admin());

create table public.honours_reactions (
  post_id uuid not null references public.honours_posts(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  emoji text not null check (emoji in ('trophy', 'fire', 'clap', 'goat', 'laugh', 'party')),
  created_at timestamptz not null default now(),
  primary key (post_id, player_id, emoji)
);

alter table public.honours_reactions enable row level security;

create policy honours_reactions_select_all on public.honours_reactions
  for select to authenticated using (true);
create policy honours_reactions_insert_own on public.honours_reactions
  for insert to authenticated
  with check (player_id = (select id from public.players where user_id = auth.uid()));
create policy honours_reactions_delete_own on public.honours_reactions
  for delete to authenticated
  using (player_id = (select id from public.players where user_id = auth.uid()));

-- Only one post can be pinned, so pinning swaps it in one statement.
create or replace function public.set_honours_pin(p_post_id uuid, p_pinned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_requesting_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_pinned then
    update honours_posts set pinned = (id = p_post_id) where pinned or id = p_post_id;
  else
    update honours_posts set pinned = false where id = p_post_id;
  end if;
end;
$$;

-- Running totals for the club counters. Goals and appearances include legacy career numbers.
create or replace function public.club_totals()
returns table (matchdays bigint, goals bigint, appearances bigint, raised numeric, roster integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from matchdays where status in ('played', 'complete')),
    (select coalesce(sum(legacy_goals), 0) from players) + (select count(*) from goals),
    (select coalesce(sum(legacy_appearances), 0) from players) + (select count(*) from match_players),
    (select coalesce(sum(amount), 0) from cause_contributions),
    public_roster_size();
$$;

-- Milestones with a known date: only ones crossed by a recorded match can be dated.
create or replace function public.club_moments()
returns table (kind text, value bigint, player_id uuid, happened_at timestamptz, detail text)
language sql
stable
security definer
set search_path = public
as $$
  with played as (
    select id, played_at, venue, row_number() over (order by played_at, id) as n
    from matchdays
    where status in ('played', 'complete')
  ),
  club_goals as (
    select g.id, m.played_at,
      (select coalesce(sum(legacy_goals), 0) from players) + row_number() over (order by m.played_at, g.minute, g.id) as n
    from goals g
    join matches m on m.id = g.match_id
  ),
  player_apps as (
    select mp.player_id, m.played_at,
      p.legacy_appearances + row_number() over (partition by mp.player_id order by m.played_at, m.id) as n
    from match_players mp
    join matches m on m.id = mp.match_id
    join players p on p.id = mp.player_id
  ),
  player_goals as (
    select g.scorer_id as player_id, m.played_at,
      p.legacy_goals + row_number() over (partition by g.scorer_id order by m.played_at, g.minute, g.id) as n
    from goals g
    join matches m on m.id = g.match_id
    join players p on p.id = g.scorer_id
  )
  select 'matchdays' as kind, n as value, null::uuid as player_id, played_at as happened_at, venue as detail from played where n in (1, 10, 25) or n % 50 = 0
  union all
  select 'club-goals', n, null, played_at, null from club_goals where n % 250 = 0
  union all
  select 'player-apps', n, player_id, played_at, null from player_apps where n % 50 = 0
  union all
  select 'player-goals', n, player_id, played_at, null from player_goals where n % 25 = 0
  order by happened_at desc;
$$;

grant execute on function public.set_honours_pin(uuid, boolean) to authenticated;
grant execute on function public.club_totals() to authenticated;
grant execute on function public.club_moments() to authenticated;
