import { cn } from 'cn'
import { Fragment, useMemo, type ReactNode } from 'react'
import { MentionChip } from '@/features/community/mentions/MentionChip'
import { parseBlocks, type Inline, type Variant } from './markdown'

function renderInline(inline: Inline[]): ReactNode[] {
  return inline.map((n, i) => {
    if (n.type === 'br') return <br key={i} />
    if (n.type === 'mention') return <MentionChip key={i} mention={n.mention} />
    let node: ReactNode = n.text
    if (n.italic) node = <em>{node}</em>
    if (n.bold) node = <strong className="font-extrabold">{node}</strong>
    if (n.href) {
      const external = !n.href.startsWith('/')
      node = (
        <a
          href={n.href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer nofollow' : undefined}
          onClick={(e) => e.stopPropagation()}
          className="font-bold text-astro-accent-soft underline decoration-astro-accent/40 underline-offset-2 hover:decoration-astro-accent"
        >
          {node}
        </a>
      )
    }
    return <Fragment key={i}>{node}</Fragment>
  })
}

/** Renders stored post, tribute or article text: formatting, links and @mention chips. */
export function RichText({ content, variant = 'basic', className, gap = 'gap-2' }: { content: string; variant?: Variant; className?: string; gap?: string }) {
  const blocks = useMemo(() => parseBlocks(content, variant), [content, variant])
  return (
    <div className={cn('flex min-w-0 flex-col break-words', gap, className)}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'p':
            return <p key={i}>{renderInline(b.inline)}</p>
          case 'h':
            return b.level === 2 ? (
              <h2 key={i} className="mt-3 font-display text-[30px] leading-none text-astro-text [text-wrap:balance]">
                {renderInline(b.inline)}
              </h2>
            ) : (
              <h3 key={i} className="mt-2 text-[18px] font-extrabold leading-tight text-astro-text">
                {renderInline(b.inline)}
              </h3>
            )
          case 'quote':
            return (
              <blockquote key={i} className="border-l-[3px] border-astro-accent/60 pl-4 font-serif text-[1.08em] italic text-[#d7dcef]">
                {renderInline(b.inline)}
              </blockquote>
            )
          case 'img':
            return <img key={i} src={b.src} alt={b.alt} loading="lazy" className="my-1 w-full rounded-[12px] object-cover" />
          case 'ul':
          case 'ol': {
            const List = b.type === 'ul' ? 'ul' : 'ol'
            return (
              <List key={i} className={cn('flex flex-col gap-1 pl-5', b.type === 'ul' ? 'list-disc marker:text-astro-accent' : 'list-decimal marker:font-bold marker:text-astro-text-dim')}>
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </List>
            )
          }
        }
      })}
    </div>
  )
}
