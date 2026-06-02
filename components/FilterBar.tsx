'use client'
import type { PinStatus } from '@/types/pin'

type FilterValue = PinStatus | 'all'

const FILTERS: { value: FilterValue; label: string; color?: string }[] = [
  { value: 'all',       label: '全部' },
  { value: 'visited',   label: '✓ 已到访',  color: '#2ECC8A' },
  { value: 'watchlist', label: '👁 想去',   color: '#F59E2A' },
  { value: 'dream',     label: '✨ 梦想',   color: '#8B7FD4' },
]

interface FilterBarProps {
  active: FilterValue
  onChange: (v: FilterValue) => void
}

export default function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2">
      {FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
            border transition-all shadow-sm
            ${active === f.value
              ? 'text-white border-transparent shadow-md'
              : 'bg-white/90 text-ink/60 border-black/10 hover:text-ink/90'
            }`}
          style={active === f.value ? { background: f.color ?? 'var(--coral)' } : {}}
        >
          {f.color && active === f.value && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
          )}
          {f.label}
        </button>
      ))}
    </div>
  )
}
