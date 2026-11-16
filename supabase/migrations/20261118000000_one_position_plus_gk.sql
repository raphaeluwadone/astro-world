-- A player has one outfield position (DEF, ATT or UTIL), and may add GK on top. GK alone is fine too.
-- Existing rows with several outfield positions keep the first one listed (and GK if they had it), outfield first.
update players p
set positions = array_remove(array[
    (select t.x from unnest(p.positions) with ordinality as t(x, i) where t.x <> 'GK' order by t.i limit 1),
    case when 'GK' = any (p.positions) then 'GK'::position_type end
  ], null)
where (select count(*) from unnest(p.positions) as x where x <> 'GK') > 1;

create function positions_valid(p position_type[])
returns boolean
language sql
immutable
as $$
  select coalesce(
    (select count(*) filter (where x <> 'GK') <= 1 and count(*) filter (where x = 'GK') <= 1 from unnest(p) as x),
    true
  );
$$;

alter table players add constraint players_positions_valid check (positions_valid(positions));
