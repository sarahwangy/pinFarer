# Pinfarer Week 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Pinfarer MVP — interactive map homepage with three-state pins, a right sidebar, filter chips, bottom stats, and a KML import page — all backed by Supabase.

**Architecture:** Next.js 14 App Router, client-side Mapbox GL JS (dynamically imported, no SSR), Supabase JS client for data. Light/warm color theme (settled during design review). KML parser runs entirely client-side via DOMParser.

**Tech Stack:** Next.js 14 · Tailwind CSS · Mapbox GL JS · @supabase/supabase-js · TypeScript · Jest + React Testing Library (for pure utilities only)

---

## File Map

```
app/
  layout.tsx              ← Google Fonts, global CSS vars, <html> wrapper
  page.tsx                ← Map homepage — composes Map + Sidebar
  place/[id]/page.tsx     ← Placeholder detail page (just renders pin name)
  import/page.tsx         ← KML import page
  globals.css             ← CSS custom properties (color tokens)
  api/
    pins/route.ts         ← GET /api/pins — reads from Supabase
    pins/[id]/route.ts    ← PATCH /api/pins/[id] — update status/notes

components/
  Map.tsx                 ← Mapbox GL wrapper, client-only, receives pins[]
  Sidebar.tsx             ← Pin list, search, status badges
  FilterBar.tsx           ← All/Visited/Watchlist/Dream chips
  StatsBar.tsx            ← Countries count + total pins
  ImportTable.tsx         ← Preview table for KML import

lib/
  supabase.ts             ← createClient singleton (browser)
  kml-parser.ts           ← parsKML(text: string) → ParsedPin[]
  kml-parser.test.ts      ← Jest unit tests for KML parser

types/
  pin.ts                  ← Pin, ParsedPin, PinStatus TypeScript types
```

---

## Task 1: Bootstrap Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- Create: `app/globals.css`
- Create: `app/layout.tsx`

- [ ] **Step 1.1: Create Next.js app**

```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel
npx create-next-app@14 pinfarer \
  --typescript --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*"
cd pinfarer
```

- [ ] **Step 1.2: Install dependencies**

```bash
npm install @supabase/supabase-js mapbox-gl @types/mapbox-gl
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom @types/jest ts-jest
```

- [ ] **Step 1.3: Write `app/globals.css`**

Replace the generated file entirely:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --sand: #FFFBF4;
  --cream: #FFFFFF;
  --ink: #2D2826;
  --map-bg: #E8F3F8;
  --muted: #A09890;
  --coral: #FF6B47;
  --gold: #F59E2A;
  --forest: #27A060;
  --mint: #2ECC8A;
  --amber: #F59E2A;
  --lavender: #8B7FD4;
  --sky: #5BB8F5;
}
```

- [ ] **Step 1.4: Write `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pinfarer',
  description: '个人旅行地图 + AI 行程规划',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-[var(--map-bg)]">{children}</body>
    </html>
  )
}
```

- [ ] **Step 1.5: Update `tailwind.config.ts` to expose font variables**

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'serif'],
      },
      colors: {
        sand:     'var(--sand)',
        cream:    'var(--cream)',
        ink:      'var(--ink)',
        mapbg:    'var(--map-bg)',
        muted:    'var(--muted)',
        coral:    'var(--coral)',
        gold:     'var(--gold)',
        forest:   'var(--forest)',
        mint:     'var(--mint)',
        amber:    'var(--amber)',
        lavender: 'var(--lavender)',
        sky:      'var(--sky)',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 1.6: Verify dev server starts**

```bash
npm run dev
```

Expected: `ready - started server on 0.0.0.0:3000` with no errors. Open http://localhost:3000 — should show default Next.js page.

- [ ] **Step 1.7: Commit**

```bash
git add -A
git commit -m "feat: bootstrap Next.js 14 project with Tailwind, fonts, CSS vars"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `types/pin.ts`

- [ ] **Step 2.1: Write `types/pin.ts`**

