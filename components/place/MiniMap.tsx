'use client'
import { useEffect, useRef } from 'react'
import type { Pin, PinStatus } from '@/types/pin'

const PIN_COLORS: Record<PinStatus, string> = {
  visited:   '#2ECC8A',
  watchlist: '#F59E2A',
  dream:     '#8B7FD4',
}

export default function MiniMap({ pin }: { pin: Pin }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return
    let map: any = null

    const init = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default
        await import('mapbox-gl/dist/mapbox-gl.css')
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

        map = new mapboxgl.Map({
          container: mapRef.current!,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [pin.lng, pin.lat],
          zoom: 11,
          interactive: false,
        })

        map.on('load', () => {
          const el = document.createElement('div')
          el.style.cssText = `
            width:14px;height:14px;border-radius:50%;
            background:${PIN_COLORS[pin.status]};
            border:2px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.25);
          `
          new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([pin.lng, pin.lat])
            .addTo(map)
        })
      } catch (err) {
        console.error('[MiniMap] Mapbox init failed:', err)
      }
    }

    init()
    return () => { map?.remove() }
  }, [pin.lng, pin.lat, pin.status])

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm overflow-hidden">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
        text-[var(--muted)] px-5 pt-4 pb-2">位置</div>
      <div ref={mapRef} className="h-[180px] w-full" />
    </div>
  )
}
