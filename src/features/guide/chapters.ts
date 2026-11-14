import type { SceneKind } from '@/components/states/Scene'

export type ChapterId = 'week' | 'spot' | 'monthly' | 'draw' | 'matchday' | 'ratings' | 'kitty' | 'cup' | 'admin'

export interface GuideChapter {
  id: ChapterId
  /** Short name for the chapter rail. */
  name: string
  title: string
  body: string
  points: string[]
  /** 'week' is the guide's own timeline scene; the rest come from Scene.tsx. */
  scene: { kind: SceneKind; variant: number } | 'week'
  cta: { label: string; to: string }
  adminOnly?: boolean
}

/** Shared with onboarding step three, so the two can't drift apart. */
export const SPOT_CHAPTER: GuideChapter = {
  id: 'spot',
  name: 'Getting a spot',
  title: 'FIRST TO PAY GETS THE SPOT.',
  body: 'Thirty play each Sunday. Ten are the monthly ten, the other twenty are weekly spots, and they go to whoever claims them first. No lottery, no favours.',
  points: [
    'Pay in the app and your spot is held for fifteen minutes while Paystack finishes. Or claim now and pay later.',
    'Claims close Wednesday at 20:00. Pull out before then and nothing happens.',
    'All twenty gone? Join standby. If a spot frees up, everyone on standby hears at once and the first to claim it plays.',
  ],
  scene: { kind: 'bench', variant: 1 },
  cta: { label: 'Claim this Sunday', to: '/matchday' },
}

export const GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: 'week',
    name: 'The week',
    title: 'ONE GAME. ONE WEEK.',
    body: 'Everything in Astro hangs off a single Sunday game. The week runs the same way every time.',
    points: [
      'Sunday evening: spots for next Sunday open.',
      'Wednesday 20:00: claims close and the sides are drawn.',
      'Sunday 07:40 selection, 07:45 kick-off at Gbaja Boys Junior High School.',
      'Monday to Tuesday 23:59: rate the players you played with.',
    ],
    scene: 'week',
    cta: { label: 'See the next matchday', to: '/matchday' },
  },
  SPOT_CHAPTER,
  {
    id: 'monthly',
    name: 'The monthly ten',
    title: 'OR TAKE A WHOLE MONTH.',
    body: 'Ten spots are sold by the month. One payment and you are in every Sunday that month, with no weekly scramble.',
    points: [
      'Opens at 08:00 on the 1st and closes the moment the tenth person pays.',
      "Can't make one Sunday? Opt out on Matchday and your spot goes to standby for that week only.",
      'The month is paid for, not each game, so a missed Sunday is not refunded.',
    ],
    scene: { kind: 'calendar', variant: 0 },
    cta: { label: 'See monthly spots', to: '/matchday' },
  },
  {
    id: 'draw',
    name: 'The draw',
    title: 'THIRTY NAMES, FIVE SIDES.',
    body: 'At Wednesday 20:00 everyone who holds a spot is drawn into five sides of six, Alpha through Epsilon.',
    points: [
      'The draw is random. Ratings are never used to balance sides.',
      'Paying early buys you a game, never a team.',
      'Nobody lands on the same side two Sundays running, wherever the numbers allow.',
    ],
    scene: { kind: 'calendar', variant: 1 },
    cta: { label: 'See the sides', to: '/matchday' },
  },
  {
    id: 'matchday',
    name: 'Match day',
    title: 'BE THERE BEFORE 07:40.',
    body: 'Selection is at 07:40 and kick-off at 07:45. Only life-changing events excuse arriving late.',
    points: [
      'Matchday shows your side, the fixtures and live scores as goals go in.',
      'Subs rotate so everyone who turns up gets on.',
      'Short a player? The side plays short. Nobody is reshuffled mid-game.',
    ],
    scene: { kind: 'whistle', variant: 1 },
    cta: { label: 'Open Matchday', to: '/matchday' },
  },
  {
    id: 'ratings',
    name: 'Ratings & tags',
    title: 'YOUR RATING COMES FROM US.',
    body: 'After the game you score the players you played with out of ten. The average is your rating for that Sunday.',
    points: [
      'Votes are anonymous. Nobody sees an individual score, admins included.',
      'File yours by Tuesday 23:59 or they stop counting.',
      'Pick two playstyle tags yourself. Three votes from the group puts another one on your card.',
    ],
    scene: { kind: 'rating', variant: 0 },
    cta: { label: 'Rate this week', to: '/matchday/voting' },
  },
  {
    id: 'kitty',
    name: 'Kitty & dues',
    title: 'THE KITTY KEEPS US GOING.',
    body: 'Dues are paid each quarter and cover the pitch, the bibs and the balls. Causes are for when one of us needs a hand.',
    points: [
      'Pay your dues in the app. It shows as paid once Paystack confirms.',
      'Anyone can suggest a cause, and everyone can see how close it is.',
      'Who has or hasn’t paid stays between you and the admins.',
    ],
    scene: { kind: 'kitty', variant: 0 },
    cta: { label: 'Open the Kitty', to: '/kitty' },
  },
  {
    id: 'cup',
    name: 'Salami Cup & awards',
    title: 'WE PLAY FOR SALAMI.',
    body: 'Four times a year the Salami Cup is played in memory of Ade Salami, who started the group. Squads are picked by hand, not drawn.',
    points: [
      'Cup goals and wins count towards your career, like any Sunday.',
      'At the end of the year the group hands out awards and badges for the season.',
      'Thirteen was his number. His page is always in the sidebar.',
    ],
    scene: { kind: 'trophy', variant: 0 },
    cta: { label: 'See the Salami Cup', to: '/salami-cup' },
  },
  {
    id: 'admin',
    name: 'Running the week',
    title: 'FOR ADMINS: RUN THE WEEK.',
    body: 'The admin portal is where the week is run. Everything players see on Matchday comes from here.',
    points: [
      'Matchday control opens and closes claims and handles swaps on the day.',
      'The draw runs at Wednesday 20:00, results and goals go in after each game.',
      'Payments flags refunds to settle by hand. Dues and causes are set up here too.',
    ],
    scene: { kind: 'whistle', variant: 2 },
    cta: { label: 'Open the admin portal', to: '/admin' },
    adminOnly: true,
  },
]

export function chaptersFor(isAdmin: boolean) {
  return GUIDE_CHAPTERS.filter((c) => isAdmin || !c.adminOnly)
}
