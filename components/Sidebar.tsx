'use client'
import { useState } from 'react'
import type { Pin, PinStatus } from '@/types/pin'

const STATUS_LABELS: Record<PinStatus, string> = {
  visited:   '已到访',
  watchlist: '想去',
  dream:     '梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  visited:   'bg-[#2ECC8A]/15 text-emerald-700',
  watchlist: 'bg-[#F59E2A]/15 text-amber-700',
  dream:     'bg-[#8B7FD4]/15 text-purple-700',
}
const DOT_COLORS: Record<PinStatus, string> = {
  visited:   'bg-[#2ECC8A]',
  watchlist: 'bg-[#F59E2A]',
  dream:     'bg-[#8B7FD4]',
}

interface SidebarProps {
  pins: Pin[]
  filterStatus: PinStatus | 'all'
  selectedId: string | null
  onSelect: (pin: Pin) => void
}

export default function Sidebar({ pins, filterStatus, selectedId, onSelect }: SidebarProps) {
  const [query, setQuery] = useState('')

  const visible = pins.filter(p => {
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

  const grouped = (['visited', 'watchlist', 'dream'] as PinStatus[]).map(status => ({
    status,
    items: visible.filter(p => p.status === status),
  })).filter(g => g.items.length > 0)

  const countries = new Set(pins.map(p => p.country).filter(Boolean)).size

  return (
    <aside className="w-[340px] flex-shrink-0 flex flex-col bg-[var(--sand)] shadow-[-4px_0_24px_rgba(0,0,0,0.1)] h-full">
      <div className="px-[18px] py-4 border-b border-black/[0.07] bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-[16px] font-semibold text-[var(--ink)]">我的地点</h2>
          <span className="text-[11px] font-medium text-[var(--muted)] bg-black/[0.06] px-2 py-0.5 rounded-full">
            {pins.length} 个
          </span>
        </div>
        <input
          type="text"
          placeholder="搜索地点…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-3 py-2 text-[13px] rounded-[10px] border border-black/[0.09]
            bg-white text-[var(--ink)] placeholder:text-[var(--muted)] outline-none
            focus:border-[var(--coral)] transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {grouped.map(({ status, items }) => (
          <div key={status}>
            <div className="px-[18px] py-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-[var(--muted)]">
              {status === 'visited' ? `✓ 已到访 · ${items.length}` :
               status === 'watchlist' ? `👁 想去 · ${items.length}` :
               `✨ 梦想 · ${items.length}`}
            </div>
            {items.map(pin => (
              <div
                key={pin.id}
                onClick={() => onSelect(pin)}
                className={`flex items-center gap-3 px-[18px] py-2.5 cursor-pointer
                  border-l-[3px] transition-colors
                  ${selectedId === pin.id
                    ? 'bg-[var(--coral)]/5 border-l-[var(--coral)]'
                    : 'border-l-transparent hover:bg-black/[0.03]'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLORS[pin.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[var(--ink)] truncate">{pin.name}</div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">
                    {pin.country ?? ''}
                    {pin.source && pin.source !== 'unknown' && ` · ${pin.source}`}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg flex-shrink-0 ${STATUS_COLORS[pin.status]}`}>
                  {STATUS_LABELS[pin.status]}
                </span>
              </div>
            ))}
          </div>
        ))}
        {visible.length === 0 && (
          <div className="text-center text-[var(--muted)] text-[13px] py-12">暂无地点</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 px-[18px] py-3.5 border-t border-black/[0.07] bg-white">
        {[
          { n: countries, label: '国家数' },
          { n: pins.length, label: '地点总数' },
          { n: pins.filter(p => p.status === 'visited').length, label: '已到访' },
          { n: pins.filter(p => p.status === 'watchlist').length, label: '想去清单' },
        ].map(({ n, label }) => (
          <div key={label}>
            <div className="font-serif text-[22px] font-bold text-[var(--coral)] leading-none">{n}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
