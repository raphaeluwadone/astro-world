import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useSession } from '@/features/auth/useSession'
import type { JoinDetails } from './api'
import { useCreateNewPlayer, useSubmitClaim, useUnclaimedPlayers, useUpdatePlayerJoinDetails } from './hooks'
import { findMatches, type ScoredMatch } from './matching'

type Step = 'name' | 'matches' | 'claim' | 'details' | 'done'
const STEPS: Step[] = ['name', 'matches', 'claim', 'details', 'done']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function JoinPage() {
  const { session } = useSession()
  const navigate = useNavigate()
  const userId = session?.user.id

  const [step, setStep] = useState<Step>('name')
  const [nick, setNick] = useState('')
  const [surname, setSurname] = useState('')
  const [claimed, setClaimed] = useState<ScoredMatch['player'] | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [insta, setInsta] = useState('')
  const [month, setMonth] = useState<number | null>(null)
  const [day, setDay] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  const { data: unclaimed = [] } = useUnclaimedPlayers()
  const matches = useMemo(() => findMatches(unclaimed, nick, surname), [unclaimed, nick, surname])
  const submitClaim = useSubmitClaim()
  const createNewPlayer = useCreateNewPlayer()
  const updateDetails = useUpdatePlayerJoinDetails()

  const idx = Math.max(0, STEPS.indexOf(step))
  const canFind = nick.trim().length > 1 || surname.trim().length > 1

  function pickMatch(m: ScoredMatch['player']) {
    setClaimed(m)
    setIsNew(false)
    setStep('claim')
  }

  function pickNewPlayer() {
    setClaimed(null)
    setIsNew(true)
    setStep('details')
  }

  async function finish() {
    if (!userId) return
    setFinishError(null)
    setFinishing(true)
    const details: JoinDetails = {
      instagram_handle: insta.trim() || null,
      birthday_month: month,
      birthday_day: day ? Number(day) : null,
    }
    try {
      if (isNew) {
        const fullName = `${nick.trim()} ${surname.trim()}`.trim() || nick.trim()
        const playerId = await createNewPlayer.mutateAsync({ userId, nickname: nick.trim(), fullName })
        await updateDetails.mutateAsync({ playerId, fields: details })
      } else if (claimed) {
        await submitClaim.mutateAsync({ playerId: claimed.id, userId, details })
      }
      setStep('done')
    } catch (err) {
      setFinishError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setFinishing(false)
    }
  }

  function restart() {
    setStep('name')
    setNick('')
    setSurname('')
    setClaimed(null)
    setIsNew(false)
    setInsta('')
    setMonth(null)
    setDay('')
    setFinishError(null)
  }

  const dobEcho = !month
    ? 'No year, ever. We only use this for the monthly party and the birthday list.'
    : !day
      ? `Born in ${MONTH_LONG[month - 1]}. Add the day so the greeting lands right.`
      : `You'll be in the ${MONTH_LONG[month - 1]} party with everyone else born that month.`

  return (
    <div className="flex min-h-screen flex-col items-center bg-astro-bg px-5 py-9 pb-[70px]">
      <div className="mb-6.5 flex w-full max-w-[560px] items-center gap-2.5">
        <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-astro-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0f1f">
            <path d="M12 2.2 21.8 12 12 21.8 2.2 12Z" />
          </svg>
        </div>
        <div className="font-display text-2xl leading-none tracking-[0.07em] text-astro-text">ASTRO</div>
        <div className="ml-auto text-[11.5px] text-astro-text-dim">Step {idx + 1} of 5</div>
      </div>

      <div className="mb-7 flex w-full max-w-[560px] gap-[5px]">
        {STEPS.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{ background: i < idx ? '#5a2b96' : i === idx ? '#a63fff' : '#182448' }}
          />
        ))}
      </div>

      {step === 'name' && (
        <div className="w-full max-w-[560px]">
          <h1 className="mb-2.5 font-display text-[46px] leading-[0.95] text-astro-text">
            WHAT DO THEY CALL YOU?
          </h1>
          <p className="mb-6.5 text-[14.5px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
            Most of the group has been playing at Gbaja for years, and you&rsquo;re probably already in
            our records under a nickname somebody gave you. Give us both and we&rsquo;ll find you.
          </p>

          <div className="astro-card mb-4 p-6">
            <div className="mb-[18px]">
              <div className="mb-[9px] text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
                Nickname
              </div>
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                placeholder="Tricky"
                className="w-full rounded-[11px] border-[1.5px] border-white/10 bg-astro-surface-2 px-4 py-3.5 text-base font-bold text-astro-text focus:border-astro-accent focus:outline-none"
              />
              <div className="mt-2 text-[11.5px] text-astro-text-muted">
                What people actually shout at you. This is the name the whole app uses.
              </div>
            </div>
            <div>
              <div className="mb-[9px] text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
                Surname
              </div>
              <input
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Adeyemi"
                className="w-full rounded-[11px] border-[1.5px] border-white/10 bg-astro-surface-2 px-4 py-3.5 text-base font-bold text-astro-text focus:border-astro-accent focus:outline-none"
              />
              <div className="mt-2 text-[11.5px] text-astro-text-muted">
                Only used to tell you apart from the other three Tobis.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={!canFind}
              onClick={() => setStep('matches')}
              className={
                canFind
                  ? 'rounded-xl bg-astro-accent px-6 py-3.5 text-[15px] font-extrabold text-astro-on-accent'
                  : 'rounded-xl bg-astro-surface-2 px-6 py-3.5 text-[15px] font-extrabold text-astro-text-disabled'
              }
            >
              Find me
            </button>
            {!canFind && <div className="text-[12.5px] text-astro-text-muted">Give us at least one of them.</div>}
          </div>
        </div>
      )}

      {step === 'matches' && (
        <div className="w-full max-w-[560px]">
          <button
            type="button"
            onClick={() => setStep('name')}
            className="mb-4 flex items-center gap-2 text-[12.5px] font-bold text-astro-text-muted hover:text-astro-text"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.6 3.6 7.2 12l8.4 8.4Z" />
            </svg>
            Change the name
          </button>
          <h1 className="mb-2.5 font-display text-[46px] leading-[0.95] text-astro-text">
            {matches.length === 0 ? 'NOBODY LIKE THAT' : matches.length === 1 ? 'THIS LOOK LIKE YOU?' : "WHICH ONE'S YOU?"}
          </h1>
          <p className="mb-6 text-[14.5px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
            {matches.length === 0
              ? 'Nothing in the records matches that, which is fine: plenty of people are new. Set yourself up below.'
              : matches.length === 1
                ? "One record close enough to show you. Tap it if it's yours."
                : `${matches.length} people it could be. Same surnames and half-shared nicknames are normal in a group this size, so check the appearances and the last time they played.`}
          </p>

          <div className="mb-4 flex flex-col gap-2.5">
            {matches.map((m) => (
              <button
                key={m.player.id}
                type="button"
                onClick={() => pickMatch(m.player)}
                className="rounded-2xl border-[1.5px] p-5 text-left transition-colors"
                style={{
                  background: '#111a33',
                  borderColor: m.score >= 5 ? 'rgba(166,63,255,0.5)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex flex-wrap items-center gap-3.5">
                  <div
                    className="size-[46px] shrink-0 rounded-xl"
                    style={{ background: 'linear-gradient(140deg, #2c3c74, #182448)' }}
                  />
                  <div className="min-w-[160px] flex-1">
                    <div className="font-display text-2xl leading-none text-astro-text">{m.player.nickname}</div>
                    <div className="truncate text-[12.5px] text-astro-text-muted">{m.player.full_name}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-astro-text-muted">
                      {m.player.appearances} apps &middot; since {new Date(m.player.joined_at).getFullYear()}
                    </div>
                  </div>
                </div>
                <div
                  className="mt-3.5 border-t border-white/[0.07] pt-3 text-[11.5px] font-bold"
                  style={{ color: m.score >= 5 ? '#c589ff' : '#6d7496' }}
                >
                  {m.why.join(' · ')}
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={pickNewPlayer}
            className="w-full rounded-2xl border border-dashed border-[rgba(166,63,255,0.45)] bg-astro-surface p-5 text-left hover:border-astro-accent"
          >
            <div className="font-display mb-1 text-2xl leading-none text-astro-text">NONE OF THOSE ARE ME</div>
            <div className="text-[12.5px] leading-[1.5] text-astro-text-muted [text-wrap:pretty]">
              Set up a new player. You&rsquo;ll start with no appearances and no rating, which is the
              honest place to start.
            </div>
          </button>
        </div>
      )}

      {step === 'claim' && claimed && (
        <div className="w-full max-w-[560px]">
          <button
            type="button"
            onClick={() => setStep('matches')}
            className="mb-4 flex items-center gap-2 text-[12.5px] font-bold text-astro-text-muted hover:text-astro-text"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.6 3.6 7.2 12l8.4 8.4Z" />
            </svg>
            Not me after all
          </button>
          <h1 className="mb-2.5 font-display text-[46px] leading-[0.95] text-astro-text">THIS IS YOUR RECORD</h1>
          <p className="mb-6 text-[14.5px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
            Everything the group has voted about you since you started. Claiming it means it becomes
            yours: ratings, tags, the lot.
          </p>

          <div
            className="relative mb-4 overflow-hidden rounded-[18px] border-[1.5px] border-[rgba(166,63,255,0.5)] p-[26px]"
            style={{ background: 'linear-gradient(165deg,#1b2650,#111a33 55%)' }}
          >
            <div className="mb-[22px] flex flex-wrap items-center gap-4">
              <div
                className="size-16 shrink-0 rounded-2xl"
                style={{ background: 'linear-gradient(150deg, #2c3c74, #131c3a)' }}
              />
              <div className="min-w-[160px] flex-1">
                <div className="font-display text-[40px] leading-[0.92] text-astro-text">{claimed.nickname}</div>
                <div className="text-[13px] text-astro-text-muted">{claimed.full_name}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-[40px] leading-[0.92] text-astro-accent-soft">
                  {claimed.avg_rating ?? '—'}
                </div>
                <div className="text-[11px] font-extrabold tracking-[0.1em] text-astro-text-muted">SEASON AVG</div>
              </div>
            </div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))' }}>
              <div className="rounded-[10px] bg-astro-surface-2 p-3">
                <div className="font-display text-2xl leading-none text-astro-text">{claimed.appearances}</div>
                <div className="mt-0.5 text-[9.5px] font-extrabold tracking-[0.1em] text-astro-text-dim">APPS</div>
              </div>
              <div className="rounded-[10px] bg-astro-surface-2 p-3">
                <div className="font-display text-2xl leading-none text-astro-text">{claimed.goals}</div>
                <div className="mt-0.5 text-[9.5px] font-extrabold tracking-[0.1em] text-astro-text-dim">GOALS</div>
              </div>
              <div className="rounded-[10px] bg-astro-surface-2 p-3">
                <div className="font-display text-2xl leading-none text-astro-text">
                  {new Date(claimed.joined_at).getFullYear()}
                </div>
                <div className="mt-0.5 text-[9.5px] font-extrabold tracking-[0.1em] text-astro-text-dim">JOINED</div>
              </div>
            </div>
            {claimed.tags.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-[7px]">
                {claimed.tags.map((t) => (
                  <div
                    key={t}
                    className="rounded-lg border border-[rgba(166,63,255,0.45)] bg-[rgba(166,63,255,0.16)] px-[11px] py-1.5 text-[11.5px] font-bold text-astro-accent-soft"
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-[18px] flex items-start gap-3 rounded-xl border border-[rgba(242,169,59,0.45)] bg-astro-surface p-4">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#f2a93b" className="mt-px shrink-0">
              <path fillRule="evenodd" d="M12 2.4 22.4 20.8H1.6Zm-1 5.6h2v7h-2Zm0 9h2v2h-2Z" />
            </svg>
            <div>
              <div className="mb-1.5 text-[13px] font-extrabold text-astro-text">
                An admin has to wave this through
              </div>
              <p className="text-[12.5px] leading-[1.55] text-astro-text-muted [text-wrap:pretty]">
                Records hold ratings people voted for, so nobody claims one unchecked. Yours goes to
                the admins with the name you gave: they&rsquo;ll know if it&rsquo;s you. You can carry
                on setting up while it&rsquo;s pending.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('details')}
            className="rounded-xl bg-astro-accent px-[26px] py-[15px] text-[15px] font-extrabold text-astro-on-accent"
          >
            That&rsquo;s me, claim it
          </button>
        </div>
      )}

      {step === 'details' && (
        <div className="w-full max-w-[560px]">
          <h1 className="mb-2.5 font-display text-[46px] leading-[0.95] text-astro-text">TWO LAST THINGS</h1>
          <p className="mb-6 text-[14.5px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
            Both of these exist for one reason each. Skip either and nothing breaks: you&rsquo;ll just
            get tagged in nothing and nobody will know when to sing.
          </p>

          <div className="astro-card mb-3.5 p-6">
            <div className="mb-1.5 flex items-center gap-2.5">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#a63fff" className="shrink-0">
                <path fillRule="evenodd" d="M7.4 2.6h9.2a4.8 4.8 0 0 1 4.8 4.8v9.2a4.8 4.8 0 0 1-4.8 4.8H7.4a4.8 4.8 0 0 1-4.8-4.8V7.4a4.8 4.8 0 0 1 4.8-4.8Zm4.6 4.6a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 2.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Zm5.5-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
              </svg>
              <div className="font-display text-[26px] leading-none text-astro-text">INSTAGRAM</div>
              <div className="ml-auto text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
                Optional
              </div>
            </div>
            <p className="mb-3.5 text-[12.5px] leading-[1.55] text-astro-text-muted [text-wrap:pretty]">
              So we can tag you in the Sunday posts instead of writing &ldquo;and the lad in the red
              boots&rdquo;.
            </p>
            <div className="flex items-center rounded-[11px] border-[1.5px] border-white/10 bg-astro-surface-2 pl-4">
              <div className="shrink-0 text-base font-bold text-astro-text-dim">@</div>
              <input
                value={insta}
                onChange={(e) => setInsta(e.target.value.replace(/^@/, ''))}
                placeholder="trickyadeyemi"
                className="min-w-0 flex-1 bg-transparent px-2 py-3.5 text-base font-bold text-astro-text focus:outline-none"
              />
            </div>
          </div>

          <div className="astro-card mb-4.5 p-6">
            <div className="mb-1.5 flex items-center gap-2.5">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#a63fff" className="shrink-0">
                <path fillRule="evenodd" d="M12 2.2c1.4 2.1.7 3.4-.3 4.5-1.2 1.3-2.5 2.5-2.5 4.6a2.8 2.8 0 0 0 5.6 0c0-1-.4-1.8-.4-1.8 1.9 1.1 3.2 3 3.2 5.2a5.6 5.6 0 0 1-11.2 0C6.4 8.6 12 7.4 12 2.2ZM5.2 18.6h13.6v2.6H5.2Z" />
              </svg>
              <div className="font-display text-[26px] leading-none text-astro-text">BIRTHDAY</div>
              <div className="ml-auto text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
                Day &amp; month
              </div>
            </div>
            <p className="mb-4 text-[12.5px] leading-[1.55] text-astro-text-muted [text-wrap:pretty]">
              Everyone born in the same month throws one party together, so we need the month more
              than the day, and we don&rsquo;t want the year. Nobody needs your age on a football app.
            </p>

            <div className="mb-[9px] text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
              Month
            </div>
            <div className="mb-4.5 flex flex-wrap gap-1.5">
              {MONTHS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMonth(i + 1)}
                  className="rounded-lg px-3.5 py-2 text-xs"
                  style={{
                    fontWeight: month === i + 1 ? 800 : 600,
                    color: month === i + 1 ? '#0a0f1f' : '#9aa3c4',
                    background: month === i + 1 ? '#a63fff' : '#182448',
                    border: `1px solid ${month === i + 1 ? '#a63fff' : 'rgba(255,255,255,0.09)'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-[9px] text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
              Day
            </div>
            <input
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              placeholder="19"
              className="font-display w-24 rounded-[11px] border-[1.5px] border-white/10 bg-astro-surface-2 px-4 py-3.5 text-center text-2xl text-astro-text focus:border-astro-accent focus:outline-none"
            />
            <div className="mt-2.5 text-[12.5px] text-astro-text-muted">{dobEcho}</div>
          </div>

          {finishError && <p className="mb-3 text-xs text-astro-red">{finishError}</p>}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={finishing}
              onClick={finish}
              className="rounded-xl bg-astro-accent px-[26px] py-[15px] text-[15px] font-extrabold text-astro-on-accent disabled:opacity-60"
            >
              {finishing ? 'Finishing up…' : 'Finish up'}
            </button>
            <button
              type="button"
              disabled={finishing}
              onClick={finish}
              className="px-1.5 py-[15px] text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
            >
              Skip both
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="w-full max-w-[560px]">
          <div className="mb-6 pb-2 pt-5 text-center">
            <div className="font-display mb-3 text-[56px] leading-[0.92] text-astro-text">
              {isNew ? "YOU'RE IN" : 'SENT TO THE ADMINS'}
            </div>
            <p className="mx-auto max-w-[44ch] text-[15px] leading-[1.6] text-astro-text-muted [text-wrap:pretty]">
              {isNew
                ? 'New player, no record to argue about. Mark yourself available before Wednesday at eight and you could be playing this Sunday.'
                : `They'll confirm you're ${claimed?.nickname ?? 'who you say you are'} and your record unlocks. Usually the same evening: one of them is always on there.`}
            </p>
          </div>

          <div className="astro-card mb-4 p-[22px]">
            <div className="mb-3.5 text-[10.5px] font-extrabold uppercase tracking-[0.13em] text-astro-text-dim">
              What happens next
            </div>
            <div className="flex flex-col gap-3">
              {(isNew
                ? [
                    { title: 'Wednesday, 20:00', body: "Availability closes and the ballot draws thirty from everyone who marked themselves in." },
                    { title: "You'll be rated", body: 'After your first Sunday, everyone who played with you votes 1–10. That average is your rating: there is no admin scoring you.' },
                    { title: 'Dues are quarterly', body: '₦12,000 a quarter keeps the pitch booked. Nobody chases you on your first week.' },
                  ]
                : [
                    { title: 'While it’s pending', body: 'You can look around, read the rules and mark yourself available. Your old ratings stay hidden until it’s approved.' },
                    { title: 'If they say no', body: 'You keep the account and start fresh as a new player. Nothing is lost except the record you didn’t own.' },
                    { title: "Then it's Wednesday", body: 'Availability closes at eight and the ballot draws thirty. Being an old hand doesn’t improve your odds.' },
                  ]
              ).map((n, i) => (
                <div key={n.title} className="flex items-start gap-3">
                  <div className="mt-px flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border border-[rgba(166,63,255,0.45)] bg-[rgba(166,63,255,0.18)] text-[11px] font-extrabold text-astro-accent-soft">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[13.5px] font-extrabold text-astro-text">{n.title}</div>
                    <p className="text-[12.5px] leading-[1.5] text-astro-text-muted [text-wrap:pretty]">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate({ to: isNew ? '/' : '/pending-approval' })}
              className="rounded-xl bg-astro-accent px-[26px] py-[15px] text-[15px] font-extrabold text-astro-on-accent"
            >
              {isNew ? 'Take the tour' : 'Continue'}
            </button>
            <button
              type="button"
              onClick={restart}
              className="px-1.5 py-[15px] text-[13px] font-bold text-astro-text-muted hover:text-astro-text"
            >
              Run it again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
