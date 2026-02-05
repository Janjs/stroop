'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { StrudelSnippet } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import Chatbot from '@/components/generate-new/chatbot'
import { useSearchParams } from 'next/navigation'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import StrudelCodeViewer from '@/components/strudel/strudel-code-viewer'

export const dynamic = 'force-dynamic'

const parseSnippetsFromOutput = (output: unknown): StrudelSnippet[] | null => {
  if (!output) return null
  if (typeof output === 'string') {
    try {
      const parsed = JSON.parse(output) as { snippets?: StrudelSnippet[]; result?: unknown; data?: unknown; output?: unknown }
      return parsed.snippets ?? parseSnippetsFromOutput(parsed.result ?? parsed.data ?? parsed.output)
    } catch {
      return null
    }
  }
  if (Array.isArray(output)) {
    return output as StrudelSnippet[]
  }
  if (typeof output === 'object') {
    if ('snippets' in (output as any)) {
      return (output as { snippets?: StrudelSnippet[] }).snippets ?? null
    }
    if ('result' in (output as any)) {
      return parseSnippetsFromOutput((output as { result?: unknown }).result)
    }
    if ('data' in (output as any)) {
      return parseSnippetsFromOutput((output as { data?: unknown }).data)
    }
    if ('output' in (output as any)) {
      return parseSnippetsFromOutput((output as { output?: unknown }).output)
    }
  }
  return null
}

const GenerateContent = () => {
  const [snippets, setSnippets] = useState<StrudelSnippet[]>([])
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeSnippetIndex, setActiveSnippetIndex] = useState(0)

  const prompt = searchParams.get('prompt') || undefined
  const chatId = searchParams.get('chatId') || undefined

  const prevChatIdRef = useRef<string | undefined>(undefined)
  const prevNewParamRef = useRef<string | null>(null)
  const newParam = searchParams.get('new')

  useEffect(() => {
    const isChatSwitch = prevChatIdRef.current && chatId && prevChatIdRef.current !== chatId
    const isNewChat = prevChatIdRef.current && !chatId
    const isReset = newParam && newParam !== prevNewParamRef.current

    if (isChatSwitch || isNewChat || isReset) {
      setSnippets([])
      setActiveSnippetIndex(0)
      setError(null)
    }

    prevChatIdRef.current = chatId
    prevNewParamRef.current = newParam
  }, [chatId, newParam])

  const handleSnippetsGenerated = (newSnippets: StrudelSnippet[], shouldReplace: boolean = false) => {
    setSnippets((prevSnippets) => {
      let combined: StrudelSnippet[]

      if (shouldReplace) {
        combined = newSnippets
      } else {
        const prevSlice = prevSnippets.slice(-newSnippets.length)
        const isDuplicate = prevSlice.length === newSnippets.length &&
          JSON.stringify(prevSlice) === JSON.stringify(newSnippets)

        if (isDuplicate) {
          return prevSnippets
        }

        combined = [...prevSnippets, ...newSnippets]
      }

      const limited = combined.slice(-20)

      const totalCombined = combined.length
      const prevLen = prevSnippets.length

      if (shouldReplace) {
        setActiveSnippetIndex(0)
        return limited
      }

      const firstNewIndexInCombined = prevLen
      const firstIndexInLimited = Math.max(0, firstNewIndexInCombined - (totalCombined - limited.length))

      setActiveSnippetIndex(firstIndexInLimited)

      return limited
    })
    setError(null)
  }

  const handleToolError = (message: string) => {
    setError(message)
  }

  const handleToolClick = (_toolName: string, output: unknown) => {
    const result = parseSnippetsFromOutput(output)
    if (result && result.length > 0) {
      handleSnippetsGenerated(result)
    }
    if (isMobile) {
      setIsDrawerOpen(true)
    }
  }

  const codeViewer = (
    <StrudelCodeViewer
      snippets={snippets}
      activeIndex={activeSnippetIndex}
      onSelect={setActiveSnippetIndex}
      isLoading={snippets.length === 0 && !!prompt && !error}
    />
  )

  return (
    <div className="flex w-full max-w-full h-full gap-4 px-4 pb-4 overflow-hidden">
      <div className="flex w-full md:w-72 lg:w-[25rem] flex-col gap-4 flex-shrink-0">
        {error && (
          <Alert variant="destructive">
            <Icons.warning className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
          </Alert>
        )}
        <Chatbot
          prompt={prompt}
          chatId={chatId}
          onSnippetsGenerated={handleSnippetsGenerated}
          onToolError={handleToolError}
          resetKey={searchParams.get('new')}
          onToolClick={handleToolClick}
        />
      </div>

      <div className="hidden md:block flex-1 min-w-0 min-h-0 overflow-hidden">
        {codeViewer}
      </div>

      {isMobile && (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerContent className="h-[85vh] p-4">
            <div className="h-full overflow-hidden">
              {codeViewer}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}

const Page = () => {
  return (
    <Suspense fallback={null}>
      <GenerateContent />
    </Suspense>
  )
}

export default Page
