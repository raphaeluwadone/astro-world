import { useState } from 'react'
import { MemorialModal } from '@/components/dialogs/MemorialModal'
import type { TributeRow } from '../api'

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function TributeCard({
  tribute,
  isOwn,
  tributeCount,
  onDelete,
}: {
  tribute: TributeRow
  isOwn: boolean
  tributeCount: number
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="astro-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="size-10 shrink-0 rounded-[10px]"
          style={{ background: 'linear-gradient(140deg, #243463, #182448)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-astro-text">{tribute.author.nickname}</div>
          <div className="text-[11.5px] text-astro-text-dim">
            {tribute.author.full_name} &middot; {relativeTime(tribute.created_at)}
          </div>
        </div>
        {isOwn && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 text-[11.5px] font-semibold text-astro-text-dim hover:text-astro-text"
          >
            Take it down
          </button>
        )}
      </div>
      <p className="text-[14.5px] leading-[1.6] text-astro-text [text-wrap:pretty]">{tribute.content}</p>

      <MemorialModal
        open={confirming}
        onOpenChange={setConfirming}
        title="Take your tribute down?"
        body={`Nobody is notified, and you can write another whenever you want to. The count on his page goes from ${tributeCount} to ${tributeCount - 1}.`}
        cancelLabel="Leave it up"
        confirmLabel="Take it down"
        confirmVariant="outline"
        onConfirm={() => {
          onDelete()
          setConfirming(false)
        }}
      />
    </div>
  )
}
