import { PhotoControls } from '@/features/photos/PhotoControls'
import { PlayerPhoto } from '@/features/photos/PlayerPhoto'

export function CardPhotoCard({ playerId, nickname }: { playerId: string; nickname: string }) {
  return (
    <div className="astro-card p-6">
      <h2 className="mb-4 font-display text-[28px] leading-none text-astro-text">Card Photo</h2>
      <div className="flex items-stretch gap-4">
        <PlayerPhoto
          playerId={playerId}
          alt={nickname}
          className="flex min-h-[168px] w-[126px] items-end justify-center rounded-[13px]"
          style={{ background: 'linear-gradient(160deg, #2c3c74, #131c3a)' }}
          fallback={<div className="h-[78%] w-[52%] rounded-t-full bg-white/[0.055]" />}
        />
        <div className="flex flex-1 flex-col justify-center gap-3">
          <p className="text-xs text-astro-text-dim [text-wrap:pretty]">
            Shoulders up, no sunglasses, no group shots. It shows on your card, your profile and any award you hold.
          </p>
          <PhotoControls playerId={playerId} size="sm" />
        </div>
      </div>
    </div>
  )
}
