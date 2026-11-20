-- Pressing Done on a game locks that rater's scores for it. The whole-day rating stays changeable until ratings close.

create table rating_games_done (
  matchday_id uuid not null references matchdays(id) on delete cascade,
  rater_id uuid not null references players(id) on delete cascade,
  game_id uuid not null,
  done_at timestamptz not null default now(),
  primary key (matchday_id, rater_id, game_id)
);
alter table rating_games_done enable row level security;
create policy rating_games_done_select_own on rating_games_done for select using (is_own_player(rater_id));
grant select on rating_games_done to authenticated;

create or replace function public.finish_game_ratings(p_matchday uuid, p_game uuid)
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
  if not exists (select 1 from rating_games(p_matchday) g where g.game_id = p_game) then
    raise exception 'That game isn''t open for ratings';
  end if;
  insert into rating_games_done (matchday_id, rater_id, game_id) values (p_matchday, me, p_game)
  on conflict do nothing;
end;
$$;
revoke execute on function public.finish_game_ratings(uuid, uuid) from public, anon;
grant execute on function public.finish_game_ratings(uuid, uuid) to authenticated;

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
    if exists (select 1 from rating_games_done d where d.matchday_id = p_matchday and d.rater_id = me and d.game_id = p_game) then
      raise exception 'You''ve locked in your ratings for that game';
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
