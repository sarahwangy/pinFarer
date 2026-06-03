import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Pin } from '@/types/pin'
import PlaceInfoGrid from '@/components/place/PlaceInfoGrid'
import PlaceStatus from '@/components/place/PlaceStatus'
import PlaceNotes from '@/components/place/PlaceNotes'
import PlaceAISummary from '@/components/place/PlaceAISummary'
import PlaceNearby from '@/components/place/PlaceNearby'

const PlaceHero = dynamic(() => import('@/components/place/PlaceHero'), { ssr: false })

async function getData(id: string): Promise<{ pin: Pin | null; nearby: Pin[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { pin: null, nearby: [] }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)

  const { data: pin } = await supabase
    .from('pins').select('*').eq('id', id).single()

  if (!pin) return { pin: null, nearby: [] }

  const { data: nearby } = await supabase
    .from('pins')
    .select('*')
    .eq('country', pin.country)
    .neq('id', id)
    .limit(3)

  return { pin, nearby: nearby ?? [] }
}

export default async function PlacePage({ params }: { params: { id: string } }) {
  const { pin, nearby } = await getData(params.id)

  if (!pin) return (
    <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[var(--muted)] mb-2">地点不存在</p>
        <Link href="/" className="text-[var(--coral)] text-sm">← 返回地图</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--sand)]">
      <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/[0.97] backdrop-blur-md
        border-b border-black/[0.07] shadow-sm flex items-center px-5 z-50">
        <div className="font-serif text-[20px] font-bold text-[var(--ink)] flex items-center gap-2 mr-8">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--coral)]" />
          Pinfarer
        </div>
        <Link href="/" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
          ← 返回地图
        </Link>
      </nav>

      <div className="pt-[54px]">
        <PlaceHero pin={pin} />
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 flex flex-col gap-4">
        <PlaceInfoGrid pin={pin} />
        <PlaceStatus pinId={pin.id} initialStatus={pin.status} />
        <PlaceNotes pinId={pin.id} initialNotes={pin.notes} />
        <PlaceAISummary
          pinId={pin.id}
          pinName={pin.name}
          country={pin.country}
          initialSummary={pin.ai_summary}
        />
        <PlaceNearby pins={nearby} />
      </div>
    </div>
  )
}
