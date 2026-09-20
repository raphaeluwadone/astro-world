-- The real "I Am Him"/"You Are Him" drop rule from Astro App.dc.html:
-- fifteen votes net underwater (not raw downvotes, a bold pick that
-- gets people talking shouldn't die of traffic) and a claim drops.
-- Soft-deleted via dropped_at rather than actually removed: the empty
-- slot's copy names who got voted off and when, which needs the row
-- to still exist. Enforced by trigger, not client code, for the same
-- reason RLS is the real boundary everywhere else in this schema: a
-- vote can come from any authenticated player's own insert/update/
-- delete, and the drop has to happen regardless of which client sent it.
alter table player_comparisons add column dropped_at timestamptz;

create or replace function check_comparison_drop_threshold() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid := coalesce(new.comparison_id, old.comparison_id);
  net int;
begin
  select coalesce(sum(case when direction = 'up' then 1 when direction = 'down' then -1 else 0 end), 0)
    into net
    from comparison_votes
    where comparison_id = target_id;

  if net <= -15 then
    update player_comparisons set dropped_at = now() where id = target_id and dropped_at is null;
  end if;

  return null;
end;
$$;

create trigger comparison_votes_check_drop
after insert or update or delete on comparison_votes
for each row execute function check_comparison_drop_threshold();
