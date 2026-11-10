import { useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { MemorialArt } from '@/features/onboarding/stepArt'
import type { CupQuarter } from '../api'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function SquadsArt() {
  const squads = ['#f2a93b', '#a63fff', '#38bdf8']
  return (
    <div className="flex gap-3">
      {squads.map((c, i) => (
        <div
          key={c}
          className="flex w-[74px] flex-col gap-1.5 rounded-xl border border-white/[0.08] bg-astro-surface-2 p-2.5"
          style={{ animation: `astro-deal 520ms cubic-bezier(.2,.8,.2,1) ${i * 140}ms both` }}
        >
          <div className="mb-1 h-1.5 rounded-full" style={{ background: c }} />
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="h-2 rounded bg-white/[0.08]" />
          ))}
        </div>
      ))}
    </div>
  )
}

function RulesArt() {
  return (
    <div className="flex items-center gap-5">
      <div className="font-display text-[86px] leading-none text-astro-amber" style={{ animation: 'astro-pop 600ms ease-out both' }}>
        12&prime;
      </div>
      <div className="rotate-[10deg]">
        <div
          className="h-[78px] w-[54px] rounded-lg bg-astro-red shadow-[0_10px_30px_rgba(224,72,63,0.35)]"
          style={{ animation: 'astro-deal 520ms cubic-bezier(.2,.8,.2,1) 220ms both' }}
        />
      </div>
    </div>
  )
}

function HonoursArt() {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute size-[200px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(242,169,59,0.3) 0%, transparent 70%)', animation: 'astro-glow 5s ease-in-out infinite' }}
      />
      <svg width="96" height="96" viewBox="0 0 24 24" fill="#f2a93b" className="relative" aria-hidden="true">
        <path d="M7.2 2.8h9.6v5.4a4.8 4.8 0 1 1-9.6 0ZM10.6 14h2.8v3.2h3.2V21H7.4v-3.8h3.2Z" />
      </svg>
    </div>
  )
}

interface Step {
  label: string
  title: string
  body: string
  points: string[]
  art: ReactNode
}

function stepsFor(cup: CupQuarter | null): Step[] {
  return [
    {
      label: 'The Salami Cup',
      title: 'Four times a year, for Ade',
      body: "One tournament a quarter in Ade Salami's name. It isn't a normal Sunday, and it doesn't run on the Sunday rules.",
      points: ['Its own day, its own squads, its own table.', 'The winners go on the honours board for good.'],
      art: <MemorialArt />,
    },
    {
      label: 'Getting in',
      title: 'Enter, then squads are drawn',
      body: 'Say you\'re in on this page before entries close. Squads are drawn from everyone who entered, not from the weekly ballot.',
      points: [
        cup ? `Entries close ${formatWhen(cup.entries_close_at)}.` : 'Entries close a few days before the cup.',
        cup
          ? `Pull out by ${formatWhen(cup.withdrawal_deadline)}. After that, your squad plays a man short.`
          : 'Pull out after the withdrawal deadline and your squad plays a man short.',
      ],
      art: <SquadsArt />,
    },
    {
      label: 'On the day',
      title: 'Cup rules are not Sunday rules',
      body: "Turn up knowing the difference, so nobody's arguing from the wrong rulebook.",
      points: [
        '12-minute games with a minute between.',
        'A red card costs you the rest of that game, not the tournament.',
        'An external referee has the final say.',
      ],
      art: <RulesArt />,
    },
    {
      label: 'It counts',
      title: 'Ratings still count',
      body: 'Cup games are rated like any Sunday, and those ratings feed your season average.',
      points: ['The table, fixtures and squads all live on this page.'],
      art: <HonoursArt />,
    },
  ]
}

export function CupIntro({ open, cup, onDone }: { open: boolean; cup: CupQuarter | null; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const steps = stepsFor(cup)
  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDone()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-[18px] border-[1.5px] border-astro-amber/40 bg-astro-surface p-0 text-astro-text ring-0 sm:max-w-[760px]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
                className="h-2 rounded-full transition-[width,background-color] duration-200"
                style={{
                  width: i === step ? 26 : 8,
                  background: i === step ? '#f2a93b' : i < step ? 'rgba(242,169,59,0.45)' : '#243463',
                }}
              />
            ))}
          </div>
          <button type="button" onClick={onDone} className="text-[12.5px] font-bold text-astro-text-dim hover:text-astro-text">
            Skip
          </button>
        </div>

        <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div key={step} className="flex min-h-[200px] items-center justify-center overflow-hidden bg-[#0d1428] p-7 sm:min-h-[340px]">
            {current.art}
          </div>
          <div className="flex min-w-0 flex-col p-7">
            <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-astro-amber">{current.label}</div>
            <DialogTitle className="font-display mb-3 text-[36px] font-normal leading-[0.95] text-astro-text [text-wrap:pretty]">
              {current.title}
            </DialogTitle>
            <DialogDescription className="mb-4 text-[14px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              {current.body}
            </DialogDescription>
            <ul className="mb-6 flex flex-col gap-2">
              {current.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 rounded-[11px] bg-astro-surface-2 px-3.5 py-3 text-[13px] leading-[1.5] text-astro-text">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-astro-amber" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-center gap-2.5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="rounded-[11px] border border-white/[0.09] bg-astro-surface-2 px-[18px] py-3 text-[13px] font-bold text-astro-text-muted"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
                className="rounded-[11px] bg-astro-amber px-6 py-3 text-sm font-extrabold text-astro-on-amber transition-transform hover:-translate-y-0.5"
              >
                {isLast ? 'Got it' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
