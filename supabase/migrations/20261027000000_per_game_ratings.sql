-- Players can rate each game a teammate or opponent played, give one rating for the whole day, or both.
-- Every score a rater gives a player that day (per game or whole day) averages into their one `ratings` row,
-- which is what every stat reads.

create table rating_inputs (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references matchdays(id) on delete cascade,
  rater_id uuid not null references players(id) on delete cascade,
  subject_id uuid not null references players(id) on delete cascade,
  -- A Pitch-side game, or a filed match when the day had no Pitch-side games. Null is the whole-day rating.
  game_id uuid,
  score numeric not null check (score >= 1 and score <= 10 and (score * 2) % 1 = 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (rater_id <> subject_id),
  unique nulls not distinct (matchday_id, rater_id, subject_id, game_id)
);
alter table rating_inputs enable row level security;
create policy rating_inputs_select_own on rating_inputs for select using (is_own_player(rater_id));
grant select on rating_inputs to authenticated;

insert into rating_inputs (matchday_id, rater_id, subject_id, game_id, score, created_at, updated_at)
select matchday_id, rater_id, subject_id, null, score, created_at, updated_at from ratings;

-- Averages land between half steps.
alter table ratings drop constraint ratings_score_check;
alter table ratings add constraint ratings_score_check check (score >= 1 and score <= 10);

-- The day's games in order: Pitch-side games that have ended, or the filed matches if there were none.
create or replace function public.rating_games(p_matchday uuid)
returns table(game_id uuid, game_no int, team_a_id uuid, team_b_id uuid, score_a int, score_b int)
language sql
stable security definer
set search_path to 'public'
as $$
  with pitch as (
    select g.id, g.team_a_id, g.team_b_id, g.created_at
    from pitch_games g
    where g.matchday_id = p_matchday and g.ended_at is not null
  )
  select p.id, (row_number() over (order by p.created_at))::int, p.team_a_id, p.team_b_id,
    (select count(*) from pitch_goals pg where pg.game_id = p.id and pg.team_id = p.team_a_id)::int,
    (select count(*) from pitch_goals pg where pg.game_id = p.id and pg.team_id = p.team_b_id)::int
  from pitch p
  union all
  select m.id, (row_number() over (order by m.played_at, m.id))::int, m.team_a_id, m.team_b_id, m.score_a, m.score_b
  from matches m
  where m.matchday_id = p_matchday and not exists (select 1 from pitch)
  order by 2;
$$;

create or replace function public.rating_game_players(p_matchday uuid)
returns table(game_id uuid, player_id uuid, team_id uuid)
language sql
stable security definer
set search_path to 'public'
as $$
  select g.game_id, tm.player_id, tm.team_id
  from rating_games(p_matchday) g
  join pitch_games pg on pg.id = g.game_id
  join team_members tm on tm.team_id in (g.team_a_id, g.team_b_id)
  where not exists (select 1 from pitch_checkins c where c.matchday_id = p_matchday)
     or exists (select 1 from pitch_checkins c where c.matchday_id = p_matchday and c.player_id = tm.player_id)
  union all
  select g.game_id, mp.player_id, mp.team_id
  from rating_games(p_matchday) g
  join match_players mp on mp.match_id = g.game_id;
$$;
grant execute on function public.rating_games(uuid) to anon, authenticated;
grant execute on function public.rating_game_players(uuid) to anon, authenticated;

drop function public.rate_player(uuid, uuid, numeric);

-- A null score clears that rating.
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
  elsif not exists (select 1 from rating_game_players(p_matchday) g where g.game_id = p_game and g.player_id = p_subject) then
    raise exception 'That player wasn''t in that game';
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
revoke execute on function public.rate_player(uuid, uuid, numeric, uuid) from public, anon;
grant execute on function public.rate_player(uuid, uuid, numeric, uuid) to authenticated;

create or replace function public.sync_day_rating()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r rating_inputs := coalesce(new, old);
  day_score numeric;
begin
  select round(avg(score), 2) into day_score
  from rating_inputs
  where matchday_id = r.matchday_id and rater_id = r.rater_id and subject_id = r.subject_id;

  if day_score is null then
    delete from ratings where matchday_id = r.matchday_id and rater_id = r.rater_id and subject_id = r.subject_id;
  else
    insert into ratings (match_id, matchday_id, rater_id, subject_id, score)
    values (rating_match_for(r.matchday_id, r.subject_id), r.matchday_id, r.rater_id, r.subject_id, day_score)
    on conflict (matchday_id, rater_id, subject_id)
    do update set score = excluded.score, match_id = coalesce(excluded.match_id, ratings.match_id);
  end if;
  return null;
end;
$$;

create trigger rating_inputs_sync_day_rating
after insert or update or delete on rating_inputs
for each row execute function sync_day_rating();
