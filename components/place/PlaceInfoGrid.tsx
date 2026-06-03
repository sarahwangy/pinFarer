import type { Pin, PinSource } from '@/types/pin'

const SOURCE_LABELS: Record<PinSource, string> = {
  youtube:     '▶ YouTube',
  wechat:      '📱 微信公众号',
  xiaohongshu: '📱 小红书',
  book:        '📖 书籍',
  self:        '✦ 自己探索',
  unknown:     '未知来源',
}

interface PlaceInfoGridProps {
  pin: Pin
}

export default function PlaceInfoGrid({ pin }: PlaceInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-5 bg-white rounded-2xl
      border border-black/[0.07] shadow-sm">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
          text-[var(--muted)] mb-1.5">发现来源</div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px]
          font-semibold bg-[var(--coral)]/10 text-[var(--coral)] border border-[var(--coral)]/20">
          {SOURCE_LABELS[pin.source]}
        </span>
      </div>

      {pin.source_url && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
            text-[var(--muted)] mb-1.5">原始链接</div>
          <a
            href={pin.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--coral)] hover:underline truncate block"
          >
            {pin.source_url.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        </div>
      )}

      {(pin.tags ?? []).length > 0 && (
        <div className="col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
            text-[var(--muted)] mb-1.5">标签</div>
          <div className="flex flex-wrap gap-1.5">
            {(pin.tags ?? []).map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold
                bg-[#8B7FD4]/12 text-purple-700 border border-[#8B7FD4]/25">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="col-span-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
          text-[var(--muted)] mb-1.5">坐标</div>
        <span className="font-mono text-[12px] text-[var(--muted)]">
          {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
        </span>
      </div>
    </div>
  )
}
