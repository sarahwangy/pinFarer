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
