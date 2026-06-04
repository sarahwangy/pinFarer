'use client'
import { useState } from 'react'
import AppNav from '@/components/AppNav'
import ChatWidget from '@/components/ai/ChatWidget'
import type { Itinerary, DayPlan, Activity } from '@/types/itinerary'

const ACT_COLORS: Record<string, string> = {
  coral:    'var(--coral)',
  mint:     'var(--mint)',
  amber:    'var(--amber)',
  lavender: 'var(--lavender)',
}

interface Props {
  itinerary: Itinerary
  heroUrl: string | null
  destination: string
  onBack: () => void
}

export default function ResultView({ itinerary, heroUrl, destination, onBack }: Props) {
  const quotes = itinerary.quotes?.length
    ? itinerary.quotes
    : itinerary.quote
      ? [{ text: itinerary.quote, author: itinerary.quoteAuthor ?? '' }]
      : []

  const [quoteIdx, setQuoteIdx] = useState(0)
  const currentQuote = quotes[quoteIdx]

  function nextQuote() { setQuoteIdx(i => (i + 1) % quotes.length) }
  function openAuthor(author: string) {
    window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(author)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[var(--sand)]">
      <AppNav activePage="ai" />
      <div className="pt-[54px]">

        {/* ── Hero ── */}
        <div className="relative bg-[#0f1923]" style={{ minHeight: '320px' }}>
          {heroUrl && (
            <img src={heroUrl} alt={destination}
              className="w-full block"
              style={{ maxHeight: '420px', objectFit: 'contain', width: '100%' }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 pointer-events-none" />

          {/* Quote — upper right, clear of bottom title area */}
          {currentQuote && (
            <div className="absolute top-6 right-6 max-w-sm text-right">
              <p className="font-serif italic text-[20px] text-white leading-snug drop-shadow-lg">
                &ldquo;{currentQuote.text}&rdquo;
              </p>
              {currentQuote.author && (
                <div className="mt-2 flex flex-col items-end gap-0.5">
                  <button type="button" onClick={() => openAuthor(currentQuote.author)}
                    className="text-[14px] text-white/85 font-medium hover:text-white
                      underline underline-offset-2 transition-colors">
                    — {currentQuote.author} ↗
                  </button>
                  <span className="text-[10px] text-white/45 font-medium tracking-wide">
                    点击查看作者详情
                  </span>
                </div>
              )}
              {/* 下一句 button — always visible when multiple quotes */}
              {quotes.length > 1 && (
                <button type="button" onClick={nextQuote}
                  className="mt-3 px-4 py-1.5 rounded-full bg-white/25 backdrop-blur-sm
                    border border-white/40 text-[12px] font-bold text-white
                    hover:bg-white/40 transition-all inline-flex items-center gap-1.5">
                  下一句 →
                  <span className="text-[10px] opacity-60">{quoteIdx + 1}/{quotes.length}</span>
                </button>
              )}
            </div>
          )}

          {/* Title + meta + back — bottom left/right */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-[38px] font-bold text-white leading-tight drop-shadow-lg">
                {itinerary.title}
              </h1>
              <div className="flex flex-wrap gap-3 mt-2">
                {[
                  `🗓 ${itinerary.totalDays} 天`,
                  `🎯 ${itinerary.style}`,
                  itinerary.pinCount > 0 ? `📍 ${itinerary.pinCount} 个收藏地点` : null,
                ].filter(Boolean).map(t => (
                  <span key={t} className="text-[13px] text-white/80">{t}</span>
                ))}
              </div>
            </div>
            <button type="button" onClick={onBack}
              className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30
                text-white text-[13px] font-semibold hover:bg-white/30 transition-all flex-shrink-0">
              ← 重新规划
            </button>
          </div>
        </div>

        {/* ── Day cards ── */}
        <div className="max-w-3xl mx-auto px-5 py-8 flex flex-col gap-5">
          {itinerary.days.map((day: DayPlan) => (
            <div key={day.day} className="bg-white rounded-2xl border border-black/[0.07]
              shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.06]">
                <span className="font-serif text-[13px] font-bold text-[var(--coral)]">{day.day}</span>
                <span className="font-semibold text-[15px] text-[var(--ink)]">{day.title}</span>
                <span className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full
                  bg-black/[0.05] text-[var(--muted)]">{day.tag}</span>
              </div>
              <div className="px-5 py-4 flex flex-col gap-5">
                {day.activities.map((act: Activity, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-[11px] text-[var(--muted)] w-10 flex-shrink-0 pt-0.5 text-right font-medium">
                      {act.time}
                    </span>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                      style={{ background: ACT_COLORS[act.color] ?? 'var(--coral)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-[var(--ink)] mb-0.5">{act.name}</div>
                      <div className="text-[13px] text-[var(--muted)] leading-relaxed">{act.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ChatWidget destination={destination} />
    </div>
  )
}
