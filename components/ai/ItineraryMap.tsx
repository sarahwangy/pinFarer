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

export default function ItineraryMap({ selectedPins }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let mounted = true

    import('mapbox-gl').then(mgl => {
      if (!mounted || !containerRef.current) return
      const mapboxgl = mgl.default ?? mgl
      ;(mapboxgl as unknown as { accessToken: string }).accessToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
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

    const applyLayers = () => {
      // Remove existing layers/sources
      ;['route-line', 'pin-points'].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
      ;['route', 'pins'].forEach(id => {
        if (map.getSource(id)) map.removeSource(id)
      })

      const coords = selectedPins.map(p => [p.lng, p.lat] as [number, number])

      // Route line
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#FF6B47',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.7,
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
      map.addLayer({
        id: 'pin-points',
        type: 'circle',
        source: 'pins',
        paint: {
          'circle-radius': 7,
          'circle-color': [
            'match', ['get', 'status'],
            'visited', STATUS_COLORS.visited,
            'watchlist', STATUS_COLORS.watchlist,
            'dream', STATUS_COLORS.dream,
            '#FF6B47',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      // Fit bounds
      if (coords.length === 1) {
        map.flyTo({ center: coords[0], zoom: 10 })
      } else {
        const lngs = coords.map(c => c[0])
        const lats = coords.map(c => c[1])
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 60, duration: 800 }
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
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{ minHeight: '300px' }}
    />
  )
}
