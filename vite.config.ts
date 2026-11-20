import path from 'node:path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { devSignInAs } from './vite/devSignInAs.ts'

// https://vite.dev/config/
// Netlify sets CONTEXT (production, deploy-preview, branch-deploy) and COMMIT_REF at build time.
const sentryUpload = !!process.env.SENTRY_AUTH_TOKEN

export default defineConfig(({ mode }) => ({
  plugins: [
    devSignInAs(loadEnv(mode, __dirname, '')),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    sentryUpload &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: { name: process.env.COMMIT_REF },
        sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
        telemetry: false,
      }),
  ],
  // Maps go to Sentry, then are deleted so they're never served.
  build: { sourcemap: sentryUpload ? 'hidden' : false },
  define: {
    'import.meta.env.VITE_SENTRY_ENVIRONMENT': JSON.stringify(process.env.CONTEXT ?? mode),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
