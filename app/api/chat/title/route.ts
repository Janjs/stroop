import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const maxDuration = 10

export async function POST(req: Request) {
  try {
    const { prompt }: { prompt: string } = await req.json()

    if (!prompt?.trim()) {
      return Response.json({ title: 'New Chat' })
    }

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Generate a short, descriptive title (3-6 words max) for a music generation chat that started with this prompt. Return ONLY the title, no quotes or punctuation at the end.

Prompt: ${prompt.trim()}`,
    })

    const title = text.trim().replace(/^["']|["']$/g, '') || 'New Chat'
    return Response.json({ title })
  } catch (error) {
    console.error('Title generation error:', error)
    return Response.json({ title: 'New Chat' })
  }
}
