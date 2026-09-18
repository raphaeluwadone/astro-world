import { InTheNetIcon } from './icons'

export function SuccessState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <InTheNetIcon />
      <div>
        <div className="mb-1.5 text-[15px] font-bold text-astro-text">{title}</div>
        <p className="mx-auto max-w-[36ch] text-[13px] leading-[1.55] text-astro-text-muted [text-wrap:pretty]">
          {body}
        </p>
      </div>
    </div>
  )
}
