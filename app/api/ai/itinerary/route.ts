import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Itinerary } from '@/types/itinerary'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// In-memory cache: key = "destination|days|style", value = parsed Itinerary
// Lives as long as the server process — cleared on restart or redeploy
const cache = new Map<string, Itinerary>()

export async function POST(request: Request) {
  const { destination, days, style, tags, pins } = await request.json()

  if (!destination) {
    return NextResponse.json({ error: 'destination required' }, { status: 400 })
  }

  // Return cached result for same destination+days+style (saves API cost during testing)
  const cacheKey = `${destination.trim().toLowerCase()}|${days}|${style}`
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log('[itinerary] cache hit:', cacheKey)
    return NextResponse.json(cached)
  }

  const pinList = ((pins ?? []) as { name: string; country: string | null }[])
    .map(p => `- ${p.name}${p.country ? ` (${p.country})` : ''}`)
    .join('\n')

  const tagList = ((tags ?? []) as string[]).join('、') || '无特定偏好'

  const prompt = `You are a professional travel planner. Create a detailed ${days}-day itinerary for: ${destination}.

User's saved places to incorporate (use as many as relevant):
${pinList || '(no saved places selected)'}

Travel style: ${style}
Preference tags: ${tagList}

Return ONLY a valid JSON object matching this exact schema (no markdown, no code fences):
{
  "title": "<City> ${days} 日行程",
  "totalDays": ${days},
  "pinCount": <number of saved places actually used>,
  "style": "${style}",
  "quotes": [
    {"text": "<quote 1 — under 20 words, real person, original language>", "author": "<Full name>"},
    {"text": "<quote 2 — different person, same rules>", "author": "<Full name>"},
    {"text": "<quote 3 — different person, same rules>", "author": "<Full name>"}
  ],
  "days": [
    {
      "day": "Day 1",
      "title": "<theme for this day in Chinese, e.g. '抵达 · 感受城市节奏'>",
      "tag": "<area or category tag, e.g. 'CBD 核心' or '📍 你的收藏'>",
      "activities": [
        {
          "time": "<HH:MM or 'Day N'>",
          "name": "<activity name — include meal type or place name>",
          "desc": "<1-2 sentence description in Chinese>",
          "color": "<one of: coral, mint, amber, lavender>"
        }
      ]
    }
  ]
}

Rules:
- Write all "title", "tag", "name", "desc" fields in Chinese
- Each day should have 3-5 activities
- Assign colors meaningfully: coral=dining/food, mint=nature/visited, amber=shopping/exploration, lavender=culture/art
- If a saved place is used, mention it by name in the activity
- For trips > 5 days, you may group multiple days in one block (e.g. "Day 6-7")
- The quote must be a REAL quote from a REAL person — no invented quotes`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'

  // Extract JSON: find the first { and last } to handle any surrounding text or code fences
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  const jsonStr = start !== -1 && end > start ? raw.slice(start, end + 1) : raw

  // Sanitize: Claude sometimes puts literal newlines inside JSON string values (invalid JSON).
  // Replacing all literal \r and \n with a space is safe — JSON structural whitespace is ignored,
  // and newlines inside string values become spaces which is acceptable.
  const sanitized = jsonStr.replace(/\r?\n/g, ' ')

  try {
    const parsed = JSON.parse(sanitized) as Itinerary
    if (!parsed.days || !Array.isArray(parsed.days)) throw new Error('invalid shape')
    cache.set(cacheKey, parsed)   // store so next identical request is free
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[itinerary] parse error:', err, '\nraw:', raw.slice(0, 500))
    return NextResponse.json({ error: 'Failed to parse itinerary' }, { status: 500 })
  }
}
