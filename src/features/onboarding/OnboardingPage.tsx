import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useCurrentPlayer } from '@/features/auth/useSession'
import { useSetAvailability } from '@/features/matchday/hooks'
import { fetchNextMatchday } from '@/features/matchday/api'
import { useQuery } from '@tanstack/react-query'
import { BrandMarkIcon } from '@/components/icons/nav-icons'
import { Wordmark } from '@/components/icons/Wordmark'
import { useMarkOnboarded } from './hooks'
import { STEPS } from './steps'
import { BallotArt, CardArt, MemorialArt, OrbitArt, RatingArt, ReadyArt } from './stepArt'

const ART = [OrbitArt, CardArt, BallotArt, RatingArt, MemorialArt, ReadyArt]
const LAST_STEP = STEPS.length - 1

export function OnboardingPage() {
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const { data: nextMatchday } = useQuery({ queryKey: ['matchday', 'next'], queryFn: fetchNextMatchday })
  const setAvailability = useSetAvailability(nextMatchday?.id)
  const markOnboarded = useMarkOnboarded(player?.id)

  const Art = ART[step]
  const current = STEPS[step]
  const isLast = step === LAST_STEP

  async function finish(markAvailable: boolean) {
    // Marking yourself in is a bonus action, not a precondition for finishing
    // onboarding: the ballot for the "next" matchday might already be closed
    // (RLS rejects the write once it's past 'open'), and that's fine, just
    // proceed to mark onboarded and leave either way.
    if (markAvailable && player?.id && nextMatchday?.id && nextMatchday.status === 'open') {
      try {
        await setAvailability.mutateAsync({ playerId: player.id, status: 'in' })
      } catch {
        // Ballot's closed or something else rejected it: not fatal, carry on.
      }
    }
    await markOnboarded.mutateAsync()
    navigate({ to: '/' })
  }

  function next() {
    if (isLast) {
      finish(true)
      return
    }
    setStep((s) => Math.min(LAST_STEP, s + 1))
  }

  return (
    <div className="min-h-screen bg-astro-bg px-6 py-10 md:px-[42px] md:py-10">
      <div className="mx-auto max-w-[1000px]">
        <div
          className="relative overflow-hidden rounded-[18px] border-[1.5px] border-[rgba(166,63,255,0.34)]"
          style={{ background: '#111a33', clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-7 py-5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-[26px] items-center justify-center rounded-lg bg-gradient-to-br from-astro-accent to-astro-accent-strong"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%)' }}
              >
                <BrandMarkIcon className="size-3.5" />
              </div>
              <Wordmark size={22} className="text-astro-text" />
            </div>
            <div className="flex items-center gap-2.5">
              {STEPS.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-label={`Step ${i + 1}`}
                  className="h-2 rounded-full transition-[width,background-color] duration-200"
                  style={{
                    width: i === Math.min(step, 4) ? 26 : 8,
                    background: i === Math.min(step, 4) ? '#a63fff' : i < step ? 'rgba(166,63,255,0.45)' : '#243463',
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => finish(false)}
              className="text-[12.5px] font-bold text-astro-text-dim hover:text-astro-text"
            >
              Skip for now
            </button>
          </div>

          <div className="grid items-stretch" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}>
            <div className="flex min-h-[400px] items-center justify-center overflow-hidden p-[30px]" style={{ background: '#0d1428' }}>
              <Art />
            </div>

            <div className="flex min-w-0 flex-col p-[34px]">
              <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.15em] text-astro-text-dim">
                {current.label}
              </div>
              <h2 className="mb-3.5 font-display text-[42px] leading-[0.95] text-astro-text [text-wrap:pretty]">
                {current.title}
              </h2>
              <p className="mb-5 text-[15px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
                {current.body}
              </p>

              <div className="mb-6.5 flex flex-col gap-2.5">
                {current.points.map((p) => (
                  <div key={p} className="flex items-start gap-2.5 rounded-[11px] bg-astro-surface-2 px-[15px] py-3.5">
                    <div className="mt-px flex size-[18px] shrink-0 items-center justify-center rounded-[6px] border border-[rgba(166,63,255,0.5)] bg-[rgba(166,63,255,0.2)]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#c589ff">
                        <path d="M9.3 19 2.6 12.3l2.6-2.6 4.1 4.1L18.8 5l2.6 2.6Z" />
                      </svg>
                    </div>
                    <div className="text-[13.5px] leading-[1.5] text-astro-text [text-wrap:pretty]">{p}</div>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2.5">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="rounded-[11px] border border-border bg-astro-surface-2 px-[18px] py-3.5 text-[13px] font-bold text-astro-text-muted"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  disabled={setAvailability.isPending || markOnboarded.isPending}
                  onClick={next}
                  className="rounded-[11px] bg-astro-accent px-6 py-3.5 text-sm font-extrabold text-astro-on-accent transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {current.next}
                </button>
                {isLast && (
                  <button
                    type="button"
                    onClick={() => finish(false)}
                    className="px-1.5 py-3.5 text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
                  >
                    Look around first
                  </button>
                )}
                <div className="ml-auto text-[11.5px] text-astro-text-dim">
                  {isLast ? 'Done' : `${step + 1} / 5`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
