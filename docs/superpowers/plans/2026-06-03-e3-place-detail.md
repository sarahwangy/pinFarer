# E3 Place Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full place detail page at `/place/[id]` — magazine-cover hero map, info grid, status switcher, inline notes editing, AI-generated introduction, and nearby places.

**Architecture:** Server Component page fetches pin + nearby pins from Supabase at request time. Interactive features (notes edit, status switch, AI generation) are split into focused Client Components that call the existing `PATCH /api/pins/[id]` route. A new `POST /api/ai/summary` route calls Claude API.

**Tech Stack:** Next.js 14 App Router · Mapbox GL JS (dynamic import) · Anthropic SDK · Supabase · Tailwind CSS · TypeScript

---

## File Map

```
app/place/[id]/page.tsx          ← rewrite: server component, fetch + compose
components/place/
  PlaceHero.tsx                  ← mini map + name overlay (client, ssr:false map)
  PlaceInfoGrid.tsx              ← source chip, URL, tags, coords (server-renderable)
  PlaceStatus.tsx                ← status switcher (client)
  PlaceNotes.tsx                 ← notes view/edit (client)
  PlaceAISummary.tsx             ← AI intro generate/display (client)
  PlaceNearby.tsx                ← nearby pins horizontal cards (server-renderable)
app/api/ai/summary/route.ts      ← new: POST, calls Claude API
components/MapPage.tsx           ← enable pin click → navigate to /place/[id]
```

---

## Task 1: Add ANTHROPIC_API_KEY to env

**Files:**
- Modify: `.env.local`
- Modify: `.env.local.example`

- [ ] **Step 1.1: Add key to `.env.local`**

Open `/Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer/.env.local` and add:
```
ANTHROPIC_API_KEY=sk-ant-...your key here...
```
Get your key from https://console.anthropic.com → API Keys.

- [ ] **Step 1.2: Update `.env.local.example`**

Add to the file:
```
ANTHROPIC_API_KEY=
```

- [ ] **Step 1.3: Commit example only (never commit .env.local)**

```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
git add .env.local.example
git commit -m "chore: add ANTHROPIC_API_KEY to env example"
```

---

## Task 2: Install Anthropic SDK

**Files:**
- Modify: `package.json`

- [ ] **Step 2.1: Install**

```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
npm install @anthropic-ai/sdk
```

- [ ] **Step 2.2: Verify**

```bash
node -e "require('@anthropic-ai/sdk'); console.log('ok')"
```
Expected: `ok`

- [ ] **Step 2.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @anthropic-ai/sdk"
```

---

## Task 3: AI Summary API route

**Files:**
- Create: `app/api/ai/summary/route.ts`

- [ ] **Step 3.1: Create `app/api/ai/summary/route.ts`**

```ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { name, country } = await request.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Write a 3-paragraph travel guide introduction to ${name}${country ? `, ${country}` : ''}. 
Cover: what makes it special, key highlights to see or do, best time to visit. 
Tone: inspiring and informative, like Lonely Planet. 150-200 words total. 
Return only the introduction text, no headings.`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ summary: text })
}
```

- [ ] **Step 3.2: Test the route**

With dev server running (`npm run dev`):
```bash
curl -X POST http://localhost:3000/api/ai/summary \
  -H "Content-Type: application/json" \
  -d '{"name":"Paris","country":"France"}'
```
Expected: `{"summary":"Paris, the City of Light..."}`

- [ ] **Step 3.3: Commit**

```bash
git add app/api/ai/summary/route.ts
git commit -m "feat: add POST /api/ai/summary Claude API route"
```

---

## Task 4: PlaceHero component

**Files:**
- Create: `components/place/PlaceHero.tsx`

