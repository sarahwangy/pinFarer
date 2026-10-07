import type { ParsedPin } from '@/types/pin'

function extractCountry(address: string): string {
  const parts = address.split(',')
  return parts[parts.length - 1].trim()
}

export function parseGeoJSON(text: string): ParsedPin[] {
  // 外部 JSON 在检查结构之前属于未知数据，不能直接信任字段类型。
  let json: unknown
  try { json = JSON.parse(text) } catch { return [] }

  if (!isRecord(json) || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) return []

  return json.features.reduce((acc: ParsedPin[], feature: unknown) => {
    if (!isRecord(feature) || !isRecord(feature.geometry)) return acc
    const coords = feature.geometry.coordinates
    const props = feature.properties
    if (feature.geometry.type !== 'Point' || !Array.isArray(coords) || !isRecord(props)) return acc
    if (!isRecord(props.location)) return acc

    const [lng, lat] = coords
    const name = props.location.name
    if (typeof name !== 'string' || !name.trim()) return acc
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) return acc

    const address = typeof props.location.address === 'string' ? props.location.address : ''
    const country = extractCountry(address)

    acc.push({ name, lat, lng, status: 'watchlist', source: 'unknown', country })
    return acc
  }, [])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
