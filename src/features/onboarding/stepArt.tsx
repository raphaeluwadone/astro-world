/** Simplified but on-brand art for each onboarding step. Faithful to the
 * design's motifs (orbiting ball, player card, ballot grid, rating chips,
 * No.13 vigil, goal net) without reproducing every decorative overlay. */
import { useEffect, useState } from 'react'
import { TEAM_ID } from '@/lib/teamId'

export function OrbitArt() {
  return (
    <div className="relative flex flex-col items-center gap-[22px]">
      <svg width={150} height={150} viewBox="0 0 120 120" aria-hidden="true">
        <g style={{ animation: 'ob-orbit 3.4s linear infinite', transformOrigin: '60px 60px' }}>
          <circle cx="60" cy="60" r="48" fill="none" stroke="#a63fff" strokeOpacity="0.18" strokeWidth="4" strokeLinecap="round" strokeDasharray="120 400" transform="rotate(-142 60 60)" />
          <circle cx="60" cy="60" r="48" fill="none" stroke="#a63fff" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" strokeDasharray="26 400" transform="rotate(-31 60 60)" />
          <circle cx="108" cy="60" r="5" fill="#c589ff" />
        </g>
        <g transform="translate(30 30) scale(0.6)">
          <use href="#astro-ball" />
        </g>
      </svg>
      <div
        className="font-display text-center text-[40px] leading-[0.92] text-astro-text"
        style={{ animation: 'ob-rise 700ms cubic-bezier(.2,.8,.2,1) both' }}
      >
        EVERY SUNDAY,
        <br />
        SOMEONE NEW
      </div>
    </div>
  )
}

export function CardArt() {
  return (
    <div
      className="relative w-[220px] overflow-hidden rounded-2xl border-[1.5px] border-[rgba(166,63,255,0.4)] p-5"
      style={{ background: 'linear-gradient(165deg,#1b2650,#111a33 55%)', animation: 'ob-pop 520ms cubic-bezier(.2,.8,.2,1) both' }}
    >
      <div
        className="pointer-events-none absolute inset-[-40%]"
        style={{
          background: 'linear-gradient(115deg,transparent 43%,rgba(255,255,255,0.1) 50%,transparent 57%)',
          animation: 'ob-sweep 5s ease-in-out infinite',
        }}
      />
      <div className="astro-ghost -right-1.5 top-[26px] text-[100px]" style={{ animation: 'ob-drift 11s ease-in-out infinite' }}>
        7
      </div>
      <div className="relative mb-3.5 h-[100px] rounded-[11px]" style={{ background: 'linear-gradient(160deg,#2c3c74,#131c3a)' }}>
        <div className="absolute bottom-0 left-1/2 h-[74%] w-[54%] -translate-x-1/2 rounded-t-full bg-white/[0.07]" />
      </div>
      <div
        className="font-display relative text-[32px] leading-[0.94] text-astro-text"
        style={{ animation: 'ob-rise 620ms cubic-bezier(.2,.8,.2,1) both', animationDelay: '240ms' }}
      >
        SNAKEBITE
      </div>
      <div
        className="relative mt-0.5 text-xs text-astro-text-muted"
        style={{ animation: 'ob-rise 620ms cubic-bezier(.2,.8,.2,1) both', animationDelay: '420ms' }}
      >
        Tunde Okafor &middot; No. 7
      </div>
    </div>
  )
}

const LIT = new Set([2, 5, 7, 11, 14, 17, 19, 22, 25, 28, 30, 33, 36, 39, 41, 44, 47, 50, 52, 55, 58, 61, 63, 66, 69, 72, 75, 78, 81, 84])
const PREVIEW_TEAMS = TEAM_ID.slice(0, 5)

const BALLOT_REPLAY_INTERVAL_MS = 6000