- [ ] **Step 4.1: Create `components/place/PlaceHero.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import type { Pin, PinStatus } from '@/types/pin'

const STATUS_LABELS: Record<PinStatus, string> = {
  visited:   '✓ 已到访',
  watchlist: '👁 想去',
  dream:     '✨ 梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  visited:   'bg-[#2ECC8A]/20 text-emerald-700 border-[#2ECC8A]/40',
  watchlist: 'bg-[#F59E2A]/20 text-amber-700 border-[#F59E2A]/40',
  dream:     'bg-[#8B7FD4]/20 text-purple-700 border-[#8B7FD4]/40',
}
const PIN_COLORS: Record<PinStatus, string> = {
  visited:   '#2ECC8A',
  watchlist: '#F59E2A',
  dream:     '#8B7FD4',
}

interface PlaceHeroProps {
  pin: Pin
}

export default function PlaceHero({ pin }: PlaceHeroProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return
    let map: any = null

    const init = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      map = new mapboxgl.Map({
        container: mapRef.current!,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [pin.lng, pin.lat],
        zoom: 10,
        interactive: false,
        projection: 'globe' as any,
      })

      map.on('load', () => {
        map.setFog({
          color: '#a8d4f0',
          'high-color': '#1a3a6e',
          'horizon-blend': 0.08,
          'space-color': '#0a0f2e',
          'star-intensity': 0.4,
        })

        // Add pin marker
        const el = document.createElement('div')
        el.style.cssText = `
          width:16px;height:16px;border-radius:50%;
          background:${PIN_COLORS[pin.status]};
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        `
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([pin.lng, pin.lat])
          .addTo(map)
      })
    }

    init()
    return () => { map?.remove() }
  }, [pin.lng, pin.lat, pin.status])

  return (
    <div className="relative h-[280px] w-full overflow-hidden">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-serif text-[36px] font-bold text-white leading-tight">
              {pin.name}
            </h1>
            {pin.country && (
              <p className="text-white/70 text-[14px] mt-1 font-medium">{pin.country}</p>
            )}
          </div>
          <span className={`px-3 py-1.5 rounded-full text-[12px] font-semibold
            border backdrop-blur-sm ${STATUS_COLORS[pin.status]}`}>
            {STATUS_LABELS[pin.status]}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4.2: Commit**

```bash
git add components/place/PlaceHero.tsx
git commit -m "feat: add PlaceHero component with mini map"
```

---

## Task 5: PlaceInfoGrid component

**Files:**
- Create: `components/place/PlaceInfoGrid.tsx`

- [ ] **Step 5.1: Create `components/place/PlaceInfoGrid.tsx`**

```tsx
import type { Pin, PinSource } from '@/types/pin'

const SOURCE_LABELS: Record<PinSource, string> = {
  youtube:     '▶ YouTube',
  wechat:      '📱 微信公众号',
  xiaohongshu: '📱 小红书',
  book:        '📖 书籍',
  self:        '✦ 自己探索',
  unknown:     '未知来源',
}

interface PlaceInfoGridProps {
  pin: Pin
}

