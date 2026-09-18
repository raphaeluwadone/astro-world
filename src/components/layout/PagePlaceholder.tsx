export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-astro-text-dim">
        {eyebrow}
      </div>
      <h1 className="font-display text-[40px] leading-[0.95] tracking-[0.01em] text-astro-text md:text-[52px]">
        {title}
      </h1>
      <p className="mt-3 max-w-lg text-sm text-astro-text-muted">{description}</p>
    </div>
  )
}
