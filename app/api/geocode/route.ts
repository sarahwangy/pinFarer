import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Pinfarer/1.0 (travel map app)' }
  })

  if (!res.ok) return NextResponse.json({ error: 'geocode failed' }, { status: 502 })

  const data = await res.json()
  if (!data.length) return NextResponse.json({ found: false })

  return NextResponse.json({
    found: true,
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    country: data[0].display_name.split(',').at(-1)?.trim() ?? '',
  })
}
