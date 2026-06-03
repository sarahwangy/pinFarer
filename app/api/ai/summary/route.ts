import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { detectPlaceType } from '@/lib/place-type'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CITY_PLACE_DATA_SCHEMA = `{
  "type": "city",
  "population": "<number with unit, e.g. '5.1 million' or '850,000'>",
  "language": "<primary language name>",
  "language_is_english": <true|false>,
  "currency": "<currency name and code, e.g. 'Australian Dollar (AUD)'>",
  "timezone": "<timezone name and offset, e.g. 'AEST (UTC+10)'>",
  "climate": "<one phrase, e.g. 'Temperate oceanic'>",
  "best_season": "<e.g. 'March–May, September–November'>",
  "food_culture": "<2-3 sentences about local food and dining culture>",
  "notable_animals": ["<animal 1>", "<animal 2>", "<animal 3>"],
  "visa_required_cn": <true|false — whether Chinese passport needs a visa>,
  "visa_note": "<one sentence about visa situation for Chinese travelers>",
  "safety_level": "<'low'|'medium'|'high'>",
  "safety_note": "<one sentence>"
}`

const PROPERTY_PLACE_DATA_SCHEMA = `{
  "type": "property",
  "council": "<local council name>",
  "primary_school": "<nearest public primary school name>",
  "secondary_school": "<nearest public secondary school name>",
  "transport_score": "<e.g. '8/10'>",
  "transport_note": "<one sentence about public transport options>",
  "cbd_distance": "<e.g. '10km, ~20 min by train'>",
  "median_price_range": "<e.g. 'AUD 1.2M–1.6M (houses), AUD 550K–750K (apartments)'>",
  "nearby_amenities": ["<amenity 1>", "<amenity 2>", "<amenity 3>"]
}`

export async function POST(request: Request) {
  const { name, country } = await request.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const placeType = detectPlaceType(name)
  const schema = placeType === 'property' ? PROPERTY_PLACE_DATA_SCHEMA : CITY_PLACE_DATA_SCHEMA

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are writing about: ${name}${country ? `, ${country}` : ''}.

Return a JSON object with exactly two keys: "summary" and "place_data".

"summary": A 3-paragraph travel/place introduction. Tone: inspiring and informative like Lonely Planet. 150-200 words. No headings.

"place_data": Fill in this exact schema with real, accurate data:
${schema}

Return only valid JSON. No markdown, no code fences, no extra text.`,
    }],
  })

  try {
    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) throw new Error('unexpected shape')
    return NextResponse.json({
      summary: parsed.summary ?? '',
      place_data: parsed.place_data ?? null,
    })
  } catch {
    // JSON parse failed — return summary as plain text, no place_data
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ summary: text, place_data: null })
  }
}
