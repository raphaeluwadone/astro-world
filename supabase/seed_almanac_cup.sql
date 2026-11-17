-- The first Salami Cup (1 October 2026), from the almanac (data/league-2025-26.json).
-- Data, not schema. Apply once after the cup_recap migration, e.g.
--   supabase db query --remote -f supabase/seed_almanac_cup.sql
-- Safe to run again: does nothing if a cup labelled Q4 2026 already exists.
-- No match results are recorded, so the table, MVP and scorers live in cup_quarters.recap.
do $$
declare
  cup uuid;
  mvp uuid;
begin
  if exists (select 1 from cup_quarters where label = 'Q4 2026') then
    return;
  end if;

  select id into mvp from players where lower(nickname) = lower('zeazou');

  insert into cup_quarters (label, venue, scheduled_at, entries_close_at, withdrawal_deadline, status, recap)
  values (
    'Q4 2026', 'Gbaja Boys HS, Surulere',
    '2026-10-01 07:45+01', '2026-09-28 20:00+01', '2026-09-30 19:00+01', 'played',
    jsonb_build_object(
      'champion', 'Predators FC',
      'champion_note', 'Level on pts and GD (+2) with Hawks • Champions on goals scored',
      'format', 'Round Robin • 15 games • 6 clubs',
      'totals', '{"g": 24, "a": 15, "cs": 13, "games": 15}'::jsonb,
      'table', '[{"club":"Predators FC","p":5,"w":3,"d":1,"l":1,"gf":5,"ga":3,"gd":2,"pts":10,"cs":3},{"club":"Hawks FC","p":5,"w":3,"d":1,"l":1,"gf":4,"ga":2,"gd":2,"pts":10,"cs":3},{"club":"Sons of Pitches FC","p":5,"w":3,"d":0,"l":2,"gf":7,"ga":4,"gd":3,"pts":9,"cs":2},{"club":"Plug & Playmakers FC","p":5,"w":2,"d":2,"l":1,"gf":4,"ga":3,"gd":1,"pts":8,"cs":3},{"club":"The Syndicate FC","p":5,"w":0,"d":2,"l":3,"gf":1,"ga":4,"gd":-3,"pts":2,"cs":1},{"club":"Crexas FC","p":5,"w":0,"d":2,"l":3,"gf":3,"ga":8,"gd":-5,"pts":2,"cs":1}]'::jsonb,
      'mvp', jsonb_build_object('player_id', mvp, 'nickname', (select nickname from players where id = mvp), 'club', 'Predators FC', 'tag', '2G + 1A • 5 Games • Cup Winner', 'text', 'Debo was the difference for the champions, two goals and an assist in five games. With Predators and Hawks level on points and goal difference, the cup came down to goals scored, so every one of his counted. Yaya matched his 3 G+A, but the MVP goes to the standout from the side that lifted the trophy.'),
      'scorers', (select coalesce(jsonb_agg(jsonb_build_object('player_id', p.id, 'nickname', p.nickname, 'club', x.club, 'v', x.v) order by x.v desc, p.nickname), '[]'::jsonb)
         from (values
      ('oreos', 'Sons of Pitches', 3),
      ('Yaya', 'Sons of Pitches', 3),
      ('Oliver', 'Plug & Playmakers', 2),
      ('Tobi', 'Predators FC', 2),
      ('zeazou', 'Predators FC', 2),
      ('DB', 'Hawks FC', 2)
    ) as x(nick, club, v) join players p on lower(p.nickname) = lower(x.nick)),
      'assisters', (select coalesce(jsonb_agg(jsonb_build_object('player_id', p.id, 'nickname', p.nickname, 'club', x.club, 'v', x.v) order by x.v desc, p.nickname), '[]'::jsonb)
         from (values
      ('Uzkhov', 'Hawks FC', 2),
      ('Fred', 'Plug & Playmakers', 2),
      ('Dan J', 'Sons of Pitches', 1),
      ('Yaya', 'Sons of Pitches', 1),
      ('Emmanuel', 'Plug & Playmakers', 1)
    ) as x(nick, club, v) join players p on lower(p.nickname) = lower(x.nick))
    )
  ) returning id into cup;

  insert into cup_squads (cup_quarter_id, name, colour)
  select cup, v.name, v.colour from (values
    ('Predators FC', '#a63fff'),
    ('Hawks FC', '#38bdf8'),
    ('Sons of Pitches FC', '#4ade80'),
    ('Plug & Playmakers FC', '#f2a93b'),
    ('The Syndicate FC', '#e0483f'),
    ('Crexas FC', '#f472b6')
  ) as v(name, colour);

  insert into cup_squad_players (cup_squad_id, player_id)
  select sq.id, p.id
  from (values
    ('Predators FC', 'zeazou'),
    ('Predators FC', 'Gbaja'),
    ('Predators FC', 'Triumph'),
    ('Predators FC', 'Leonard'),
    ('Predators FC', 'Gbolahan'),
    ('Predators FC', 'Tobi'),
    ('Predators FC', 'Mustee'),
    ('Hawks FC', 'Uzkhov'),
    ('Hawks FC', 'Ajegs'),
    ('Hawks FC', 'Dozie'),
    ('Hawks FC', 'Vinny'),
    ('Hawks FC', 'Dante'),
    ('Hawks FC', 'Delani'),
    ('Hawks FC', 'Allison'),
    ('Sons of Pitches FC', 'Yaya'),
    ('Sons of Pitches FC', 'Dan J'),
    ('Sons of Pitches FC', 'Bass'),
    ('Sons of Pitches FC', 'Laru'),
    ('Sons of Pitches FC', 'oreos'),
    ('Sons of Pitches FC', 'Wale'),
    ('Sons of Pitches FC', 'Famade'),
    ('Plug & Playmakers FC', 'Ette'),
    ('Plug & Playmakers FC', 'Oliver'),
    ('Plug & Playmakers FC', 'Oreva'),
    ('Plug & Playmakers FC', 'Joe'),
    ('Plug & Playmakers FC', 'Emmanuel'),
    ('Plug & Playmakers FC', 'Fred'),
    ('Plug & Playmakers FC', 'Skinny N'),
    ('The Syndicate FC', 'Chukkie'),
    ('The Syndicate FC', 'Tony Vodka'),
    ('The Syndicate FC', 'Machado'),
    ('The Syndicate FC', 'Seyi'),
    ('The Syndicate FC', 'Mayor'),
    ('The Syndicate FC', 'Julius'),
    ('The Syndicate FC', 'Willis'),
    ('Crexas FC', 'Tomi'),
    ('Crexas FC', 'George'),
    ('Crexas FC', 'Ebuka'),
    ('Crexas FC', 'Olamide'),
    ('Crexas FC', 'Bald Hermit'),
    ('Crexas FC', 'Black and fly'),
    ('Crexas FC', 'Killz')
  ) as m(club, nick)
  join cup_squads sq on sq.cup_quarter_id = cup and sq.name = m.club
  join players p on lower(p.nickname) = lower(m.nick);

  -- Silverware for the champions' squad, and the MVP badge.
  insert into player_badges (player_id, badge_key, period_key, detail, awarded_at, expires_at, status, auto_live_at)
  select csp.player_id, 'silverware', cup::text, 'Won the Q4 2026 Salami Cup with Predators FC',
         '2026-10-01 07:45+01', '2027-10-01 07:45+01', 'live', '2026-10-01 07:45+01'
  from cup_squads sq join cup_squad_players csp on csp.cup_squad_id = sq.id
  where sq.cup_quarter_id = cup and sq.name = 'Predators FC'
  on conflict do nothing;

  if mvp is not null then
    insert into player_badges (player_id, badge_key, period_key, detail, awarded_at, expires_at, status, auto_live_at)
    values (mvp, 'cup-mvp', cup::text, 'Cup MVP, Q4 2026', '2026-10-01 07:45+01', '2027-10-01 07:45+01', 'live', '2026-10-01 07:45+01')
    on conflict do nothing;
  end if;
end $$;
