import { streamText, convertToModelMessages, UIMessage, smoothStream } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { createHash } from 'crypto'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 30

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
let strudelGuideCache: string | null = null
let strudelExamplesCache: string | null = null

async function getStrudelGuide(): Promise<string> {
  if (strudelGuideCache) {
    return strudelGuideCache
  }
  const guidePath = path.join(process.cwd(), 'docs', 'strudel-code-guide.md')
  strudelGuideCache = await readFile(guidePath, 'utf8')
  return strudelGuideCache
}

async function getStrudelExamples(): Promise<string> {
  if (strudelExamplesCache) {
    return strudelExamplesCache
  }
  const examplesPath = path.join(process.cwd(), 'docs', 'examples.md')
  strudelExamplesCache = await readFile(examplesPath, 'utf8')
  return strudelExamplesCache
}

function generateCacheKey(messages: UIMessage[], model: string): string {
  const normalized = messages.map((m) => ({
    role: m.role,
    parts: m.parts?.map((p: any) => {
      if (p.type === 'text') return { type: 'text', text: p.text }
      return p
    }),
  }))
  const keyData = JSON.stringify({ messages: normalized, model })
  return createHash('sha256').update(keyData).digest('hex')
}

async function getCachedResponse(key: string): Promise<{ response: string; headers: Record<string, string> } | null> {
  try {
    return await convex.query(api.cache.getPromptCache, { cacheKey: key })
  } catch (error) {
    console.error('Error getting prompt cache:', error)
    return null
  }
}

async function setCachedResponse(key: string, response: string, headers: Record<string, string>): Promise<void> {
  try {
    await convex.mutation(api.cache.setPromptCache, {
      cacheKey: key,
      response,
      headers,
    })
  } catch (error) {
    console.error('Error setting prompt cache:', error)
  }
}

async function collectStreamForCache(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  const chunks: Uint8Array[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value)
    }
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message?.includes('terminated') || error.cause?.code === 'UND_ERR_SOCKET') {
      console.log('Stream terminated early, caching partial response')
    } else {
      throw error
    }
  } finally {
    try {
      reader.releaseLock()
    } catch (e) {
      // Ignore errors releasing lock
    }
  }

  if (chunks.length === 0) {
    throw new Error('No data collected from stream')
  }

  const combined = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }

  return decoder.decode(combined)
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = 'gpt-5.2',
      currentCode,
    }: {
      messages: UIMessage[]
      model?: string
      currentCode?: string
    } = await req.json()

    const cacheKey = generateCacheKey(messages, model)
    const cached = await getCachedResponse(cacheKey)

    if (cached) {
      console.log('Cache HIT for prompt request:', { cacheKey, model, messageCount: messages.length })
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(cached.response))
          controller.close()
        },
      })

      return new Response(stream, {
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
        },
      })
    }

    const [strudelGuide, strudelExamples] = await Promise.all([getStrudelGuide(), getStrudelExamples()])
    const currentCodeContext = currentCode
      ? `\n\nThe user currently has this Strudel code loaded. When they ask to edit or modify it, use this as the base and make the requested changes:\n\`\`\`strudel\n${currentCode}\n\`\`\``
      : ''
    const systemPrompt = `You are a helpful assistant that generates Strudel live-coding music patterns.
Use the Strudel guide below as the source of truth for syntax and capabilities.
Study the examples carefully to understand the style, structure, and patterns of good Strudel code.

Strudel guide:
${strudelGuide}

${strudelExamples}${currentCodeContext}

RESPONSE FORMAT — follow this order strictly for EVERY response that includes code:

1. FIRST, write 1-2 sentences acknowledging the user's request and briefly describing what you will create. This text MUST appear before any code.
2. THEN output the Strudel code in a single fenced code block with the language tag "strudel":

\`\`\`strudel
s("bd sd").fast(2)
\`\`\`

The code must be valid Strudel code, playable as-is. Output a single Strudel expression (no variable assignments, no play(), no loop, no comments). Use Strudel built-ins like s(), note(), stack(), fast(), slow(), gain(), lpf(), hpf(), room(), size(), pan(); do not use synth or any undefined globals.

3. AFTER the code block, explain what was created and how the Strudel code is structured.

IMPORTANT: Never start your response with a code block. Always lead with conversational text first. Output exactly one \`\`\`strudel code block per response. The code block streams directly into the user's live editor.`

    const result = streamText({
      model: openaiProvider(model),
      messages: await convertToModelMessages(messages),
      system: systemPrompt,
      experimental_transform: smoothStream({
        delayInMs: 15,
        chunking: 'word',
      }),
    })

    const streamResponse = result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
    })

    const stream = streamResponse.body
    if (!stream) {
      return streamResponse
    }

    const responseHeaders: Record<string, string> = {}
    streamResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const [userStream, cacheStream] = stream.tee()

    collectStreamForCache(cacheStream)
      .then(async (collectedResponse) => {
        if (collectedResponse && collectedResponse.length > 0) {
          await setCachedResponse(cacheKey, collectedResponse, responseHeaders)
          console.log('Cached prompt request:', { cacheKey, model, messageCount: messages.length })
        }
      })
      .catch((error) => {
        if (error.message !== 'No data collected from stream') {
          console.error('Error caching response:', error.message || error)
        }
      })

    return new Response(userStream, {
      headers: {
        ...streamResponse.headers,
        'X-Cache': 'MISS',
      },
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred while processing your request.',
        details: error.cause || undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
