import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/features/auth/api'
import { useCurrentPlayer } from '@/features/auth/useSession'

export function UserMenu() {
  const { player } = useCurrentPlayer()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    await navigate({ to: '/login' })
  }

  return (
    <div className="fixed right-6 top-5 z-20 hidden md:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full border border-border bg-astro-surface py-1.5 pl-1.5 pr-3.5 hover:border-astro-accent/40"
          >
            <div className="flex size-7 items-center justify-center rounded-full border border-astro-accent/40 bg-astro-surface-2 font-display text-xs text-astro-accent">
              {(player?.nickname ?? '?').slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-astro-text">
              {player?.nickname ?? 'Loading…'}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>{player?.full_name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
