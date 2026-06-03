# Tags + Bulk Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add custom tags (text[] on pins) + bulk status setting in import, with tag filtering and inline tag editing in the sidebar.

**Architecture:** Tags stored as `text[]` on the `pins` table (no extra tables). Import page gets bulk-status buttons and a batch-tag input. Sidebar gets tag filter chips (derived from all existing tags) and an inline tag editor when a pin is selected. A new PATCH `/api/pins/[id]` route handles tag updates.

**Tech Stack:** Next.js 14 App Router · Supabase · TypeScript · Tailwind CSS

---

## File Map

```
types/pin.ts                     ← add tags: string[] to Pin
app/api/pins/[id]/route.ts       ← new: PATCH to update tags/status on a single pin
components/ImportTable.tsx       ← add bulk-status bar + batch-tag input
components/Sidebar.tsx           ← add tag filter chips + inline tag editor on selected pin
components/MapPage.tsx           ← pass allTags + tagFilter state to Sidebar
```

---

## Task 1: Supabase schema + types

**Files:**
- Modify: `types/pin.ts`

- [ ] **Step 1.1: Add tags column in Supabase SQL Editor**

Run in Supabase Dashboard → SQL Editor:
```sql
alter table pins add column if not exists tags text[] default '{}';
```

- [ ] **Step 1.2: Update `types/pin.ts`**

Replace the entire file:
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
  tags: string[]
  created_at: string
}

export interface ParsedPin {
  name: string
  lat: number
  lng: number
  status: PinStatus
  source: PinSource
  country?: string
  tags?: string[]
}
```

- [ ] **Step 1.3: Verify TypeScript**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer && npx tsc --noEmit 2>&1
```
Expected: 0 errors (or only pre-existing warnings).

- [ ] **Step 1.4: Commit**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
git add types/pin.ts
git commit -m "feat: add tags field to Pin type"
```

---

## Task 2: PATCH /api/pins/[id] route

**Files:**
- Create: `app/api/pins/[id]/route.ts`

- [ ] **Step 2.1: Create `app/api/pins/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(url, key)

  const body = await request.json()
  const { data, error } = await supabase
    .from('pins')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2.2: Test the route**

With dev server running:
```bash
# Get a pin id from GET /api/pins first, then:
curl -X PATCH http://localhost:3000/api/pins/SOME-UUID \
  -H "Content-Type: application/json" \
  -d '{"tags": ["test"]}'
```
Expected: JSON of the updated pin with `tags: ["test"]`.

- [ ] **Step 2.3: Commit**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
git add app/api/pins/[id]/route.ts
git commit -m "feat: add PATCH /api/pins/[id] for tag and status updates"
```

---

## Task 3: ImportTable — bulk status + batch tags

**Files:**
- Modify: `components/ImportTable.tsx`

- [ ] **Step 3.1: Replace `components/ImportTable.tsx` entirely**

```tsx
'use client'
import { useState } from 'react'
import type { ParsedPin, PinStatus } from '@/types/pin'

interface ImportTableProps {
  rows: ParsedPin[]
  onChangeStatus: (index: number, status: PinStatus) => void
  onBulkStatus: (status: PinStatus) => void
  onBulkTag: (tag: string) => void
}

const STATUS_OPTIONS: PinStatus[] = ['watchlist', 'visited', 'dream']
const STATUS_LABELS: Record<PinStatus, string> = {
  watchlist: '想去',
  visited:   '已到访',
  dream:     '梦想',
}
const STATUS_COLORS: Record<PinStatus, string> = {
  watchlist: 'bg-[#F59E2A]/15 text-amber-700 border-[#F59E2A]/30',
  visited:   'bg-[#2ECC8A]/15 text-emerald-700 border-[#2ECC8A]/30',
  dream:     'bg-[#8B7FD4]/15 text-purple-700 border-[#8B7FD4]/30',
}

const PREVIEW_LIMIT = 20

