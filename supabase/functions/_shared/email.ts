// Ticket emails from the Astro email kit, as inline-styled tables so they hold up in Gmail and Outlook.
import { BADGES } from './badges.ts'

export const APP_URL = (Deno.env.get('APP_URL') ?? 'http://localhost:5175').replace(/\/$/, '')
const TZ = Deno.env.get('APP_TIMEZONE') ?? 'Europe/London'

const C = { purple: '#a63fff', green: '#4ade80', cyan: '#38bdf8', amber: '#f2a93b', gold: '#f2a93b', grey: '#4d5578' }
const TIER_STUB = { week: C.green, month: C.cyan, year: C.purple, cup: C.gold } as const
const TIER_LABEL = { week: 'Weekly', month: 'Monthly', year: 'Yearly', cup: 'Salami Cup' } as const

const DISPLAY = "'Bebas Neue','Arial Narrow',Impact,sans-serif"
const SANS = "Manrope,'Segoe UI',Helvetica,Arial,sans-serif"
const MONO = "'JetBrains Mono',Menlo,Consolas,monospace"

export interface Ticket {
  subject: string
  preheader: string
  stub: string
  stubImage?: string
  ink?: string
  keyColor?: string
  ref: [string, string]
  head: string
  patch?: { name: string; tier: string }
  body: string[]
  facts?: [string, string][]
  cta: { label: string; url: string }
  small?: string
  optIn: boolean
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).format(new Date(iso))
const dayMonth = (iso: string) => fmt(iso, { day: 'numeric', month: 'short' })
const longDay = (iso: string) => fmt(iso, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
const fullDate = (iso: string) => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' })
const time = (iso: string) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false })
const naira = (n: unknown) => `₦${Number(n).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`
const quarterLabel = (d: Record<string, unknown>) => `Q${d.quarter} ${d.year}`
const listNames = (names: string[]) =>
  names.length <= 2 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
const url = (path: unknown) => `${APP_URL}${String(path ?? '/')}`

const LOGO = `<svg width="24" height="24" viewBox="0 0 100 100" aria-hidden="true" style="vertical-align:middle"><g transform="translate(5 9) scale(0.75)"><ellipse cx="60" cy="50" rx="54" ry="19" fill="none" stroke="#1b2650" stroke-width="6" transform="rotate(-20 60 50)"/><circle cx="60" cy="50" r="31" fill="#0a0f1f"/><path d="M60 31 L74 41 L68 58 H52 L46 41 Z" fill="#eef0f9"/><path d="M18 66 Q60 88 103 46" fill="none" stroke="#0a0f1f" stroke-width="6" stroke-linecap="round"/></g></svg>`

