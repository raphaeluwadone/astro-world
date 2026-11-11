-- A Pitch-side swap moves the weekly claim to whoever comes in and rewrites the teams post to match.

create or replace function public.drawn_teams_lines(p_matchday uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select string_agg(line, E'\n' order by ord)
  from (
    select team_order(t.greek_name) as ord,
      '**' || t.greek_name || ':** ' || string_agg(mention_token(tm.player_id), ', ' order by p.nickname) as line
    from teams t
    join team_members tm on tm.team_id = t.id
    join players p on p.id = tm.player_id
    where t.matchday_id = p_matchday
    group by t.id, t.greek_name
  ) lines;
$$;

create or replace function public.post_drawn_teams()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  body text := drawn_teams_lines(new.id);
begin
  if new.status <> 'drawn' or old.status = 'drawn' or body is null then
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

create or replace function public.swap_team_player(p_team uuid, p_out uuid, p_in uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  md uuid;
  played timestamptz;
  clash text;
  post record;
  notes text;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can swap players' using errcode = '42501';
  end if;
  select t.matchday_id, m.played_at into md, played from teams t join matchdays m on m.id = t.matchday_id where t.id = p_team;

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

  select id, content into post from posts where kind = 'teams' and matchday_id = md order by created_at desc limit 1;
  if post.id is not null then
    select string_agg(l, E'\n') into notes
    from regexp_split_to_table(post.content, E'\n') l where l like '_Swap:%';
    update posts set content =
      '**Teams are out for ' || to_char(played at time zone 'Africa/Lagos', 'Dy FMDD Mon') || '.**' || E'\n\n'
      || drawn_teams_lines(md) || E'\n\n'
      || coalesce(notes || E'\n', '')
      || '_Swap: ' || mention_token(p_in) || ' in for ' || mention_token(p_out) || '._'
    where id = post.id;
  end if;
end;
$$;

revoke execute on function public.swap_team_player(uuid, uuid, uuid) from public, anon;
grant execute on function public.swap_team_player(uuid, uuid, uuid) to authenticated;
