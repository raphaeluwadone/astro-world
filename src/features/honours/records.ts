export interface LeagueRecord {
  title: string
  holder: string
  figure: string
  note?: string
}

/** Records from the group's almanac, as written during the 2025/26 season. Edit here as they fall. */
export const LEAGUE_RECORDS: LeagueRecord[] = [
  { title: 'Most clean sheets', holder: 'Bass', figure: '32', note: '29% of every clean sheet recorded. Jerrie is next with 28.' },
  { title: 'Best month, goals and assists', holder: 'Skinny N', figure: '21 G+A', note: 'April 2026, the Player of the Month record.' },
  { title: 'Most goals in a game week', holder: 'Skinny N', figure: '5', note: 'GW15. zeazou is the only player to score five twice, in GW21 and GW24.' },
  { title: 'Most assists in a game week', holder: 'Ebuka', figure: '5', note: 'GW15, level with Ohis.' },
  { title: 'Second-best month ever', holder: 'Fred', figure: '19 G+A', note: 'August 2026, with Player of the Month. Ebuka had 18 in April.' },
  { title: 'Most clean sheets in a game week', holder: 'Bass, Bald Hermit, Jerrie', figure: '4', note: 'Bass in GW16, Bald Hermit in GW10. Jerrie holds a share too.' },
  { title: 'Most assists in a month by a keeper', holder: 'Jerrie', figure: '10', note: 'May 2026, on the way to the Golden Glove.' },
  { title: 'Penalties saved in one game week', holder: 'Jerrie', figure: '2', note: 'GW14, a league first.' },
  { title: 'Biggest Defender of the Month score', holder: 'Chukkie', figure: '134 pts', note: 'August 2026. Dan J is next with 128 in May.' },
  { title: 'Longest run without a yellow card', holder: 'Bass', figure: '26 game weeks' },
  { title: 'First brothers to both win Player of the Month', holder: 'AK and Ohis', figure: '2', note: 'AK in January, Ohis in March.' },
]
