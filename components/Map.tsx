'use client'
import { useEffect, useRef } from 'react'
import type { Pin } from '@/types/pin'

const PIN_COLORS: Record<string, string> = {
  visited:   '#2ECC8A',
  watchlist: '#F59E2A',
  dream:     '#8B7FD4',
}

interface MapProps {
  pins: Pin[]
  onPinClick?: (pin: Pin) => void
}

export default function Map({ pins, onPinClick }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [20, 20],
        zoom: 1.8,
        projection: 'globe' as any,
      })
      mapRef.current = map

      map.on('load', () => {
        map.setFog({
          color: '#a8d4f0',
          'high-color': '#1a3a6e',
          'horizon-blend': 0.08,
          'space-color': '#0a0f2e',
          'star-intensity': 0.6,
        })
      })
    }

    initMap()
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const addMarkers = async () => {
      if (!mapRef.current) return
      const mapboxgl = (await import('mapbox-gl')).default

      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      pins.forEach(pin => {
        // Outer wrapper: large transparent hit area (32x32) — easy to click
        const wrapper = document.createElement('div')
        wrapper.style.cssText = `
          width:32px;height:32px;
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;
        `
        // Inner dot: visual only
        const dot = document.createElement('div')
        dot.style.cssText = `
          width:12px;height:12px;border-radius:50%;
          background:${PIN_COLORS[pin.status]};
          border:2px solid rgba(255,255,255,0.85);
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          transition:transform .15s;
          pointer-events:none;
        `
        wrapper.appendChild(dot)
        wrapper.addEventListener('mouseenter', () => { dot.style.transform = 'scale(1.6)' })
        wrapper.addEventListener('mouseleave', () => { dot.style.transform = 'scale(1)' })

        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false })
          .setHTML(`<div style="font-family:sans-serif;padding:4px 2px">
            <div style="font-weight:600;font-size:13px">${pin.name}</div>
            <div style="font-size:11px;color:#888;margin-top:2px">${pin.country ?? ''}</div>
          </div>`)

        const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
          .setLngLat([pin.lng, pin.lat])
          .setPopup(popup)
          .addTo(mapRef.current!)

        wrapper.addEventListener('click', () => onPinClick?.(pin))
        markersRef.current.push(marker)
      })
    }

    addMarkers()
  }, [pins, onPinClick])

  return <div ref={containerRef} className="w-full h-full" />
}
