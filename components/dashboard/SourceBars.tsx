import type { PinSource } from '@/types/pin'

interface Props {
  bySource: Record<PinSource, number>
}

const SOURCE_LABELS: Record<PinSource, string> = {
  youtube:     '▶ YouTube',
  wechat:      '微信公众号',
  xiaohongshu: '小红书',
  book:        '📖 书籍',
  self:        '✦ 自己探索',
  unknown:     '未知',
}

const SOURCE_COLORS: Record<PinSource, string> = {
  youtube:     '#FF6B47',
  wechat:      '#2ECC8A',
  xiaohongshu: '#F59E2A',
  book:        '#8B7FD4',
  self:        '#1a8a5a',
  unknown:     '#A09890',
}

export default function SourceBars({ bySource }: Props) {
  const entries = (Object.keys(SOURCE_LABELS) as PinSource[])
    .map(src => ({ src, count: bySource[src] ?? 0, label: SOURCE_LABELS[src], color: SOURCE_COLORS[src] }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)

  if (entries.length === 0) {
    return <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">暂无数据</div>
  }

  const max = entries[0].count

  return (
    <div className="flex flex-col gap-3">
      {entries.map(({ src, count, label, color }) => (
        <div key={src}>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="font-medium text-[var(--ink)]">{label}</span>
            <span className="text-[var(--muted)]">{count}</span>
          </div>
          <div className="h-2 bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(count / max) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
