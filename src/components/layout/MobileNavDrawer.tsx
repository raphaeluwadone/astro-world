import { Dialog as DialogPrimitive } from 'radix-ui'
import { CloseIcon } from '@/components/icons/nav-icons'
import { SidebarNavContent } from './SidebarNavContent'

export function MobileNavDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[90] bg-[rgba(10,15,31,0.72)] md:hidden"
          style={{ animation: 'md-backdrop 200ms ease both' }}
        />
        <DialogPrimitive.Content
          className="fixed inset-y-0 left-0 z-[90] flex w-[82%] max-w-80 flex-col gap-[22px] overflow-y-auto border-r border-border bg-astro-surface px-4 pt-[26px] pb-[30px] outline-none md:hidden"
          style={{ animation: 'md-drawer 260ms cubic-bezier(.2,.8,.2,1) both' }}
        >
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <DialogPrimitive.Close className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-astro-text-muted hover:bg-astro-surface-2 hover:text-astro-text">
            <CloseIcon className="size-4" />
          </DialogPrimitive.Close>
          <SidebarNavContent onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
