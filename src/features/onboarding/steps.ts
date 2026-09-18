export interface OnboardingStep {
  label: string
  title: string
  body: string
  points: string[]
  next: string
}

/** Verbatim from the design handoff. Copy polish is planned as a separate pass. */
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
    title: 'MARK YOURSELF IN BY WEDNESDAY EIGHT.',
    body: 'More of us want a game than there are spots, so the thirty who play are drawn at random on Wednesday night.',
    points: [
      "Say you're available any time before Wednesday 20:00.",
      "If more than thirty are in, it's a ballot, not first come, first served.",
      'Miss out and you go on standby. Standby order favours whoever missed out most recently.',
      'The thirty are then split into five sides of six: Alpha through Epsilon.',
    ],
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
    title: 'WE PLAY FOR ADE.',
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
    body: "One thing left: tell us you're available, and you're in Wednesday's ballot.",
    points: ['The ballot for this Sunday closes Wednesday at eight.', 'Anything unclear later lives on the Rules page.'],
    next: 'Mark me in for Sunday',
  },
]
