-- The memorial page for Ade Salami ("His page is always in the sidebar.
-- Tributes are open for good." from onboarding step 5). Tributes carry no
-- anonymity requirement, same reasoning as posts: authorship is the point.

create table tributes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references players (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index tributes_created_at_idx on tributes (created_at desc);

alter table tributes enable row level security;

create policy tributes_select_all on tributes for select to authenticated using (true);
create policy tributes_insert_own on tributes for insert to authenticated
  with check (author_id = (select id from players where user_id = auth.uid()));
