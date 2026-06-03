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
  filterTag: string | null
  selectedId: string | null
  onSelect: (pin: Pin) => void
  onTagFilter: (tag: string | null) => void
  onUpdatePinTags: (pinId: string, tags: string[]) => void
}

export default function Sidebar({
  pins, filterStatus, filterTag, selectedId,
  onSelect, onTagFilter, onUpdatePinTags,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [newTag, setNewTag] = useState('')

  const allTags = pins.flatMap(p => p.tags ?? []).filter((t, i, arr) => arr.indexOf(t) === i).sort()

  const visible = pins.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    const matchesTag    = filterTag === null || (p.tags ?? []).includes(filterTag)
    const matchesQuery  = p.name.toLowerCase().includes(query.toLowerCase())
    return matchesStatus && matchesTag && matchesQuery
  })

  const grouped = (['visited', 'watchlist', 'dream'] as PinStatus[]).map(status => ({
    status,
    items: visible.filter(p => p.status === status),
  })).filter(g => g.items.length > 0)

  const countries = new Set(pins.map(p => p.country).filter(Boolean)).size
  const selectedPin = selectedId ? pins.find(p => p.id === selectedId) : null

  const addTagToPin = () => {
    if (!selectedPin || !newTag.trim()) return
    const merged = [...(selectedPin.tags ?? []), newTag.trim()]
    const updated = merged.filter((t, i) => merged.indexOf(t) === i)
    onUpdatePinTags(selectedPin.id, updated)
    setNewTag('')
  }

  const removeTagFromPin = (tag: string) => {
    if (!selectedPin) return
    onUpdatePinTags(selectedPin.id, (selectedPin.tags ?? []).filter(t => t !== tag))
  }

  return (
    <aside className="w-[340px] flex-shrink-0 flex flex-col bg-[var(--sand)]
      shadow-[-4px_0_24px_rgba(0,0,0,0.1)] h-full">

      {/* Header */}
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

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="px-[18px] py-2.5 border-b border-black/[0.05] flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onTagFilter(null)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
              ${filterTag === null
                ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                : 'bg-white text-[var(--muted)] border-black/10 hover:border-black/25'
              }`}
          >
            全部标签
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagFilter(filterTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                ${filterTag === tag
                  ? 'bg-[#8B7FD4] text-white border-[#8B7FD4]'
                  : 'bg-white text-purple-700 border-[#8B7FD4]/30 hover:border-[#8B7FD4]'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Pin list */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {grouped.map(({ status, items }) => (
          <div key={status}>
            <div className="px-[18px] py-2.5 text-[10px] font-semibold uppercase
              tracking-[0.09em] text-[var(--muted)]">
              {status === 'visited' ? `✓ 已到访 · ${items.length}` :
               status === 'watchlist' ? `👁 想去 · ${items.length}` :
               `✨ 梦想 · ${items.length}`}
            </div>
            {items.map(pin => (
              <div
                key={pin.id}
                onClick={() => onSelect(pin)}
                className={`flex items-start gap-3 px-[18px] py-2.5 cursor-pointer
                  border-l-[3px] transition-colors
                  ${selectedId === pin.id
                    ? 'bg-[var(--coral)]/5 border-l-[var(--coral)]'
                    : 'border-l-transparent hover:bg-black/[0.03]'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${DOT_COLORS[pin.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[var(--ink)] truncate">{pin.name}</div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">
                    {pin.country ?? ''}
                    {pin.source && pin.source !== 'unknown' && ` · ${pin.source}`}
                  </div>
                  {(pin.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(pin.tags ?? []).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px]
                          font-semibold bg-[#8B7FD4]/12 text-purple-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg
                  flex-shrink-0 mt-0.5 ${STATUS_COLORS[pin.status]}`}>
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

      {/* Inline tag editor for selected pin */}
      {selectedPin && (
        <div className="px-[18px] py-3 border-t border-black/[0.07] bg-white/60">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            {selectedPin.name} 的标签
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
            {(selectedPin.tags ?? []).length === 0 && (
              <span className="text-[11px] text-[var(--muted)]">暂无标签</span>
            )}
            {(selectedPin.tags ?? []).map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full
                text-[11px] font-semibold bg-[#8B7FD4]/15 text-purple-700
                border border-[#8B7FD4]/30">
                {tag}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTagFromPin(tag) }}
                  className="text-purple-400 hover:text-purple-700 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTagToPin()}
              placeholder="添加标签…"
              className="flex-1 px-2.5 py-1.5 text-[12px] rounded-lg border border-black/10
                bg-white text-[var(--ink)] placeholder:text-[var(--muted)] outline-none
                focus:border-[var(--coral)] transition-colors"
            />
            <button
              type="button"
              onClick={addTagToPin}
              className="px-3 py-1.5 rounded-lg bg-[var(--coral)] text-white text-[12px]
                font-semibold hover:bg-[#d4623e] transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-[18px] py-3.5 border-t border-black/[0.07] bg-white">
        {[
          { n: countries, label: '国家数' },
          { n: pins.length, label: '地点总数' },
          { n: pins.filter(p => p.status === 'visited').length, label: '已到访' },
          { n: pins.filter(p => p.status === 'watchlist').length, label: '想去清单' },
        ].map(({ n, label }) => (
          <div key={label}>
            <div className="font-serif text-[22px] font-bold text-[var(--coral)] leading-none">{n}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em]
              text-[var(--muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
