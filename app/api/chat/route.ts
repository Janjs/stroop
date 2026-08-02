import { streamText, convertToModelMessages, UIMessage, smoothStream } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { DEFAULT_OPENAI_MODEL } from '@/lib/models'
import { readFile } from 'fs/promises'
import path from 'path'

export const maxDuration = 30

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

    const [strudelGuide, strudelExamples, strudelSounds, strudelApiReference] = await Promise.all([
      getStrudelGuide(),
      getStrudelExamples(),
      getStrudelSounds(),
      //getStrudelApiReference(), this is too long and not needed for now
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

API reference (all available Strudel functions):
${strudelApiReference}

Available default sounds (only use names from this catalog):
${strudelSounds}${currentCodeContext}${selectionContextBlock}${repairContextBlock}

For informational questions that do not require generating music (e.g. "what synths can you use?", "how does fast() work?"), answer conversationally in plain text. Do not include a Strudel code block unless the user asks you to generate or modify music.

RESPONSE FORMAT — follow this order strictly for EVERY response that includes code:

1. FIRST, write 1-2 sentences acknowledging the user's request and briefly describing what you will create. This text MUST appear before any code.
2. THEN output the Strudel code in a single fenced code block with the language tag "strudel":

\`\`\`strudel
s("bd sd").fast(2).cpm(120)
\`\`\`

The code must be valid Strudel code, playable as-is. Output a single Strudel expression (no variable assignments, no play(), no loop, no comments). Use Strudel built-ins like s(), note(), stack(), fast(), slow(), gain(), lpf(), hpf(), room(), size(), pan(); pick sound names from the catalog above; do not use synth or any undefined globals. Always end every pattern with .cpm(n), choosing a tempo that fits the style (e.g. .cpm(120) for house, .cpm(140) for techno).

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
