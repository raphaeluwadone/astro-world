-- Game-by-game ratings are for the matchday itself. From midnight (London) only the whole-day rating can change.
-- Scores already given per game stay in the averages.

create or replace function public.per_game_ratings_open(p_matchday uuid)
returns boolean
language sql
stable
set search_path to 'public'
as $$
  select now() < (((played_at at time zone 'Europe/London')::date + 1)::timestamp at time zone 'Europe/London')
  from matchdays where id = p_matchday;
$$;
grant execute on function public.per_game_ratings_open(uuid) to anon, authenticated;

drop function public.rating_matchday();
create function public.rating_matchday()
returns table(matchday_id uuid, played_at timestamptz, venue text, closes_at timestamptz, is_open boolean, part_of boolean, open_to_everyone boolean, can_rate boolean, per_game_open boolean)
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
           and (s.open_to_everyone or coalesce(part_of_matchday(requesting_player_id(), md.id), false)),
         matchday_ratings_open(md.id) and per_game_ratings_open(md.id)
  from md, s;
$$;
grant execute on function public.rating_matchday() to anon, authenticated;

create or replace function public.rate_player(p_matchday uuid, p_subject uuid, p_score numeric, p_game uuid default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  me uuid := requesting_player_id();
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
  if p_game is null then
    if not exists (select 1 from matchday_rating_roster(p_matchday) r where r.player_id = p_subject) then
      raise exception 'That player didn''t play this matchday';
    end if;
  else
    if not coalesce(per_game_ratings_open(p_matchday), false) then
      raise exception 'Game-by-game ratings closed with the matchday. Give a final rating instead.';
    end if;
    if not exists (select 1 from rating_game_players(p_matchday) g where g.game_id = p_game and g.player_id = p_subject) then
      raise exception 'That player wasn''t in that game';
    end if;
  end if;

  if p_score is null then
    delete from rating_inputs
    where matchday_id = p_matchday and rater_id = me and subject_id = p_subject and game_id is not distinct from p_game;
  else
    insert into rating_inputs (matchday_id, rater_id, subject_id, game_id, score)
    values (p_matchday, me, p_subject, p_game, p_score)
    on conflict (matchday_id, rater_id, subject_id, game_id)
    do update set score = excluded.score, updated_at = now();
  end if;
end;
$$;