export function BallotArt() {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), BALLOT_REPLAY_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div key={cycle} className="flex flex-col items-center gap-5">
      <div className="grid grid-cols-12 gap-[7px]" style={{ width: 270 }}>
        {Array.from({ length: 96 }, (_, n) => {
          const on = LIT.has(n)
          return (
            <div
              key={n}
              className="aspect-square rounded-[3px]"
              style={
                on
                  ? { animation: 'ob-light 520ms cubic-bezier(.2,.8,.2,1) both', animationDelay: `${260 + n * 9}ms` }
                  : { background: '#1b2650', opacity: 0.55 }
              }
            />
          )
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-[7px]">
        {PREVIEW_TEAMS.map((t, n) => (
          <div
            key={t.name}
            className="rounded-[7px] border px-2 py-1.5 text-[9px] font-extrabold tracking-[0.08em]"
            style={{
              color: t.colour,
              background: '#111a33',
              borderColor: `${t.colour}55`,
              animation: 'ob-team 420ms cubic-bezier(.2,.8,.2,1) both',
              animationDelay: `${1250 + n * 110}ms`,
            }}
          >
            {t.name.toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  )
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const TAGS = [
  { label: 'Deep Playmaker', self: true },
  { label: 'Two-Footed', self: true },
  { label: 'High Work Rate', self: false },
]

export function RatingArt() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="grid grid-cols-5 gap-2">
        {SCORES.map((v, n) => (
          <div
            key={v}
            className="font-display flex size-11 items-center justify-center rounded-[10px] text-xl"
            style={{
              ...(v === 8
                ? { background: 'rgba(166,63,255,0.2)', color: '#c589ff', border: '1px solid rgba(166,63,255,0.5)' }
                : { background: '#182448', color: '#6d7496', border: '1px solid rgba(255,255,255,0.07)' }),
              animation: 'ob-pop 360ms cubic-bezier(.2,.8,.2,1) both',
              animationDelay: `${n * 55}ms`,
            }}
          >
            {v}
          </div>
        ))}
      </div>
      <div
        className="flex items-center gap-3.5 rounded-[14px] border-[1.5px] border-[rgba(166,63,255,0.4)] bg-astro-surface px-[22px] py-4"
        style={{ animation: 'ob-avg 2.6s ease-out infinite' }}
      >
        <div className="font-display text-[46px] leading-[0.85] text-astro-accent">7.8</div>
        <div className="text-xs leading-[1.4] text-astro-text-muted">
          your rating
          <br />
          for that match
        </div>
      </div>
      <div className="flex max-w-[280px] flex-wrap justify-center gap-[7px]">
        {TAGS.map((t, n) => (
          <div
            key={t.label}
            className="whitespace-nowrap rounded-full px-3 py-[7px] text-[11.5px] font-bold"
            style={{
              ...(t.self
                ? { background: 'rgba(166,63,255,0.16)', color: '#c589ff', border: '1px solid rgba(166,63,255,0.5)' }
                : { background: '#182448', color: '#9aa3c4', border: '1px solid rgba(255,255,255,0.07)' }),
              animation: 'ob-tag 460ms cubic-bezier(.2,.8,.2,1) both',
              animationDelay: `${700 + n * 130}ms`,
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function MemorialArt() {
  return (
    <div className="relative flex flex-col items-center gap-5">
      <div
        className="pointer-events-none absolute left-1/2 top-[38%] size-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(166,63,255,0.34) 0%, rgba(166,63,255,0.09) 46%, transparent 72%)',
          animation: 'ob-glow 9s ease-in-out infinite',
        }}
      />
      <svg width={140} height={140} viewBox="0 0 120 120" className="relative" aria-hidden="true">
        <circle cx="60" cy="60" r="44" fill="none" stroke="#a63fff" strokeWidth="2" strokeLinecap="round" strokeDasharray="277" transform="rotate(-90 60 60)" style={{ animation: 'ob-vigil 4s ease-in-out infinite' }} />
        <g transform="translate(36.25 36.25) scale(0.475)">
          <use href="#astro-ball" />
        </g>
      </svg>
      <div
        className="font-display relative text-[34px] leading-[0.95] text-astro-text"
        style={{ animation: 'ob-rise 900ms cubic-bezier(.16,.84,.24,1) both' }}
      >
        NO. 13
      </div>
    </div>
  )
}

export function ReadyArt() {
  return (
    <svg width={240} height={170} viewBox="0 0 210 150" aria-hidden="true">
      <g style={{ animation: 'ob-net 2.6s ease-out infinite', transformOrigin: '118px 82px' }}>
        <path d="M62 124V46h112v78" fill="none" stroke="#2c3c74" strokeWidth="4" strokeLinejoin="round" />
        <path d="M62 46h112M62 62h112M62 78h112M62 94h112M62 110h112M78 46v78M94 46v78M110 46v78M126 46v78M142 46v78M158 46v78" stroke="#2c3c74" strokeWidth="1.4" opacity="0.6" />
        <path d="M62 46h112" stroke="#4ade80" strokeOpacity="0.5" strokeWidth="4.5" strokeLinecap="round" />
      </g>
      <circle cx="118" cy="82" r="22" fill="none" stroke="#4ade80" strokeWidth="3" style={{ animation: 'ob-ripple 2.6s ease-out infinite', transformOrigin: '118px 82px' }} />
      <g style={{ animation: 'ob-strike 2.6s cubic-bezier(.2,.7,.3,1) infinite', transformOrigin: '118px 82px' }}>
        <g transform="translate(103 67) scale(0.3)">
          <use href="#astro-ball" />
        </g>
      </g>
    </svg>
  )
}
