import { streamText, convertToModelMessages, UIMessage, smoothStream } from 'ai'
import { createOpenAI, openai as openaiProvider } from '@ai-sdk/openai'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'
import { DEFAULT_OPENAI_MODEL, estimateUsageCents, getModel } from '@/lib/models'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 60

const MAX_OUTPUT_TOKENS = 4096

let strudelGuideCache: string | null = null
let strudelExamplesCache: string | null = null
let strudelSoundsCache: string | null = null
let strudelApiReferenceCache: string | null = null

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

async function getStrudelSounds(): Promise<string> {
  if (strudelSoundsCache) {
    return strudelSoundsCache
  }
  const soundsPath = path.join(process.cwd(), 'docs', 'strudel-sounds.md')
  strudelSoundsCache = await readFile(soundsPath, 'utf8')
  return strudelSoundsCache
}

async function getStrudelApiReference(): Promise<string> {
  if (strudelApiReferenceCache) {
    return strudelApiReferenceCache
  }
  const apiReferencePath = path.join(process.cwd(), 'docs', 'strudel-api-reference.md')
  strudelApiReferenceCache = await readFile(apiReferencePath, 'utf8')
  return strudelApiReferenceCache
}

function languageModel(modelId: string) {
  const spec = getModel(modelId)
  if ('openai' in spec && spec.openai && process.env.OPENAI_API_KEY) {
    return openaiProvider(spec.openai)
  }
  if (!process.env.OPENROUTER_API_KEY) throw new Error('This model needs OPENROUTER_API_KEY')
  const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://stroop.app',
      'X-Title': 'Stroop',
    },
    fetch: async (url, init) => {
      if (typeof init?.body === 'string') {
        const body = JSON.parse(init.body)
        if (body.max_tokens == null) {
          body.max_tokens = body.max_completion_tokens ?? MAX_OUTPUT_TOKENS
        }
        if (body.reasoning == null) {
          body.reasoning = spec.provider === 'moonshotai'
            ? { effort: 'none', exclude: true }
            : { exclude: true }
        }
        init = { ...init, body: JSON.stringify(body) }
      }
      return fetch(url, init)
    },
  })
  return openrouter.chat(spec.openrouter)
}

function convexClient(token?: string) {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
  if (token) client.setAuth(token)
  return client
}

export async function POST(req: Request) {
  let refundSession: string | undefined
  try {
    const {
      messages,
      model = DEFAULT_OPENAI_MODEL,
      currentCode,
      repairContext,
      selectionContext,
      anonymousSessionId,
    }: {
      messages: UIMessage[]
      model?: string
      currentCode?: string
      repairContext?: RepairContext
      selectionContext?: SelectionContext
      anonymousSessionId?: string
    } = await req.json()

    const resolvedModel = getModel(model).id
    const token = await convexAuthNextjsToken()
    const convex = convexClient(token)
    const grant = await convex.mutation(api.credits.consume, {
      model: resolvedModel,
      anonymousSessionId,
    })

    if (!grant.ok) {
      const status = grant.reason === 'sign_in' ? 401 : 402
      return new Response(JSON.stringify({ error: grant.reason }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (grant.kind === 'free') refundSession = anonymousSessionId

    const [strudelGuide, strudelExamples, strudelSounds] = await Promise.all([
      getStrudelGuide(),
      getStrudelExamples(),
      getStrudelSounds(),
    ])
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

${strudelExamples}

Available default sounds (only use names from this catalog):
${strudelSounds}${currentCodeContext}${selectionContextBlock}${repairContextBlock}

If the user attaches one or more images, they are log-frequency spectrograms of audio they recorded or dropped (time on X, log frequency on Y, brighter = louder). A caption may include duration and estimated BPM. Infer tempo, rhythm, pitch material, and texture from the image and generate matching Strudel. Treat "translate this to strudel" plus a spectrogram as a request to transcribe the audio.

For informational questions that do not require generating music (e.g. "what synths can you use?", "how does fast() work?"), answer conversationally in plain text. Do not include a Strudel code block unless the user asks you to generate or modify music.

RESPONSE FORMAT — follow this order strictly for EVERY response that includes code:

1. FIRST, write 1-2 sentences acknowledging the user's request and briefly describing what you will create. This text MUST appear before any code.
2. THEN output the Strudel code in a single fenced code block with the language tag "strudel":

\`\`\`strudel
s("bd*4, ~ sd*2, hh*8").cpm(30)
\`\`\`

The code must be valid Strudel code, playable as-is. Output a single Strudel expression (no variable assignments, no play(), no loop, no comments). Use Strudel built-ins like s(), note(), stack(), fast(), slow(), gain(), lpf(), hpf(), room(), size(), pan(); pick sound names from the catalog above; do not use synth or any undefined globals.

TEMPO: .cpm(n) sets cycles per minute, NOT BPM. Never pass BPM directly to .cpm() — .cpm(150) is ~4× faster than 150 BPM in 4/4. For standard 4/4 patterns where one cycle = one bar, use .cpm(bpm/4) (e.g. 120 BPM → .cpm(30), 140 BPM → .cpm(35), 150 BPM → .cpm(37.5)). Structure drum patterns with one bar per cycle (e.g. bd*4) so tempo is predictable. When no tempo is requested, omit .cpm() and use the default (~60 cpm). When the user asks for a specific BPM, always convert with bpm/4.

3. AFTER the code block, explain what was created and how the Strudel code is structured.

IMPORTANT: Never start your response with a code block. Always lead with conversational text first. Output exactly one \`\`\`strudel code block per response. The code block streams directly into the user's live editor.`

    const result = streamText({
      model: languageModel(resolvedModel),
      messages: await convertToModelMessages(messages),
      system: systemPrompt,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      experimental_transform: smoothStream({
        delayInMs: 15,
        chunking: 'word',
      }),
      async onError({ error }) {
        console.error('Chat stream error:', error)
        if (!refundSession) return
        await convex.mutation(api.credits.refundFree, { anonymousSessionId: refundSession })
        refundSession = undefined
      },
      async onFinish(event) {
        if (grant.kind !== 'paid') return
        const usage = event.totalUsage ?? event.usage
        const inputTokens = usage.inputTokens ?? 0
        const outputTokens = usage.outputTokens ?? 0
        try {
          await convex.mutation(api.credits.recordUsage, {
            model: resolvedModel,
            inputTokens,
            outputTokens,
            cents: estimateUsageCents(resolvedModel, inputTokens, outputTokens),
          })
        } catch (error) {
          console.error('Failed to record usage', error)
        }
      },
    })

    const streamResponse = result.toUIMessageStreamResponse({
      sendSources: true,
      sendReasoning: true,
      onError: (error) => {
        const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
        if (/credits|max_tokens/i.test(message)) return 'This model is out of provider credits. Try Luna.'
        return message || 'An error occurred.'
      },
    })

    return streamResponse
  } catch (error: any) {
    console.error('Chat API error:', error)
    if (refundSession) {
      await convexClient().mutation(api.credits.refundFree, { anonymousSessionId: refundSession })
    }
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
