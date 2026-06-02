# Pinfarer Week 1 Design — Map Homepage + KML Import

## Scope

Week 1 MVP: Epic 1 (init) + Epic 2 (map homepage) + Epic 6 (KML import).
Goal: live Vercel deployment with real pin data visible on an interactive map by end of week.

## Approach

Phased: init → map skeleton with mock data → KML import to populate real data → complete map UI with real data.
Rationale: visual feedback at every stage; no long "nothing visible" gaps.

## Phase 1 — Project Init (E1, ~half day)

- `npx create-next-app@14` with App Router + Tailwind CSS
- Global CSS variables (color tokens from PRD §1.4): `--sand`, `--cream`, `--ink`, `--deep-ocean`, `--coral`, `--gold`, `--forest`, `--mint`, `--amber`, `--lavender`, `--muted`
- Google Fonts: Fraunces (serif) + DM Sans (sans-serif)
- Supabase: create project, run SQL to create `pins` + `itineraries` tables (schema from PRD §1.5), enable RLS
- Mapbox: register account, get public token
- `.env.local`: `NEXT_PUBLIC_MAPBOX_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- GitHub repo + Vercel project (auto-deploy on push to main)

## Phase 2 — Map Skeleton (E2-01, E2-02, ~1 day)

- `/` page: full-viewport Mapbox GL JS map, `mapbox://styles/mapbox/dark-v11` base style, `--deep-ocean` background
- Mapbox loaded client-side only (`dynamic(() => import(...), { ssr: false })`)
- 3–5 hardcoded mock pins (one per status) to verify color rendering before real data exists
- Pin colors: visited=`#52B788`, watchlist=`#F4A261`, dream=`#9B89C4`
- Pin click → `router.push('/place/[id]')` (placeholder page)

## Phase 3 — KML Import (E6, ~1 day)

- `/import` page
- Drag-and-drop file upload (HTML5 + `react-dropzone` or native)
- KML parser: extract `<name>` + `<coordinates>` using DOMParser (client-side, no extra lib needed)
- Batch source-type selector (default: `unknown`)
- Preview table: parsed results, each row editable (status dropdown)
- Confirm → bulk insert into Supabase `pins` table via `supabase.from('pins').insert([...])`
- Success/error toast feedback

## Phase 4 — Map Complete (E2 remainder, ~1 day)

- Replace mock pins with live Supabase query (`supabase.from('pins').select('*')`)
- Right sidebar: pin list with status badges, fixed width ~320px
- Top filter chips: All / Visited / Watchlist / Dream — filters map markers + sidebar list
- Bottom stats bar: country count (distinct) + total pin count
- P1 additions: sidebar search (client-side filter by name) + hover tooltip (pin name + status)

## Data Flow

```
Supabase pins table
  → /api/pins (or direct client query)
    → MapPage state (pins[])
      → Mapbox markers (colored by status)
      → Sidebar list (filtered)
      → Stats bar (computed)
```

## File Structure

```
app/
  page.tsx              ← map homepage
  place/[id]/page.tsx   ← placeholder detail page
  import/page.tsx       ← KML import
  layout.tsx            ← fonts, global CSS
components/
  Map.tsx               ← Mapbox GL wrapper (client-only)
  Sidebar.tsx           ← pin list + search + filters
  StatsBar.tsx          ← bottom stats
  ImportTable.tsx       ← preview table for KML import
lib/
  supabase.ts           ← supabase client
  kml-parser.ts         ← KML → pin objects
```

## Out of Scope (Week 1)

- Auth (single-user, RLS can be permissive for now)
- Place detail page content (E3)
- Dashboard (E4)
- AI Agent (E5)
- Duplicate detection on import (E6-07, P2)
