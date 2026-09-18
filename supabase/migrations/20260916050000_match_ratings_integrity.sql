-- Aggregate-only function for the Match page's "ratings integrity"
-- panel (voter count, match average, lowest-rated player's average).
-- Same anonymity guarantee as match_ratings_summary/matchday_motm_summary:
-- SECURITY DEFINER so it can read the ratings table regardless of the
-- caller's own RLS-restricted view of it, but the return shape has no
-- rater_id anywhere in it — an aggregate count, never an identity.

create function match_ratings_integrity(p_match_id uuid)
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
    (select count(distinct rater_id) from ratings where match_id = p_match_id),
    (select round(avg(score), 1) from ratings where match_id = p_match_id),
    (select round(min(subj_avg), 1) from per_subject);
$$;

revoke all on function match_ratings_integrity(uuid) from public;
grant execute on function match_ratings_integrity(uuid) to authenticated;
