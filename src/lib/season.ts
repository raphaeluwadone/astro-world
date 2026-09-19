/** The season runs 1 August to the following July. Shared so "this
 * season" means the same date everywhere it's asked (Profile's stats
 * toggle, the team standings), rather than two copies drifting apart. */
export function currentSeasonStart(): Date {
  const now = new Date()
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return new Date(year, 7, 1)
}
