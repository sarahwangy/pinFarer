import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Pin } from '@/types/pin'
import PlaceDetailSections from '@/components/place/PlaceDetailSections'
import PlaceNearby from '@/components/place/PlaceNearby'
import PlaceNotes from '@/components/place/PlaceNotes'
import MiniMap from '@/components/place/MiniMap'

const PlaceHero = dynamic(() => import('@/components/place/PlaceHero'), { ssr: false })

const STATUS_LABELS = { visited: '✓ 已到访', watchlist: '👁 想去', dream: '✨ 梦想' }
const SOURCE_LABELS = {
  youtube: '▶ YouTube', wechat: '📱 微信公众号', xiaohongshu: '📱 小红书',
  book: '📖 书籍', self: '✦ 自己探索', unknown: '未知来源',
}

async function getData(id: string): Promise<{ pin: Pin | null; nearby: Pin[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return { pin: null, nearby: [] }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)

  const { data: pin } = await supabase.from('pins').select('*').eq('id', id).single()
  if (!pin) return { pin: null, nearby: [] }

  const { data: nearby } = await supabase
    .from('pins').select('*').eq('country', pin.country).neq('id', id).limit(3)

  return { pin, nearby: nearby ?? [] }
}

export default async function PlaceDetailPage({ params }: { params: { id: string } }) {
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
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/[0.97] backdrop-blur-md
        border-b border-black/[0.07] shadow-sm flex items-center px-5 z-50">
        <div className="font-serif text-[20px] font-bold text-[var(--ink)] flex items-center gap-2 mr-8">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--coral)]" />
          Pinfarer
        </div>
        <Link href={`/place/${pin.id}`}
          className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
          ← 返回详情
        </Link>
      </nav>

      {/* Hero */}
      <div className="pt-[54px]">
        <PlaceHero pin={pin} />
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-3 gap-6">

        {/* Left column — 2/3 width */}
        <div className="col-span-2 flex flex-col gap-6">

          {/* AI Summary — full text */}
          {pin.ai_summary && (
            <div className="bg-[var(--ink)] rounded-2xl border border-white/[0.06] shadow-sm px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
                  AI 介绍
                </div>
                <span className="text-[10px] font-semibold bg-[var(--coral)]/20 text-[var(--coral)]
                  px-2 py-0.5 rounded-full border border-[var(--coral)]/30">
                  ✦ Claude
                </span>
              </div>
              <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">
                {pin.ai_summary}
              </p>
            </div>
          )}

          {/* Type-aware sections */}
          {pin.place_data && <PlaceDetailSections data={pin.place_data} />}

          {/* Nearby places */}
          {nearby.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
                text-[var(--muted)] mb-3">同地区其他地点</div>
              <PlaceNearby pins={nearby} />
            </div>
          )}
        </div>

        {/* Right column — 1/3 width */}
        <div className="col-span-1 flex flex-col gap-4">

          {/* Basic info card */}
          <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
              text-[var(--muted)] mb-4">基本信息</div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="text-[11px] text-[var(--muted)] mb-1">状态</div>
                <span className="text-[13px] font-semibold text-[var(--ink)]">
                  {STATUS_LABELS[pin.status] ?? pin.status}
                </span>
              </div>
              <div>
                <div className="text-[11px] text-[var(--muted)] mb-1">发现来源</div>
                <span className="text-[13px] text-[var(--ink)]">{SOURCE_LABELS[pin.source] ?? pin.source}</span>
              </div>
              {pin.country && (
                <div>
                  <div className="text-[11px] text-[var(--muted)] mb-1">国家/地区</div>
                  <span className="text-[13px] text-[var(--ink)]">{pin.country}</span>
                </div>
              )}
              <div>
                <div className="text-[11px] text-[var(--muted)] mb-1">坐标</div>
                <span className="font-mono text-[11px] text-[var(--muted)]">
                  {Number(pin.lat).toFixed(4)}, {Number(pin.lng).toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Mini map */}
          <MiniMap pin={pin} />

          {/* Notes */}
          <PlaceNotes pinId={pin.id} initialNotes={pin.notes} />
        </div>
      </div>
    </div>
  )
}
