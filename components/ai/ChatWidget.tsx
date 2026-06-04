'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }
interface Props { destination: string }

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, li) => {
    const trimmed = line.trim()
    if (!trimmed) { elements.push(<div key={li} className="h-2" />); return }
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      elements.push(
        <div key={li} className="flex gap-1.5 items-start">
          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--forest)] flex-shrink-0" />
          <span>{inlineMarkdown(trimmed.slice(2))}</span>
        </div>
      )
      return
    }
    elements.push(<p key={li}>{inlineMarkdown(trimmed)}</p>)
  })

  return <div className="flex flex-col gap-1 text-[14px] leading-relaxed">{elements}</div>
}

function inlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

function exportPDF(destination: string, messages: Message[]) {
  const win = window.open('', '_blank')
  if (!win) return

  const rows = messages.map(m => `
    <div class="${m.role === 'user' ? 'user-msg' : 'ai-msg'}">
      <div class="role">${m.role === 'user' ? '我' : 'Claude'}</div>
      <div class="bubble">${m.content.replace(/\n/g, '<br/>')}</div>
    </div>
  `).join('')

  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${destination} · 旅行对话记录</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 24px; color: #2D2826; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .date { font-size: 12px; color: #A09890; margin-bottom: 32px; }
  .user-msg, .ai-msg { margin-bottom: 20px; }
  .role { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;
    color: #A09890; margin-bottom: 6px; }
  .bubble { font-size: 14px; line-height: 1.7; padding: 12px 16px; border-radius: 12px; }
  .user-msg .bubble { background: #27A060; color: #fff; }
  .ai-msg .bubble { background: #F7F3EE; color: #2D2826; border: 1px solid rgba(0,0,0,.07); }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
  <h1>✈️ ${destination} · 旅行对话记录</h1>
  <div class="date">${new Date().toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' })}</div>
  ${rows}
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`)
  win.document.close()
}

export default function ChatWidget({ destination }: Props) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, open])

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

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
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: 'min(680px, 85vh)' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-[var(--forest)] text-white flex-shrink-0">
              <span className="text-xl">✦</span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold">问问 Claude</div>
                <div className="text-[12px] opacity-70 truncate">关于 {destination} 的任何问题</div>
              </div>
              {history.length > 0 && (
                <button type="button" onClick={() => exportPDF(destination, history)}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors
                    text-[12px] font-semibold flex items-center gap-1.5">
                  📄 导出 PDF
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors
                  flex items-center justify-center text-[16px] font-bold ml-1">
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {history.length === 0 && (
                <div className="text-center text-[var(--muted)] mt-8">
                  <div className="text-4xl mb-3">💬</div>
                  <div className="text-[14px] font-semibold text-[var(--ink)] mb-1">
                    问我关于 {destination} 的任何问题
                  </div>
                  <div className="text-[12px]">最佳季节、当地美食、交通攻略……</div>
                </div>
              )}
              {history.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl
                    ${m.role === 'user'
                      ? 'bg-[var(--forest)] text-white rounded-br-sm text-[14px]'
                      : 'bg-[var(--sand)] text-[var(--ink)] rounded-bl-sm border border-black/[0.07]'
                    }`}>
                    {m.role === 'assistant' ? <MarkdownText text={m.content} /> : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--sand)] border border-black/[0.07] px-4 py-3 rounded-2xl rounded-bl-sm">
                    <span className="flex gap-1.5 items-center">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full bg-[var(--muted)] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-black/[0.06] flex gap-2 flex-shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="有什么想问的…"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--sand)] text-[14px]
                  text-[var(--ink)] border border-black/[0.1] outline-none
                  focus:border-[var(--forest)] transition-colors"
              />
              <button type="button" onClick={send} disabled={!input.trim() || loading}
                className="px-4 py-2.5 rounded-xl bg-[var(--forest)] text-white text-[13px]
                  font-semibold disabled:opacity-40 hover:bg-[var(--coral)] transition-colors">
                发送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        {showHint && !open && (
          <div className="bg-[var(--ink)] text-white text-[12px] font-semibold px-3 py-1.5
            rounded-full shadow-lg animate-bounce whitespace-nowrap">
            ✦ 问我关于行程的问题
          </div>
        )}
        <div className="relative">
          {!open && (
            <span className="absolute inset-0 rounded-full bg-[var(--forest)] opacity-40 animate-ping" />
          )}
          <button type="button" onClick={() => { setOpen(o => !o); setShowHint(false) }}
            className="relative w-14 h-14 rounded-full bg-[var(--forest)] text-white shadow-xl
              flex items-center justify-center text-2xl hover:bg-[var(--coral)]
              transition-colors hover:scale-110 active:scale-95">
            {open ? '✕' : '💬'}
          </button>
        </div>
      </div>
    </>
  )
}
