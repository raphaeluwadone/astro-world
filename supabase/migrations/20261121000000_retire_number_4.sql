-- Number 4 was Ade Salami's. It is retired, so nobody can set it as their favourite number.
alter table public.players
  add constraint players_number_4_retired check (favourite_number is distinct from 4);
