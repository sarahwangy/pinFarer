'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Pin, PinStatus } from '@/types/pin'
import FilterBar from './FilterBar'
import Sidebar from './Sidebar'

const Map = dynamic(() => import('./Map'), { ssr: false })

type FilterValue = PinStatus | 'all'

export default function MapPage() {
  const router = useRouter()
  const [pins, setPins] = useState<Pin[]>([])
  const [filter, setFilter] = useState<FilterValue>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/pins')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPins(data) })
      .catch(console.error)
  }, [])

  const visiblePins = useMemo(() => pins.filter(p => {
    const matchesStatus = filter === 'all' || p.status === filter
    const matchesTag = filterTag === null || (p.tags ?? []).includes(filterTag)
    return matchesStatus && matchesTag
  }), [pins, filter, filterTag])

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedId(pin.id)
  }, [])

  const handleSidebarSelect = useCallback((pin: Pin) => {
    setSelectedId(pin.id)
  }, [])

  const handleUpdatePinTags = useCallback(async (pinId: string, tags: string[]) => {
    const res = await fetch(`/api/pins/${pinId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
    if (res.ok) {
      const updated = await res.json()
      setPins(prev => prev.map(p => p.id === pinId ? updated : p))
    }
  }, [])

  return (
    <div className="flex h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/[0.97] backdrop-blur-md
        border-b border-black/[0.07] shadow-sm flex items-center px-5 z-50">
        <div className="font-serif text-[20px] font-bold text-[var(--ink)] flex items-center gap-2 mr-8">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--coral)] shadow-[0_0_8px_rgba(255,107,71,0.7)]" />
          Pinfarer
        </div>
        <div className="flex gap-0.5">
          {[
            { label: '地图', active: true },
            { label: '数据统计', active: false },
            { label: 'AI 规划', active: false },
            { label: '导入', active: false },
          ].map(({ label, active }, i) => (
            <button key={label}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors
                ${active
                  ? 'bg-[var(--coral)] text-white'
                  : 'text-[var(--ink)]/45 hover:text-[var(--ink)]/80 hover:bg-black/5'
                }`}
              onClick={() => { if (i === 3) router.push('/import') }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2.5">
          <button
            onClick={() => router.push('/import')}
            className="px-3.5 py-1.5 text-[13px] font-semibold rounded-lg border border-black/15
              text-[var(--ink)] transition-colors hover:border-black/30"
          >
            + 导入 KML
          </button>
          <button className="px-3.5 py-1.5 text-[13px] font-semibold rounded-lg
            bg-[var(--coral)] text-white hover:bg-[#d4623e] transition-colors">
            + 添加地点
          </button>
        </div>
      </nav>

      {/* Map area */}
      <div className="flex-1 relative mt-[54px]">
        <Map pins={visiblePins} onPinClick={handlePinClick} />
        <div className="absolute top-3 left-3 z-10">
          <FilterBar active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="mt-[54px] flex-shrink-0">
        <Sidebar
          pins={pins}
          filterStatus={filter}
          filterTag={filterTag}
          selectedId={selectedId}
          onSelect={handleSidebarSelect}
          onTagFilter={setFilterTag}
          onUpdatePinTags={handleUpdatePinTags}
        />
      </div>
    </div>
  )
}
