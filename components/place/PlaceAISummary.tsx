'use client'
import { useState } from 'react'

interface PlaceAISummaryProps {
  pinId: string
  pinName: string
  country: string | null
  initialSummary: string | null
}

export default function PlaceAISummary({
  pinId, pinName, country, initialSummary
}: PlaceAISummaryProps) {
  const [summary, setSummary] = useState(initialSummary ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pinName, country }),
      })
      if (!res.ok) throw new Error('生成失败')
      const { summary: text, place_data } = await res.json()

      await fetch(`/api/pins/${pinId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_summary: text, place_data }),
      })
      setSummary(text)
    } catch {
      setError('生成失败，请重试')
    }
    setLoading(false)
  }

  return (
    <div className="bg-[var(--ink)] rounded-2xl border border-white/[0.06] shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">
            AI 介绍
          </div>
          <span className="text-[10px] font-semibold bg-[var(--coral)]/20 text-[var(--coral)]
            px-2 py-0.5 rounded-full border border-[var(--coral)]/30">
            ✦ Claude
          </span>
        </div>
        {summary && !loading && (
          <button type="button" onClick={generate}
            className="text-[11px] text-white/40 hover:text-white/70 transition-colors">
            重新生成
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i}
                className="w-1.5 h-1.5 rounded-full bg-[var(--coral)]"
                style={{ animation: `pinBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <span className="text-[13px] text-white/50">正在生成旅行介绍…</span>
        </div>
      ) : summary ? (
        <div>
          <p className={`text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap
            ${summary.length > 200 ? 'line-clamp-4' : ''}`}>
            {summary}
          </p>
          {summary.length > 200 && (
            <a
              href={`/place/${pinId}/detail`}
              className="inline-flex items-center gap-1 mt-3 text-[12px] font-semibold
                text-[var(--coral)] hover:text-[#d4623e] transition-colors"
            >
              展开查看完整介绍 ↗
            </a>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-[13px] text-white/40 mb-3">
            让 Claude 为你生成 Lonely Planet 风格的旅行介绍
          </p>
          <button type="button" onClick={generate}
            className="px-5 py-2 rounded-xl bg-[var(--coral)] text-white text-[13px]
              font-semibold hover:bg-[#d4623e] transition-colors">
            ✦ 生成介绍
          </button>
        </div>
      )}

      {error && <p className="text-[12px] text-red-400 mt-2">{error}</p>}

      <style jsx>{`
        @keyframes pinBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
