import type { ParsedPin } from '@/types/pin'

function extractCountry(address: string): string {
  const parts = address.split(',')
  return parts[parts.length - 1].trim()
}

export function parseGeoJSON(text: string): ParsedPin[] {
  let json: any
  try { json = JSON.parse(text) } catch { return [] }

  if (json.type !== 'FeatureCollection' || !Array.isArray(json.features)) return []

  return (json.features as any[]).reduce((acc: ParsedPin[], feature: any) => {
    const coords = feature.geometry?.coordinates
    const props = feature.properties
    if (!coords || !props) return acc

    const [lng, lat] = coords
    const name = props.location?.name
    if (!name || isNaN(lat) || isNaN(lng)) return acc

    const address = props.location?.address ?? ''
    const country = extractCountry(address)

    acc.push({ name, lat, lng, status: 'watchlist', source: 'unknown', country })
    return acc
  }, [])
}
