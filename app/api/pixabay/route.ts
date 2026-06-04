import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  if (!q) return NextResponse.json({ url: null })

  const key = process.env.PIXABAY_API_KEY
  if (!key) return NextResponse.json({ url: null })

  const params = new URLSearchParams({
    key,
    q,
    image_type: 'photo',
    orientation: 'horizontal',
    per_page: '3',
    safesearch: 'true',
  })

  try {
    const res = await fetch(`https://pixabay.com/api/?${params}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return NextResponse.json({ url: null })
    const data = await res.json()
    const url = data.hits?.[0]?.webformatURL ?? null
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}
