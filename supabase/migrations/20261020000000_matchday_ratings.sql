-- Ratings are per matchday: anyone from the matchday rates any player who played it, once.
-- Admins can open rating to every member. Each rating is stored against the subject's last game that day.

create table rating_settings (
  id boolean primary key default true check (id),
  open_to_everyone boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into rating_settings default values;
alter table rating_settings enable row level security;
create policy rating_settings_read on rating_settings for select to authenticated using (true);
create policy rating_settings_admin on rating_settings for update to authenticated using (is_requesting_admin()) with check (is_requesting_admin());

-- The window runs from the matchday itself, not from when its results were filed.
create or replace function public.matchday_ratings_open(p_matchday uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select now() < voting_closes_at(played_at) from matchdays where id = p_matchday;
$$;

create or replace function public.ratings_open_for(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select matchday_ratings_open(matchday_id) from matches where id = p_match_id;
$$;

create or replace function public.part_of_matchday(p_player uuid, p_matchday uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from match_players mp join matches m on m.id = mp.match_id where m.matchday_id = p_matchday and mp.player_id = p_player)
      or exists (select 1 from team_members tm join teams t on t.id = tm.team_id where t.matchday_id = p_matchday and tm.player_id = p_player);
$$;

create or replace function public.rating_match_for(p_matchday uuid, p_subject uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.id from matches m join match_players mp on mp.match_id = m.id
  where m.matchday_id = p_matchday and mp.player_id = p_subject
  order by m.played_at desc, m.id desc limit 1;
$$;

alter table ratings add column matchday_id uuid references matchdays(id) on delete cascade;

-- One rating per rater, subject and matchday: keep the latest, on the subject's last game.
create temp table kept_ratings on commit drop as
select distinct on (r.rater_id, r.subject_id, m.matchday_id)
  m.matchday_id, rating_match_for(m.matchday_id, r.subject_id) as match_id, r.rater_id, r.subject_id, r.score, r.created_at, r.updated_at
from ratings r join matches m on m.id = r.match_id
order by r.rater_id, r.subject_id, m.matchday_id, r.updated_at desc;
delete from ratings;
insert into ratings (matchday_id, match_id, rater_id, subject_id, score, created_at, updated_at)
select matchday_id, match_id, rater_id, subject_id, score, created_at, updated_at from kept_ratings;

create or replace function public.set_rating_matchday()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.matchday_id := (select matchday_id from matches where id = new.match_id);
  return new;
end;
$$;
create trigger ratings_set_matchday before insert or update of match_id on ratings
for each row execute function set_rating_matchday();

alter table ratings alter column matchday_id set not null;
create unique index ratings_one_per_matchday on ratings (matchday_id, rater_id, subject_id);

-- Writes go through rate_player.
drop policy ratings_insert_own on ratings;
drop policy ratings_update_own on ratings;

create or replace function public.rate_player(p_matchday uuid, p_subject uuid, p_score numeric)
returns void
language plpgsql
security definer
set search_path = public
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
  game := rating_match_for(p_matchday, p_subject);
  if game is null then
    raise exception 'That player didn''t play this matchday';
  end if;
  insert into ratings (match_id, rater_id, subject_id, score)
  values (game, me, p_subject, p_score)
  on conflict (matchday_id, rater_id, subject_id) do update set score = excluded.score, match_id = excluded.match_id;
end;
$$;
revoke execute on function public.rate_player(uuid, uuid, numeric) from public, anon;
grant execute on function public.rate_player(uuid, uuid, numeric) to authenticated;

-- The matchday the rating page is about: the latest one with filed games, and whether the caller can rate it.
create or replace function public.rating_matchday()
returns table (matchday_id uuid, played_at timestamptz, venue text, closes_at timestamptz, is_open boolean, part_of boolean, open_to_everyone boolean, can_rate boolean)
language sql
stable
security definer
set search_path = public
as $$
  with md as (
    select md.id, md.played_at, md.venue from matchdays md
    where md.status = 'played' and exists (select 1 from matches m where m.matchday_id = md.id)
    order by md.played_at desc limit 1
  ),
  s as (select open_to_everyone from rating_settings)
  select md.id, md.played_at, md.venue, voting_closes_at(md.played_at), matchday_ratings_open(md.id),
         coalesce(part_of_matchday(requesting_player_id(), md.id), false), s.open_to_everyone,
         requesting_player_id() is not null and matchday_ratings_open(md.id)
           and (s.open_to_everyone or coalesce(part_of_matchday(requesting_player_id(), md.id), false))
  from md, s;
$$;
grant execute on function public.rating_matchday() to authenticated;

-- Every player who played the matchday, with their team.
create or replace function public.matchday_rating_roster(p_matchday uuid)
returns table (player_id uuid, team_id uuid, greek_name text, colour text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (mp.player_id) mp.player_id, t.id, t.greek_name, t.colour
  from match_players mp
  join matches m on m.id = mp.match_id
  join teams t on t.id = mp.team_id
  where m.matchday_id = p_matchday
  order by mp.player_id, m.played_at desc;
$$;
grant execute on function public.matchday_rating_roster(uuid) to authenticated;

-- A player's matchday rating shows on every game they played that day.
create or replace function public.match_ratings_summary()
returns table (match_id uuid, subject_id uuid, avg_rating numeric, vote_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with per_day as (
    select r.matchday_id, r.subject_id, round(avg(r.score), 1) as avg_rating, count(*) as vote_count
    from ratings r
    where not matchday_ratings_open(r.matchday_id)
    group by r.matchday_id, r.subject_id
  )
  select mp.match_id, d.subject_id, d.avg_rating, d.vote_count
  from per_day d
  join matches m on m.matchday_id = d.matchday_id
  join match_players mp on mp.match_id = m.id and mp.player_id = d.subject_id;
$$;

create or replace function public.match_ratings_integrity(p_match_id uuid)
returns table (voter_count bigint, match_avg numeric, lowest_avg numeric)
language sql
stable
security definer
set search_path = public
as $$
  with day as (select matchday_id from matches where id = p_match_id),
  players as (select player_id from match_players where match_id = p_match_id),
  r as (
    select ratings.* from ratings, day
    where ratings.matchday_id = day.matchday_id and ratings.subject_id in (select player_id from players)
  ),
  per_subject as (select subject_id, avg(score) as subj_avg from r group by subject_id)
  select
    case when ratings_open_for(p_match_id) then null else (select count(distinct rater_id) from r) end,
    case when ratings_open_for(p_match_id) then null else (select round(avg(score), 1) from r) end,
    case when ratings_open_for(p_match_id) then null else (select round(min(subj_avg), 1) from per_subject) end;
$$;
