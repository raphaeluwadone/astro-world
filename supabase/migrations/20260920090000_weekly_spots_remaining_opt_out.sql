-- Real bug, found live while testing the weekly-claims flow just built:
-- weekly_spots_remaining() counted every monthly member as occupying a
-- spot regardless of whether they'd opted out of this specific Sunday
-- (availability.status = 'out'). Rule 1.6 says an opted-out monthly
-- spot goes to standby for that week, but with the old function nobody
-- could actually claim it: the RLS check never saw the spot as free.
create or replace function weekly_spots_remaining(p_matchday_id uuid)
returns int
language sql
security definer
set search_path = public
stable
as $$
  select md.capacity
    - (
        select count(*) from monthly_memberships mm
        where mm.month = date_trunc('month', md.played_at)::date
          and not exists (
            select 1 from availability a
            where a.matchday_id = md.id
              and a.player_id = mm.player_id
              and a.status = 'out'
          )
      )
    - (select count(*) from weekly_claims wc where wc.matchday_id = md.id)
  from matchdays md
  where md.id = p_matchday_id;
$$;
