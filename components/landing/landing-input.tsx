'use client'

import { useRouter } from 'next/navigation'
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputProvider,
  usePromptInputController,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import Link from 'next/link'

const DEFAULT_PROMPT = 'e.g., dreamy lo-fi beat at 90 bpm'

const PROMPT_SUGGESTIONS = [
  'Dreamy lo-fi beat at 90 bpm',
  'Bright synth groove with syncopated hats',
  'Minimal techno pulse at 130 bpm',
  'Warm ambient pads with slow kick',
  'Playful chiptune groove at 150 bpm',
  'Melancholic downtempo rhythm',
]

function LandingInputContent() {
  const router = useRouter()

  const { textInput } = usePromptInputController()

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text?.trim())
    if (!hasText) return

    const textToSend = message.text || DEFAULT_PROMPT
    router.push(`/generate?prompt=${encodeURIComponent(textToSend)}`)
  }

  const hasText = Boolean(textInput.value?.trim())

  return (
    <div className="flex flex-col w-full max-w-xl items-center">
      <PromptInput onSubmit={handleSubmit} className="w-full">
        <PromptInputBody>
          <PromptInputTextarea placeholder={DEFAULT_PROMPT} />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full justify-end">
          <PromptInputSubmit disabled={!hasText} />
        </PromptInputFooter>
      </PromptInput>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Icons.lightbulb className="h-4 w-4" />
          <p className="text-sm">Need inspiration? Try one of these:</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {PROMPT_SUGGESTIONS.map((suggestion, i) => (
            <Link key={i} href={`/generate?prompt=${encodeURIComponent(suggestion)}`}>
              <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5">
                {suggestion}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingInput() {
  return (
    <PromptInputProvider>
      <LandingInputContent />
    </PromptInputProvider>
  )
}
