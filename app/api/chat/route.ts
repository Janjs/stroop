import { streamText, convertToModelMessages, UIMessage, smoothStream } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { createHash } from 'crypto'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { DEFAULT_OPENAI_MODEL } from '@/lib/models'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 30

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
let strudelGuideCache: string | null = null
let strudelExamplesCache: string | null = null

function extractStrudelCodeFromText(text: string): string | null {
  const marker = '```strudel\n'
  const lastIdx = text.lastIndexOf(marker)
  if (lastIdx === -1) return null
  const codeStart = lastIdx + marker.length
  const remaining = text.substring(codeStart)
  const closingIdx = remaining.indexOf('```')
  const code = closingIdx !== -1 ? remaining.substring(0, closingIdx) : remaining
  return code.trim() || null
}

function getPreviousGenerationFromMessages(messages: UIMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message.role !== 'assistant') continue

    for (const part of message.parts ?? []) {
      if (part.type === 'text' && 'text' in part) {
        const code = extractStrudelCodeFromText(part.text)
        if (code) return code
      }
    }
  }

  return undefined
}

type RepairContext = {
  type: 'compile' | 'fix'
  error: string
  code: string
  originalRequest?: string
  attempt?: number
  maxAttempts?: number
}

type SelectionContext = {
  from: number
  to: number
  text: string
}

function buildSelectionContextBlock(selection: SelectionContext): string {
  return [
    '\n\nThe user has selected a specific part of their code in the editor.',
    'Apply their request ONLY to this selected region. Keep everything else in the code unchanged.',
    'Return the complete updated Strudel code (not just the selection).',
    '',
    'Selected code:',
    '```strudel',
    selection.text,
    '```',
  ].join('\n')
}

function buildRepairContextBlock(repair: RepairContext): string {
  const lines = [
    '\n\nThe generated Strudel code needs to be fixed.',
    `Error: ${repair.error}`,
    '',
    'Failing code:',
    '```strudel',
    repair.code,
    '```',
  ]
  if (repair.originalRequest) {
    lines.push('', `Original request: ${repair.originalRequest}`)
  }
  if (repair.attempt && repair.maxAttempts) {
    lines.push('', `Auto-retry ${repair.attempt}/${repair.maxAttempts}.`)
  }
  lines.push('', 'Fix the error and regenerate valid Strudel code.')
  return lines.join('\n')
}

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

function generateCacheKey(
  messages: UIMessage[],
  model: string,
  currentCode?: string,
  repairContext?: RepairContext,
  selectionContext?: SelectionContext,
): string {
  const normalized = messages.map((m) => ({
    role: m.role,
    parts: m.parts?.map((p: any) => {
      if (p.type === 'text') return { type: 'text', text: p.text }
      return p
    }),
  }))
  const keyData = JSON.stringify({ messages: normalized, model, currentCode, repairContext, selectionContext })
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

export async function POST(req: Request) {
  try {
    const {
      messages,
      model = DEFAULT_OPENAI_MODEL,
      currentCode,
      repairContext,
      selectionContext,
    }: {
      messages: UIMessage[]
      model?: string
      currentCode?: string
      repairContext?: RepairContext
      selectionContext?: SelectionContext
    } = await req.json()

    const cacheKey = generateCacheKey(messages, model, currentCode, repairContext, selectionContext)
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
    const resolvedCurrentCode = currentCode ?? getPreviousGenerationFromMessages(messages)
    const currentCodeContext = resolvedCurrentCode
      ? `\n\nThe user has Strudel code loaded in their editor. When they send a follow-up message, update this existing code incrementally — do not rewrite from scratch unless they ask for something completely new. Preserve parts they did not ask to change.\n\`\`\`strudel\n${resolvedCurrentCode}\n\`\`\``
      : ''
    const selectionContextBlock = selectionContext ? buildSelectionContextBlock(selectionContext) : ''
    const repairContextBlock = repairContext ? buildRepairContextBlock(repairContext) : ''
    const systemPrompt = `You are a helpful assistant that generates Strudel live-coding music patterns.
Use the Strudel guide below as the source of truth for syntax and capabilities.
Study the examples carefully to understand the style, structure, and patterns of good Strudel code.

Strudel guide:
${strudelGuide}

${strudelExamples}${currentCodeContext}${selectionContextBlock}${repairContextBlock}

RESPONSE FORMAT — follow this order strictly for EVERY response that includes code:

1. FIRST, write 1-2 sentences acknowledging the user's request and briefly describing what you will create. This text MUST appear before any code.
2. THEN output the Strudel code in a single fenced code block with the language tag "strudel":

\`\`\`strudel
s("bd sd").fast(2).cpm(120)
\`\`\`

The code must be valid Strudel code, playable as-is. Output a single Strudel expression (no variable assignments, no play(), no loop, no comments). Use Strudel built-ins like s(), note(), stack(), fast(), slow(), gain(), lpf(), hpf(), room(), size(), pan(); do not use synth or any undefined globals. Always end every pattern with .cpm(n), choosing a tempo that fits the style (e.g. .cpm(120) for house, .cpm(140) for techno).

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

    return streamResponse
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
