'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Pin, PinStatus } from '@/types/pin'
import FilterBar from './FilterBar'
import Sidebar from './Sidebar'
import AppNav from './AppNav'

const Map = dynamic(() => import('./Map'), { ssr: false })

type FilterValue = PinStatus | 'all'

export default function MapPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pins, setPins] = useState<Pin[]>([])
  const [filter, setFilter] = useState<FilterValue>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyToPin, setFlyToPin] = useState<Pin | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState<string | null>(null)

  // Apply URL params on first load: ?status=dream&country=Australia
  useEffect(() => {
    const status = searchParams.get('status') as FilterValue | null
    const country = searchParams.get('country')
    if (status && ['visited', 'watchlist', 'dream'].includes(status)) setFilter(status)
    if (country) setFilterCountry(country)
  }, [searchParams])

  useEffect(() => {
    fetch('/api/pins')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPins(data) })
      .catch(console.error)
  }, [])

  const visiblePins = useMemo(() => pins.filter(p => {
    const matchesStatus = filter === 'all' || p.status === filter
    const matchesTag = filterTag === null || (p.tags ?? []).includes(filterTag)
    const matchesCountry = filterCountry === null || p.country === filterCountry
    return matchesStatus && matchesTag && matchesCountry
  }), [pins, filter, filterTag, filterCountry])

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedId(pin.id)
    router.push(`/place/${pin.id}`)
  }, [router])

  const handleSidebarSelect = useCallback((pin: Pin) => {
    setSelectedId(pin.id)
    setFlyToPin(pin)
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
      <AppNav activePage="map" />

      {/* Map area */}
      <div className="flex-1 relative mt-[54px]">
        <Map pins={visiblePins} onPinClick={handlePinClick} flyToPin={flyToPin} />
        <div className="absolute top-3 left-3 z-10">
          <FilterBar active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="mt-[54px] flex-shrink-0">
        <Sidebar
          pins={visiblePins}
          filterStatus={filter}
          filterTag={filterTag}
          selectedId={selectedId}
          onSelect={handleSidebarSelect}
          onTagFilter={setFilterTag}
          onUpdatePinTags={handleUpdatePinTags}
        />
        {filterCountry && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20
            bg-[var(--ink)] text-white text-[12px] font-semibold px-3 py-1.5 rounded-full
            flex items-center gap-2 shadow-lg">
            📍 {filterCountry}
            <button type="button" onClick={() => setFilterCountry(null)}
              className="opacity-60 hover:opacity-100 transition-opacity ml-1">✕</button>
          </div>
        )}
      </div>
    </div>
  )
}
