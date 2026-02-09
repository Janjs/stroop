'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { StrudelSnippet } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import Chatbot from '@/components/generate-new/chatbot'
import { useSearchParams } from 'next/navigation'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import StrudelCodeViewer from '@/components/strudel/strudel-code-viewer'

export const dynamic = 'force-dynamic'

const GenerateContent = () => {
  const [snippets, setSnippets] = useState<StrudelSnippet[]>([])
  const [error, setError] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<{ message: string; code: string; id: number } | null>(null)
  const [fixRequest, setFixRequest] = useState<{ message: string; code: string; id: number } | null>(null)
  const [isCodeStreaming, setIsCodeStreaming] = useState(false)
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const prompt = searchParams.get('prompt') || undefined
  const chatId = searchParams.get('chatId') || undefined

  const prevChatIdRef = useRef<string | undefined>(undefined)
  const prevNewParamRef = useRef<string | null>(null)
  const hasInitializedRef = useRef(false)
  const newParam = searchParams.get('new')
  const viewerKey = `${chatId ?? 'new'}-${newParam ?? 'none'}`

  useEffect(() => {
    if (hasInitializedRef.current) {
      const isChatChange = prevChatIdRef.current !== chatId
      const isReset = newParam && newParam !== prevNewParamRef.current
      if (isChatChange || isReset) {
        setSnippets([])
        setError(null)
      }
    } else {
      hasInitializedRef.current = true
    }

    prevChatIdRef.current = chatId
    prevNewParamRef.current = newParam
  }, [chatId, newParam])

  const handleSnippetsGenerated = useCallback((newSnippets: StrudelSnippet[], options?: { isStreaming?: boolean }) => {
    setSnippets(newSnippets.slice(-1))
    setIsCodeStreaming(options?.isStreaming ?? false)
    setError(null)
    setCompileError(null)
    setFixRequest(null)
  }, [])

  const handleToolError = useCallback((message: string) => {
    setError(message)
  }, [])

  const handleCompileError = useCallback((message: string, code: string) => {
    setCompileError({ message, code, id: Date.now() })
  }, [])

  const handleFixInChat = useCallback((message: string, code: string) => {
    setFixRequest({ message, code, id: Date.now() })
  }, [])

  const handleToolClick = useCallback((_toolName: string, output: unknown) => {
    if (output && typeof output === 'object' && 'snippets' in (output as any)) {
      const snippets = (output as { snippets?: StrudelSnippet[] }).snippets
      if (snippets && snippets.length > 0) {
        setSnippets(snippets.slice(-1))
        setError(null)
      }
    }
    setIsDrawerOpen(true)
  }, [])

  const showEditor = Boolean(snippets[0]?.code?.trim())

  const codeViewer = showEditor ? (
    <StrudelCodeViewer
      key={viewerKey}
      snippets={snippets}
      isLoading={snippets.length === 0 && !!prompt && !error}
      isCodeStreaming={isCodeStreaming}
      onCompileError={handleCompileError}
      onFixInChat={handleFixInChat}
      resetKey={searchParams.get('new')}
    />
  ) : (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="flex-1 min-h-0 flex flex-col p-0">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {snippets.length === 0 && !!prompt && !error ? 'Generating Strudel code...' : 'Your Strudel code will appear here.'}
        </div>
      </CardContent>
    </Card>
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
          compileError={compileError}
          fixRequest={fixRequest}
          resetKey={searchParams.get('new')}
          onToolClick={handleToolClick}
          currentSnippets={snippets}
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
