-- Bib colours per game, and adding a player to a side without taking anyone off it.

-- Null means nobody picked a colour (every game before this existed).
alter table pitch_games
  add column bib_a text,
  add column bib_b text,
  add constraint pitch_games_bib_a_check check (bib_a in ('blue', 'red', 'yellow', 'green', 'orange', 'white', 'black')),
  add constraint pitch_games_bib_b_check check (bib_b in ('blue', 'red', 'yellow', 'green', 'orange', 'white', 'black')),
  add constraint pitch_games_bibs_differ check (bib_a is null or bib_b is null or bib_a <> bib_b);

-- Rewrites the teams post from the current sides, keeping earlier swap and add notes, then appends one more.
create or replace function public.append_teams_post_note(p_matchday uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  played timestamptz;
  post record;
  notes text;
begin
  select played_at into played from matchdays where id = p_matchday;
  select id, content into post from posts where kind = 'teams' and matchday_id = p_matchday order by created_at desc limit 1;
  if post.id is null then
    return;
  end if;
  select string_agg(l, E'\n') into notes
  from regexp_split_to_table(post.content, E'\n') l where l like '_Swap:%' or l like '_Added:%';
  update posts set content =
    '**Teams are out for ' || to_char(played at time zone 'Africa/Lagos', 'Dy FMDD Mon') || '.**' || E'\n\n'
    || drawn_teams_lines(p_matchday) || E'\n\n'
    || coalesce(notes || E'\n', '')
    || p_note
  where id = post.id;
end;
$$;
revoke execute on function public.append_teams_post_note(uuid, text) from public, anon, authenticated;

create or replace function public.swap_team_player(p_team uuid, p_out uuid, p_in uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  md uuid;
  clash text;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can swap players' using errcode = '42501';
  end if;
  select t.matchday_id into md from teams t where t.id = p_team;

  select t.greek_name into clash from team_members tm join teams t on t.id = tm.team_id
  where t.matchday_id = md and tm.player_id = p_in;
  if clash is not null then
    raise exception '% is already on %', (select nickname from players where id = p_in), clash;
  end if;

  update team_members set player_id = p_in where team_id = p_team and player_id = p_out;
  if not found then
    raise exception 'That player isn''t on this team';
  end if;

  -- The spot travels with the swap, unless the incoming player already holds one.
  if not player_is_monthly_member_for(p_in, md)
     and not exists (select 1 from weekly_claims where matchday_id = md and player_id = p_in) then
    update weekly_claims set player_id = p_in where matchday_id = md and player_id = p_out;
  end if;

  perform append_teams_post_note(md, '_Swap: ' || mention_token(p_in) || ' in for ' || mention_token(p_out) || '._');
end;
$$;

-- A late arrival or a guest joins a side. No spot moves: they didn't hold one.
create or replace function public.add_team_player(p_team uuid, p_in uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  md uuid;
  team_name text;
  clash text;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can add players to a team' using errcode = '42501';
  end if;
  select t.matchday_id, t.greek_name into md, team_name from teams t where t.id = p_team;
  if md is null then
    raise exception 'That team doesn''t exist';
  end if;

  select t.greek_name into clash from team_members tm join teams t on t.id = tm.team_id
  where t.matchday_id = md and tm.player_id = p_in;
  if clash is not null then
    raise exception '% is already on %', (select nickname from players where id = p_in), clash;
  end if;

  insert into team_members (team_id, player_id) values (p_team, p_in);

  perform append_teams_post_note(md, '_Added: ' || mention_token(p_in) || ' joins ' || team_name || '._');
end;
$$;
revoke execute on function public.add_team_player(uuid, uuid) from public, anon;
