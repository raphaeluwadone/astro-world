/** Visual only: there's no photo upload/storage pipeline built yet (see
 * project memory), so this shows the real shape without pretending a drop
 * zone that goes nowhere actually works. */
export function CardPhotoCard() {
  return (
    <div className="astro-card p-6">
      <h2 className="mb-4 font-display text-[28px] leading-none text-astro-text">Card Photo</h2>
      <div className="flex items-stretch gap-4">
        <div
          className="flex min-h-[168px] w-[126px] shrink-0 items-end justify-center overflow-hidden rounded-[13px]"
          style={{ background: 'linear-gradient(160deg, #2c3c74, #131c3a)' }}
        >
          <div className="h-[78%] w-[52%] rounded-t-full bg-white/[0.055]" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-2.5 rounded-[13px] border border-dashed border-[rgba(166,63,255,0.4)] p-[18px] text-center">
          <div className="text-[13.5px] font-extrabold text-astro-accent-soft">Not wired up yet</div>
          <p className="text-xs text-astro-text-dim [text-wrap:pretty]">
            Shoulders up, no sunglasses, no group shots. It'll get cropped to the card once photo
            upload exists.
          </p>
        </div>
      </div>
    </div>
  )
}
