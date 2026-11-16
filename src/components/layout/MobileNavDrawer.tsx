import { useNavigate } from '@tanstack/react-router'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { CloseIcon, SignOutIcon } from '@/components/icons/nav-icons'
import { signOut } from '@/features/auth/api'
import { SidebarNavContent } from './SidebarNavContent'

export function MobileNavDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate()
  const handleSignOut = async () => {
    await signOut()
    onOpenChange(false)
    await navigate({ to: '/login' })
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[90] bg-[rgba(10,15,31,0.72)] md:hidden"
          style={{ animation: 'md-backdrop 200ms ease both' }}
        />
        <DialogPrimitive.Content
          className="astro-drawer-top fixed inset-0 z-[90] flex h-dvh w-full flex-col gap-[22px] overflow-y-auto bg-astro-surface px-4 pb-[30px] pt-[calc(26px+env(safe-area-inset-top))] outline-none md:hidden"
        >
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <DialogPrimitive.Close className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-astro-text-muted hover:bg-astro-surface-2 hover:text-astro-text">
            <CloseIcon className="size-4" />
          </DialogPrimitive.Close>
          <SidebarNavContent onNavigate={() => onOpenChange(false)} />
          <button
            type="button"
            onClick={handleSignOut}
            className="astro-tap mt-auto flex min-h-11 items-center gap-3 rounded-[9px] px-2.5 text-[14px] font-bold text-astro-text-muted hover:bg-astro-red/10 hover:text-astro-red"
          >
            <SignOutIcon className="size-[19px]" />
            Sign out
          </button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
