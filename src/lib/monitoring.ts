import * as Sentry from '@sentry/react'
import { onlineManager } from '@tanstack/react-query'
import type { router as appRouter } from '@/router'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

/** Off unless VITE_SENTRY_DSN is set, so local dev sends nothing. */
export function startMonitoring(router: typeof appRouter) {
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    tracesSampleRate: 0.2,
    // Only the player fields we set ourselves: no IPs, cookies, headers or request bodies (sign-up sends emails).
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
    ignoreErrors: ['ResizeObserver loop'],
  })
}

type DbError = { message: string; code?: string; details?: string; hint?: string }

const isDbError = (e: unknown): e is DbError =>
  typeof e === 'object' && e !== null && typeof (e as DbError).message === 'string' && typeof (e as DbError).code === 'string'

/** Supabase errors are plain objects, which Sentry can't group, so wrap them. */
function toError(e: unknown): Error {
  if (e instanceof Error) return e
  if (isDbError(e)) return Object.assign(new Error(e.message), { name: `DbError ${e.code}` })
  if (typeof e === 'object' && e !== null && typeof (e as { message?: unknown }).message === 'string') return new Error((e as { message: string }).message)
  return new Error(typeof e === 'string' ? e : 'Non-error thrown')
}

/** Our own `raise exception` messages (SQLSTATE P0001) are answers for the player, not bugs. */
function isExpected(e: unknown) {
  if (!onlineManager.isOnline()) return true
  return isDbError(e) && e.code === 'P0001'
}

export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!dsn || isExpected(error)) return
  const db = isDbError(error) ? { code: error.code, details: error.details, hint: error.hint } : undefined
  Sentry.captureException(toError(error), { extra: { ...db, ...context } })
}

export function setMonitoredPlayer(player: { id: string; nickname: string; is_admin: boolean } | null, userId?: string) {
  if (!dsn) return
  Sentry.setUser(player ? { id: userId ?? player.id, username: player.nickname } : userId ? { id: userId } : null)
  Sentry.setTag('player_id', player?.id)
  Sentry.setTag('admin', player ? String(player.is_admin) : undefined)
}

export const reactErrorHandler = Sentry.reactErrorHandler
