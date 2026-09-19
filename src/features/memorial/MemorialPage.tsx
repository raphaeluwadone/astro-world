import { useCurrentPlayer } from '@/features/auth/useSession'
import { EmptyState } from '@/components/states/EmptyState'
import { TheCircleIcon } from '@/components/states/icons'
import { VigilLoader } from '@/components/states/VigilLoader'
import { TributeCard } from './components/TributeCard'
import { TributeComposer } from './components/TributeComposer'
import { useCreateTribute, useDeleteTribute, useTributes } from './hooks'

export function MemorialPage() {
  const { player } = useCurrentPlayer()
  const playerId = player?.id ?? null

  const { data: tributes = [], isLoading } = useTributes()
  const createTribute = useCreateTribute(playerId)
  const deleteTribute = useDeleteTribute()

  return (
    <div>
      <div
        className="relative mb-7 overflow-hidden rounded-[18px] border border-[rgba(166,63,255,0.3)] p-8"
        style={{ background: 'linear-gradient(165deg,#1b2650,#111a33 60%)' }}
      >
        <div
          className="pointer-events-none absolute right-[-30px] top-[-40px] font-display text-[220px] leading-none"
          style={{ color: 'rgba(255,255,255,0.04)' }}
        >
          13
        </div>
        <div className="relative flex items-center gap-2.5 pb-4">
          <div className="h-px w-[26px] bg-astro-accent" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-astro-accent-soft">
            In memory
          </span>
        </div>
        <h1 className="relative font-display text-[44px] leading-[0.95] text-astro-text md:text-[56px]">
          ADE SALAMI
        </h1>
        <p className="relative mt-2 text-sm text-astro-text-muted">
          No. 13, his number, and anyone&rsquo;s who wants it
        </p>
        <p className="relative mt-5 max-w-[68ch] text-[15px] leading-[1.65] text-astro-text [text-wrap:pretty]">
          Ade Salami played with us for years. He started the group chat and bought the first set of
          bibs. Thirteen was retired in his memory, and four times a year the Salami Cup is played in
          his name, with squads picked by hand rather than drawn.
        </p>
      </div>

      <div className="astro-card mb-4 p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[28px] leading-none text-astro-text">Tributes</h2>
          <span className="text-xs text-astro-text-dim">{tributes.length} &middot; open for good</span>
        </div>

        <div className="mb-5 border-l-2 border-[rgba(203,213,245,0.4)] pl-[18px]">
          <p className="font-serif text-[19px] leading-[1.5] text-[#e8ecfa] [text-wrap:pretty]">
            Tributes stay up permanently. You can take yours down whenever you like, and nobody is told
            when you do.
          </p>
        </div>

        <TributeComposer
          disabled={!playerId}
          isSubmitting={createTribute.isPending}
          onSubmit={(content) => createTribute.mutate(content)}
        />
      </div>

      <div className="flex flex-col gap-3.5">
        {isLoading ? (
          <VigilLoader />
        ) : tributes.length === 0 ? (
          <EmptyState icon={<TheCircleIcon />} title="Nobody has written yet." body="Be the first. A line is enough." />
        ) : (
          tributes.map((tribute) => (
            <TributeCard
              key={tribute.id}
              tribute={tribute}
              isOwn={tribute.author.id === playerId}
              tributeCount={tributes.length}
              onDelete={() => deleteTribute.mutate(tribute.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
