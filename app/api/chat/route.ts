import { streamText, tool, convertToModelMessages, UIMessage, generateObject, smoothStream } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { z } from 'zod'
import { parseStrudelSnippets, StrudelSnippetsSchema } from '@/lib/strudel-generation'
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
  const keyData = JSON.stringify({ messages, model })
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

const generateStrudelCodeTool = tool({
  description: 'Generate a single Strudel code snippet based on a description. The description can include mood, genre, tempo, or style.',
  inputSchema: z.object({
    description: z.string().describe('The description or style of Strudel snippets to generate (e.g., "dreamy lo-fi beat at 90 bpm")'),
  }),
  execute: async ({ description }) => {
    const prompt = `Generate Strudel code snippets that fit the following description: ${description}`
    const fullPrompt = `Generate 1 Strudel code snippet based on the user's request. The snippet should be valid Strudel code and playable as-is. Output a single Strudel expression (no variable assignments, no play(), no loop, no comments). Use Strudel built-ins like s(), note(), stack(), fast(), slow(), gain(), lpf(), hpf(), room(), size(), pan(); do not use synth or any undefined globals.\n\nUser request: ${prompt}`

    const toolCacheKey = createHash('sha256').update(fullPrompt).digest('hex')

    try {
      const cached = await convex.query(api.cache.getToolCache, { cacheKey: toolCacheKey })

      if (cached) {
        console.log('Tool cache HIT for description:', description)
        const snippets = parseStrudelSnippets(cached)
        return {
          success: true,
          snippets,
          message: `Generated ${snippets.length} Strudel snippets.`,
        }
      }
    } catch (error) {
      console.error('Error getting tool cache:', error)
    }

    try {
      const { object } = await generateObject({
        model: openaiProvider('gpt-5.2'),
        schema: StrudelSnippetsSchema,
        prompt: fullPrompt,
      })

      if (!object || !object.snippets) {
        return { error: 'Error while generating Strudel snippets.' }
      }

      try {
        await convex.mutation(api.cache.setToolCache, {
          cacheKey: toolCacheKey,
          result: object,
        })
        console.log('Tool cache MISS - cached result for description:', description)
      } catch (error) {
        console.error('Error setting tool cache:', error)
      }

      const snippets = parseStrudelSnippets(object)

      return {
        success: true,
        snippets,
        message: `Generated ${snippets.length} Strudel snippets.`,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error while generating Strudel snippets.',
      }
    }
  },
})

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
    const systemPrompt = `You are a helpful assistant that generates Strudel code based on user requests.
Use the Strudel guide below as the source of truth for syntax and capabilities.
Study the examples carefully to understand the style, structure, and patterns of good Strudel code.

Strudel guide:
${strudelGuide}

${strudelExamples}${currentCodeContext}

When users ask for Strudel code, you should:
1. First, provide a brief response acknowledging their request and explaining what you are about to do.
2. Then use the generateStrudelCode tool to create the snippets. The description should include any relevant details like mood, genre, tempo, or style mentioned by the user. If the user is asking to modify existing code, include the full current code and the specific changes requested.
3. After the tool completes, provide a detailed explanation of what was created and how the Strudel code is structured.

If you are generating any Strudel code, you must call the generateStrudelCode tool and never output Strudel code directly without a tool call.
Always include text before and after calling the tool to create a natural conversation flow.`

    const result = streamText({
      model: openaiProvider(model),
      messages: await convertToModelMessages(messages),
      system: systemPrompt,
      tools: {
        generateStrudelCode: generateStrudelCodeTool,
      },
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
