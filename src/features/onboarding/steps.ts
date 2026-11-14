import { SPOT_CHAPTER } from '@/features/guide/chapters'

export interface OnboardingStep {
  label: string
  title: string
  body: string
  points: string[]
  next: string
}

/** From the design handoff, except step three, which shares the guide's spot chapter. */
export const STEPS: OnboardingStep[] = [
  {
    label: 'Step one of five',
    title: 'THIRTY SPOTS. A HUNDRED OF US.',
    body: "Astro runs one game a week. Sides are drawn fresh every Sunday, so you'll rarely play with the same eleven twice.",
    points: [
      'No fixed teams and no captains picking.',
      'Sunday 09:30, Gbaja Boys Junior High School.',
      'Everything here is decided by the group, including the rules.',
    ],
    next: 'How it works',
  },
  {
    label: 'Step two of five',
    title: "PICK THE NAME YOU'LL BE KNOWN BY.",
    body: "Everyone goes by a nickname here. It's the big text on your card, your real name sits underneath it, smaller.",
    points: [
      'Your nickname is what appears in team draws, rankings and the feed.',
      "Pick a favourite number too. It isn't exclusive, so take one that's already taken if you like.",
      'Positions are GK, DEF, ATT or UTIL, and you can claim more than one.',
    ],
    next: 'Next: getting a game',
  },
  {
    label: 'Step three of five',
    title: SPOT_CHAPTER.title,
    body: SPOT_CHAPTER.body,
    points: SPOT_CHAPTER.points,
    next: 'Next: your rating',
  },
  {
    label: 'Step four of five',
    title: 'YOUR RATING COMES FROM US, NOT AN ADMIN.',
    body: 'After every match you score the other eleven out of ten. The average is your rating for that Sunday.',
    points: [
      'Votes are anonymous and never shown individually, not even to admins.',
      'File yours by Tuesday night or they stop counting.',
      "You can tag yourself with two playstyles. The group votes the rest onto you, and you can't remove those.",
      'No attribute bars. Nobody is reduced to six numbers here.',
    ],
    next: 'One more thing',
  },
  {
    label: 'Step five of five',
    title: 'WE PLAY FOR SALAMI.',
    body: 'Ade Salami played with us for years. He started the group chat and bought the first set of bibs. We lost him, and four times a year the Salami Cup is played in his name.',
    points: [
      'His page is always in the sidebar. Tributes are open for good.',
      "Thirteen was his number. It's yours too if you want it.",
      'The cup runs quarterly, with squads picked by hand rather than drawn.',
    ],
    next: "I'm ready",
  },
  {
    label: "That's everything",
    title: 'RIGHT. SEE YOU SUNDAY.',
    body: 'One thing left: claim your spot for Sunday on Matchday before claims close.',
    points: ['Claims for this Sunday close Wednesday at eight.', 'Anything unclear later lives in How Astro works, in the sidebar.'],
    next: 'Claim my Sunday spot',
  },
]
