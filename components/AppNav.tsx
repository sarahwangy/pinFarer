'use client'
import { useRouter } from 'next/navigation'

type ActivePage = 'map' | 'dashboard' | 'ai' | 'import' | 'place'

interface Props {
  activePage: ActivePage
}

const TABS = [
  { label: '地图',   page: 'map',       href: '/' },
  { label: '数据统计', page: 'dashboard', href: '/dashboard' },
  { label: 'AI 规划', page: 'ai',        href: '/ai' },
  { label: '导入',   page: 'import',    href: '/import' },
] as const

export default function AppNav({ activePage }: Props) {
  const router = useRouter()

  return (
    <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/[0.97] backdrop-blur-md
      border-b border-black/[0.07] shadow-sm flex items-center px-5"
      style={{ zIndex: 9999 }}
    >
      <div className="font-serif text-[20px] font-bold text-[var(--ink)] flex items-center gap-2 mr-8 cursor-pointer"
        onClick={() => router.push('/')}>
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--coral)] shadow-[0_0_8px_rgba(255,107,71,0.7)]" />
        Pinfarer
      </div>

      <div className="flex gap-0.5">
        {TABS.map(({ label, page, href }) => {
          const active = activePage === page
          return (
            <button
              key={page}
              type="button"
              onClick={() => router.push(href)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors
                ${active
                  ? 'bg-[var(--coral)] text-white'
                  : 'text-[var(--ink)]/45 hover:text-[var(--ink)]/80 hover:bg-black/5'
                }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex gap-2.5">
        <button
          type="button"
          onClick={() => router.push('/import')}
          className="px-3.5 py-1.5 text-[13px] font-semibold rounded-lg border border-black/15
            text-[var(--ink)] transition-colors hover:border-black/30"
        >
          + 导入 KML
        </button>
      </div>
    </nav>
  )
}
