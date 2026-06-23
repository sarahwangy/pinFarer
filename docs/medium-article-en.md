# I Built an AI Travel Map with Claude + Mapbox — and Vibe Coded the Whole Thing

## When your travel wishlist lives in five different apps, you build a sixth one

I have a problem that I suspect a lot of travel-obsessed people share: I save places everywhere. A coastal village in the Faroe Islands from a YouTube video. A ramen shop in Osaka from a WeChat message. A hiking trail in Patagonia from a blog post I read at 11pm. None of these live in the same place. Most of them I forget about entirely.

I wanted one map where I could pin every destination I'd visited, was actively planning, or just dreamed about — and when I actually went to plan a trip, I wanted AI to read my pins and build a real itinerary, not a generic "Top 10 things to do in Tokyo" response.

That's Pinfarer. [Live demo → pinfarer.vercel.app](https://pinfarer.vercel.app) | [GitHub → github.com/sarahwangy/pinFarer](https://github.com/sarahwangy/pinFarer)

I built this entirely using vibe coding — working with Claude Code as an AI development partner, using structured skills that turn natural language into real software. I'll explain what that looks like in practice below.

---

## What Is Pinfarer?

Pinfarer is a personal travel map and AI trip planner. You pin destinations in one of three states — **Visited**, **Watchlist**, or **Dream** — on a real globe (not a flat map). Each pin gets an AI-generated place description, city data, and optionally property data. When you're ready to plan a trip, an AI itinerary planner reads your saved pins and generates a personalized day-by-day schedule.

Here's how data flows through the app:

```
User clicks globe
      ↓
Mapbox GL JS (globe projection + fly-to animation)
      ↓
Pin saved → POST /api/pins → Supabase (PostgreSQL + JSONB)
      ↓
Place detail page loads
      ↓
GET /api/ai/summary → Claude Sonnet 4.6
      ↓
AI-generated place intro + city data + property data
      ↓
GET /api/pixabay → Pixabay (place hero image)
      ↓
Rendered in place detail page
      ↓
AI Trip Planner: user selects pins → POST /api/ai/itinerary → Claude → day-by-day plan + Mapbox route overlay
```

---

## The Problem I Was Solving

I've had a Google Maps "Starred Places" list for years. It has hundreds of pins. The problem: every pin looks identical. There's no distinction between "I actively want to go here in six months" and "I thought this looked cool once." There's no data about the place beyond a name and coordinates. And when I try to plan an actual trip, I have to open Google Maps, a browser, a notes app, and a spreadsheet simultaneously.

More personally: I had saved places scattered across Google Maps, browser bookmarks, WeChat collections, and Xiaohongshu likes. They represented real curiosity and real intent. They were just invisible to me because they were fragmented.

I wanted a single tool that:
1. Respects the difference between "visited," "planning," and "dreaming"
2. Automatically provides useful information about a place the moment you pin it
3. Can take your saved pins and turn them into a real trip plan

That's the product. Everything else — the globe, the dashboard, the KML import — came from trying to build that honestly.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server components + API routes in one project |
| Language | TypeScript 5 | Type safety for complex pin + itinerary data shapes |
| Map | Mapbox GL JS (globe projection) | True sphere rendering, smooth fly-to animation |
| AI | Anthropic Claude Sonnet 4.6 | Structured data extraction + natural language generation |
| Database | Supabase (PostgreSQL + JSONB) | Flexible schema for place_data; free tier generous |
| Images | Pixabay API (server-side proxy) | Free, no attribution watermarks in UI |
| Auth | NextAuth (Google OAuth) | Fastest path to user-scoped pins |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent component library |
| Deploy | Vercel | Zero-config Next.js hosting |

---

## APIs Used

### Anthropic Claude Sonnet 4.6 — the brain of the app

Claude does three distinct jobs in Pinfarer, each requiring different prompt design.

**Job 1: Place introduction**
When you pin a location, a short call to `/api/ai/summary` fetches a 2-3 sentence introduction to the place. The prompt passes the place name and country, and asks Claude to write something evocative and informative — not a Wikipedia summary, but the kind of thing you'd tell a friend.

**Job 2: Structured city data extraction**
The place detail page has a "City Data" tab: population, official language, currency, climate description, food culture highlights, visa requirements for Australian passport holders, safety level (1-5), and notable wildlife. All of this is Claude-generated via a single API call with a strict JSON schema in the system prompt.

