// Sends edge function errors to Sentry when the SENTRY_DSN secret is set; otherwise they only go to the logs.
const SENTRY = 'npm:@sentry/deno@11.10.0'
type SentryModule = typeof import('npm:@sentry/deno@11.10.0')

let loading: Promise<SentryModule | null> | undefined

function sentry() {
  const dsn = Deno.env.get('SENTRY_DSN')
  if (!dsn) return Promise.resolve(null)
  loading ??= (import(SENTRY) as Promise<SentryModule>)
    .then((S) => {
      S.init({
        dsn,
        environment: Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production',
        defaultIntegrations: false,
        dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [] },
      })
      return S
    })
    .catch((e) => {
      console.error('sentry failed to load', e)
      return null
    })
  return loading
}

export async function reportError(fn: string, error: unknown, extra?: Record<string, unknown>) {
  console.error(fn, error, extra ?? '')
  const S = await sentry()
  if (!S) return
  S.withScope((scope) => {
    scope.setTag('function', fn)
    if (extra) scope.setExtras(extra)
    S.captureException(error instanceof Error ? error : new Error(String(error)))
  })
  await S.flush(2000)
}

async function messageOf(res: Response) {
  const text = await res.clone().text().catch(() => '')
  try {
    const body = JSON.parse(text)
    if (typeof body?.error === 'string') return body.error
  } catch {
    // Not JSON.
  }
  return text.slice(0, 300) || `HTTP ${res.status}`
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function withCors(res: Response) {
  if (res.headers.has('Access-Control-Allow-Origin')) return res
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(cors)) headers.set(k, v)
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}

/** Deno.serve that answers CORS preflights and reports thrown errors and 5xx responses. */
export function serve(fn: string, handler: (req: Request) => Response | Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
    try {
      const res = await handler(req)
      if (res.status >= 500) await reportError(fn, new Error(`${fn}: ${await messageOf(res)}`), { status: res.status })
      return withCors(res)
    } catch (e) {
      await reportError(fn, e)
      return withCors(Response.json({ error: 'Something went wrong' }, { status: 500 }))
    }
  })
}
