-- Matchday posts: the draw and each Pitch-side full time post to the community feed as "Astro".
-- Authored by the admin who triggered them (author_id is required); the UI shows them as Astro.

alter table posts
  add column kind text check (kind in ('teams', 'report')),
  add column matchday_id uuid references matchdays(id) on delete cascade,
  add column pitch_game_id uuid unique references pitch_games(id) on delete cascade;

alter table pitch_games add column report text;

drop policy posts_insert_own on posts;
create policy posts_insert_own on posts for insert to authenticated
  with check (author_id = (select id from players where user_id = auth.uid()) and kind is null);

create or replace function public.team_order(p_name text)
returns int
language sql
immutable
as $$
  select coalesce(array_position(array['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'], p_name), 99);
$$;

create or replace function public.mention_token(p_player uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select '@[' || nickname || '](player:' || id || ')' from players where id = p_player;
$$;

create or replace function public.matchday_post_author()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(requesting_player_id(), (select id from players where is_admin and left_at is null order by joined_at limit 1));
$$;

-- ---------------------------------------------------------------------------
-- Teams are out
-- ---------------------------------------------------------------------------

create or replace function public.post_drawn_teams()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  body text;
begin
  if new.status <> 'drawn' or old.status = 'drawn' then
    return null;
  end if;

  select string_agg(line, E'\n' order by ord) into body
  from (
    select team_order(t.greek_name) as ord,
      '**' || t.greek_name || ':** ' || string_agg(mention_token(tm.player_id), ', ' order by p.nickname) as line
    from teams t
    join team_members tm on tm.team_id = t.id
    join players p on p.id = tm.player_id
    where t.matchday_id = new.id
    group by t.id, t.greek_name
  ) lines;

  if body is null then
    return null;
  end if;

  insert into posts (author_id, kind, matchday_id, content)
  values (
    matchday_post_author(), 'teams', new.id,
    '**Teams are out for ' || to_char(new.played_at at time zone 'Africa/Lagos', 'Dy FMDD Mon') || '.**' || E'\n\n' || body
  );
  return null;
end;
$$;

create trigger matchdays_post_teams after update of status on matchdays
  for each row execute function public.post_drawn_teams();

-- ---------------------------------------------------------------------------
-- Full time: match report post and a result notification per player
-- ---------------------------------------------------------------------------

create or replace function public.post_pitch_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a teams;
  b teams;
  sa int;
  sb int;
  game_no int;
  scorers text;
  lineups text;
  body text;
  post uuid;
  m record;
begin
  if new.ended_at is null then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.ended_at is not null and old.report is not distinct from new.report then
    return null;
  end if;

  select * into a from teams where id = new.team_a_id;
  select * into b from teams where id = new.team_b_id;
  select count(*) filter (where team_id = a.id), count(*) filter (where team_id = b.id) into sa, sb
  from pitch_goals where game_id = new.id;
  select count(*) into game_no from pitch_games where matchday_id = new.matchday_id and created_at <= new.created_at;

  select string_agg(line, E'\n' order by ord) into scorers
  from (
    select case when g.team_id = a.id then 0 else 1 end as ord,
      '**' || t.greek_name || ':** ' || string_agg(
        coalesce(mention_token(g.scorer_id), 'scorer to add')
          || case
               when g.minute is null then ''
               when g.minute > new.length_min then ' ' || new.length_min || '+' || (g.minute - new.length_min) || '′'
               else ' ' || g.minute || '′'
             end
          || coalesce(' (assist ' || mention_token(g.assist_id) || ')', ''),
        ', ' order by g.created_at
      ) as line
    from pitch_goals g join teams t on t.id = g.team_id
    where g.game_id = new.id
    group by g.team_id, t.greek_name
  ) s;

  -- Checked-in players if there are any, otherwise the drawn side.
  select string_agg(line, E'\n' order by ord) into lineups
  from (
    select case when t.id = a.id then 0 else 1 end as ord,
      t.greek_name || ': ' || string_agg(mention_token(tm.player_id), ', ' order by p.nickname) as line
    from teams t
    join team_members tm on tm.team_id = t.id
    join players p on p.id = tm.player_id
    where t.id in (a.id, b.id)
      and (
        not exists (select 1 from pitch_checkins c where c.matchday_id = new.matchday_id)
        or exists (select 1 from pitch_checkins c where c.matchday_id = new.matchday_id and c.player_id = tm.player_id)
      )
    group by t.id, t.greek_name
  ) l;

  body := '**Full time, game ' || game_no || ': ' || a.greek_name || ' ' || sa || '–' || sb || ' ' || b.greek_name || '**'
    || coalesce(E'\n\n' || nullif(btrim(new.report), ''), '')
    || E'\n\n' || coalesce(scorers, 'No goals.')
    || coalesce(E'\n\n_Line-ups_' || E'\n' || lineups, '');

  insert into posts (author_id, kind, matchday_id, pitch_game_id, content)
  values (matchday_post_author(), 'report', new.matchday_id, new.id, body)
  on conflict (pitch_game_id) do update set content = excluded.content
  returning id into post;

  for m in
    select tm.player_id, t.greek_name as team,
      case when t.id = a.id then b.greek_name else a.greek_name end as opponent,
      case when t.id = a.id then sa else sb end as scored,
      case when t.id = a.id then sb else sa end as conceded
    from teams t join team_members tm on tm.team_id = t.id
    where t.id in (a.id, b.id)
  loop
    perform notify(
      player_user(m.player_id), 'pitch_result',
      jsonb_build_object('matchday_id', new.matchday_id, 'team', m.team, 'opponent', m.opponent, 'for', m.scored, 'against', m.conceded, 'game_no', game_no),
      '/community?post=' || post, null, 'result:' || new.id || ':' || m.player_id
    );
  end loop;
  return null;
end;
$$;

create trigger pitch_games_post_report after update of ended_at, report on pitch_games
  for each row execute function public.post_pitch_report();