```ts
export type PinStatus = 'visited' | 'watchlist' | 'dream'
export type PinSource = 'youtube' | 'wechat' | 'xiaohongshu' | 'book' | 'self' | 'unknown'

export interface Pin {
  id: string
  user_id: string | null
  name: string
  country: string | null
  region: string | null
  lat: number
  lng: number
  status: PinStatus
  source: PinSource
  source_url: string | null
  notes: string | null
  ai_summary: string | null
  created_at: string
}

export interface ParsedPin {
  name: string
  lat: number
  lng: number
  status: PinStatus
  source: PinSource
}
```

- [ ] **Step 2.2: Commit**

```bash
git add types/pin.ts
git commit -m "feat: add Pin and ParsedPin TypeScript types"
```

---

## Task 3: Supabase setup

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local` (not committed)
- Create: `.env.local.example`

- [ ] **Step 3.1: Register Supabase account and create project**

1. Go to https://supabase.com → New Project
2. Name: `pinfarer`, region: closest to you
3. Save the database password

- [ ] **Step 3.2: Create tables in Supabase SQL editor**

In Supabase Dashboard → SQL Editor, run:

```sql
create table pins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  name        text not null,
  country     text,
  region      text,
  lat         decimal(9,6),
  lng         decimal(9,6),
  status      text check (status in ('visited','watchlist','dream')),
  source      text check (source in ('youtube','wechat','xiaohongshu','book','self','unknown')) default 'unknown',
  source_url  text,
  notes       text,
  ai_summary  text,
  created_at  timestamptz default now()
);

create table itineraries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  title      text,
  days       integer,
  route      jsonb,
  created_at timestamptz default now()
);

-- Allow all reads/writes (single-user MVP, no auth yet)
alter table pins enable row level security;
create policy "allow all" on pins for all using (true) with check (true);

alter table itineraries enable row level security;
create policy "allow all" on itineraries for all using (true) with check (true);
```

- [ ] **Step 3.3: Insert 3 seed pins for testing**

```sql
insert into pins (name, country, region, lat, lng, status, source) values
  ('Paris',     'France',    'Europe',      48.8566,  2.3522,   'visited',   'youtube'),
  ('Tokyo',     'Japan',     'East Asia',   35.6762,  139.6503, 'visited',   'self'),
  ('Bali',      'Indonesia', 'SE Asia',     -8.4095,  115.1889, 'watchlist', 'youtube'),
  ('Reykjavik', 'Iceland',   'Europe',      64.1466,  -21.9426, 'dream',     'wechat'),
  ('Melbourne', 'Australia', 'Oceania',    -37.8136,  144.9631, 'visited',   'self');
```

- [ ] **Step 3.4: Get API keys**

Supabase Dashboard → Project Settings → API:
- Copy `Project URL`
- Copy `anon public` key

- [ ] **Step 3.5: Create `.env.local`**

```bash
# Not committed — copy from .env.local.example and fill in
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

- [ ] **Step 3.6: Create `.env.local.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

- [ ] **Step 3.7: Register Mapbox account**

1. Go to https://account.mapbox.com → Sign up (free)
2. Dashboard → Tokens → Default public token
3. Copy token into `.env.local`

- [ ] **Step 3.8: Add `.env.local` to `.gitignore`**

Check `.gitignore` already includes `.env.local` (create-next-app adds it). If not:
```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 3.9: Write `lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)
```

- [ ] **Step 3.10: Commit**

```bash
git add lib/supabase.ts .env.local.example .gitignore
git commit -m "feat: add Supabase client, create pins/itineraries tables with seed data"
```

---

## Task 4: Pins API route

**Files:**
- Create: `app/api/pins/route.ts`

- [ ] **Step 4.1: Write `app/api/pins/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('pins')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { data, error } = await supabase.from('pins').insert(body).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 4.2: Test the route**

```bash
# With dev server running:
curl http://localhost:3000/api/pins
```

Expected: JSON array with the 5 seed pins.

- [ ] **Step 4.3: Commit**

```bash
git add app/api/pins/route.ts
git commit -m "feat: add GET /api/pins and POST /api/pins routes"
```

---

## Task 5: KML parser (TDD)

**Files:**
- Create: `lib/kml-parser.ts`
- Create: `lib/kml-parser.test.ts`

- [ ] **Step 5.1: Configure Jest**

Add to `package.json`:

```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "transform": { "^.+\\.tsx?$": ["ts-jest", {}] },
    "moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" }
  },
  "scripts": {
    "test": "jest"
  }
}
```

- [ ] **Step 5.2: Write the failing test first**

Create `lib/kml-parser.test.ts`:

```ts
import { parseKML } from './kml-parser'