export default function PlaceInfoGrid({ pin }: PlaceInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 px-6 py-5 bg-white rounded-2xl
      border border-black/[0.07] shadow-sm">

      {/* Source type */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
          text-[var(--muted)] mb-1.5">发现来源</div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px]
          font-semibold bg-[var(--coral)]/10 text-[var(--coral)] border border-[var(--coral)]/20">
          {SOURCE_LABELS[pin.source]}
        </span>
      </div>

      {/* Source URL */}
      {pin.source_url && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
            text-[var(--muted)] mb-1.5">原始链接</div>
          <a
            href={pin.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--coral)] hover:underline truncate block"
          >
            {pin.source_url.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        </div>
      )}

      {/* Tags */}
      {(pin.tags ?? []).length > 0 && (
        <div className="col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
            text-[var(--muted)] mb-1.5">标签</div>
          <div className="flex flex-wrap gap-1.5">
            {(pin.tags ?? []).map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-[11px] font-semibold
                bg-[#8B7FD4]/12 text-purple-700 border border-[#8B7FD4]/25">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Coordinates */}
      <div className="col-span-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
          text-[var(--muted)] mb-1.5">坐标</div>
        <span className="font-mono text-[12px] text-[var(--muted)]">
          {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 5.2: Commit**

```bash
git add components/place/PlaceInfoGrid.tsx
git commit -m "feat: add PlaceInfoGrid with source, tags, coordinates"
```

---

## Task 6: PlaceStatus component

**Files:**
- Create: `components/place/PlaceStatus.tsx`

- [ ] **Step 6.1: Create `components/place/PlaceStatus.tsx`**

```tsx
'use client'
import { useState } from 'react'
import type { PinStatus } from '@/types/pin'

const OPTIONS: { value: PinStatus; label: string; color: string; active: string }[] = [
  { value: 'visited',   label: '✓ 已到访', color: 'border-[#2ECC8A]/30 text-emerald-700', active: 'bg-[#2ECC8A] text-white border-[#2ECC8A]' },
  { value: 'watchlist', label: '👁 想去',  color: 'border-[#F59E2A]/30 text-amber-700',   active: 'bg-[#F59E2A] text-white border-[#F59E2A]' },
  { value: 'dream',     label: '✨ 梦想',  color: 'border-[#8B7FD4]/30 text-purple-700',  active: 'bg-[#8B7FD4] text-white border-[#8B7FD4]' },
]

interface PlaceStatusProps {
  pinId: string
  initialStatus: PinStatus
}

export default function PlaceStatus({ pinId, initialStatus }: PlaceStatusProps) {
  const [status, setStatus] = useState<PinStatus>(initialStatus)
  const [saving, setSaving] = useState(false)

  const handleChange = async (newStatus: PinStatus) => {
    if (newStatus === status) return
    setSaving(true)
    const res = await fetch(`/api/pins/${pinId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) setStatus(newStatus)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm px-6 py-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
        text-[var(--muted)] mb-3">状态</div>
      <div className="flex gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={saving}
            onClick={() => handleChange(opt.value)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border
              transition-all ${status === opt.value ? opt.active : `bg-white ${opt.color} hover:opacity-80`}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6.2: Commit**

```bash
git add components/place/PlaceStatus.tsx
git commit -m "feat: add PlaceStatus switcher component"
```

---

## Task 7: PlaceNotes component

**Files:**
- Create: `components/place/PlaceNotes.tsx`

- [ ] **Step 7.1: Create `components/place/PlaceNotes.tsx`**

```tsx
'use client'
import { useState } from 'react'

interface PlaceNotesProps {
  pinId: string
  initialNotes: string | null
}

export default function PlaceNotes({ pinId, initialNotes }: PlaceNotesProps) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(notes)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch(`/api/pins/${pinId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: draft }),
    })
    if (res.ok) { setNotes(draft); setEditing(false) }
    setSaving(false)
  }

  const handleCancel = () => {
    setDraft(notes)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] shadow-sm px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
          个人备注
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[12px] text-[var(--coral)] font-semibold hover:opacity-70 transition-opacity"
          >
            {notes ? '编辑' : '+ 添加备注'}
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="写下你对这个地方的想法…"
            rows={4}
            className="w-full px-3 py-2.5 text-[13px] rounded-xl border border-black/10
              bg-[var(--sand)] text-[var(--ink)] placeholder:text-[var(--muted)]
              outline-none focus:border-[var(--coral)] transition-colors resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-[12px] font-semibold rounded-lg
                border border-black/15 text-[var(--muted)] hover:border-black/30 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-[12px] font-semibold rounded-lg
                bg-[var(--coral)] text-white hover:bg-[#d4623e] transition-colors disabled:opacity-60"
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap">
          {notes || <span className="text-[var(--muted)]">暂无备注，点击添加…</span>}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 7.2: Commit**

```bash
git add components/place/PlaceNotes.tsx
git commit -m "feat: add PlaceNotes inline edit component"
```

---

## Task 8: PlaceAISummary component

**Files:**
- Create: `components/place/PlaceAISummary.tsx`

- [ ] **Step 8.1: Create `components/place/PlaceAISummary.tsx`**

```tsx
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
      // Generate summary
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pinName, country }),
      })
      if (!res.ok) throw new Error('生成失败')
      const { summary: text } = await res.json()

      // Save to Supabase
      await fetch(`/api/pins/${pinId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_summary: text }),
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
          <button
            type="button"
            onClick={generate}
            className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
          >
            重新生成
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--coral)]"
                style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <span className="text-[13px] text-white/50">正在生成旅行介绍…</span>
        </div>
      ) : summary ? (
        <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">
          {summary}
        </p>
      ) : (
        <div className="text-center py-4">
          <p className="text-[13px] text-white/40 mb-3">
            让 Claude 为你生成 Lonely Planet 风格的旅行介绍
          </p>
          <button
            type="button"
            onClick={generate}
            className="px-5 py-2 rounded-xl bg-[var(--coral)] text-white text-[13px]
              font-semibold hover:bg-[#d4623e] transition-colors"
          >
            ✦ 生成介绍
          </button>
        </div>
      )}

      {error && (
        <p className="text-[12px] text-red-400 mt-2">{error}</p>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
```

- [ ] **Step 8.2: Commit**

```bash
git add components/place/PlaceAISummary.tsx
git commit -m "feat: add PlaceAISummary component with Claude API integration"
```

---

## Task 9: PlaceNearby component

**Files:**
- Create: `components/place/PlaceNearby.tsx`

- [ ] **Step 9.1: Create `components/place/PlaceNearby.tsx`**

```tsx
import Link from 'next/link'
import type { Pin, PinStatus } from '@/types/pin'

const STATUS_LABELS: Record<PinStatus, string> = {
  visited:   '✓ 已到访',
  watchlist: '👁 想去',
  dream:     '✨ 梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  visited:   'bg-[#2ECC8A]/15 text-emerald-700',
  watchlist: 'bg-[#F59E2A]/15 text-amber-700',
  dream:     'bg-[#8B7FD4]/15 text-purple-700',
}

interface PlaceNearbyProps {
  pins: Pin[]
}

export default function PlaceNearby({ pins }: PlaceNearbyProps) {
  if (pins.length === 0) return null

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em]
        text-[var(--muted)] mb-3">同地区其他地点</div>
      <div className="grid grid-cols-3 gap-3">
        {pins.map(pin => (
          <Link
            key={pin.id}
            href={`/place/${pin.id}`}
            className="bg-white rounded-xl border border-black/[0.07] p-4
              hover:border-[var(--coral)]/40 hover:shadow-md transition-all group"
          >
            <div className="font-medium text-[13px] text-[var(--ink)] group-hover:text-[var(--coral)]
              transition-colors truncate">
              {pin.name}
            </div>
            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px]
              font-semibold ${STATUS_COLORS[pin.status]}`}>
              {STATUS_LABELS[pin.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 9.2: Commit**

```bash
git add components/place/PlaceNearby.tsx
git commit -m "feat: add PlaceNearby component"
```

---

## Task 10: Rewrite place detail page

**Files:**
- Modify: `app/place/[id]/page.tsx`

- [ ] **Step 10.1: Replace `app/place/[id]/page.tsx` entirely**

```tsx
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
      {/* Navbar */}
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

      {/* Hero — full width, below navbar */}
      <div className="pt-[54px]">
        <PlaceHero pin={pin} />
      </div>

      {/* Content */}
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
```

- [ ] **Step 10.2: Verify TypeScript**

```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer && npx tsc --noEmit 2>&1
```
Expected: 0 errors.

- [ ] **Step 10.3: Commit**

```bash
git add app/place/[id]/page.tsx
git commit -m "feat: rewrite place detail page with all E3 components"
```

---

## Task 11: Enable pin click navigation in MapPage

**Files:**
- Modify: `components/MapPage.tsx`

- [ ] **Step 11.1: Enable pin click navigation**

In `components/MapPage.tsx`, update `handlePinClick`:

```tsx
const handlePinClick = useCallback((pin: Pin) => {
  setSelectedId(pin.id)
  router.push(`/place/${pin.id}`)
}, [router])
```

- [ ] **Step 11.2: Verify TypeScript**

```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer && npx tsc --noEmit 2>&1
```

- [ ] **Step 11.3: Manual test**

1. Open `localhost:3000`
2. Click any pin on the map
3. Should navigate to `/place/[id]` showing the full detail page
4. Click "← 返回地图" → back to map

- [ ] **Step 11.4: Commit**

```bash
git add components/MapPage.tsx
git commit -m "feat: enable pin click navigation to place detail page"
```

---

## Task 12: Push + update learning notes

- [ ] **Step 12.1: Push**

```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
git push origin main
```

- [ ] **Step 12.2: Append to `docs/learning-notes.md`**

Add at the end of the file:

```markdown
### E3 - 地点详情页（Hero 地图 + 信息卡片 + AI 介绍）

- **学到的核心概念：**
  - Server Component vs Client Component 的拆分原则：能在服务器取的数据就在服务器取（`getData()`），需要交互的部分拆成 Client Component
  - `dynamic(() => import(...), { ssr: false })`：Mapbox 这类依赖浏览器 DOM 的库必须用动态导入，在服务端渲染会报错
  - Anthropic SDK：`client.messages.create()` 是行业标准的 LLM API 调用方式，`max_tokens` 控制生成长度

- **用到的关键 API/函数：**
  - `supabase.from('pins').select('*').eq('country', pin.country).neq('id', id).limit(3)`：链式查询，`.neq` = not equal，排除自身
  - CSS `@keyframes bounce`：纯 CSS 动画，不需要 JS 控制加载状态小点

- **容易踩的坑：**
  - Mapbox 地图在 Server Component 里会报错，必须用 `dynamic` + `ssr: false` 包一层
  - `ANTHROPIC_API_KEY` 没有 `NEXT_PUBLIC_` 前缀 = 只有服务器能读，浏览器无法访问，这是正确做法（保护 API key）

- **一句话总结：** 详情页 = 服务端取数据 + 多个独立 Client Component 各管一块交互，职责分离让每个组件只需要理解自己那一块。
```

- [ ] **Step 12.3: Commit**

```bash
git add docs/learning-notes.md
git commit -m "docs: add E3 learning notes"
git push origin main
```

---

## Self-Review

| Ticket | Task | ✓ |
|--------|------|---|
| E3-01 Hero layout + info grid | Tasks 4, 5, 10 | ✓ |
| E3-02 Source type chip | Task 5 (PlaceInfoGrid) | ✓ |
| E3-03 Source URL link | Task 5 (PlaceInfoGrid) | ✓ |
| E3-04 Notes inline edit | Task 7 | ✓ |
| E3-05 AI summary (Claude) | Tasks 3, 8 | ✓ |
| E3-06 Nearby places | Task 9 | ✓ |
| E3-07 Status switcher | Task 6 | ✓ |
| Pin click navigation | Task 11 | ✓ |
| Env + SDK setup | Tasks 1, 2 | ✓ |
| Learning notes | Task 12 | ✓ |
