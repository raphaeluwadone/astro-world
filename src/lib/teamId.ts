/** The canonical TEAM_ID list, read directly from the design source
 * (Astro App.dc.html) and indexed everywhere a team name, glyph or
 * colour is needed, rather than duplicated as a literal: colour drifted
 * out of sync across screens once already when each one carried its own
 * copy. Almost always 5 sides (30 players); Zeta only comes into play
 * the occasional week an admin opens a 6th side (36 players). */
export const TEAM_ID = [
  { name: 'Alpha', glyph: 'Α', colour: '#38bdf8' },
  { name: 'Beta', glyph: 'Β', colour: '#e0483f' },
  { name: 'Gamma', glyph: 'Γ', colour: '#a63fff' },
  { name: 'Delta', glyph: 'Δ', colour: '#4ade80' },
  { name: 'Epsilon', glyph: 'Ε', colour: '#f2a93b' },
  { name: 'Zeta', glyph: 'Ζ', colour: '#cbd5f5' },
] as const
