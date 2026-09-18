-- RLS for the Community feed and Articles index. Posts/likes/mentions carry
-- no anonymity requirement (unlike ratings/MOTM) — authorship is the whole
-- point of a feed post — so plain public SELECT + own-row INSERT is enough.
-- Deliberately NOT included: tag-creation voting ("three votes and it's
-- real") — that rule is still unconfirmed per the design's own open
-- questions, so the tag pool stays read-only until Raphael decides it.

create policy posts_select_all on posts for select to authenticated using (true);
create policy posts_insert_own on posts for insert to authenticated
  with check (author_id = (select id from players where user_id = auth.uid()));

create policy post_likes_select_all on post_likes for select to authenticated using (true);
create policy post_likes_insert_own on post_likes for insert to authenticated
  with check (player_id = (select id from players where user_id = auth.uid()));
create policy post_likes_delete_own on post_likes for delete to authenticated
  using (player_id = (select id from players where user_id = auth.uid()));

create policy post_mentions_select_all on post_mentions for select to authenticated using (true);

create policy articles_select_all on articles for select to authenticated using (true);

-- Aggregate career stats for every player in one round trip — the
-- Rankings leaderboard and Players grid both need this across the whole
-- roster, and doing it as N per-player queries would be a real N+1 (see
-- project notes on this exact pitfall). SECURITY DEFINER purely to avoid
-- re-deriving four separate joins client-side, not for any anonymity
-- reason — none of these numbers are sensitive.
create function player_career_stats()
returns table (
  player_id uuid,
  appearances bigint,
  goals bigint,
  assists bigint,
  motm_count bigint,
  avg_rating numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with apps as (
    select player_id, count(*) as n from match_players group by player_id
  ),
  scored as (
    select scorer_id as player_id, count(*) as n from goals group by scorer_id
  ),
  assisted as (
    select assist_id as player_id, count(*) as n from goals where assist_id is not null group by assist_id
  ),
  motm_per_matchday as (
    select distinct on (matchday_id) matchday_id, nominee_id, vote_count
    from matchday_motm_summary()
    order by matchday_id, vote_count desc
  ),
  motm as (
    select nominee_id as player_id, count(*) as n from motm_per_matchday group by nominee_id
  ),
  avg_ratings as (
    select subject_id as player_id, round(avg(score), 1) as avg_rating
    from ratings
    group by subject_id
  )
  select
    p.id as player_id,
    coalesce(apps.n, 0) as appearances,
    coalesce(scored.n, 0) as goals,
    coalesce(assisted.n, 0) as assists,
    coalesce(motm.n, 0) as motm_count,
    avg_ratings.avg_rating
  from players p
  left join apps on apps.player_id = p.id
  left join scored on scored.player_id = p.id
  left join assisted on assisted.player_id = p.id
  left join motm on motm.player_id = p.id
  left join avg_ratings on avg_ratings.player_id = p.id;
$$;

revoke all on function player_career_stats() from public;
grant execute on function player_career_stats() to authenticated;