const SAMPLE_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Eiffel Tower</name>
      <Point><coordinates>2.2945,48.8584,0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Shibuya Crossing</name>
      <Point><coordinates>139.7006,35.6590,0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Bad Entry</name>
    </Placemark>
  </Document>
</kml>`

describe('parseKML', () => {
  it('extracts name and coordinates from Placemarks', () => {
    const result = parseKML(SAMPLE_KML)
    expect(result).toHaveLength(2) // bad entry skipped
    expect(result[0]).toMatchObject({
      name: 'Eiffel Tower',
      lat: 48.8584,
      lng: 2.2945,
      status: 'watchlist',
      source: 'unknown',
    })
    expect(result[1].name).toBe('Shibuya Crossing')
  })

  it('returns empty array for empty KML', () => {
    expect(parseKML('<kml><Document></Document></kml>')).toEqual([])
  })

  it('skips Placemarks without coordinates', () => {
    const kml = `<kml><Document>
      <Placemark><name>No Coords</name></Placemark>
    </Document></kml>`
    expect(parseKML(kml)).toEqual([])
  })
})
```

- [ ] **Step 5.3: Run test — verify it fails**

```bash
npx jest lib/kml-parser.test.ts
```

Expected: `FAIL — Cannot find module './kml-parser'`

- [ ] **Step 5.4: Implement `lib/kml-parser.ts`**

```ts
import type { ParsedPin } from '@/types/pin'

export function parseKML(kmlText: string): ParsedPin[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(kmlText, 'application/xml')
  const placemarks = Array.from(doc.querySelectorAll('Placemark'))

  return placemarks.reduce<ParsedPin[]>((acc, pm) => {
    const name = pm.querySelector('name')?.textContent?.trim()
    const coordText = pm.querySelector('coordinates')?.textContent?.trim()
    if (!name || !coordText) return acc

    const [lngStr, latStr] = coordText.split(',')
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    if (isNaN(lat) || isNaN(lng)) return acc

    acc.push({ name, lat, lng, status: 'watchlist', source: 'unknown' })
    return acc
  }, [])
}
```

- [ ] **Step 5.5: Run test — verify it passes**

```bash
npx jest lib/kml-parser.test.ts
```

Expected: `PASS · 3 tests passed`

- [ ] **Step 5.6: Commit**

```bash
git add lib/kml-parser.ts lib/kml-parser.test.ts package.json
git commit -m "feat: add KML parser with unit tests"
```

---

## Task 6: Map component

**Files:**
- Create: `components/Map.tsx`

- [ ] **Step 6.1: Write `components/Map.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import type { Pin } from '@/types/pin'

const PIN_COLORS: Record<string, string> = {
  visited:   '#2ECC8A',
  watchlist: '#F59E2A',
  dream:     '#8B7FD4',
}

interface MapProps {
  pins: Pin[]
  onPinClick?: (pin: Pin) => void
}

export default function Map({ pins, onPinClick }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      await import('mapbox-gl/dist/mapbox-gl.css')

      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [20, 20],
        zoom: 1.8,
        projection: 'globe',
      })
      mapRef.current = map

      map.on('load', () => {
        map.setFog({ color: '#e8f3f8', 'high-color': '#c8e4f0', 'horizon-blend': 0.05 })
      })
    }

    initMap()
    return () => { mapRef.current?.remove(); mapRef.current = null }
  }, [])

  // Re-render markers when pins change
  useEffect(() => {
    const addMarkers = async () => {
      if (!mapRef.current) return
      const mapboxgl = (await import('mapbox-gl')).default

      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      pins.forEach(pin => {
        const el = document.createElement('div')
        el.style.cssText = `
          width:12px;height:12px;border-radius:50%;
          background:${PIN_COLORS[pin.status]};
          border:2px solid rgba(255,255,255,0.8);
          box-shadow:0 2px 6px rgba(0,0,0,0.2);
          cursor:pointer;transition:transform .15s;
        `
        el.addEventListener('mouseenter', () => el.style.transform = 'scale(1.6)')
        el.addEventListener('mouseleave', () => el.style.transform = 'scale(1)')

        const popup = new mapboxgl.Popup({ offset: 12, closeButton: false })
          .setHTML(`<div style="font-family:var(--font-dm-sans);padding:4px 2px">
            <div style="font-weight:600;font-size:13px">${pin.name}</div>
            <div style="font-size:11px;color:#888;margin-top:2px">${pin.country ?? ''}</div>
          </div>`)

        const marker = new mapboxgl.Marker(el)
          .setLngLat([pin.lng, pin.lat])
          .setPopup(popup)
          .addTo(mapRef.current!)

        el.addEventListener('click', () => onPinClick?.(pin))
        markersRef.current.push(marker)
      })
    }

    addMarkers()
  }, [pins, onPinClick])

  return <div ref={containerRef} className="w-full h-full" />
}
```

