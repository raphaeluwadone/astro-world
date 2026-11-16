import { lazy } from 'react'

// Null in production builds, so the picker's code never ships.
export const DevSwitcher = import.meta.env.DEV ? lazy(() => import('./SignInAs').then((m) => ({ default: m.DevSwitcher }))) : null
export const DevSignInAs = import.meta.env.DEV ? lazy(() => import('./SignInAs').then((m) => ({ default: m.SignInAs }))) : null
