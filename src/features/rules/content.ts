// Placeholder content from the design handoff (Astro App.dc.html), not yet
// confirmed against the group's real rules. Revisit once real content
// arrives (STATUS.md notes a data-collection form went to the client
// covering exactly this).

export const RULE_GLANCE_STATIC: Array<{ k: string; v: string }> = [
  { k: 'Pay for your spot by', v: 'Sat 20:00' },
  { k: 'Teams made', v: 'Game day' },
  { k: 'Selection', v: 'Sun 07:40' },
  { k: 'Kick-off', v: 'Sun 07:45' },
  { k: 'Ratings close', v: 'Tue 23:59' },
  { k: 'Spots per Sunday', v: '30' },
  { k: 'Monthly ten', v: '1st, 08:00' },
  { k: 'Weekly spots', v: '20, first to pay' },
  { k: 'Sides', v: '5 or 6 teams' },
  { k: 'Self-set traits', v: '2 max' },
  { k: 'Salami Cup', v: 'Quarterly' },
]

export interface RuleItem {
  k: string
  text: string
  tag?: string
  tagTone?: 'changed' | 'pending'
}

export interface RuleSection {
  n: string
  title: string
  items: RuleItem[]
}

export const RULE_SECTIONS: RuleSection[] = [
  {
    n: '01',
    title: 'GETTING A SPOT',
    items: [
      { k: '1.1', text: 'Spots open as soon as an admin schedules the matchday. Claim one and pay for it by Saturday 20:00, or it goes to the next person on standby.' },
      { k: '1.2', text: 'No spot, no game. Ghosting is not a maybe.' },
      { k: '1.3', text: 'Pull out before the teams are made and a paid weekly spot is flagged for a refund. After that, tell an admin and find your own replacement.' },
      {
        k: '1.4',
        text: 'Thirty play each Sunday, and they arrive two ways. Ten are the monthly ten. The other twenty are first to pay each week.',
        tag: 'Amended Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '1.5',
        text: 'The monthly ten is first come, first served. Entry opens at 08:00 on the 1st of the month, costs one payment for the whole month, and closes the moment the tenth person pays. You are then in every Sunday that month without claiming a spot each week.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '1.6',
        text: 'If one of the ten cannot make a Sunday, that spot goes to the top of standby for that week only. The month is paid for, not each game, there is no refund for a Sunday you miss.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '1.7',
        text: 'There is no limit on how many months running you can take a monthly spot. The same ten can hold it all year if they keep getting there first. Being quick is the whole qualification.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '1.8',
        text: 'When every spot is gone you can join standby. It is first come, first served: when a spot frees up, standby is told and the first in line can pay for it. An admin can also add someone in directly.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
    ],
  },
  {
    n: '02',
    title: 'MAKING THE TEAMS',
    items: [
      {
        k: '2.1',
        text: 'On game day, once everyone has checked in, all thirty names, the ten included, are made into teams by a random draw or by captains pick. Paying early buys you a game, never a team.',
        tag: 'Amended Sep 2026',
        tagTone: 'changed',
      },
      { k: '2.2', text: 'Nobody is put on the same side two Sundays running, wherever the numbers allow it.' },
      { k: '2.3', text: 'Ratings are never used to balance sides. The draw is random on purpose.' },
      { k: '2.4', text: 'The draw is final. Swaps are admin-only and only on match day.' },
    ],
  },
  {
    n: '03',
    title: 'MATCH DAY',
    items: [
      {
        k: '3.1',
        text: 'Team selection starts at 07:40 and kick-off is 07:45. If you have a spot, be there before 07:40, not at it.',
        tag: 'Amended Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '3.2',
        text: 'From this Sunday, only life-changing events excuse arriving late, and evidence will be asked for. We had formed the habit of abusing the exceptions.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '3.3',
        text: "Not valid, and this list is not exhaustive: I'm running late · I had a flat tyre · my neighbour blocked my gate · I'll be there in five minutes · I'm coming.",
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '3.4',
        text: 'These rules have no exceptions and apply to admins exactly as they apply to everyone else. Enforcement had gone slack, that is on us and it stops now.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      { k: '3.5', text: "No-shows are replaced by the admin from whoever's available. The voting roster follows whoever actually played." },
      { k: '3.6', text: 'If a side ends up short, they play short. Nobody gets reshuffled mid-game.' },
      { k: '3.7', text: "Bibs go home with whoever's car they're in. Washed." },
    ],
  },
  {
    n: '04',
    title: 'SUBSTITUTES',
    items: [
      {
        k: '4.1',
        text: 'Too many people were standing around on a Sunday without a game. These rules exist so everyone who turns up gets on.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '4.2',
        text: 'If you already have a set, you cannot sub for another set, unless you are going in as a goalkeeper.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '4.3',
        text: 'A sub cannot go on twice in a row. Every sub must have had a turn before the first one back on can return.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      { k: '4.4', text: 'If you want your side to keep winning, do it with your side. That is the point.', tag: 'New Sep 2026', tagTone: 'changed' },
    ],
  },
  {
    n: '05',
    title: 'RATINGS',
    items: [
      { k: '5.1', text: 'Rate the other eleven from 1 to 10 before Tuesday 23:59.' },
      { k: '5.2', text: 'Votes are anonymous and averaged. Nobody sees an individual score, admins included.' },
      { k: '5.3', text: "You cannot rate yourself, and you cannot rate a match you didn't play." },
      {
        k: '5.4',
        text: 'Miss the window twice in a season and your votes stop counting until you file one on time.',
        tag: 'Not yet enforced',
        tagTone: 'pending',
      },
    ],
  },
  {
    n: '06',
    title: 'PROFILE & TRAITS',
    items: [
      { k: '6.1', text: 'You set your nickname, real name, one position (DEF, ATT or UTIL, plus GK if you will go in goal), foot, bio, photo, favourite number and up to two traits.' },
      { k: '6.2', text: 'Rating, stats, badges and traits from the group are earned, not set.' },
      { k: '6.3', text: 'Anyone can invent a trait. Three votes and it joins the pool, and three votes on a player puts it on their card.' },
      {
        k: '6.4',
        text: '“I am him” is your own claim, three at most. “You are him” belongs to the group.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
      {
        k: '6.5',
        text: 'Any claim fifteen votes underwater is dropped and the slot comes back. Pulling your own claim is allowed and is not the same as being voted off. A dropped name can be claimed again after a month.',
        tag: 'New Sep 2026',
        tagTone: 'changed',
      },
    ],
  },
  {
    n: '07',
    title: 'CHANGING THE RULES',
    items: [
      { k: '7.1', text: 'Anyone can propose a change. It goes to the feed for a week.' },
      { k: '7.2', text: 'It passes on a majority of players who turned out in the last four Sundays.' },
      { k: '7.3', text: 'Changes take effect the following Wednesday. Never mid-week, never mid-matchday.' },
    ],
  },
]

export interface Amendment {
  /** ISO date the change took effect. */
  date: string
  /** Short form for the Home strip. */
  headline: string
  text: string
  by: string
  vote: string
}

export const AMENDMENTS: Amendment[] = [
  {
    date: '2026-09-18',
    headline: 'Selection 07:40, kick-off 07:45',
    text: 'Kick-off moved to 07:45 with selection at 07:40, late excuses cut back to life-changing events with evidence, and substitute rotation added so everyone who turns up gets on. Applies to admins too.',
    by: 'The admins',
    vote: 'Announced',
  },
  {
    date: '2026-09-02',
    headline: 'Teams renamed to the Greek alphabet',
    text: 'Teams renamed from colours to the Greek alphabet. Colours kept as identifiers only.',
    by: 'Debo',
    vote: '22–33',
  },
  {
    date: '2026-08-26',
    headline: '“I am him” added',
    text: '“I am him” added alongside “you are him”, both capped at three with up and down votes.',
    by: 'Wale',
    vote: '17–9',
  },
  {
    date: '2026-08-12',
    headline: 'Ballot night moved to Wednesday',
    text: 'Ballot night moved from Saturday 20:00 to Wednesday 20:00 to give people midweek notice.',
    by: 'Kunle',
    vote: '19–6',
  },
  {
    date: '2026-08-05',
    headline: 'Positions simplified',
    text: 'Positions simplified to GK, DEF, ATT and UTIL. Players may hold more than one.',
    by: 'Fred',
    vote: '24–1',
  },
  {
    date: '2026-07-14',
    headline: 'Attribute ratings scrapped',
    text: 'Numeric attribute ratings scrapped. Playstyle tags replaced them.',
    by: 'Wale',
    vote: '26–0',
  },
  {
    date: '2025-03-03',
    headline: 'No. 4 retired',
    text: 'No. 4 retired in memory of Ade Salami.',
    by: 'The group',
    vote: 'Unanimous',
  },
]

export const LATEST_AMENDMENT = AMENDMENTS[0]

export function formatAmendmentDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  // en-GB abbreviates September as "Sept"; the design uses "Sep".
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', opts).replace('Sept', 'Sep')
}

export interface Punishment {
  name: string
  sanction: string
  detail: string
  severity: 'Light' | 'Heavy' | 'Severe'
}

export const PUNISHMENTS: Punishment[] = [
  {
    name: 'No-show without notice',
    sanction: 'Sit out the next Sunday',
    detail: "Held a spot, didn't turn up, told nobody before 07:30.",
    severity: 'Heavy',
  },
  {
    name: 'Late withdrawal',
    sanction: 'Back of the standby queue',
    detail: 'Pulled out after the teams were made but in time for a replacement.',
    severity: 'Light',
  },
  {
    name: 'Not filing ratings',
    sanction: 'Your votes stop counting',
    detail: 'Missed the Tuesday deadline twice in a season.',
    severity: 'Light',
  },
  {
    name: 'Abuse in the feed',
    sanction: 'Two-week suspension',
    detail: 'Judged by two admins, not one. Banter is the point of the place, this is the line past it.',
    severity: 'Heavy',
  },
  {
    name: "Rating a match you didn't play",
    sanction: 'Votes voided for the season',
    detail: 'Caught automatically against the line-up that actually played.',
    severity: 'Severe',
  },
]
