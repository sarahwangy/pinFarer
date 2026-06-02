import { parseKML } from './kml-parser'

const SAMPLE_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Eiffel Tower</name>
      <Point><coordinates>2.2945,48.8584,0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Shibuya Crossing</name>
      <Point><coordinates>139.7006,35.6590,0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Bad Entry</name>
    </Placemark>
  </Document>
</kml>`

describe('parseKML', () => {
  it('extracts name and coordinates from Placemarks', () => {
    const result = parseKML(SAMPLE_KML)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      name: 'Eiffel Tower',
      lat: 48.8584,
      lng: 2.2945,
      status: 'watchlist',
      source: 'unknown',
    })
    expect(result[1].name).toBe('Shibuya Crossing')
  })

  it('returns empty array for empty KML', () => {
    expect(parseKML('<kml><Document></Document></kml>')).toEqual([])
  })

  it('skips Placemarks without coordinates', () => {
    const kml = `<kml><Document>
      <Placemark><name>No Coords</name></Placemark>
    </Document></kml>`
    expect(parseKML(kml)).toEqual([])
  })
})