The key technique here is **structured output via system prompt constraints**. Instead of asking Claude to "describe the city," I ask it to return a specific JSON object. Every field has a defined type. This makes the response directly renderable without a parsing step.

```typescript
// app/api/ai/summary/route.ts
const systemPrompt = `You are a travel data assistant. 
Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "intro": "string (2-3 sentences, evocative and informative)",
  "cityData": {
    "population": "string (e.g. '3.7 million')",
    "language": "string",
    "currency": "string (code + name)",
    "climate": "string (2 sentences)",
    "food": "string (2-3 sentences on local food culture)",
    "visa": "string (for Australian passport holders)",
    "safety": number (1-5, where 5 is safest),
    "animals": "string (notable wildlife or 'N/A')"
  }
}`

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 1024,
  system: systemPrompt,
  messages: [{ role: 'user', content: `Place: ${name}, ${country}` }]
})
```

**Job 3: AI Trip Planner**
This is the most complex prompt. Claude receives: a list of selected pins (name, country, lat/lng, the user's own notes), trip length in days, travel style (relaxed / balanced / packed), and preference tags (food-focused, outdoor, cultural, etc.). It returns a full itinerary as a structured JSON object with day objects, each containing time-slotted activities.

The insight that makes this useful: Claude knows which places the user has *actually saved*, meaning they've expressed genuine intent. The itinerary isn't generic — it's built around places you already care about.

---

### Mapbox GL JS — globe, not flat map

The decision to use globe projection instead of a standard Mercator flat map was one of the earliest design calls, and it changed the feel of the entire product.

Mapbox supports `projection: 'globe'` in the map style config. On a globe, your pins exist in real spatial relationship to each other. When you click a pin, the camera rotates and flies to it. This interaction — watching the Earth spin to your destination — makes the emotional experience of the app completely different from a flat map.

```typescript
// components/Map.tsx
const map = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  projection: 'globe',           // ← the key setting
  center: [0, 20],
  zoom: 1.8,
  antialias: true,
})

// Fly to a pin with smooth animation
map.flyTo({
  center: [pin.lng, pin.lat],
  zoom: 10,
  duration: 2000,
  essential: true,
})
```

Each pin gets a custom HTML marker colored by status: green for Visited, amber for Watchlist, purple for Dream. The markers use CSS transitions so they pulse gently on hover.

**Geocoding** is handled via a server-side proxy to Mapbox's geocoding API. When a user types a place name to add a pin, the app converts the name to coordinates — and importantly, does this on the server side to keep the Mapbox token out of client-side requests beyond what's strictly necessary.

---

### Supabase — PostgreSQL with flexible JSONB

The pin schema uses a `place_data` column of type `jsonb` to store AI-generated city and property data. This was a deliberate design choice: city data for Tokyo looks very different from property data for a suburb of Melbourne. Rather than creating separate tables or nullable columns for every possible field, JSONB lets each pin carry exactly the data structure it needs.

```sql
create table if not exists pins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  name        text not null,
  country     text,
  region      text,
  lat         double precision not null,
  lng         double precision not null,
  status      text not null default 'watchlist',
  source      text not null default 'unknown',
  source_url  text,
  notes       text,
  ai_summary  text,
  place_data  jsonb,          -- flexible: city data OR property data
  tags        text[] default '{}',
  created_at  timestamptz default now()
);
```

The `source` field tracks where the pin came from: YouTube, WeChat, Xiaohongshu, manual, or KML import. This feeds the dashboard's discovery source chart.

---

### Pixabay — place photos without watermarks

Every place detail page has a hero image. Mapbox satellite imagery gives a precise aerial view, and Pixabay provides a fallback photo that shows the place at ground level. The Pixabay API key is proxied server-side — the client never sees it.

```typescript
// app/api/pixabay/route.ts
const url = `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=5&safesearch=true`
const res = await fetch(url)
const data = await res.json()
return NextResponse.json({ url: data.hits[0]?.largeImageURL ?? null })
```

---

## AI Skills and Techniques

### 1. Structured Output via System Prompt Constraints

The most reliable way to get consistently machine-readable data from Claude is to specify the exact JSON schema in the system prompt and add explicit constraints: "Return ONLY valid JSON. No markdown. No explanation." This eliminates the need for response parsing logic and makes the output directly usable in TypeScript with a type assertion.

When the schema is complex (like the itinerary with nested day/activity objects), I define the full structure in the system prompt with field names, types, and example values. Claude is very good at following this faithfully.

```typescript
// Itinerary prompt structure
const systemPrompt = `Return ONLY valid JSON:
{
  "title": "string",
  "days": [
    {
      "day": number,
      "date": "string",
      "location": "string",
      "activities": [
        {
          "time": "string (e.g. '9:00 AM')",
          "activity": "string",
          "duration": "string",
          "tips": "string"
        }
      ]
    }
  ],
  "travelTips": ["string"]
}`
```

### 2. Context-Aware Personalization

The AI trip planner prompt includes the user's actual saved pins — not just destination names, but the user's own notes about each place. This means Claude has genuine context: "The user has visited Kyoto and noted it was crowded in spring, wants to go to Osaka, and dreams about Hokkaido." The resulting itinerary reflects this history, not a generic travel template.

```typescript
const pinsContext = selectedPins.map(pin => 
  `- ${pin.name} (${pin.country}) [${pin.status}]${pin.notes ? `: "${pin.notes}"` : ''}`
).join('\n')

const userPrompt = `Plan a ${days}-day ${travelStyle} trip.
My saved destinations:
${pinsContext}

Travel preferences: ${tags.join(', ')}
Trip focus: ${tripFocus}`
```

### 3. Place Type Detection

Some places are cities (Tokyo, Paris, Melbourne) and some are specific neighborhoods or suburbs people consider for relocation (Fitzroy, Bondi, Notting Hill). The app detects which type of place is being viewed and shows different AI-generated data accordingly.

City view → population, language, currency, climate, food, visa, safety, wildlife  
Property/suburb view → council area, school catchment, transport score, CBD distance, median price range

This detection lives in `lib/place-type.ts` and uses a combination of the place's `region` field and a simple heuristic based on known suburb name patterns.

### 4. Streaming vs. One-Shot API Calls

For short place introductions (2-3 sentences), I use a standard non-streaming Claude API call. The latency is under a second and streaming would add complexity for no UX benefit.

For the AI Trip Planner, which generates 3-14 days of content, I use streaming to show the itinerary appearing in real time. The UI shows a skeleton state, then the itinerary content streams in day by day. This makes a 5-second generation feel interactive instead of frozen.

```typescript
// app/api/ai/itinerary/route.ts — streaming response
const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }]
})

return new Response(
  new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    }
  }),
  { headers: { 'Content-Type': 'text/event-stream' } }
)
```

### 5. API Key Security via Server-Side Proxies

All third-party API keys (Anthropic, Pixabay, Mapbox geocoding) are called from Next.js API routes, never from the client. This means:
- `ANTHROPIC_API_KEY` never appears in browser network requests
- `PIXABAY_API_KEY` is entirely server-side
- Only `NEXT_PUBLIC_MAPBOX_TOKEN` is exposed to the client, which is required for the map to render — but it's a public read-only token with domain restrictions set in Mapbox

This is the standard pattern for full-stack Next.js apps that call paid APIs. It protects keys and keeps rate-limit responsibility on the server.

### 6. KML Parsing — Meeting Users Where Their Data Lives

Google Takeout exports saved places as KML files. KML is XML-based and contains `<Placemark>` elements with name, description, and `<coordinates>`. I wrote a parser in `lib/kml-parser.ts` that:

1. Reads the raw KML string
2. Finds all `<Placemark>` elements via regex
3. Extracts name and coordinates
4. Returns an array of `{ name, lat, lng }` objects

The import flow then lets users preview all parsed places, assign a status to each (Visited / Watchlist / Dream), and import everything in one click. This turns years of Google Maps saves into Pinfarer pins instantly.

```typescript
// lib/kml-parser.ts
export function parseKML(kmlString: string): ParsedPlace[] {
  const placemarks = kmlString.match(/<Placemark[\s\S]*?<\/Placemark>/g) ?? []
  
  return placemarks.map(pm => {
    const name = pm.match(/<name>(.*?)<\/name>/)?.[1] ?? 'Unknown'
    const coords = pm.match(/<coordinates>(.*?)<\/coordinates>/)?.[1]?.trim()
    const [lng, lat] = coords?.split(',').map(Number) ?? [0, 0]
    return { name, lat, lng }
  }).filter(p => p.lat !== 0 && p.lng !== 0)
}
```

---

## The Vibe Coding Process

I built Pinfarer using Claude Code — Anthropic's CLI tool — as my primary development environment. But I didn't just prompt Claude freeform. I used a set of structured skills that enforce a proper software development workflow.

**`superpowers:brainstorming`** — Before touching any code for a new feature, this skill explores intent, surfaces edge cases, and proposes multiple approaches. For the AI Trip Planner, brainstorming revealed a decision I hadn't thought through: should the itinerary be generated all at once or day by day? We landed on all-at-once with streaming display, which gave the best UX.

**`superpowers:writing-plans`** — After brainstorming, this skill produces a concrete implementation plan: file paths, function signatures, data shapes, the order of changes. For the KML import feature, the plan covered `lib/kml-parser.ts`, `app/import/page.tsx`, the API route for bulk pin creation, and the UI preview component — all specified before I wrote a line.

**`superpowers:subagent-driven-development`** — Each task in the plan is executed by a fresh AI agent with the spec as context. This keeps individual tasks focused. After each task, there's a quality review pass before moving to the next.

**`superpowers:systematic-debugging`** — When the Mapbox globe stopped rendering after I changed the map style, this skill walked through the root-cause process: check the style URL, check the projection setting, check the container div height (it was 0px — the container had no height set). Not just "fix the symptom," but understand why it broke.

**`superpowers:verification-before-completion`** — Before marking any feature done, this skill checks actual behavior against the spec: does the itinerary actually render? Does the KML import handle files with missing coordinates gracefully? Does the streaming work on a slow connection? These questions get answered against the running app, not assumed.

**`superpowers:frontend-design`** — For the dashboard and place detail pages, I used this skill to generate HTML mockups that could be previewed in a browser before writing any React. This let me validate the layout and information hierarchy before writing component code — and it caught two layout decisions I would have had to refactor later.

**Concrete example — building the AI Trip Planner:**

1. `brainstorming`: What inputs does the planner need? How should the map and itinerary panel be laid out? What happens if the user selects pins from five different countries?
2. `writing-plans`: Plan specifies `app/ai/page.tsx` (selection UI + itinerary display), `app/api/ai/itinerary/route.ts` (streaming Claude call), and `types/itinerary.ts` (TypeScript types for the response shape)
3. `frontend-design`: HTML mockup of the two-panel layout (pin selector left, itinerary + map right), previewed in browser
4. `subagent-driven-development`: Three agents — one for the API route, one for the selection UI, one for the itinerary display with streaming
5. `verification-before-completion`: Tested with 3-day trip, 14-day trip, single-pin selection, and pins across different continents

---

## App Pages

### Globe Map (Home)

The main view is the globe — a full-viewport Mapbox satellite map in sphere projection. Your pins appear as colored markers: green (Visited), amber (Watchlist), purple (Dream). A sidebar on the left lists all pins with filter controls for status and tags.

Clicking a pin triggers `map.flyTo()` — the globe rotates smoothly to that location. Clicking a marker opens a mini-popup with the place name and status, and a button to open the full place detail page.

### Place Detail Page

Each place has its own page at `/place/[id]`. The structure:

- **Hero image**: Mapbox satellite aerial + Pixabay ground-level photo
- **AI introduction**: 2-3 sentences about the place, generated on first load
- **Status selector**: change Visited / Watchlist / Dream inline
- **Personal notes**: free-text, auto-saved with debounce
- **City Data tab**: population, language, currency, climate, food, visa, safety, wildlife
- **Property Data tab**: council, schools, transport score, CBD distance, median price
- **Nearby places**: other pins in the same country

City data and property data are generated by Claude on first visit and cached in the `place_data` JSONB column. Subsequent visits read from the database.

### Dashboard

The dashboard gives a high-level view of your travel map:

- **KPI cards**: total pins, visited count, watchlist count, dream count
- **Donut chart** (SVG, custom built): status distribution as percentages
- **Bar chart** (SVG, custom built): discovery source breakdown — YouTube, WeChat, Xiaohongshu, manual add, KML import
- **Country ranked list**: countries with the most pins, with progress bars
- **Tags cloud**: all tags across all pins

Both charts are built as SVG elements in React — no chart library. This was a deliberate choice to keep bundle size down and to understand how SVG rendering actually works.

### AI Trip Planner

The trip planner is a two-panel page. Left panel: pin selector (checkbox list of all saved pins), trip configuration (days, style, preference tags). Right panel: the generated itinerary and a live Mapbox map showing selected pins connected by a dashed route line.

When generation starts, the left panel locks and the right panel shows a streaming response — you see the itinerary appear day by day in real time. The route line on the map updates to show the selected pins' geographic relationship.

### KML Import

A drag-and-drop zone for Google Takeout KML files. After dropping a file:
1. The parser runs client-side and shows a preview list of all detected places
2. Each row shows name and coordinates with a status dropdown (defaults to Watchlist)
3. "Import All" sends the batch to the API and creates all pins at once
4. The user is redirected to the map with all new pins visible

---

## Example: How the AI Trip Planner Works End to End

Here's what actually happens when a user generates an itinerary:

**Step 1 — Pin selection**
The user checks boxes next to saved pins. Say they select: Kyoto (Visited), Osaka (Watchlist), and Nara (Watchlist). Their notes for Kyoto say "loved Arashiyama, avoid peak cherry blossom season."

**Step 2 — Trip configuration**
5 days. Travel style: Balanced. Preference tags: Cultural, Food.

**Step 3 — API call**
`POST /api/ai/itinerary` fires with the pin data and config. The system prompt instructs Claude to return a specific JSON structure. The user message includes the pins with their statuses and notes.

**Step 4 — Streaming response**
Claude returns the itinerary as a JSON string. The API route streams this back to the client using `ReadableStream`. The frontend reads chunks and displays them progressively.

**Step 5 — Rendering**
Once the stream completes, the JSON is parsed into `ItineraryDay[]` objects. Each day renders as a card with time-slotted activities. The Mapbox map shows the three pins with a dashed line connecting them in sequence.

**Step 6 — Why it's personal**
The generated plan doesn't just route you through Kyoto → Nara → Osaka generically. It picks up that the user found Kyoto crowded before, suggests they go early season or late season, incorporates their food preference into restaurant suggestions, and structures the Osaka day around food experiences since Osaka's culinary reputation matches what the user said they care about.

---

## What I Learned

**Globe projection is not just a visual choice.** Choosing sphere over flat map changed the emotional register of the entire product. A flat map is a database view. A globe is a travel fantasy. The same pin, on the same data — but one makes you feel like a data manager and the other makes you feel like an explorer. This was the most important design decision in the project.

**JSONB is underrated for flexible schemas.** I was tempted to create separate tables for city data and property data. Instead, a single JSONB column handles both, plus any future data shape I add. The trade-off is that you lose SQL-level field validation, but for AI-generated content that evolves, flexibility matters more than rigidity.

**Streaming changes perceived performance.** A 5-second Claude response feels like waiting. A 5-second Claude response that streams in real-time feels like it's working. The actual latency is identical — but one feels slow and the other feels fast. For any generative AI feature that takes more than 2 seconds, streaming is basically required.

**KML import is a moat.** Adding Google Takeout import turned Pinfarer from "start from scratch" into "migrate your existing data here." Users with hundreds of Google Maps saves can import them in under a minute. This single feature changes the product's adoption story completely.

**Meeting users where their data lives is a product principle.** Don't ask people to start over. Google Maps has years of user location data. Honoring that — by letting people bring it with them — is a form of respect for their time and history.

**Vibe coding is real software engineering, done faster.** The structured skills — brainstorming before coding, writing plans before implementing, verifying before marking done — aren't shortcuts around engineering rigor. They're the engineering workflow, compressed and AI-assisted. I caught design problems in the brainstorm that would have cost hours to refactor. I caught bugs in verification that I would have shipped to production. The skills impose discipline, not replace it.

---

*Pinfarer is live at [pinfarer.vercel.app](https://pinfarer.vercel.app). The full source is at [github.com/sarahwangy/pinFarer](https://github.com/sarahwangy/pinFarer). If you've got a Google Maps KML export and want to try the import, it takes about thirty seconds.*
