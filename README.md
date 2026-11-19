# Astro

The club app for a 70-player Sunday five-a-side football group: sign-ups, payments, teams, results and the
season's history in one place.

## Features

**Matchday**
- Weekly sign-up where places go to whoever pays first, with a waitlist, drop-outs and a cooldown before reclaiming.
- Captain drafts, bibs and pitch assignment.
- Live results: goals, assists, own goals, cards and clean sheets.
- Player ratings and a Man of the Match vote after every game.

**Money**
- Match fees, quarterly dues and one-off causes (the kitty), paid through Paystack.
- Payment webhooks and a reconcile job keep the books right when a callback goes missing.

**Players and history**
- Profiles with photos, season stats, recent form and head-to-head comparison.
- Rankings, Player of the Month, honours and yearly badges.
- The Salami Cup: a tournament with randomly drawn squads, fixtures, standings and honours.
- Articles, the rules, and a memorial page.

**Admin**
- Approve new members and link them to their existing player record.
- Run matchday, enter results, manage dues, causes, badges and the cup.

## How it's built

- **Web:** React, TypeScript, Vite, TanStack Router and Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TipTap
- **Backend:** Supabase (Postgres, auth, row-level security, edge functions for payments, email and stats)
- **Payments:** Paystack
- **Monitoring and hosting:** Sentry, Netlify

Most of the rules live in Postgres: who can see and change what is enforced by row-level security, and the
trickier flows (claiming a place, swaps, the draft, payments) are database functions with their own SQL tests in
[supabase/tests](supabase/tests).

## Run it locally

Needs Node 22+, Docker and the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
supabase start                    # local Postgres, auth and API
cp .env.example .env.local        # paste the URL and anon key that supabase start prints
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/seed_test_data.sql   # fictional players and matches
npm run dev                       # http://localhost:5173
```

```bash
npm test          # unit tests (Vitest)
npm run test:db   # database tests
npm run lint
```
