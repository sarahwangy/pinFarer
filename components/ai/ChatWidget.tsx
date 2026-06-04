'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

interface Props {
  destination: string
}

export default function ChatWidget({ destination }: Props) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, open])

  async function send() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    const next: Message[] = [...history, { role: 'user', content: msg }]
    setHistory(next)
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, message: msg, history }),
      })
      const data = await res.json()
      setHistory([...next, { role: 'assistant', content: data.reply ?? '出错了，请重试' }])
    } catch {
      setHistory([...next, { role: 'assistant', content: '网络错误，请重试' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)]
          border border-black/[0.07] flex flex-col overflow-hidden"
          style={{ height: '420px' }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--forest)] text-white">
            <span className="text-lg">✦</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold">问问 Claude</div>
              <div className="text-[11px] opacity-70 truncate">{destination}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)}
              className="opacity-70 hover:opacity-100 transition-opacity text-lg leading-none">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
            {history.length === 0 && (
              <div className="text-center text-[12px] text-[var(--muted)] mt-4">
                <div className="text-2xl mb-2">💬</div>
                问我关于 {destination} 的任何问题
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-[var(--forest)] text-white rounded-br-sm'
                    : 'bg-[var(--sand)] text-[var(--ink)] rounded-bl-sm border border-black/[0.06]'
                  }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--sand)] border border-black/[0.06] px-3 py-2 rounded-2xl rounded-bl-sm">
                  <span className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--muted)] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-black/[0.06] flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="有什么想问的…"
              className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--sand)] text-[13px]
                text-[var(--ink)] border border-black/[0.1] outline-none
                focus:border-[var(--forest)] transition-colors"
            />
            <button type="button" onClick={send} disabled={!input.trim() || loading}
              className="px-3 py-1.5 rounded-xl bg-[var(--forest)] text-white text-[12px]
                font-semibold disabled:opacity-40 hover:bg-[var(--coral)] transition-colors">
              发送
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-full bg-[var(--forest)] text-white shadow-lg
          flex items-center justify-center text-xl hover:bg-[var(--coral)] transition-colors
          hover:scale-110 active:scale-95">
        {open ? '✕' : '💬'}
      </button>
    </div>
  )
}
