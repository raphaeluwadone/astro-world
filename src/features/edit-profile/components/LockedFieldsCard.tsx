interface LockedField {
  label: string
  why: string
  value: string
}

export function LockedFieldsCard({ fields }: { fields: LockedField[] }) {
  return (
    <div className="astro-card border-[rgba(166,63,255,0.22)] p-6">
      <div className="mb-1.5 flex items-center gap-2.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#a63fff">
          <path
            fillRule="evenodd"
            d="M12 2.4A4.6 4.6 0 0 0 7.4 7v2.4H5.2V21.2h13.6V9.4h-2.2V7A4.6 4.6 0 0 0 12 2.4Zm2.4 7V7a2.4 2.4 0 0 0-4.8 0v2.4Z"
          />
        </svg>
        <h2 className="font-display text-[28px] leading-none text-astro-text">Not Yours to Change</h2>
      </div>
      <p className="mb-4.5 text-[13px] text-astro-text-dim">
        These come from matchdays and votes. Ask nicely in the feed.
      </p>
      <div className="flex flex-col gap-[9px]">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-3.5 rounded-[11px] border border-border bg-astro-surface-sunken px-[15px] py-[13px]"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 text-[12.5px] font-extrabold text-astro-text-muted">
                {f.label}
              </div>
              <div className="text-[11.5px] text-astro-text-dim [text-wrap:pretty]">{f.why}</div>
            </div>
            <div className="max-w-[44%] shrink-0 text-right text-[13px] font-bold text-astro-text-dim">
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
