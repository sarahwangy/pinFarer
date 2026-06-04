'use client'
import { useEffect, useRef } from 'react'
import type { Pin } from '@/types/pin'

interface Props {
  selectedPins: Pin[]
}

const STATUS_COLORS: Record<string, string> = {
  visited:   '#2ECC8A',
  watchlist: '#F59E2A',
  dream:     '#8B7FD4',
}

// Haversine distance in km between two coords
function distanceKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = (b[1] - a[1]) * Math.PI / 180
  const dLng = (b[0] - a[0]) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Try Mapbox Directions API — returns route coordinates or null if fails / too far
async function fetchRoute(coords: [number, number][], token: string): Promise<[number, number][] | null> {
  if (coords.length < 2) return null

  // Skip Directions API if any two adjacent pins are more than 500km apart (international)
  for (let i = 0; i < coords.length - 1; i++) {
    if (distanceKm(coords[i], coords[i + 1]) > 500) return null
  }

  const coordStr = coords.map(c => `${c[0]},${c[1]}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordStr}?geometries=geojson&overview=full&access_token=${token}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    const routeCoords = data.routes?.[0]?.geometry?.coordinates
    if (!Array.isArray(routeCoords) || routeCoords.length === 0) return null
    return routeCoords as [number, number][]
  } catch {
    return null
  }
}

export default function ItineraryMap({ selectedPins }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const tokenRef = useRef<string>('')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let mounted = true

    import('mapbox-gl').then(mgl => {
      if (!mounted || !containerRef.current) return
      const mapboxgl = mgl.default ?? mgl
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
      ;(mapboxgl as unknown as { accessToken: string }).accessToken = token
      tokenRef.current = token

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        zoom: 3,
        center: [140, -30],
      })

      mapRef.current = map
    })

    return () => {
      mounted = false
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || selectedPins.length === 0) return

    const coords = selectedPins.map(p => [p.lng, p.lat] as [number, number])

    async function applyLayers() {
      // Remove existing layers/sources
      ;['route-casing', 'route-line', 'pin-points'].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      ;['route', 'pins'].forEach(id => {
        if (map.getSource(id)) map.removeSource(id)
      })

      // Try real road route; fall back to straight line
      const routeCoords = await fetchRoute(coords, tokenRef.current)
      const lineCoords = routeCoords ?? coords

      // Route line
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineCoords },
          properties: {},
        },
      })
      // White casing underneath the blue line — makes it pop on any map background
      map.addLayer({
        id: 'route-casing',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': routeCoords ? 9 : 7,
          'line-opacity': 0.9,
        },
      })
      // Royal blue route line on top
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1D4ED8',
          'line-width': routeCoords ? 5 : 4,
          
          'line-opacity': 1,
        },
      })

      // Pin circles
      map.addSource('pins', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: selectedPins.map(p => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
            properties: { status: p.status },
          })),
        },
      })
      // Outer glow ring
      map.addLayer({
        id: 'pin-points',
        type: 'circle',
        source: 'pins',
        paint: {
          'circle-radius': 11,
          'circle-color': '#FBBF24',      // vivid amber/yellow — pops on any map
          'circle-stroke-width': 3,
          'circle-stroke-color': '#1D4ED8', // dark blue border matches route
          'circle-opacity': 1,
        },
      })

      // Fit bounds to pin positions (not route, which could be long)
      if (coords.length === 1) {
        map.flyTo({ center: coords[0], zoom: 12 })
      } else {
        const lngs = coords.map(c => c[0])
        const lats = coords.map(c => c[1])
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 80, duration: 800 }
        )
      }
    }

    if (map.isStyleLoaded()) {
      applyLayers()
    } else {
      map.once('load', applyLayers)
    }
  }, [selectedPins])

  return (
    <div ref={containerRef} className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: '300px' }} />
  )
}
