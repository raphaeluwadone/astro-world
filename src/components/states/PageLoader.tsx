import { BallOrbitLoader } from './BallOrbitLoader'

/** Drop-in replacement for a bare "Loading…" line: the same Orbit loader, centred, for a full page or section. */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <BallOrbitLoader label={label} />
    </div>
  )
}
