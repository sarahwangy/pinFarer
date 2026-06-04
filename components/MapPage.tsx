'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Pin, PinStatus } from '@/types/pin'
import FilterBar from './FilterBar'
import Sidebar from './Sidebar'
import AppNav from './AppNav'

const Map = dynamic(() => import('./Map'), { ssr: false })

type FilterValue = PinStatus | 'all'

export default function MapPage() {
  const router = useRouter()
  const [pins, setPins] = useState<Pin[]>([])
  const [filter, setFilter] = useState<FilterValue>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyToPin, setFlyToPin] = useState<Pin | null>(null)
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
