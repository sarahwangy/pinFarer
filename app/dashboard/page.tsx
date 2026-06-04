import Link from 'next/link'
import type { Pin, PinStatus, PinSource } from '@/types/pin'

export interface DashboardStats {
  total: number
  byStatus: Record<PinStatus, number>
  bySource: Record<PinSource, number>
  topCountries: { country: string; count: number }[]
  topTags: { tag: string; count: number }[]
}

async function getStats(): Promise<DashboardStats> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const empty: DashboardStats = {
    total: 0,
    byStatus: { visited: 0, watchlist: 0, dream: 0 },
    bySource: { youtube: 0, wechat: 0, xiaohongshu: 0, book: 0, self: 0, unknown: 0 },
    topCountries: [],
    topTags: [],
  }

  if (!url || !key) return empty

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)

  const { data, error } = await supabase.from('pins').select('status,source,country,tags')
  if (error || !data) return empty

  const pins = data as Pick<Pin, 'status' | 'source' | 'country' | 'tags'>[]

  const byStatus: Record<PinStatus, number> = { visited: 0, watchlist: 0, dream: 0 }
  const bySource: Record<PinSource, number> = { youtube: 0, wechat: 0, xiaohongshu: 0, book: 0, self: 0, unknown: 0 }
  const countryCounts: Record<string, number> = {}
  const tagCounts: Record<string, number> = {}

  for (const pin of pins) {
    byStatus[pin.status] = (byStatus[pin.status] ?? 0) + 1
    bySource[pin.source] = (bySource[pin.source] ?? 0) + 1
    if (pin.country) {
      countryCounts[pin.country] = (countryCounts[pin.country] ?? 0) + 1
    }
    for (const tag of pin.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([country, count]) => ({ country, count }))

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  return { total: pins.length, byStatus, bySource, topCountries, topTags }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-[var(--sand)]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/[0.97] backdrop-blur-md
        border-b border-black/[0.07] shadow-sm flex items-center px-5 z-50">
        <div className="font-serif text-[20px] font-bold text-[var(--ink)] flex items-center gap-2 mr-8">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--coral)]" />
          Pinfarer
        </div>
        <Link href="/" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors mr-4">
          ← 返回地图
        </Link>
        <span className="text-[13px] font-semibold text-[var(--ink)]">数据统计</span>
      </nav>

      <div className="pt-[54px] max-w-4xl mx-auto px-5 py-8 flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-[var(--ink)] mb-1">数据统计</h1>
          <p className="text-[13px] text-[var(--muted)]">共 {stats.total} 个地点</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '全部地点', value: stats.total, color: 'var(--coral)' },
            { label: '✓ 已到访', value: stats.byStatus.visited, color: 'var(--mint)' },
            { label: '👁 想去', value: stats.byStatus.watchlist, color: 'var(--amber)' },
            { label: '✨ 梦想', value: stats.byStatus.dream, color: 'var(--lavender)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-black/[0.07]
              shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">{label}</div>
              <div className="text-4xl font-serif font-bold" style={{ color }}>{value}</div>
              {stats.total > 0 && (
                <div className="text-[12px] text-[var(--muted)] mt-1">
                  {Math.round(value / stats.total * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Status donut — placeholder, filled by later task */}
          <div className="bg-white rounded-2xl border border-black/[0.07]
            shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-4">旅行状态分布</div>
            <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">
              暂无图表
            </div>
          </div>

          {/* Source bars — placeholder, filled by later task */}
          <div className="bg-white rounded-2xl border border-black/[0.07]
            shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-4">发现来源</div>
            <div className="flex items-center justify-center h-40 text-[var(--muted)] text-sm">
              暂无图表
            </div>
          </div>
        </div>

        {/* Country list — placeholder, filled by later task */}
        <div className="bg-white rounded-2xl border border-black/[0.07]
          shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-4">国家/地区分布</div>
          <div className="text-[var(--muted)] text-sm">暂无数据</div>
        </div>

        {/* Tags */}
        {stats.topTags.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.07]
            shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-4">常用标签</div>
            <div className="flex flex-wrap gap-2">
              {stats.topTags.map(({ tag, count }) => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-[12px] font-semibold bg-[rgba(139,127,212,0.12)] text-[#7b6fc4]
                  border border-[rgba(139,127,212,0.25)]">
                  {tag}
                  <span className="text-[10px] opacity-60">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
