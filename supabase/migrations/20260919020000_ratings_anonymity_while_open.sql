-- Real anonymity leak, not just a UI nicety: match_ratings_summary and
-- match_ratings_integrity had no time gate at all, so a per-player average
-- and the match-wide voter count were readable live while votes were still
-- trickling in. Watching a count go from 0 to 1 (or an average shift on
-- each increment) recovers individual votes in exactly the small-n way the
-- anonymity design was supposed to prevent. Fix: these aggregates now only
-- reveal real numbers once ratings_open_for() is false for that match,
-- server-side, so it can't be bypassed by calling the RPC directly.

create or replace function match_ratings_summary()
returns table (match_id uuid, subject_id uuid, avg_rating numeric, vote_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select r.match_id, r.subject_id, round(avg(r.score), 1) as avg_rating, count(*) as vote_count
  from ratings r
  where not ratings_open_for(r.match_id)
  group by r.match_id, r.subject_id;
$$;

create or replace function match_ratings_integrity(p_match_id uuid)
returns table (voter_count bigint, match_avg numeric, lowest_avg numeric)
language sql
security definer
set search_path = public
stable
as $$
  with per_subject as (
    select subject_id, avg(score) as subj_avg
    from ratings
    where match_id = p_match_id
    group by subject_id
  )
  select
    case when ratings_open_for(p_match_id) then null
      else (select count(distinct rater_id) from ratings where match_id = p_match_id) end,
    case when ratings_open_for(p_match_id) then null
      else (select round(avg(score), 1) from ratings where match_id = p_match_id) end,
    case when ratings_open_for(p_match_id) then null
      else (select round(min(subj_avg), 1) from per_subject) end;
$$;