export function renderTicket(t: Ticket): string {
  const ink = t.ink ?? '#0a0f1f'
  const key = t.keyColor ?? '#c589ff'
  const stubBg = t.stubImage ? `background-color:${t.stub};background-image:${t.stubImage};` : `background-color:${t.stub};`
  const patch = t.patch
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;background:#0f1730;border-radius:8px;margin:0 0 16px"><tr>
        <td width="56" style="${stubBg}border-radius:8px 0 0 8px;text-align:center;font-family:${DISPLAY};font-size:24px;color:${ink}">&#9733;</td>
        <td style="padding:10px 16px"><div style="font-family:${DISPLAY};font-size:26px;line-height:1;color:#eef0f9;letter-spacing:.04em">${esc(t.patch.name)}</div>
        <div style="font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#9aa3c4">${esc(t.patch.tier)}</div></td>
      </tr></table>`
    : ''
  const facts = t.facts?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1730;border-radius:10px;margin:0 0 14px"><tr>${t.facts
        .map(
          ([k, v], i) =>
            `<td valign="top" style="padding:12px 14px;${i ? 'border-left:1px dashed rgba(255,255,255,.1);' : ''}"><div style="font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${key}">${esc(k)}</div><div style="font-weight:800;font-size:15px;color:#eef0f9">${esc(v)}</div></td>`,
        )
        .join('')}</tr></table>`
    : ''
  const why = t.optIn
    ? `You get these because they're on in your email settings. <a href="${APP_URL}/profile/edit#email-settings" style="color:#9aa3c4">Turn them off</a>.`
    : "This is about your account, so it can't be turned off."

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<title>${esc(t.subject)}</title></head>
<body style="margin:0;padding:0;background:#05080f">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(t.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05080f"><tr><td align="center" style="padding:28px 16px 36px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:${SANS};color:#eef0f9">
<tr><td style="background:#111a33;border-radius:14px;overflow:hidden">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="${stubBg}padding:14px 24px;border-radius:14px 14px 0 0;color:${ink}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-family:${DISPLAY};font-size:26px;letter-spacing:.1em;color:${ink}">${LOGO} ASTRO</td>
        <td align="right" style="font-family:${MONO};font-size:11px;line-height:1.4;color:${ink};opacity:.85">${esc(t.ref[0])}<br>${esc(t.ref[1])}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:28px 24px 24px">
      <h1 style="margin:0 0 16px;font-family:${DISPLAY};font-weight:400;font-size:46px;line-height:.95;color:#eef0f9">${esc(t.head)}</h1>
      ${patch}
      ${t.body.map((p) => `<p style="margin:0 0 12px;color:#c9cee4;font-size:15.5px;line-height:1.5">${p}</p>`).join('')}
    </td></tr>
    <tr><td style="padding:0 18px"><div style="border-top:2px dashed rgba(255,255,255,.12);height:0;line-height:0">&nbsp;</div></td></tr>
    <tr><td style="padding:20px 24px 26px">
      ${facts}
      <a href="${esc(t.cta.url)}" style="display:block;background:#eef0f9;color:#0a0f1f;border-radius:8px;text-align:center;font-weight:800;font-size:15px;padding:14px 26px;text-decoration:none">${esc(t.cta.label)}</a>
      ${t.small ? `<p style="margin:14px 0 0;font-size:13px;color:#9aa3c4">${t.small}</p>` : ''}
      <p style="margin:14px 0 0;font-size:12px;color:#6d7496;word-break:break-all">Button not working? Paste this into your browser: <a href="${esc(t.cta.url)}" style="color:#c589ff">${esc(t.cta.url)}</a></p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:18px 8px 0;font-size:12px;color:#6d7496;text-align:center;line-height:1.6">Astro · Sunday football at Gbaja Boys<br>${why}</td></tr>
</table></td></tr></table></body></html>`
}

type Data = Record<string, any>

export function buildTicket(template: string, d: Data): Ticket | null {
  switch (template) {
    case 'spot':
      return {
        subject: `You're on for Sunday ${dayMonth(d.played_at)}`,
        preheader: `Spot ${d.spot} of ${d.capacity}. Teams drawn Saturday.`,
        stub: C.purple,
        ref: ['MATCHDAY', `SPOT ${d.spot}/${d.capacity}`],
        head: "You're on the list",
        body: [`You grabbed <b>spot ${esc(d.spot)} of ${esc(d.capacity)}</b>. Teams are drawn on Saturday evening and nobody knows who they're with until then.`],
        facts: [['Sunday', dayMonth(d.played_at)], ['Kick-off', time(d.played_at)], ['Spot', `${d.spot} / ${d.capacity}`]],
        cta: { label: 'See the matchday', url: url(d.link) },
        small: "Can't make it? Drop out before Saturday so someone on standby gets in.",
        optIn: true,
      }

    case 'badge': {
      const def = BADGES[d.badge_key]
      if (!def) return null
      const shared: string[] = d.shared_with ?? []
      const cup = def.tier === 'cup'
      const base = {
        stub: TIER_STUB[def.tier],
        stubImage: cup ? 'linear-gradient(120deg,#f6d27a,#c98a1e)' : undefined,
        ref: ['BADGE', TIER_LABEL[def.tier].toUpperCase()] as [string, string],
        cta: { label: cup ? 'See the honours' : 'See the award', url: url(d.link) },
        optIn: true,
      }
      if (d.badge_key === 'silverware') {
        return {
          ...base,
          subject: 'Silverware: you won the Salami Cup',
          preheader: 'Yours until the next cup is won.',
          head: 'Silverware',
          patch: { name: def.name, tier: 'Salami Cup · Winner' },
          body: ["Your team won the <b>Salami Cup</b>. The badge stays on your profile, with the gold border, until somebody else lifts the next one."],
          facts: [['Awarded', fullDate(d.awarded_at)], ['Holds until', 'Next cup']],
          cta: { label: 'See the honours', url: `${APP_URL}/salami-cup` },
        }
      }
      const holds = cup ? 'Next cup' : fullDate(d.expires_at)
      if (shared.length > 0 && !cup) {
        return {
          ...base,
          subject: `New badge, shared: ${def.name}`,
          preheader: `Tied with ${listNames(shared)}.`,
          head: 'You share a badge',
          patch: { name: def.name, tier: `${TIER_LABEL[def.tier]} · Tied` },
          body: [`You and <b>${esc(listNames(shared))}</b> tied${d.detail ? ` for ${esc(String(d.detail).charAt(0).toLowerCase() + String(d.detail).slice(1))}` : ''}, so you all get it. Tied badges carry a tied mark on your profile.`],
          facts: [['Tied with', shared.length === 1 ? shared[0] : `${shared.length} others`], ...(d.stat ? [['Stat', d.stat] as [string, string]] : []), ['Holds until', holds]],
        }
      }
      return {
        ...base,
        subject: `New badge: ${def.name}`,
        preheader: d.detail ?? def.for,
        head: 'You earned a badge',
        patch: { name: def.name, tier: `${TIER_LABEL[def.tier]} · ${def.for}` },
        body: [
          cup
            ? `You picked up <b>${esc(def.name)}</b> at the Salami Cup. It stays on your profile until the next cup is won.`
            : `It's on your profile now and next to your name across the app until <b>${esc(fullDate(d.expires_at))}</b>. Win it again and the clock resets.`,
        ],
        facts: [['Awarded', fullDate(d.awarded_at)], ['Holds until', holds], ['Shared', shared.length ? `With ${shared.length}` : 'No']],
      }
    }

    case 'dues-due':
      return {
        subject: `${quarterLabel(d)} dues are due ${longDay(d.due_date)}`,
        preheader: `${naira(d.amount)}, due ${longDay(d.due_date)}.`,
        stub: C.amber,
        ink: '#20150a',
        keyColor: C.amber,
        ref: ['DUES', quarterLabel(d).toUpperCase()],
        head: 'Dues are due',
        body: [`${esc(quarterLabel(d))} dues are <b>${naira(d.amount)}</b>, due by <b>${esc(longDay(d.due_date))}</b>. Pay an admin in person or by transfer and they'll mark you as paid.`],
        facts: [['Amount', naira(d.amount)], ['Due', longDay(d.due_date)], ['Paid so far', `${d.paid_count} / ${d.roster}`]],
        cta: { label: 'See your dues', url: url(d.link) },
        small: "Dues aren't tied to the ballot. Not paying won't cost you a spot.",
        optIn: true,
      }

    case 'dues-late': {
      const days = Math.max(1, Math.round((Date.now() - new Date(d.due_date).getTime()) / 86_400_000))
      return {
        subject: `Your ${quarterLabel(d)} dues are overdue`,
        preheader: `${naira(d.amount)}, was due ${longDay(d.due_date)}.`,
        stub: C.amber,
        ink: '#20150a',
        keyColor: C.amber,
        ref: ['DUES', 'OVERDUE'],
        head: 'Still owed',
        body: [`We don't have your <b>${esc(quarterLabel(d))}</b> dues marked as paid yet. If you've paid, tell an admin and they'll fix it.`],
        facts: [['Amount', naira(d.amount)], ['Was due', longDay(d.due_date)], ['Days late', String(days)]],
        cta: { label: 'See your dues', url: url(d.link) },
        small: 'Paying on time every quarter earns the Good Standing badge.',
        optIn: true,
      }
    }

    case 'dues-paid':
      return {
        subject: `Dues received for ${quarterLabel(d)}`,
        preheader: d.marked_by ? `Marked as paid by ${d.marked_by}.` : 'Marked as paid.',
        stub: C.green,
        keyColor: C.green,
        ref: ['DUES', 'RECEIPT'],
        head: 'Paid, thank you',
        body: [`<b>${esc(d.marked_by ?? 'An admin')}</b> marked your ${esc(quarterLabel(d))} dues as paid. Nothing else to do.`],
        facts: [['Amount', naira(d.amount)], ['Paid', longDay(d.paid_at)], ['Marked by', d.marked_by ?? 'Admin']],
        cta: { label: 'See your dues', url: url(d.link) },
        optIn: true,
      }

    case 'claim-approved':
      return {
        subject: "You're in. Your Astro profile is live",
        preheader: `An admin approved your claim on ${d.nickname}.`,
        stub: C.purple,
        ref: ['ROSTER', 'APPROVED'],
        head: "You're in",
        body: [
          `An admin approved your claim on <b>${esc(d.nickname)}</b> in the roster.` +
            (d.legacy_goals || d.legacy_assists
              ? ` Your legacy record of <b>${esc(d.legacy_goals ?? 0)} goals and ${esc(d.legacy_assists ?? 0)} assists</b> is on your profile now.`
              : ''),
        ],
        cta: { label: 'Open your profile', url: url(d.link) },
        optIn: false,
      }
  }
  return null
}
