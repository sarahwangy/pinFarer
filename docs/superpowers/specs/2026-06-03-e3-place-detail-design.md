# E3 Place Detail Page — Design Spec

## Overview

Full-featured place detail page at `/place/[id]`. Magazine-cover aesthetic: hero map + info cards. All 7 E3 tickets in scope.

## Layout

```
/place/[id]
│
├── Navbar (← 返回地图)
│
├── Hero (full-width, ~280px)
│   ├── Mini Mapbox map — single pin, no controls, not interactive
│   └── Overlay: place name (Fraunces large) + country + status badge
│
├── Info Grid (2 columns)
│   ├── Source type chip (YouTube / 书籍 / 小红书 / Unknown...)
│   ├── Source URL (shown only if present, clickable)
│   ├── Tags chips
│   └── Coordinates (lat/lng)
│
├── Status switcher card
│   └── 3 buttons: 已到访 / 想去 / 梦想 — current status highlighted
│
├── Notes card
│   ├── View mode: text + edit button
│   └── Edit mode: textarea + save / cancel
│
├── AI Summary card
│   ├── Has content: display text
│   └── No content: "✦ 生成介绍" button → loading → display result
│
└── Nearby places (same country, max 3, horizontal cards)
```

## Architecture

**Page component** (`app/place/[id]/page.tsx`): Server Component. Fetches pin + nearby pins server-side. Passes data to client sub-components.

**Sub-components** (all Client Components for interactivity):
- `PlaceHero` — mini Mapbox map (dynamically imported, ssr:false) + name overlay
- `PlaceNotes` — view/edit toggle, PATCH on save
- `PlaceAISummary` — generate button + streaming display, PATCH on save
- `PlaceNearby` — static display of nearby pin cards

**API routes:**
- `PATCH /api/pins/[id]` — already exists, handles status/notes/ai_summary/tags updates
- `POST /api/ai/summary` — new, calls Claude API, returns generated text

## Tickets

| ID | Feature | Priority |
|----|---------|----------|
| E3-01 | Hero layout + info grid | P0 |
| E3-02 | Source type chip | P0 |
| E3-03 | Source URL link | P0 |
| E3-04 | Notes inline edit | P1 |
| E3-05 | AI summary generation | P1 |
| E3-06 | Nearby places | P1 |
| E3-07 | Status switcher | P1 |

## AI Summary (E3-05)

- Model: `claude-sonnet-4-5`
- Style: Lonely Planet travel guide — history, highlights, best time to visit
- System prompt: "You are a travel writer for Lonely Planet. Write a 3-paragraph introduction to {place name}, {country}. Cover: what makes it special, key highlights, best time to visit. Tone: inspiring, informative, 150-200 words."
- Result stored in `pins.ai_summary`, shown permanently after first generation
- Loading state: animated dots while waiting

## Design Tokens

Consistent with existing system:
- `--sand` / `--cream` backgrounds
- `--coral` for CTAs and active states
- `--ink` for text
- Fraunces serif for headings
- DM Sans for body

## Navigation

- Pin click on map → navigate to `/place/[id]` (currently commented out in MapPage, enable as part of E3)
- Back button → `← 返回地图` → `router.back()` or `/`
