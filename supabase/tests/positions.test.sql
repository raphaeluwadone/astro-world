-- One outfield position, plus GK if they want it.
begin;
select plan(8);

select ok(positions_valid('{}'), 'no position is fine');
select ok(positions_valid('{ATT}'), 'one outfield position is fine');
select ok(positions_valid('{GK}'), 'GK on its own is fine');
select ok(positions_valid('{DEF,GK}'), 'one outfield position plus GK is fine');
select ok(not positions_valid('{DEF,ATT}'), 'two outfield positions are refused');
select ok(not positions_valid('{GK,DEF,UTIL}'), 'GK plus two outfield positions is refused');
select ok(not positions_valid('{GK,GK}'), 'GK twice is refused');

select throws_ok(
  $$insert into players (nickname, full_name, positions) values ('Two Spots', 'Two Spots', '{DEF,ATT}')$$,
  '23514', null, 'the players table refuses two outfield positions'
);

select * from finish();
rollback;
