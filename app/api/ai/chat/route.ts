import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Message { role: 'user' | 'assistant'; content: string }

export async function POST(request: Request) {
  const { destination, message, history } = await request.json()
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const messages: Message[] = [
    ...((history ?? []) as Message[]),
    { role: 'user', content: message },
  ]

  const reply = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are a friendly, knowledgeable travel assistant for Pinfarer, a personal travel map app.
The user is currently viewing a trip plan for: ${destination || 'an unknown destination'}.
Answer travel questions helpfully and concisely in the same language the user writes in (Chinese or English).
Keep answers under 150 words. Be warm and enthusiastic about travel.`,
    messages,
  })

  const text = reply.content[0].type === 'text' ? reply.content[0].text : ''
  return NextResponse.json({ reply: text })
}
