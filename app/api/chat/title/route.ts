import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const maxDuration = 10

export async function POST(req: Request) {
  try {
    const { prompt, code }: { prompt?: string; code?: string } = await req.json()
    const source = code?.trim() || prompt?.trim()

    if (!source) {
      return Response.json({ title: 'New chat' })
    }

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: code?.trim()
        ? `Generate a short, descriptive title (3-6 words max) for a Strudel live coding music pattern. Return ONLY the title, no quotes or punctuation at the end.

Strudel code:
${source}`
        : `Generate a short, descriptive title (3-6 words max) for a music generation chat that started with this prompt. Return ONLY the title, no quotes or punctuation at the end.

Prompt: ${source}`,
    })

    const title = text.trim().replace(/^["']|["']$/g, '') || 'New chat'
    return Response.json({ title })
  } catch (error) {
    console.error('Title generation error:', error)
    return Response.json({ title: 'New chat' })
  }
}
