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
  Suggestions,
  Suggestion,
} from '@/components/ai-elements/suggestion'
import { Label } from '@/components/ui/label'

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

const MOODS = ['Happy', 'Sad', 'Dreamy', 'Energetic', 'Chill', 'Melancholic', 'Romantic', 'Mysterious']
const GENRES = ['Jazz', 'Pop', 'R&B', 'Classical', 'Lo-fi', 'Rock', 'Blues', 'Folk']
const TEMPOS = ['70 bpm', '90 bpm', '110 bpm', '130 bpm', '150 bpm']

function constructPrompt(mood: string | null, genre: string | null, tempo: string | null) {
  const parts: string[] = []
  if (mood) parts.push(mood)
  if (genre) parts.push(genre)
  if (tempo) parts.push(`at ${tempo}`)
  return parts.join(' ')
}

function LandingInputContent() {
  const router = useRouter()
  const { textInput } = usePromptInputController()

  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedTempo, setSelectedTempo] = useState<string | null>(null)

  const handleMoodClick = (mood: string) =>
    setSelectedMood((prev) => (prev === mood ? null : mood))
  const handleGenreClick = (genre: string) =>
    setSelectedGenre((prev) => (prev === genre ? null : genre))
  const handleTempoClick = (tempo: string) =>
    setSelectedTempo((prev) => (prev === tempo ? null : tempo))

  useEffect(() => {
    const prompt = constructPrompt(selectedMood, selectedGenre, selectedTempo)
    textInput.setInput(prompt)
  }, [selectedMood, selectedGenre, selectedTempo])

  const handleSubmit = (message: PromptInputMessage) => {
    const text = message.text?.trim() || constructPrompt(selectedMood, selectedGenre, selectedTempo)
    if (!text) return
    router.push(`/generate?prompt=${encodeURIComponent(text)}`)
  }

  const hasSelections = selectedMood || selectedGenre || selectedTempo
  const hasText = Boolean(textInput.value?.trim()) || hasSelections

  return (
    <div className="flex flex-col w-full max-w-xl">
      <PromptInput onSubmit={handleSubmit} className="w-full">
        <PromptInputBody>
          <PromptInputTextarea placeholder="e.g., dreamy lo-fi beat at 90 bpm" />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full justify-end">
          <PromptInputSubmit disabled={!hasText} />
        </PromptInputFooter>
      </PromptInput>

      <div className="mt-4 space-y-1">
        <Label className="mb-3 text-xs text-muted-foreground">Mood</Label>
        <SuggestionsWithFade className="my-1">
          <Suggestions className="py-1 ml-0.5">
            {MOODS.map((mood) => (
              <Suggestion
                size="sm"
                key={mood}
                suggestion={mood}
                selected={selectedMood === mood}
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
            {TEMPOS.map((tempo) => (
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
      <LandingInputContent />
    </PromptInputProvider>
  )
}
