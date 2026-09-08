'use client'

import { useState, useEffect, useRef } from 'react'
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
import {
  AudioAttachmentPreview,
  AudioPromptButtons,
  AudioRecordingStatusProvider,
  useAudioRecordingStatus,
} from '@/components/generate-new/audio-prompt-tools'
import { filePartsToSpectrograms } from '@/lib/audio-spectrogram'
import { stashPendingAudio } from '@/lib/pending-audio'
import {
  Suggestions,
  Suggestion,
} from '@/components/ai-elements/suggestion'
import { Label } from '@/components/ui/label'
import { applyMoodBackground, GENRES, MOODS } from '@/lib/prompt-suggestions'
import { TEMPO_LABELS } from '@/lib/tempo-suggestions'
import { useConvexAuth } from 'convex/react'
import { useBilling } from '@/hooks/useBilling'
import { ModelSelect } from '@/components/billing/model-select'
import { SubscribeDialog } from '@/components/billing/subscribe-dialog'
import { FreeGens } from '@/components/billing/usage-meter'
import { LUNA_MODEL_ID } from '@/lib/models'

function SuggestionsWithFade({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showLeftFade, setShowLeftFade] = useState(false)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]')
    if (!viewport) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = viewport as HTMLElement
      setShowLeftFade(scrollLeft > 0)
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 1)
    }

    checkScroll()
    viewport.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      viewport.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      {showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      {showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      {children}
    </div>
  )
}

function constructPrompt(mood: string | null, genre: string | null, tempo: string | null) {
  const parts: string[] = []
  if (mood) parts.push(mood)
  if (genre) parts.push(genre)
  if (tempo) parts.push(`at ${tempo}`)
  return parts.join(' ')
}

function LandingInputContent() {
  const router = useRouter()
  const { textInput, attachments } = usePromptInputController()
  const { processingCount } = useAudioRecordingStatus()
  const { isAuthenticated } = useConvexAuth()
  const usage = useBilling()

  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedTempo, setSelectedTempo] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(LUNA_MODEL_ID)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMoodClick = (mood: string) => {
    setSelectedMood((prev) => (prev === mood ? null : mood))
    if (selectedMood === mood) return
    applyMoodBackground(mood, true)
  }
  const handleGenreClick = (genre: string) =>
    setSelectedGenre((prev) => (prev === genre ? null : genre))
  const handleTempoClick = (tempo: string) =>
    setSelectedTempo((prev) => (prev === tempo ? null : tempo))

  useEffect(() => {
    const prompt = constructPrompt(selectedMood, selectedGenre, selectedTempo)
    textInput.setInput(prompt)
  }, [selectedMood, selectedGenre, selectedTempo])

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text?.trim() || constructPrompt(selectedMood, selectedGenre, selectedTempo) || (message.files.length ? 'translate this to strudel' : '')
    if (!text && message.files.length === 0) return
    setError(null)
    setIsSubmitting(true)
    if (message.files.length) {
      try {
        const converted = await filePartsToSpectrograms(message.files)
        stashPendingAudio({
          text: [text, converted.caption].filter(Boolean).join('\n\n'),
          files: converted.files,
        })
      } catch {
        setIsSubmitting(false)
        setError('Could not read that audio. Try wav, mp3, or m4a.')
        return
      }
    }
    const params = new URLSearchParams({ prompt: text, model: usage?.canUsePaidModels ? selectedModel : LUNA_MODEL_ID })
    router.push(`/generate?${params.toString()}`)
  }

  const hasSelections = selectedMood || selectedGenre || selectedTempo
  const hasText = Boolean(textInput.value?.trim()) || hasSelections
  const hasAudio = attachments.files.length > 0

  return (
    <div className="flex flex-col w-full max-w-xl">
      {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
      <PromptInput accept="audio/*" className="w-full" maxFiles={3} maxFileSize={8_000_000} onSubmit={handleSubmit}>
        <AudioAttachmentPreview />
        <PromptInputBody>
          <PromptInputTextarea className={hasAudio ? 'pt-1.5' : undefined} placeholder="e.g., dreamy lo-fi beat at 90 bpm" />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full items-end justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-3">
            <AudioPromptButtons />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {usage && <FreeGens usage={usage} onClick={() => setSubscribeOpen(true)} />}
            {isAuthenticated && (
              <ModelSelect
                value={usage?.canUsePaidModels ? selectedModel : LUNA_MODEL_ID}
                onChange={setSelectedModel}
                canUsePaidModels={usage?.canUsePaidModels ?? false}
                onNeedSubscribe={() => setSubscribeOpen(true)}
              />
            )}
            <PromptInputSubmit disabled={(!hasText && !hasAudio) || isSubmitting || processingCount > 0} status={isSubmitting ? 'submitted' : undefined} />
          </div>
        </PromptInputFooter>
      </PromptInput>
      <SubscribeDialog open={subscribeOpen} onOpenChange={setSubscribeOpen} />

      <div className="mt-4 space-y-1">
        <Label className="mb-3 text-xs text-muted-foreground">Mood</Label>
        <SuggestionsWithFade className="my-1">
          <Suggestions className="py-1 ml-0.5">
            {MOODS.map((mood) => (
              <Suggestion
                size="sm"
                key={mood.label}
                suggestion={mood.label}
                preview={'preview' in mood ? mood.preview : undefined}
                selected={selectedMood === mood.label}
                onClick={handleMoodClick}
              />
            ))}
          </Suggestions>
        </SuggestionsWithFade>
        <Label className="mb-2 text-xs text-muted-foreground">Genre</Label>
        <SuggestionsWithFade className="my-1">
          <Suggestions className="py-1 ml-0.5">
            {GENRES.map((genre) => (
              <Suggestion
                key={genre}
                suggestion={genre}
                selected={selectedGenre === genre}
                onClick={handleGenreClick}
              />
            ))}
          </Suggestions>
        </SuggestionsWithFade>
        <Label className="mb-2 text-xs text-muted-foreground">Tempo</Label>
        <SuggestionsWithFade className="my-1">
          <Suggestions className="py-1 ml-0.5">
            {TEMPO_LABELS.map((tempo) => (
              <Suggestion
                key={tempo}
                suggestion={tempo}
                selected={selectedTempo === tempo}
                onClick={handleTempoClick}
              />
            ))}
          </Suggestions>
        </SuggestionsWithFade>
      </div>
    </div>
  )
}

export default function LandingInput() {
  return (
    <PromptInputProvider>
      <AudioRecordingStatusProvider>
        <LandingInputContent />
      </AudioRecordingStatusProvider>
    </PromptInputProvider>
  )
}
