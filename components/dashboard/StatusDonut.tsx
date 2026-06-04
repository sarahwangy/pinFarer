interface Props {
  visited: number
  watchlist: number
  dream: number
}

const RADIUS = 56
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function StatusDonut({ visited, watchlist, dream }: Props) {
  const total = visited + watchlist + dream

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">
        暂无数据
      </div>
    )
  }

  const visitedPct = visited / total
  const watchlistPct = watchlist / total

  const segments = [
    { count: visited,   color: '#2ECC8A', label: '已到访', offset: 0 },
    { count: watchlist, color: '#F59E2A', label: '想去',   offset: visitedPct },
    { count: dream,     color: '#8B7FD4', label: '梦想',   offset: visitedPct + watchlistPct },
  ]

  return (
    <div className="flex items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" />
        {segments.map(({ count, color, label, offset }) => (
          <circle
            key={label}
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${count / total * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE - offset * CIRCUMFERENCE}
          />
        ))}
        <text
          x="70" y="66"
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px',
            fontFamily: 'var(--font-fraunces, serif)', fontSize: '24px', fontWeight: 700,
            fill: '#2D2826' }}
        >
          {total}
        </text>
        <text
          x="70" y="84"
          textAnchor="middle" dominantBaseline="middle"
          style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px',
            fontFamily: 'var(--font-dm-sans, sans-serif)', fontSize: '11px',
            fill: '#A09890' }}
        >
          个地点
        </text>
      </svg>

      <div className="flex flex-col gap-3">
        {[
          { label: '✓ 已到访', count: visited, color: '#2ECC8A' },
          { label: '👁 想去',  count: watchlist, color: '#F59E2A' },
          { label: '✨ 梦想',  count: dream, color: '#8B7FD4' },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-[13px] text-[var(--ink)]">{label}</span>
            <span className="ml-auto text-[13px] font-semibold text-[var(--ink)]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
