-- Ratings open as soon as a Pitch-side game ends, not once the admin files the day's results.
-- A rating made before filing has no match yet; filing attaches it.

alter table ratings drop constraint ratings_pkey;
alter table ratings alter column match_id drop not null;
alter table ratings add constraint ratings_pkey primary key using index ratings_one_per_matchday;

create or replace function public.set_rating_matchday()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.match_id is not null then
    new.matchday_id := (select matchday_id from matches where id = new.match_id);
  end if;
  return new;
end;
$$;

-- Who played in an ended Pitch-side game: the two sides' members, narrowed to the checked-in when anyone checked in.
create or replace function public.ended_game_roster(p_matchday uuid)
returns table(player_id uuid, team_id uuid, ended_at timestamptz)
language sql
stable security definer
set search_path to 'public'
as $$
  select tm.player_id, tm.team_id, max(g.ended_at)
  from pitch_games g
  join team_members tm on tm.team_id in (g.team_a_id, g.team_b_id)
  where g.matchday_id = p_matchday
    and g.ended_at is not null
    and (
      not exists (select 1 from pitch_checkins c where c.matchday_id = p_matchday)
      or exists (select 1 from pitch_checkins c where c.matchday_id = p_matchday and c.player_id = tm.player_id)
    )
  group by tm.player_id, tm.team_id;
$$;
revoke all on function public.ended_game_roster(uuid) from public, anon, authenticated;

create or replace function public.matchday_rating_roster(p_matchday uuid)
returns table(player_id uuid, team_id uuid, greek_name text, colour text)
language sql
stable security definer
set search_path to 'public'
as $$
  select distinct on (r.player_id) r.player_id, t.id, t.greek_name, t.colour
  from (
    select mp.player_id, mp.team_id, m.played_at as at
    from match_players mp join matches m on m.id = mp.match_id
    where m.matchday_id = p_matchday
    union all
    select e.player_id, e.team_id, e.ended_at from ended_game_roster(p_matchday) e
    where not exists (select 1 from matches m where m.matchday_id = p_matchday)
  ) r
  join teams t on t.id = r.team_id
  order by r.player_id, r.at desc;
$$;

create or replace function public.rating_matchday()
returns table(matchday_id uuid, played_at timestamptz, venue text, closes_at timestamptz, is_open boolean, part_of boolean, open_to_everyone boolean, can_rate boolean)
language sql
stable security definer
set search_path to 'public'
as $$
  with md as (
    select md.id, md.played_at, md.venue from matchdays md
    where (md.status = 'played' and exists (select 1 from matches m where m.matchday_id = md.id))
       or (md.status not in ('played', 'cancelled') and exists (select 1 from pitch_games g where g.matchday_id = md.id and g.ended_at is not null))
    order by md.played_at desc limit 1
  ),
  s as (select open_to_everyone from rating_settings)
  select md.id, md.played_at, md.venue, voting_closes_at(md.played_at), matchday_ratings_open(md.id),
         coalesce(part_of_matchday(requesting_player_id(), md.id), false), s.open_to_everyone,
         requesting_player_id() is not null and matchday_ratings_open(md.id)
           and (s.open_to_everyone or coalesce(part_of_matchday(requesting_player_id(), md.id), false))
  from md, s;
$$;

create or replace function public.rate_player(p_matchday uuid, p_subject uuid, p_score numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := requesting_player_id();
  game uuid;
begin
  if me is null then
    raise exception 'Sign in to rate' using errcode = '42501';
  end if;
  if me = p_subject then
    raise exception 'You can''t rate yourself';
  end if;
  if not coalesce(matchday_ratings_open(p_matchday), false) then
    raise exception 'Ratings for this matchday are closed';
  end if;
  if not (select open_to_everyone from rating_settings) and not part_of_matchday(me, p_matchday) then
    raise exception 'Ratings are open to players from this matchday only' using errcode = '42501';
  end if;
  if not exists (select 1 from matchday_rating_roster(p_matchday) r where r.player_id = p_subject) then
    raise exception 'That player didn''t play this matchday';
  end if;
  game := rating_match_for(p_matchday, p_subject);
  insert into ratings (match_id, matchday_id, rater_id, subject_id, score)
  values (game, p_matchday, me, p_subject, p_score)
  on conflict (matchday_id, rater_id, subject_id)
  do update set score = excluded.score, match_id = coalesce(excluded.match_id, ratings.match_id);
end;
$$;

-- Filing the results gives early ratings their match.
create or replace function public.attach_early_ratings()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update ratings r set match_id = new.match_id
  from matches m
  where m.id = new.match_id and r.matchday_id = m.matchday_id and r.subject_id = new.player_id and r.match_id is null;
  return null;
end;
$$;

create trigger match_players_attach_early_ratings
after insert on match_players
for each row execute function attach_early_ratings();
