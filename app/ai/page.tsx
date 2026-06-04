'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import AppNav from '@/components/AppNav'
import type { Pin } from '@/types/pin'
import type { Itinerary, DayPlan, Activity } from '@/types/itinerary'

const ItineraryMap = dynamic(() => import('@/components/ai/ItineraryMap'), { ssr: false })

const STATUS_COLORS: Record<string, string> = {
  visited:   'var(--mint)',
  watchlist: 'var(--amber)',
  dream:     'var(--lavender)',
}

const ACT_COLORS: Record<string, string> = {
  coral:    'var(--coral)',
  mint:     'var(--mint)',
  amber:    'var(--amber)',
  lavender: 'var(--lavender)',
}

const STYLES = ['文化探索', '美食 + 咖啡', '户外自然', '亲子家庭', '购物娱乐']
const DAY_OPTIONS = [3, 5, 7, 10, 14]
const PREF_TAGS = ['☕ 精品咖啡', '🍜 当地美食', '🏠 看房考察', '🎨 艺术画廊', '🌿 公园自然', '🛍 购物', '👶 亲子活动', '🏖 海滩']

export default function AIPage() {
  const [pins, setPins] = useState<Pin[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(5)
  const [style, setStyle] = useState('美食 + 咖啡')
  const [prefTags, setPrefTags] = useState<Set<string>>(new Set(['☕ 精品咖啡', '🍜 当地美食']))
  const [loading, setLoading] = useState(false)
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/pins')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPins(data) })
      .catch(console.error)
  }, [])

  const selectedPins = pins.filter(p => selectedIds.has(p.id))
  // Show max 12 pins to avoid privacy exposure; pins are already sorted by created_at desc
  const displayPins = pins.slice(0, 12)

  function togglePin(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleTag(tag: string) {
    setPrefTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  async function handleGenerate() {
    if (!destination.trim()) return
    setLoading(true)
    setError(null)
    setItinerary(null)

    try {
      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          days,
          style,
          tags: Array.from(prefTags),
          pins: selectedPins.map(p => ({ name: p.name, country: p.country })),
        }),
      })
      if (!res.ok) throw new Error('生成失败，请重试')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setItinerary(data as Itinerary)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--sand)]">
      <AppNav activePage="ai" />

      <div className="pt-[54px] flex h-screen overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 overflow-y-auto px-6 py-8 max-w-xl">
          <div className="mb-6">
            <h1 className="font-serif text-3xl font-bold text-[var(--ink)] mb-2">
              让 <em className="not-italic text-[var(--forest)]">Claude</em> 帮你规划旅程
            </h1>
            <p className="text-[13px] text-[var(--muted)]">从你的地点收藏中智能生成行程，考虑交通、时间和偏好</p>
          </div>

          {pins.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
                选择要加入行程的地点
              </div>
              <div className="flex flex-wrap gap-2">
                {displayPins.map(pin => {
                  const sel = selectedIds.has(pin.id)
                  return (
                    <button
                      key={pin.id}
                      onClick={() => togglePin(pin.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium
                        border transition-all ${sel
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                          : 'border-black/[0.12] bg-white text-[var(--ink)] hover:border-black/30'
                        }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLORS[pin.status] }}
                      />
                      {pin.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-4">
            <div className="mb-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-2">目的地</label>
              <input
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="城市或地区，例如 Melbourne, Australia"
                className="w-full px-3 py-2 rounded-xl border border-black/[0.1] text-[13px]
                  font-medium text-[var(--ink)] bg-[var(--sand)] outline-none
                  focus:border-[var(--coral)] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-2">行程天数</label>
                <select
                  title="行程天数"
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] text-[13px]
                    font-medium text-[var(--ink)] bg-white outline-none cursor-pointer"
                >
                  {DAY_OPTIONS.map(d => <option key={d} value={d}>{d} 天</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-2">旅行风格</label>
                <select
                  title="旅行风格"
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] text-[13px]
                    font-medium text-[var(--ink)] bg-white outline-none cursor-pointer"
                >
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-2">偏好标签</label>
              <div className="flex flex-wrap gap-2">
                {PREF_TAGS.map(tag => {
                  const sel = prefTags.has(tag)
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all
                        ${sel
                          ? 'bg-[var(--coral)] text-white border-[var(--coral)]'
                          : 'bg-white text-[var(--muted)] border-black/[0.1] hover:border-black/25'
                        }`}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !destination.trim()}
              className="w-full py-3 rounded-xl font-bold text-[14px] text-white transition-all
                bg-[var(--ink)] hover:bg-[var(--coral)] disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Claude 正在规划…
                </>
              ) : (
                <>✦ 生成 {days} 天行程</>
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-[13px] text-red-600 mb-4">
              {error}
            </div>
          )}

          {itinerary && (
            <div className="mt-2">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[var(--ink)]">{itinerary.title}</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { icon: '📍', text: `${itinerary.pinCount} 个收藏地点` },
                      { icon: '🗓', text: `${itinerary.totalDays} 天` },
                      { icon: '🎯', text: itinerary.style },
                      { icon: '✦', text: 'Claude Sonnet 4.6' },
                    ].map(({ icon, text }) => (
                      <span key={text} className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                        {icon} {text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {itinerary.days.map((day: DayPlan) => (
                  <div key={day.day} className="bg-white rounded-2xl border border-black/[0.07]
                    shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.06]">
                      <span className="font-serif text-[13px] font-bold text-[var(--coral)]">{day.day}</span>
                      <span className="font-semibold text-[14px] text-[var(--ink)]">{day.title}</span>
                      <span className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full
                        bg-black/[0.05] text-[var(--muted)]">{day.tag}</span>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-4">
                      {day.activities.map((act: Activity, i: number) => (
                        <div key={i} className="flex gap-3">
                          <span className="text-[11px] text-[var(--muted)] w-10 flex-shrink-0 pt-0.5 text-right">
                            {act.time}
                          </span>
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                            style={{ background: ACT_COLORS[act.color] ?? 'var(--coral)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[var(--ink)] mb-0.5">{act.name}</div>
                            <div className="text-[12px] text-[var(--muted)] leading-relaxed">{act.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right panel — map */}
        <div className="hidden lg:flex flex-col flex-1 p-4">
          <div className="flex-1 rounded-2xl overflow-hidden bg-white border border-black/[0.07]
            shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            {selectedPins.length > 0 ? (
              <ItineraryMap selectedPins={selectedPins} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-8">
                <div className="text-3xl">🌍</div>
                <div className="text-[13px] font-semibold text-[var(--ink)]">选择地点后在此显示路线</div>
                <div className="text-[12px] text-[var(--muted)]">点击上方地点卡片可加入行程</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
