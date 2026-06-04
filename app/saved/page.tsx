import Link from 'next/link'
import AppNav from '@/components/AppNav'

interface ChatMessage { role: 'user' | 'assistant'; content: string }
interface SavedChat {
  id: string
  destination: string
  messages: ChatMessage[]
  created_at: string
}

async function getSavedChats(): Promise<SavedChat[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)
  const { data } = await supabase
    .from('saved_chats')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as SavedChat[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function SavedPage() {
  const chats = await getSavedChats()

  return (
    <div className="min-h-screen bg-[var(--sand)]">
      <AppNav activePage="map" />
      <div className="pt-[54px] max-w-3xl mx-auto px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[var(--ink)] mb-1">已保存的对话</h1>
            <p className="text-[13px] text-[var(--muted)]">共 {chats.length} 条</p>
          </div>
          <Link href="/ai" className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
            ← 返回 AI 规划
          </Link>
        </div>

        {chats.length === 0 && (
          <div className="bg-white rounded-2xl border border-black/[0.07] p-12 text-center">
            <div className="text-4xl mb-3">💬</div>
            <div className="text-[15px] font-semibold text-[var(--ink)] mb-1">还没有保存的对话</div>
            <div className="text-[13px] text-[var(--muted)]">在 AI 规划页面与 Claude 对话后，点击保存即可</div>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {chats.map(chat => (
            <div key={chat.id} className="bg-white rounded-2xl border border-black/[0.07]
              shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="text-[20px]">✈️</span>
                  <div>
                    <div className="font-semibold text-[15px] text-[var(--ink)]">{chat.destination}</div>
                    <div className="text-[12px] text-[var(--muted)]">{formatDate(chat.created_at)}</div>
                  </div>
                </div>
                <span className="text-[12px] text-[var(--muted)] bg-black/[0.04] px-2.5 py-1 rounded-full">
                  {chat.messages.length} 条消息
                </span>
              </div>

              {/* Messages */}
              <div className="px-5 py-4 flex flex-col gap-3 max-h-80 overflow-y-auto">
                {chat.messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed
                      ${m.role === 'user'
                        ? 'bg-[var(--forest)] text-white rounded-br-sm'
                        : 'bg-[var(--sand)] text-[var(--ink)] rounded-bl-sm border border-black/[0.06]'
                      }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
