-- Team cycles: the points race between the shirts (Alpha to Zeta). A calendar year by default; the admin can
-- pick another length when a cycle starts, end one early, and crowns the champion shirt when it closes.

create table team_cycles (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- Set when the admin closes it, early or on time. Matches after this count for the next cycle.
  closed_at timestamptz,
  champion text,
  -- The final table as the admin confirmed it: [{name, played, won, drawn, lost, gf, ga, points}].
  final_table jsonb,
  closed_by uuid references players(id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((closed_at is null) = (champion is null))
);

create unique index team_cycles_one_open on team_cycles ((true)) where closed_at is null;

alter table team_cycles enable row level security;
create policy team_cycles_read on team_cycles for select to authenticated using (true);
-- Changes go through close_team_cycle, so a running cycle's dates can't be edited directly.

insert into team_cycles (label, starts_at, ends_at)
values (
  extract(year from now() at time zone 'Africa/Lagos')::text,
  date_trunc('year', now() at time zone 'Africa/Lagos') at time zone 'Africa/Lagos',
  (date_trunc('year', now() at time zone 'Africa/Lagos') + interval '1 year') at time zone 'Africa/Lagos'
);

alter table posts drop constraint posts_kind_check;
alter table posts add constraint posts_kind_check check (kind in ('teams', 'report', 'champion'));
alter table posts add column team_cycle_id uuid unique references team_cycles(id) on delete cascade;

-- Each filed match from both sides, with the opponent, for any window (head-to-head needs the opponent).
create or replace function public.team_matches_between(p_from timestamptz, p_to timestamptz)
returns table (greek_name text, opponent text, played_at timestamptz, goals_for int, goals_against int)
language sql
stable
security definer
set search_path = public
as $$
  select ta.greek_name, tb.greek_name, md.played_at, m.score_a, m.score_b
  from matches m
  join teams ta on ta.id = m.team_a_id
  join teams tb on tb.id = m.team_b_id
  join matchdays md on md.id = m.matchday_id
  where md.status = 'played' and md.played_at >= p_from and md.played_at < p_to
  union all
  select tb.greek_name, ta.greek_name, md.played_at, m.score_b, m.score_a
  from matches m
  join teams ta on ta.id = m.team_a_id
  join teams tb on tb.id = m.team_b_id
  join matchdays md on md.id = m.matchday_id
  where md.status = 'played' and md.played_at >= p_from and md.played_at < p_to;
$$;

-- Closes the open cycle (early if before ends_at), crowns the champion, starts the next one,
-- posts the announcement as Astro and tells every active player.
create or replace function public.close_team_cycle(p_champion text, p_final_table jsonb, p_next_label text, p_next_ends_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cur team_cycles;
  closing timestamptz := now();
  next_id uuid;
  post uuid;
  rec jsonb;
  body text;
  p record;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can close a cycle' using errcode = '42501';
  end if;
  select * into cur from team_cycles where closed_at is null for update;
  if cur.id is null then
    raise exception 'There is no open cycle';
  end if;
  if p_champion not in ('Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta') then
    raise exception 'Unknown team %', p_champion;
  end if;
  closing := least(closing, cur.ends_at);
  if p_next_ends_at <= closing then
    raise exception 'The next cycle must end after it starts';
  end if;

  update team_cycles set closed_at = closing, champion = p_champion, final_table = p_final_table, closed_by = requesting_player_id()
  where id = cur.id;
  insert into team_cycles (label, starts_at, ends_at) values (p_next_label, closing, p_next_ends_at) returning id into next_id;

  select r into rec from jsonb_array_elements(p_final_table) r where r->>'name' = p_champion;
  body := '**' || p_champion || ' are the champions of ' || cur.label || '.**'
    || E'\n\n' || coalesce((rec->>'points') || ' points from ' || (rec->>'played') || ' games: '
       || (rec->>'won') || ' won, ' || (rec->>'drawn') || ' drawn, ' || (rec->>'lost') || ' lost.', '')
    || E'\n\nThe star stays on the shirt. Whoever gets drawn into ' || p_champion || ' wears it.'
    || E'\n\n_Final table_' || E'\n'
    || (select string_agg((ord) || '. ' || (r->>'name') || ', ' || (r->>'points') || ' pts', E'\n' order by ord)
        from jsonb_array_elements(p_final_table) with ordinality as t(r, ord));

  insert into posts (author_id, kind, team_cycle_id, content)
  values (matchday_post_author(), 'champion', cur.id, body)
  returning id into post;

  for p in select user_id from players where user_id is not null and left_at is null loop
    perform notify(p.user_id, 'team_champion', jsonb_build_object('team', p_champion, 'cycle', cur.label),
      '/awards/shirt-of-the-year', null, 'champion:' || cur.id || ':' || p.user_id);
  end loop;
  return next_id;
end;
$$;

revoke execute on function public.close_team_cycle(text, jsonb, text, timestamptz) from public, anon;
grant execute on function public.close_team_cycle(text, jsonb, text, timestamptz) to authenticated;
