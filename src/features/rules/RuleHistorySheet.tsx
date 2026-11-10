import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { AMENDMENTS, formatAmendmentDate } from './content'

export function RuleHistorySheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto border-white/[0.07] bg-astro-surface p-0 text-astro-text sm:max-w-md"
      >
        <div className="border-b border-white/[0.07] px-6 pb-5 pt-6">
          <SheetTitle className="font-display text-[30px] font-normal leading-none text-astro-text">Change history</SheetTitle>
          <SheetDescription className="mt-1.5 text-[13px] text-astro-text-muted [text-wrap:pretty]">
            Every change to the rules, newest first, with who made it and how it was decided.
          </SheetDescription>
        </div>
        <ol className="px-6 py-5">
          {AMENDMENTS.map((a, i) => (
            <li key={a.date} className="flex gap-3.5">
              <div className="flex w-3 shrink-0 flex-col items-center">
                <div className={`mt-1.5 size-2.5 shrink-0 rounded-sm ${i === 0 ? 'bg-astro-accent' : 'bg-astro-text-disabled'}`} />
                {i < AMENDMENTS.length - 1 && <div className="w-px flex-1 bg-white/[0.09]" />}
              </div>
              <div className="min-w-0 flex-1 pb-5">
                <div className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-astro-text-dim">
                  {formatAmendmentDate(a.date)}
                </div>
                <div className="mb-2 text-[13.5px] leading-[1.55] text-astro-text [text-wrap:pretty]">{a.text}</div>
                <div className="flex flex-wrap gap-1.5">
                  <div className="rounded-md border border-white/[0.07] bg-astro-surface-2 px-2.5 py-1 text-[11px] font-bold text-astro-text-muted">
                    {a.by}
                  </div>
                  <div className="rounded-md border border-white/[0.07] bg-astro-surface-2 px-2.5 py-1 text-[11px] font-extrabold text-astro-text-dim">
                    {a.vote}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </SheetContent>
    </Sheet>
  )
}
