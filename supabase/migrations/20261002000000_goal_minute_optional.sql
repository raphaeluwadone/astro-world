-- Results are filed per team without a match minute.
alter table public.goals alter column minute drop not null;