export default function ImportTable({ rows, onChangeStatus, onBulkStatus, onBulkTag }: ImportTableProps) {
  const [tagInput, setTagInput] = useState('')

  if (rows.length === 0) return null

  const preview = rows.slice(0, PREVIEW_LIMIT)
  const hidden = rows.length - PREVIEW_LIMIT

  const handleAddTag = () => {
    const t = tagInput.trim()
    if (!t) return
    onBulkTag(t)
    setTagInput('')
  }

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden mb-5">
      {/* Header */}
      <div className="px-[18px] py-3.5 border-b border-black/[0.07] flex items-center justify-between">
        <h3 className="font-serif text-[15px] font-semibold text-[var(--ink)]">
          预览 — 解析到 {rows.length} 个地点
        </h3>
        <span className="text-[12px] text-[var(--muted)]">
          {hidden > 0 ? `显示前 ${PREVIEW_LIMIT} 条，还有 ${hidden} 条将一并导入` : '导入前可修改状态'}
        </span>
      </div>

      {/* Bulk actions */}
      <div className="px-[18px] py-3 border-b border-black/[0.05] bg-black/[0.015] flex flex-wrap items-center gap-3">
        {/* Bulk status */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[var(--muted)]">全部设为</span>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onBulkStatus(s)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all
                hover:opacity-80 ${STATUS_COLORS[s]}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-black/10" />

        {/* Bulk tag */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-[var(--muted)]">批量打标签</span>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
            placeholder="输入标签名，如「育儿」"
            className="px-3 py-1 text-[12px] rounded-lg border border-black/10 bg-white
              text-[var(--ink)] placeholder:text-[var(--muted)] outline-none
              focus:border-[var(--coral)] transition-colors w-40"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-3 py-1 rounded-lg bg-[var(--ink)] text-white text-[11px] font-semibold
              hover:opacity-80 transition-opacity"
          >
            应用到全部
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/[0.025]">
              {['#', '地点名称', '坐标', '状态', '标签'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold
                  uppercase tracking-[0.07em] text-[var(--muted)] border-b border-black/[0.07]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.02]">
                <td className="px-4 py-2.5 text-[13px] text-[var(--muted)]">{i + 1}</td>
                <td className="px-4 py-2.5 text-[13px] font-medium text-[var(--ink)]">{row.name}</td>
                <td className="px-4 py-2.5 text-[11px] text-[var(--muted)] font-mono">
                  {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
                </td>
                <td className="px-4 py-2.5">
                  <select
                    value={row.status}
                    onChange={e => onChangeStatus(i, e.target.value as PinStatus)}
                    className="px-2 py-1 rounded-lg border border-black/10 text-[12px]
                      font-medium text-[var(--ink)] bg-white outline-none cursor-pointer"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {(row.tags ?? []).map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                        bg-[var(--lavender)]/15 text-purple-700 border border-[var(--lavender)]/30">
                        {tag}
                      </span>
                    ))}
                  </div>
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

- [ ] **Step 3.2: Update `app/import/page.tsx` to pass new props**

Find the `updateRowStatus` callback and add two new callbacks below it:

```tsx
// Replace updateRowStatus and add two new callbacks:
const updateRowStatus = useCallback((index: number, newStatus: PinStatus) => {
  setRows(prev => prev.map((r, i) => i === index ? { ...r, status: newStatus } : r))
}, [])

const bulkSetStatus = useCallback((newStatus: PinStatus) => {
  setRows(prev => prev.map(r => ({ ...r, status: newStatus })))
}, [])

const bulkAddTag = useCallback((tag: string) => {
  setRows(prev => prev.map(r => ({
    ...r,
    tags: r.tags?.includes(tag) ? r.tags : [...(r.tags ?? []), tag],
  })))
}, [])
```

Find the `<ImportTable>` usage and update it:
```tsx
<ImportTable
  rows={rows}
  onChangeStatus={updateRowStatus}
  onBulkStatus={bulkSetStatus}
  onBulkTag={bulkAddTag}
/>
```

Also update `handleImport` body mapping to include tags:
```tsx
const body = rows.map(r => ({
  name: r.name,
  lat: r.lat,
  lng: r.lng,
  status: r.status,
  source,
  country: r.country ?? null,
  tags: r.tags ?? [],
}))
```

- [ ] **Step 3.3: Verify TypeScript**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer && npx tsc --noEmit 2>&1
```
Expected: 0 errors.

- [ ] **Step 3.4: Manual test**

1. Open `localhost:3000/import`
2. Upload a CSV file
3. Click "全部设为梦想" — all rows should change to 梦想
4. Type "育儿" → click "应用到全部" — all rows show 育儿 tag chip
5. Click "导入 X 个地点"

- [ ] **Step 3.5: Commit**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
git add components/ImportTable.tsx app/import/page.tsx
git commit -m "feat: bulk status + batch tags in import table"
```

---

## Task 4: Sidebar — tag filters + inline tag editor

**Files:**
- Modify: `components/Sidebar.tsx`
- Modify: `components/MapPage.tsx`

- [ ] **Step 4.1: Replace `components/Sidebar.tsx` entirely**

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
  visited:   'bg-[#2ECC8A]/15 text-emerald-700',
  watchlist: 'bg-[#F59E2A]/15 text-amber-700',
  dream:     'bg-[#8B7FD4]/15 text-purple-700',
}
const DOT_COLORS: Record<PinStatus, string> = {
  visited:   'bg-[#2ECC8A]',
  watchlist: 'bg-[#F59E2A]',
  dream:     'bg-[#8B7FD4]',
}

interface SidebarProps {
  pins: Pin[]
  filterStatus: PinStatus | 'all'
  filterTag: string | null
  selectedId: string | null
  onSelect: (pin: Pin) => void
  onTagFilter: (tag: string | null) => void
  onUpdatePinTags: (pinId: string, tags: string[]) => void
}

export default function Sidebar({
  pins, filterStatus, filterTag, selectedId,
  onSelect, onTagFilter, onUpdatePinTags,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [newTag, setNewTag] = useState('')

  // Derive all unique tags across all pins
  const allTags = Array.from(new Set(pins.flatMap(p => p.tags ?? []))).sort()

  const visible = pins.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus
    const matchesTag    = filterTag === null || (p.tags ?? []).includes(filterTag)
    const matchesQuery  = p.name.toLowerCase().includes(query.toLowerCase())
    return matchesStatus && matchesTag && matchesQuery
  })

  const grouped = (['visited', 'watchlist', 'dream'] as PinStatus[]).map(status => ({
    status,
    items: visible.filter(p => p.status === status),
  })).filter(g => g.items.length > 0)

  const countries = new Set(pins.map(p => p.country).filter(Boolean)).size
  const selectedPin = selectedId ? pins.find(p => p.id === selectedId) : null

  const addTagToPin = () => {
    if (!selectedPin || !newTag.trim()) return
    const updated = [...new Set([...(selectedPin.tags ?? []), newTag.trim()])]
    onUpdatePinTags(selectedPin.id, updated)
    setNewTag('')
  }

  const removeTagFromPin = (tag: string) => {
    if (!selectedPin) return
    onUpdatePinTags(selectedPin.id, (selectedPin.tags ?? []).filter(t => t !== tag))
  }

  return (
    <aside className="w-[340px] flex-shrink-0 flex flex-col bg-[var(--sand)]
      shadow-[-4px_0_24px_rgba(0,0,0,0.1)] h-full">

      {/* Header */}
      <div className="px-[18px] py-4 border-b border-black/[0.07] bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-[16px] font-semibold text-[var(--ink)]">我的地点</h2>
          <span className="text-[11px] font-medium text-[var(--muted)] bg-black/[0.06] px-2 py-0.5 rounded-full">
            {pins.length} 个
          </span>
        </div>
        <input
          type="text"
          placeholder="搜索地点…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-3 py-2 text-[13px] rounded-[10px] border border-black/[0.09]
            bg-white text-[var(--ink)] placeholder:text-[var(--muted)] outline-none
            focus:border-[var(--coral)] transition-colors"
        />
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="px-[18px] py-2.5 border-b border-black/[0.05] flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onTagFilter(null)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
              ${filterTag === null
                ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                : 'bg-white text-[var(--muted)] border-black/10 hover:border-black/25'
              }`}
          >
            全部标签
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagFilter(filterTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                ${filterTag === tag
                  ? 'bg-[var(--lavender)] text-white border-[var(--lavender)]'
                  : 'bg-white text-purple-700 border-[var(--lavender)]/30 hover:border-[var(--lavender)]'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Pin list */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {grouped.map(({ status, items }) => (
          <div key={status}>
            <div className="px-[18px] py-2.5 text-[10px] font-semibold uppercase
              tracking-[0.09em] text-[var(--muted)]">
              {status === 'visited' ? `✓ 已到访 · ${items.length}` :
               status === 'watchlist' ? `👁 想去 · ${items.length}` :
               `✨ 梦想 · ${items.length}`}
            </div>
            {items.map(pin => (
              <div
                key={pin.id}
                onClick={() => onSelect(pin)}
                className={`flex items-start gap-3 px-[18px] py-2.5 cursor-pointer
                  border-l-[3px] transition-colors
                  ${selectedId === pin.id
                    ? 'bg-[var(--coral)]/5 border-l-[var(--coral)]'
                    : 'border-l-transparent hover:bg-black/[0.03]'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${DOT_COLORS[pin.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[var(--ink)] truncate">{pin.name}</div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">
                    {pin.country ?? ''}
                    {pin.source && pin.source !== 'unknown' && ` · ${pin.source}`}
                  </div>
                  {(pin.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(pin.tags ?? []).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                          bg-[var(--lavender)]/12 text-purple-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-lg
                  flex-shrink-0 mt-0.5 ${STATUS_COLORS[pin.status]}`}>
                  {STATUS_LABELS[pin.status]}
                </span>
              </div>
            ))}
          </div>
        ))}
        {visible.length === 0 && (
          <div className="text-center text-[var(--muted)] text-[13px] py-12">暂无地点</div>
        )}
      </div>

      {/* Inline tag editor for selected pin */}
      {selectedPin && (
        <div className="px-[18px] py-3 border-t border-black/[0.07] bg-white/60">
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">
            {selectedPin.name} 的标签
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
            {(selectedPin.tags ?? []).length === 0 && (
              <span className="text-[11px] text-[var(--muted)]">暂无标签</span>
            )}
            {(selectedPin.tags ?? []).map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full
                text-[11px] font-semibold bg-[var(--lavender)]/15 text-purple-700
                border border-[var(--lavender)]/30">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTagFromPin(tag)}
                  className="text-purple-400 hover:text-purple-700 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTagToPin()}
              placeholder="添加标签…"
              className="flex-1 px-2.5 py-1.5 text-[12px] rounded-lg border border-black/10
                bg-white text-[var(--ink)] placeholder:text-[var(--muted)] outline-none
                focus:border-[var(--coral)] transition-colors"
            />
            <button
              type="button"
              onClick={addTagToPin}
              className="px-3 py-1.5 rounded-lg bg-[var(--coral)] text-white text-[12px]
                font-semibold hover:bg-[#d4623e] transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-[18px] py-3.5 border-t border-black/[0.07] bg-white">
        {[
          { n: countries, label: '国家数' },
          { n: pins.length, label: '地点总数' },
          { n: pins.filter(p => p.status === 'visited').length, label: '已到访' },
          { n: pins.filter(p => p.status === 'watchlist').length, label: '想去清单' },
        ].map(({ n, label }) => (
          <div key={label}>
            <div className="font-serif text-[22px] font-bold text-[var(--coral)] leading-none">{n}</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em]
              text-[var(--muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
```

- [ ] **Step 4.2: Update `components/MapPage.tsx`**

Add `filterTag` state and `onUpdatePinTags` handler, pass them to Sidebar:

```tsx
// Add new state after existing state declarations:
const [filterTag, setFilterTag] = useState<string | null>(null)

// Add new callback after handleSidebarSelect:
const handleUpdatePinTags = useCallback(async (pinId: string, tags: string[]) => {
  const res = await fetch(`/api/pins/${pinId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags }),
  })
  if (res.ok) {
    const updated = await res.json()
    setPins(prev => prev.map(p => p.id === pinId ? updated : p))
  }
}, [])

// Update visiblePins to also filter by tag:
const visiblePins = pins.filter(p => {
  const matchesStatus = filter === 'all' || p.status === filter
  const matchesTag = filterTag === null || (p.tags ?? []).includes(filterTag)
  return matchesStatus && matchesTag
})

// Update <Sidebar> JSX to pass new props:
<Sidebar
  pins={pins}
  filterStatus={filter}
  filterTag={filterTag}
  selectedId={selectedId}
  onSelect={handleSidebarSelect}
  onTagFilter={setFilterTag}
  onUpdatePinTags={handleUpdatePinTags}
/>
```

- [ ] **Step 4.3: Verify TypeScript**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer && npx tsc --noEmit 2>&1
```
Expected: 0 errors.

- [ ] **Step 4.4: Manual test**

1. Open `localhost:3000`
2. Click a pin in sidebar → tag editor appears at bottom of sidebar
3. Type "育儿" → press Enter → tag appears on pin
4. Tag chip appears in the tag filter area at top of pin list
5. Click "育儿" chip → only pins with that tag show
6. Click "全部标签" → all pins show again
7. Click × on a tag → tag removed, Supabase updated

- [ ] **Step 4.5: Commit**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
git add components/Sidebar.tsx components/MapPage.tsx
git commit -m "feat: tag filter chips + inline tag editor in sidebar"
```

---

## Task 5: Push to GitHub

- [ ] **Step 5.1: Push**
```bash
cd /Users/sha/Code/AI-code-26/4-Pinfarer-travel/pinfarer
git push origin main
```

---

## Self-Review

| Requirement | Task | Status |
|-------------|------|--------|
| 一键全部设为想去/梦想/已到访 | Task 3 | ✓ |
| 批量打标签（导入时）| Task 3 | ✓ |
| 标签存储在 pins.tags text[] | Task 1 | ✓ |
| PATCH API 更新标签 | Task 2 | ✓ |
| 侧边栏标签 filter chips | Task 4 | ✓ |
| 选中 pin 后内联编辑标签 | Task 4 | ✓ |
| 标签同步到 Supabase | Task 2 + 4 | ✓ |
| 地图 visiblePins 按标签筛选 | Task 4 | ✓ |
