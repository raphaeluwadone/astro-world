-- Default playstyles and traits for the dry run. Data, not schema: apply once with psql or
-- `supabase db query --remote -f`. Safe to run again. All are pre-approved, so testers can
-- tag themselves (two each) and vote them onto each other (three votes) straight away.
-- Needs at least one admin player, who is recorded as the creator.
insert into tags (label, created_by, is_approved, approved_at)
select l, a.id, true, now()
from (values
  -- Playstyles
  ('Target Man'), ('Poacher'), ('Playmaker'), ('Speedster'), ('Engine Room'), ('Ball Winner'),
  ('Dribble Wizard'), ('One-Touch Passer'), ('Long Shot Merchant'), ('Set-Piece Menace'),
  ('Wall at the Back'), ('Sweeper Keeper'), ('Tireless Runner'), ('Safe Hands'), ('Shakpa'),
  ('Fox in the Box'), ('GeGe'),
  -- Traits
  ('EnuPoor'), ('Tardiness 101'), ('ParaMode'), ('HeroBall'), ('TheSaint'), ('Silent Assassin'),
  ('Fresh Legs'), ('KeypadWarrior'), ('EarlyBirdie'), ('VibeKing'), ('Brings the Oranges'),
  ('CryBaby'), ('Big Game Player'), ('Skippo'), ('HypeMan'), ('Arthritis'), ('Moaner'),
  ('TheClown'), ('Aged'), ('SeniorCitizen')
) as t(l)
cross join lateral (select id from players where is_admin order by joined_at limit 1) a
on conflict do nothing;