- [ ] **Step 6.2: Commit**

```bash
git add components/Map.tsx
git commit -m "feat: add Mapbox GL map component with pin markers"
```

---

## Task 7: FilterBar component

**Files:**
- Create: `components/FilterBar.tsx`

- [ ] **Step 7.1: Write `components/FilterBar.tsx`**

```tsx
'use client'
import type { PinStatus } from '@/types/pin'

type FilterValue = PinStatus | 'all'

const FILTERS: { value: FilterValue; label: string; color?: string }[] = [
  { value: 'all',       label: '全部' },
  { value: 'visited',   label: '✓ 已到访',  color: '#2ECC8A' },
  { value: 'watchlist', label: '👁 想去',   color: '#F59E2A' },
  { value: 'dream',     label: '✨ 梦想',   color: '#8B7FD4' },
]

interface FilterBarProps {
  active: FilterValue
  onChange: (v: FilterValue) => void
}

export default function FilterBar({ active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2">
      {FILTERS.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
            border transition-all shadow-sm
            ${active === f.value
              ? 'text-white border-transparent shadow-md'
              : 'bg-white/90 text-ink/60 border-black/10 hover:text-ink/90'
            }`}
          style={active === f.value ? { background: f.color ?? 'var(--coral)' } : {}}
        >
          {f.color && active === f.value && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
          )}
          {f.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 7.2: Commit**

```bash
git add components/FilterBar.tsx
git commit -m "feat: add FilterBar component"
```

---

## Task 8: Sidebar component

**Files:**
- Create: `components/Sidebar.tsx`

- [ ] **Step 8.1: Write `components/Sidebar.tsx`**

```tsx
'use client'
import { useState } from 'react'
import type { Pin, PinStatus } from '@/types/pin'

const STATUS_LABELS: Record<PinStatus, string> = {
  visited:   '已到访',
  watchlist: '想去',
  dream:     '梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  visited:   'bg-mint/15 text-emerald-700',
  watchlist: 'bg-amber/15 text-amber-700',
  dream:     'bg-lavender/15 text-purple-700',
}
const DOT_COLORS: Record<PinStatus, string> = {
  visited:   'bg-mint',
  watchlist: 'bg-amber',
  dream:     'bg-lavender',
}

interface SidebarProps {
  pins: Pin[]
  filterStatus: PinStatus | 'all'
  selectedId: string | null
  onSelect: (pin: Pin) => void
}

export default function Sidebar({ pins, filterStatus, selectedId, onSelect }: SidebarProps) {
  const [query, setQuery] = useState('')

  const visible = pins.filter(p => {
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  })

  const grouped = (['visited', 'watchlist', 'dream'] as PinStatus[]).map(status => ({
    status,
    items: visible.filter(p => p.status === status),
  })).filter(g => g.items.length > 0)

  const countries = new Set(pins.map(p => p.country).filter(Boolean)).size

  return (
    <aside className="w-[340px] flex-shrink-0 flex flex-col bg-sand shadow-[-4px_0_24px_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="px-[18px] py-4 border-b border-black/7 bg-cream">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-[16px] font-semibold text-ink">我的地点</h2>
          <span className="text-[11px] font-medium text-muted bg-black/6 px-2 py-0.5 rounded-full">
            {pins.length} 个
          </span>
        </div>
        <input
          type="text"
          placeholder="搜索地点…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-3 py-2 text-[13px] rounded-[10px] border border-black/9
            bg-white text-ink placeholder-muted outline-none focus:border-coral transition-colors"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {grouped.map(({ status, items }) => (
          <div key={status}>
            <div className="px-[18px] py-2.5 text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
              {status === 'visited' ? `✓ 已到访 · ${items.length}` :
               status === 'watchlist' ? `👁 想去 · ${items.length}` :
               `✨ 梦想 · ${items.length}`}
            </div>
            {items.map(pin => (
              <div
                key={pin.id}
                onClick={() => onSelect(pin)}
                className={`flex items-center gap-3 px-[18px] py-2.5 cursor-pointer
                  border-l-[3px] transition-colors
                  ${selectedId === pin.id
                    ? 'bg-coral/5 border-l-coral'
                    : 'border-l-transparent hover:bg-black/[0.03]'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${DOT_COLORS[pin.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{pin.name}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {pin.country ?? ''}
                    {pin.source && pin.source !== 'unknown' && ` · ${pin.source}`}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg flex-shrink-0 ${STATUS_COLORS[pin.status]}`}>
                  {STATUS_LABELS[pin.status]}
                </span>
              </div>
            ))}
          </div>
        ))}
        {visible.length === 0 && (
          <div className="text-center text-muted text-[13px] py-12">暂无地点</div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-[18px] py-3.5 border-t border-black/7 bg-cream">
        {[
          { n: countries, label: '国家数' },
          { n: pins.length, label: '地点总数' },
          { n: pins.filter(p => p.status === 'visited').length, label: '已到访' },
          { n: pins.filter(p => p.status === 'watchlist').length, label: '想去清单' },
        ].map(({ n, label }) => (
          <div key={label}>
            <div className="font-serif text-[22px] font-bold text-coral leading-none">{n}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
```

- [ ] **Step 8.2: Commit**

```bash
git add components/Sidebar.tsx
git commit -m "feat: add Sidebar with pin list, search, grouped sections, stats"
```

---

## Task 9: Map homepage

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 9.1: Write `app/page.tsx`**

```tsx
import { Suspense } from 'react'
import MapPage from '@/components/MapPage'

export default function Home() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-mapbg" />}>
      <MapPage />
    </Suspense>
  )
}
```

- [ ] **Step 9.2: Create `components/MapPage.tsx`**

```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Pin, PinStatus } from '@/types/pin'
import FilterBar from './FilterBar'
import Sidebar from './Sidebar'

const Map = dynamic(() => import('./Map'), { ssr: false })

type FilterValue = PinStatus | 'all'

export default function MapPage() {
  const router = useRouter()
  const [pins, setPins] = useState<Pin[]>([])
  const [filter, setFilter] = useState<FilterValue>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/pins')
      .then(r => r.json())
      .then(setPins)
      .catch(console.error)
  }, [])

  const visiblePins = filter === 'all' ? pins : pins.filter(p => p.status === filter)

  const handlePinClick = useCallback((pin: Pin) => {
    setSelectedId(pin.id)
  }, [])

  const handleSidebarSelect = useCallback((pin: Pin) => {
    setSelectedId(pin.id)
  }, [])

  return (
    <div className="flex h-screen pt-0">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/97 backdrop-blur-md
        border-b border-black/7 shadow-sm flex items-center px-5 gap-0 z-50">
        <div className="font-serif text-[20px] font-bold text-ink flex items-center gap-2 mr-8">
          <span className="w-2.5 h-2.5 rounded-full bg-coral shadow-[0_0_8px_rgba(255,107,71,0.7)]" />
          Pinfarer
        </div>
        <div className="flex gap-0.5">
          {['地图','数据统计','AI 规划','导入'].map((label, i) => (
            <button key={label}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors
                ${i === 0 ? 'bg-coral text-white' : 'text-ink/45 hover:text-ink/80 hover:bg-black/5'}`}
              onClick={() => {
                if (i === 3) router.push('/import')
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2.5">
          <button
            onClick={() => router.push('/import')}
            className="px-3.5 py-1.5 text-[13px] font-semibold rounded-lg border border-black/15 text-ink transition-colors hover:border-black/3"
          >
            + 导入 KML
          </button>
          <button className="px-3.5 py-1.5 text-[13px] font-semibold rounded-lg bg-coral text-white hover:bg-[#d4623e] transition-colors">
            + 添加地点
          </button>
        </div>
      </nav>

      {/* Map area */}
      <div className="flex-1 relative mt-[54px]">
        <Map pins={visiblePins} onPinClick={handlePinClick} />
        <div className="absolute top-3 left-3 z-10">
          <FilterBar active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="mt-[54px]">
        <Sidebar
          pins={pins}
          filterStatus={filter}
          selectedId={selectedId}
          onSelect={handleSidebarSelect}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 9.3: Verify map page works**

```bash
npm run dev
```

Open http://localhost:3000. Expected:
- Navbar renders with Pinfarer logo
- Mapbox map fills the viewport left of sidebar
- 5 seed pins visible on map as colored dots
- Sidebar shows pins grouped by status
- Filter chips filter both map and sidebar

- [ ] **Step 9.4: Commit**

```bash
git add app/page.tsx components/MapPage.tsx
git commit -m "feat: map homepage with Mapbox, sidebar, filter chips"
```

---

## Task 10: Place detail placeholder

**Files:**
- Create: `app/place/[id]/page.tsx`

- [ ] **Step 10.1: Write `app/place/[id]/page.tsx`**

```tsx
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function PlacePage({ params }: { params: { id: string } }) {
  const { data: pin } = await supabase.from('pins').select('*').eq('id', params.id).single()

  if (!pin) return (
    <div className="min-h-screen bg-sand flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted">地点不存在</p>
        <Link href="/" className="text-coral mt-2 inline-block">← 返回地图</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-sand p-8">
      <Link href="/" className="text-coral text-sm mb-6 inline-block">← 返回地图</Link>
      <h1 className="font-serif text-4xl font-bold text-ink">{pin.name}</h1>
      <p className="text-muted mt-2">{pin.country} · {pin.status}</p>
      <p className="text-muted text-sm mt-4">详情页功能将在 Week 2 完善（E3）</p>
    </div>
  )
}
```

- [ ] **Step 10.2: Update Map.tsx to navigate on pin click**

In `components/Map.tsx`, update the `onPinClick` call to navigate. The parent `MapPage.tsx` already handles this via `selectedId` — to enable navigation to detail page, update `handlePinClick` in `MapPage.tsx`:

```tsx
// In components/MapPage.tsx, replace handlePinClick:
const handlePinClick = useCallback((pin: Pin) => {
  setSelectedId(pin.id)
  // Uncomment to navigate on click:
  // router.push(`/place/${pin.id}`)
}, [])
```

Keep navigation commented for now — detail page is Week 2 scope.

- [ ] **Step 10.3: Commit**

```bash
git add app/place/
git commit -m "feat: placeholder place detail page"
```

---

## Task 11: KML Import page

**Files:**
- Create: `app/import/page.tsx`
- Create: `components/ImportTable.tsx`

- [ ] **Step 11.1: Write `components/ImportTable.tsx`**

```tsx
'use client'
import type { ParsedPin, PinStatus } from '@/types/pin'

interface ImportTableProps {
  rows: ParsedPin[]
  onChange: (index: number, status: PinStatus) => void
}

const STATUS_OPTIONS: PinStatus[] = ['watchlist', 'visited', 'dream']
const STATUS_LABELS: Record<PinStatus, string> = {
  watchlist: '想去',
  visited: '已到访',
  dream: '梦想',
}

export default function ImportTable({ rows, onChange }: ImportTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="bg-cream rounded-2xl border border-black/7 overflow-hidden mb-5">
      <div className="px-[18px] py-3.5 border-b border-black/7 flex items-center justify-between">
        <h3 className="font-serif text-[15px] font-semibold text-ink">
          预览 — 解析到 {rows.length} 个地点
        </h3>
        <span className="text-[12px] text-muted">导入前可逐条修改状态</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/[0.025]">
              {['#', '地点名称', '坐标', '状态'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold
                  uppercase tracking-[0.07em] text-muted border-b border-black/7">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02]">
                <td className="px-4 py-2.5 text-[13px] text-muted">{i + 1}</td>
                <td className="px-4 py-2.5 text-[13px] font-medium text-ink">{row.name}</td>
                <td className="px-4 py-2.5 text-[11px] text-muted font-mono">
                  {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={row.status}
                    onChange={e => onChange(i, e.target.value as PinStatus)}
                    className="px-2 py-1 rounded-lg border border-black/10 text-[12px]
                      font-medium text-ink bg-white outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 11.2: Write `app/import/page.tsx`**

```tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { parseKML } from '@/lib/kml-parser'
import ImportTable from '@/components/ImportTable'
import type { ParsedPin, PinSource, PinStatus } from '@/types/pin'

const SOURCES: { value: PinSource; label: string }[] = [
  { value: 'unknown',     label: '未知' },
  { value: 'youtube',     label: '▶ YouTube' },
  { value: 'wechat',      label: '📱 微信公众号' },
  { value: 'xiaohongshu', label: '📱 小红书' },
  { value: 'book',        label: '📖 书籍' },
  { value: 'self',        label: '✦ 自己探索' },
]

export default function ImportPage() {
  const router = useRouter()
  const [rows, setRows] = useState<ParsedPin[]>([])
  const [source, setSource] = useState<PinSource>('unknown')
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'importing' | 'done'>('idle')
  const [progress, setProgress] = useState(0)

  const handleFile = useCallback(async (file: File) => {
    const text = await file.text()
    const parsed = parseKML(text)
    setRows(parsed.map(p => ({ ...p, source })))
  }, [source])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.kml')) handleFile(file)
  }, [handleFile])

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const updateStatus = useCallback((index: number, newStatus: PinStatus) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, status: newStatus } : r))
  }, [])

  const handleImport = async () => {
    setStatus('importing')
    setProgress(0)
    const body = rows.map(r => ({
      name: r.name, lat: r.lat, lng: r.lng,
      status: r.status, source,
    }))

    // Fake progress
    const iv = setInterval(() => setProgress(p => Math.min(p + 15, 90)), 150)

    const res = await fetch('/api/pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    clearInterval(iv)
    setProgress(100)

    if (res.ok) {
      setStatus('done')
      setTimeout(() => router.push('/'), 1200)
    } else {
      setStatus('idle')
      alert('导入失败，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-[54px] bg-white/97 backdrop-blur-md
        border-b border-black/7 shadow-sm flex items-center px-5 z-50">
        <div className="font-serif text-[20px] font-bold text-ink flex items-center gap-2 mr-8">
          <span className="w-2.5 h-2.5 rounded-full bg-coral" />
          Pinfarer
        </div>
        <button onClick={() => router.push('/')} className="text-[13px] text-muted hover:text-ink transition-colors">
          ← 返回地图
        </button>
      </nav>

      <div className="max-w-3xl mx-auto pt-[86px] pb-12 px-6">
        <h1 className="font-serif text-[28px] font-bold text-ink mb-1">
          从 <em className="italic text-forest">Google 地图</em> 导入
        </h1>
        <p className="text-[13px] text-muted mb-6">上传 Google Takeout 导出的 KML 文件，批量导入收藏地点</p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
          className={`rounded-2xl border-2 border-dashed text-center px-6 py-12 cursor-pointer
            transition-all mb-6
            ${isDragging
              ? 'border-forest bg-forest/5'
              : 'border-black/15 bg-white hover:border-forest/50'
            }`}
        >
          <input id="fileInput" type="file" accept=".kml" className="hidden" onChange={onFileInput} />
          <div className="text-4xl mb-3">📍</div>
          <div className="font-serif text-[18px] font-semibold text-ink mb-1.5">将 KML 文件拖拽到此处</div>
          <div className="text-[13px] text-muted">
            或 <span className="text-forest font-semibold">点击选择文件</span>
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <span className="text-[11px] bg-black/6 px-2 py-0.5 rounded font-semibold text-muted">KML</span>
            <span className="text-[11px] text-muted">来自 Google Takeout → 地图 → 已保存地点</span>
          </div>
        </div>

        {/* Progress */}
        {status === 'importing' && (
          <div className="mb-6">
            <div className="flex justify-between text-[13px] font-medium text-ink mb-1.5">
              <span>正在导入…</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-black/8 rounded-full overflow-hidden">
              <div className="h-full bg-forest rounded-full transition-[width] duration-300"
                style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Source selector */}
        {rows.length > 0 && (
          <div className="flex items-center gap-4 mb-5 flex-wrap">
            <span className="text-[13px] font-semibold text-ink">默认来源：</span>
            <div className="flex gap-2 flex-wrap">
              {SOURCES.map(s => (
                <button key={s.value} onClick={() => setSource(s.value)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-all
                    ${source === s.value
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-muted border-black/10 hover:border-black/25'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ImportTable rows={rows} onChange={updateStatus} />

        {rows.length > 0 && (
          <div className="flex justify-end gap-3">
            <button onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl border border-black/15 text-[14px] font-semibold text-ink hover:border-black/3 transition-colors">
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={status !== 'idle'}
              className={`px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all
                ${status === 'done'
                  ? 'bg-mint'
                  : 'bg-forest hover:bg-[#245a41] hover:-translate-y-px'
                }`}
            >
              {status === 'done' ? '✓ 导入成功！' : `导入 ${rows.length} 个地点 →`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 11.3: Test import flow**

```bash
# Create a minimal test KML file
cat > /tmp/test.kml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <name>Colosseum</name>
      <Point><coordinates>12.4922,41.8902,0</coordinates></Point>
    </Placemark>
    <Placemark>
      <name>Santorini</name>
      <Point><coordinates>25.4615,36.3932,0</coordinates></Point>
    </Placemark>
  </Document>
</kml>
EOF
```

1. Open http://localhost:3000/import
2. Drop `/tmp/test.kml` onto the dropzone
3. Verify 2 rows appear in preview table
4. Change one row's status
5. Click import → verify redirect to `/` with new pins on map

- [ ] **Step 11.4: Commit**

```bash
git add app/import/page.tsx components/ImportTable.tsx
git commit -m "feat: KML import page with drag-and-drop, preview table, bulk insert"
```

---

## Task 12: Deploy to Vercel

**Files:** none (config only)

- [ ] **Step 12.1: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/pinfarer.git
git push -u origin main
```

- [ ] **Step 12.2: Connect Vercel**

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select the `pinfarer` repo
3. Framework: Next.js (auto-detected)
4. Add environment variables (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
5. Click Deploy

- [ ] **Step 12.3: Verify production deploy**

Open the Vercel URL. Test:
- Map loads with pins
- Import page works
- Filter chips work

- [ ] **Step 12.4: Commit**

```bash
git add .
git commit -m "chore: ready for Vercel deployment"
```

---

## Self-Review

**Spec coverage check:**

| Ticket | Task | Status |
|--------|------|--------|
| E1-01 Next.js + Tailwind | Task 1 | ✓ |
| E1-02 GitHub + Vercel | Task 12 | ✓ |
| E1-03 Supabase tables | Task 3 | ✓ |
| E1-04 Env vars | Task 3 | ✓ |
| E1-05 CSS vars + fonts | Task 1 | ✓ |
| E2-01 Mapbox dark map | Task 6 | ✓ (light-v11 style) |
| E2-02 3-color pins from Supabase | Tasks 4,6 | ✓ |
| E2-03 Pin click → /place/[id] | Task 10 | ✓ (commented, ready) |
| E2-04 Sidebar pin list | Task 8 | ✓ |
| E2-05 Sidebar search | Task 8 | ✓ |
| E2-06 Filter chips | Task 7 | ✓ |
| E2-07 Stats bar | Task 8 (in sidebar) | ✓ |
| E2-08 Pin hover tooltip | Task 6 (Mapbox Popup) | ✓ |
| E6-01 KML upload UI | Task 11 | ✓ |
| E6-02 KML parser | Task 5 | ✓ |
| E6-03 Batch source type | Task 11 | ✓ |
| E6-04 Preview table + edit status | Task 11 | ✓ |
| E6-05 Confirm import → Supabase | Task 11 | ✓ |

All P0 tickets for Week 1 covered. P1 items (E2-08 hover) included via Mapbox Popup.
