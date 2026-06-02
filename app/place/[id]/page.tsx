import Link from 'next/link'

// Fetch pin server-side — gracefully handles missing Supabase config
async function getPin(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)
  const { data } = await supabase.from('pins').select('*').eq('id', id).single()
  return data
}

export default async function PlacePage({ params }: { params: { id: string } }) {
  const pin = await getPin(params.id)

  if (!pin) return (
    <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[var(--muted)]">地点不存在</p>
        <Link href="/" className="text-[var(--coral)] mt-2 inline-block">← 返回地图</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--sand)] p-8">
      <Link href="/" className="text-[var(--coral)] text-sm mb-6 inline-block">← 返回地图</Link>
      <h1 className="font-serif text-4xl font-bold text-[var(--ink)]">{pin.name}</h1>
      <p className="text-[var(--muted)] mt-2">{pin.country} · {pin.status}</p>
      <p className="text-[var(--muted)] text-sm mt-4">详情页功能将在 Week 2 完善（E3）</p>
    </div>
  )
}
