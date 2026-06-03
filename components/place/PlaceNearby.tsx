import Link from 'next/link'
import type { Pin, PinStatus } from '@/types/pin'

const STATUS_LABELS: Record<PinStatus, string> = {
  visited:   '✓ 已到访',
  watchlist: '👁 想去',
  dream:     '✨ 梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  visited:   'bg-[#2ECC8A]/15 text-emerald-700',
  watchlist: 'bg-[#F59E2A]/15 text-amber-700',
  dream:     'bg-[#8B7FD4]/15 text-purple-700',
}

interface PlaceNearbyProps {
  pins: Pin[]
}

export default function PlaceNearby({ pins }: PlaceNearbyProps) {
  if (pins.length === 0) return null

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
        text-[var(--muted)] mb-3">同地区其他地点</div>
      <div className="grid grid-cols-3 gap-3">
        {pins.map(pin => (
          <Link key={pin.id} href={`/place/${pin.id}`}
            className="bg-white rounded-xl border border-black/[0.07] p-4
              hover:border-[var(--coral)]/40 hover:shadow-md transition-all group">
            <div className="font-medium text-[13px] text-[var(--ink)]
              group-hover:text-[var(--coral)] transition-colors truncate">
              {pin.name}
            </div>
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px]
              font-semibold ${STATUS_COLORS[pin.status]}`}>
              {STATUS_LABELS[pin.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
