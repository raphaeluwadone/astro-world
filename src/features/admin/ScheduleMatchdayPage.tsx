import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/states/PageLoader'
import { FieldHint, FieldLabel, TextField } from '@/features/edit-profile/components/FieldInput'
import { useCreateMatchday, useNextMatchday } from '@/features/matchday/hooks'

function nextSunday(): string {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
  return d.toISOString().slice(0, 10)
}

export function ScheduleMatchdayPage() {
  const { data: matchday, isLoading } = useNextMatchday()
  const createMatchday = useCreateMatchday()

  const [date, setDate] = useState(nextSunday())
  const [time, setTime] = useState('09:30')
  const [venue, setVenue] = useState('')
  const [capacity, setCapacity] = useState<30 | 36>(30)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    if (!date || !time) {
      setError('Pick a date and time first.')
      return
    }
    setError(null)
    try {
      await createMatchday.mutateAsync({
        playedAt: new Date(`${date}T${time}`).toISOString(),
        venue: venue.trim() || null,
        capacity,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        Sets the whole week in motion
      </div>
      <h1 className="mb-6 font-display text-[40px] leading-[0.95] text-astro-text md:text-[52px]">
        Schedule a matchday
      </h1>

      {matchday ? (
        <div className="astro-card max-w-lg p-6">
          <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
            Already on the books
          </div>
          <div className="mb-1 font-display text-3xl leading-none text-astro-text">
            {new Date(matchday.played_at).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </div>
          <p className="mb-5 text-sm text-astro-text-muted">
            {matchday.venue ?? 'No venue set'} &middot; {matchday.capacity} spots &middot; status: {matchday.status}
          </p>
          <p className="mb-5 text-[12.5px] text-astro-text-dim">
            One matchday at a time keeps the ballot unambiguous. This one needs to reach{' '}
            <span className="font-semibold text-astro-text-muted">complete</span> before you can open the next.
          </p>
          <Link to="/matchday" className="text-sm font-semibold text-astro-accent">
            View it &rarr;
          </Link>
        </div>
      ) : (
        <div className="astro-card max-w-lg p-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Date" type="date" value={date} onChange={setDate} />
              <TextField label="Kick-off" type="time" value={time} onChange={setTime} />
            </div>
            <TextField
              label="Venue"
              value={venue}
              onChange={setVenue}
              hint="Optional, but everyone will ask if it's blank."
            />
            <div>
              <FieldLabel>Sides</FieldLabel>
              <div className="flex gap-2">
                {([30, 36] as const).map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setCapacity(cap)}
                    className={
                      capacity === cap
                        ? 'rounded-lg bg-astro-accent px-3.5 py-2 text-xs font-extrabold text-astro-on-accent'
                        : 'rounded-lg border border-border bg-astro-surface-2 px-3.5 py-2 text-xs font-bold text-astro-text-muted'
                    }
                  >
                    {cap / 6} teams &middot; {cap}
                  </button>
                ))}
              </div>
              <FieldHint>Can still be changed later from the matchday page.</FieldHint>
            </div>
            {error && <p className="text-xs text-astro-red">{error}</p>}
            <Button onClick={open} disabled={createMatchday.isPending} className="w-fit">
              {createMatchday.isPending ? 'Opening…' : 'Open the matchday'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
