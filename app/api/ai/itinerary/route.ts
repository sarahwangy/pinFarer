import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { Itinerary } from '@/types/itinerary'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const { destination, days, style, tags, pins } = await request.json()

  if (!destination) {
    return NextResponse.json({ error: 'destination required' }, { status: 400 })
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
- For trips > 5 days, you may group multiple days in one block (e.g. "Day 6-7")`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'

  try {
    const parsed = JSON.parse(raw) as Itinerary
    if (!parsed.days || !Array.isArray(parsed.days)) throw new Error('invalid shape')
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to parse itinerary', raw }, { status: 500 })
  }
}
