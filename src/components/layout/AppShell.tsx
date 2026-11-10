import { useState, type ReactNode } from 'react'
import { useNotificationsRealtime } from '@/features/notifications/hooks'
import { BottomNav } from './BottomNav'
import { MobileHeader } from './MobileHeader'
import { MobileNavDrawer } from './MobileNavDrawer'
import { PlayerSearchBar } from './PlayerSearchBar'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  useNotificationsRealtime()

  return (
    <div className="flex min-h-screen items-stretch bg-astro-bg">
      <Sidebar />
      <UserMenu />
      <div className="flex min-w-0 flex-1 flex-col md:ml-60">
        <MobileHeader onMenuClick={() => setMenuOpen(true)} />
        <MobileNavDrawer open={menuOpen} onOpenChange={setMenuOpen} />
        <main className="min-w-0 flex-1 px-4 py-5 md:px-10.5 md:py-8.5 md:pb-[70px]">
          <PlayerSearchBar className="mb-[22px] hidden max-w-[420px] md:flex lg:max-w-[460px]" />
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
