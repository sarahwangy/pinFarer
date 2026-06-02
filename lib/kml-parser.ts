import type { ParsedPin } from '@/types/pin'

export function parseKML(kmlText: string): ParsedPin[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(kmlText, 'application/xml')
  const placemarks = Array.from(doc.querySelectorAll('Placemark'))

  return placemarks.reduce<ParsedPin[]>((acc, pm) => {
    const name = pm.querySelector('name')?.textContent?.trim()
    const coordText = pm.querySelector('coordinates')?.textContent?.trim()
    if (!name || !coordText) return acc

    const [lngStr, latStr] = coordText.split(',')
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (isNaN(lat) || isNaN(lng)) return acc

    acc.push({ name, lat, lng, status: 'watchlist', source: 'unknown' })
    return acc
  }, [])
}
