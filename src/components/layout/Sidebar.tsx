import { SidebarNavContent } from './SidebarNavContent'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 shrink-0 flex-col gap-[22px] overflow-y-auto border-r border-border bg-astro-surface px-4 pt-[26px] pb-[30px] md:flex">
      <SidebarNavContent />
    </aside>
  )
}
