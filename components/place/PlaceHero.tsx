'use client'
import { useEffect, useRef, useState } from 'react'
import type { Pin, PinStatus } from '@/types/pin'

const STATUS_LABELS: Record<PinStatus, string> = {
  visited:   '✓ 已到访',
  watchlist: '👁 想去',
  dream:     '✨ 梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  visited:   'bg-[#2ECC8A]/20 text-emerald-700 border-[#2ECC8A]/40',
  watchlist: 'bg-[#F59E2A]/20 text-amber-700 border-[#F59E2A]/40',
  dream:     'bg-[#8B7FD4]/20 text-purple-700 border-[#8B7FD4]/40',
}
const PIN_COLORS: Record<PinStatus, string> = {
  visited:   '#2ECC8A',
  watchlist: '#F59E2A',
  dream:     '#8B7FD4',
}

interface PlaceHeroProps {
  pin: Pin
}

export default function PlaceHero({ pin }: PlaceHeroProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [pixabayUrl, setPixabayUrl] = useState<string | null>(null)

  // Fetch Pixabay image with cancellation on pin change
  useEffect(() => {
    const controller = new AbortController()
    const query = pin.country ? `${pin.name} ${pin.country}` : pin.name
    fetch(`/api/pixabay?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => { if (data.url) setPixabayUrl(data.url) })
      .catch(() => {})
    return () => controller.abort()
  }, [pin.name, pin.country])

  // Mapbox map init
  useEffect(() => {
    if (!mapRef.current) return
    let map: any = null
    let mounted = true

    const init = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default
        await import('mapbox-gl/dist/mapbox-gl.css')

        // Bail out if component unmounted during async imports
        if (!mounted || !mapRef.current) return

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

        map = new mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [pin.lng, pin.lat],
          zoom: 10,
          interactive: false,
          projection: 'globe' as any,
        })

        let loaded = false

        map.on('load', () => {
          loaded = true
          if (!mounted) return
          setMapLoaded(true)
          const el = document.createElement('div')
          el.style.cssText = `
            width:16px;height:16px;border-radius:50%;
            background:${PIN_COLORS[pin.status]};
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
          `
          new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([pin.lng, pin.lat])
            .addTo(map)
        })

        // Only set failed state if map never successfully loaded
        map.on('error', () => {
          if (!loaded && mounted) setMapLoaded(false)
        })
      } catch {
        // map init failed — Pixabay fallback will show
      }
    }

    init()
    return () => {
      mounted = false
      map?.remove()
    }
  }, [pin.lng, pin.lat, pin.status])

  return (
    <div className="relative h-[280px] w-full overflow-hidden">
      {/* Mapbox map layer */}
      <div
        ref={mapRef}
        className="absolute inset-0"
        style={{ opacity: mapLoaded ? 1 : 0, transition: 'opacity 0.4s' }}
      />

      {/* Pixabay fallback — fades out smoothly when map loads */}
      {pixabayUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${pixabayUrl})`,
            opacity: mapLoaded ? 0 : 1,
            transition: 'opacity 0.4s',
          }}
        />
      )}

      {/* Gradient overlay — always on top for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-[36px] font-bold text-white leading-tight">
              {pin.name}
            </h1>
            {pin.country && (
              <p className="text-white/70 text-[14px] mt-1 font-medium">{pin.country}</p>
            )}
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[12px] font-semibold
            border backdrop-blur-sm ${STATUS_COLORS[pin.status]}`}>
            {STATUS_LABELS[pin.status]}
          </span>
        </div>
      </div>
    </div>
  )
}
