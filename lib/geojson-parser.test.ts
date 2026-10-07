import { parseGeoJSON } from './geojson-parser'

const point = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [2.2945, 48.8584] },
  properties: { location: { name: 'Eiffel Tower', address: 'Paris, France' } },
}

describe('parseGeoJSON', () => {
  it('imports a named point with longitude, latitude and country', () => {
    expect(parseGeoJSON(JSON.stringify({ type: 'FeatureCollection', features: [point] }))).toEqual([
      { name: 'Eiffel Tower', lng: 2.2945, lat: 48.8584, country: 'France', status: 'watchlist', source: 'unknown' },
    ])
  })

  it.each(['invalid JSON', 'null', '[]', '{}'])('rejects malformed input: %s', text => {
    expect(parseGeoJSON(text)).toEqual([])
  })

  it('skips malformed features while retaining valid points', () => {
    const features = [
      null,
      {},
      { ...point, geometry: { type: 'LineString', coordinates: [[1, 2], [3, 4]] } },
      { ...point, geometry: { type: 'Point', coordinates: ['2', 48] } },
      { ...point, properties: { location: { name: 123 } } },
      point,
    ]
    expect(parseGeoJSON(JSON.stringify({ type: 'FeatureCollection', features }))).toHaveLength(1)
  })

  it('handles missing or non-string addresses without throwing', () => {
    const feature = { ...point, properties: { location: { name: 'Paris', address: 123 } } }
    expect(parseGeoJSON(JSON.stringify({ type: 'FeatureCollection', features: [feature] }))[0].country).toBe('')
  })
})
