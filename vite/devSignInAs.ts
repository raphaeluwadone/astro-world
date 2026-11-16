import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import type { Plugin } from 'vite'

const DEV_DOMAIN = 'dev.astro.local'

/** Dev server only: lists players and mints a session for any of them, so local testing skips the login. */
export function devSignInAs(env: Record<string, string>): Plugin {
  return {
    name: 'astro-dev-sign-in-as',
    apply: 'serve',
    configureServer(server) {
      const url = env.VITE_SUPABASE_URL
      const key = env.SUPABASE_SERVICE_ROLE_KEY
      if (!url || !key) return
      const host = new URL(url).hostname
      if (host !== '127.0.0.1' && host !== 'localhost') {
        server.config.logger.warn('[sign-in-as] off: VITE_SUPABASE_URL is not a local Supabase')
        return
      }
      const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

      async function emailFor(playerId: string | undefined) {
        if (!playerId) {
          const email = `new-${Date.now()}@${DEV_DOMAIN}`
          const { error } = await admin.auth.admin.createUser({ email, email_confirm: true })
          if (error) throw error
          return email
        }
        const { data: player, error } = await admin.from('players').select('user_id').eq('id', playerId).single()
        if (error) throw error
        if (player.user_id) {
          const { data, error: userError } = await admin.auth.admin.getUserById(player.user_id)
          if (userError) throw userError
          return data.user.email!
        }
        // Unclaimed player: give them a dev login so RLS sees them as themselves.
        const email = `${playerId}@${DEV_DOMAIN}`
        const { data: created, error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true })
        if (createError) throw createError
        const { error: linkError } = await admin.from('players').update({ user_id: created.user.id }).eq('id', playerId)
        if (linkError) throw linkError
        return email
      }

      async function handle(req: IncomingMessage, res: ServerResponse) {
        res.setHeader('content-type', 'application/json')
        if (req.method === 'GET') {
          const { data, error } = await admin
            .from('players')
            .select('id, nickname, full_name, is_admin, user_id, left_at')
            .order('nickname')
          if (error) throw error
          return res.end(JSON.stringify(data.map(({ user_id, ...p }) => ({ ...p, hasLogin: !!user_id }))))
        }
        let body = ''
        for await (const chunk of req) body += chunk
        const { playerId } = JSON.parse(body || '{}') as { playerId?: string }
        const email = await emailFor(playerId)
        const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
        if (error) throw error
        res.end(JSON.stringify({ tokenHash: data.properties.hashed_token }))
      }

      server.middlewares.use('/__dev/sign-in-as', (req, res) => {
        handle(req, res).catch((e: Error) => {
          res.statusCode = 500
          res.end(JSON.stringify({ error: e.message }))
        })
      })
    },
  }
}
