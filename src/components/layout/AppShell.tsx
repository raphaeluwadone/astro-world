import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-stretch bg-astro-bg">
      <Sidebar />
      <UserMenu />
      <div className="flex min-w-0 flex-1 flex-col md:ml-60">
        <MobileHeader />
        <main className="min-w-0 flex-1 px-4 py-5 md:px-10.5 md:py-8.5 md:pb-[70px]">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
