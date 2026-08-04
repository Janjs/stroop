'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { EditorSelectionContext, StrudelSnippet } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import Chatbot from '@/components/generate-new/chatbot'
import { ChatTitleLabel } from '@/components/chat-title-label'
import { useSearchParams } from 'next/navigation'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import StrudelCodeViewer, { type StrudelCodeViewerHandle } from '@/components/strudel/strudel-code-viewer'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { DEFAULT_CHAT_TITLE } from '@/lib/chat-title'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'

export const dynamic = 'force-dynamic'

const GenerateContent = () => {
  const [snippets, setSnippets] = useState<StrudelSnippet[]>([])
  const [isCodeStreaming, setIsCodeStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<{ message: string; code: string; id: number } | null>(null)
  const [fixRequest, setFixRequest] = useState<{ message: string; code: string; id: number } | null>(null)
  const [selectionContext, setSelectionContext] = useState<EditorSelectionContext | null>(null)
  const editorRef = useRef<StrudelCodeViewerHandle>(null)
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isTitleHovered, setIsTitleHovered] = useState(false)
  const userDismissedDrawerRef = useRef(false)

  const prompt = searchParams.get('prompt') || undefined
  const chatId = searchParams.get('chatId') || undefined
  const title = searchParams.get('title') || undefined
  const { isAuthenticated } = useConvexAuth()
  const anonymousSessionId = useAnonymousSession()
  const chat = useQuery(
    api.chats.get,
    chatId && (isAuthenticated || anonymousSessionId)
      ? { id: chatId as Id<'chats'>, sessionId: anonymousSessionId ?? undefined }
      : 'skip',
  )
  const isChatLoading = Boolean(chatId && (isAuthenticated || anonymousSessionId) && chat === undefined)
  const displayTitle = chat?.title || title || prompt || DEFAULT_CHAT_TITLE

  const prevChatIdRef = useRef<string | undefined>(undefined)
  const createdChatIdRef = useRef<string | undefined>(undefined)
  const prevNewParamRef = useRef<string | null>(null)
  const hasInitializedRef = useRef(false)
  const newParam = searchParams.get('new')
  const viewerKey = chatId ?? newParam ?? 'none'
  const hydratedChatSnippetsRef = useRef(false)

  useEffect(() => {
    hydratedChatSnippetsRef.current = false
  }, [chatId])

  useEffect(() => {
    if (hasInitializedRef.current) {
      const isCreatedChat = createdChatIdRef.current === chatId
      const isChatChange = prevChatIdRef.current !== chatId && !isCreatedChat
      const isReset = newParam && newParam !== prevNewParamRef.current
      if (isChatChange || isReset) {
        setSnippets([])
        setIsCodeStreaming(false)
        setError(null)
        setCompileError(null)
        setFixRequest(null)
        setSelectionContext(null)
      }
    } else {
      hasInitializedRef.current = true
    }

    prevChatIdRef.current = chatId
    prevNewParamRef.current = newParam
    createdChatIdRef.current = undefined
  }, [chatId, newParam])

  useEffect(() => {
    if (!chatId || !chat?.snippets?.length || isCodeStreaming) return
    if (hydratedChatSnippetsRef.current) return
    const next = chat.snippets.slice(-1)
    if (!next[0]?.code?.trim()) return
    hydratedChatSnippetsRef.current = true
    setSnippets(next)
  }, [chatId, chat?.snippets, isCodeStreaming])

  const handleSnippetsGenerated = useCallback((newSnippets: StrudelSnippet[], options?: { fromChatLoad?: boolean; streaming?: boolean }) => {
    const fromChatLoad = options?.fromChatLoad ?? false
    const streaming = options?.streaming ?? false
    setIsCodeStreaming(streaming)
    setSnippets((prev) => {
      const next = newSnippets.slice(-1)
      if (!streaming && prev[0]?.code === next[0]?.code) return prev
      return next
    })
    setError(null)
    userDismissedDrawerRef.current = false
    setCompileError(null)
    setFixRequest(null)

    if (isMobile && !fromChatLoad && newSnippets.some((snippet) => Boolean(snippet.code?.trim()))) {
      if (!userDismissedDrawerRef.current) {
        setIsDrawerOpen(true)
      }
    }
  }, [isMobile])

  const handleToolError = useCallback((message: string) => {
    setError(message)
  }, [])

  const handleCompileError = useCallback((message: string, code: string) => {
    setCompileError({ message, code, id: Date.now() })
  }, [])

  const handleFixInChat = useCallback((message: string, code: string) => {
    setFixRequest({ message, code, id: Date.now() })
  }, [])

  const getEditorContext = useCallback(() => ({
    code: editorRef.current?.getCurrentCode() ?? snippets[0]?.code ?? '',
    selection: selectionContext ?? undefined,
  }), [snippets, selectionContext])

  const handleAddSelectionToContext = useCallback((selection: EditorSelectionContext) => {
    setSelectionContext(selection)
  }, [])

  const handleCodeSaved = useCallback((code: string) => {
    setSnippets((current) => {
      const activeSnippet = current[0]
      return [{ ...activeSnippet, code }]
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectionContext(null)
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

  const codeViewer = (
    <StrudelCodeViewer
      ref={editorRef}
      key={viewerKey}
      snippets={snippets}
      isCodeStreaming={isCodeStreaming}
      isLoading={isChatLoading || (snippets.length === 0 && !!prompt && !error)}
      onCompileError={handleCompileError}
      onFixInChat={handleFixInChat}
      onAddSelectionToContext={handleAddSelectionToContext}
      onCodeSaved={handleCodeSaved}
      resetKey={searchParams.get('new')}
      chatId={chatId}
      shareTitle={searchParams.get('title') || prompt}
    />
  )

  const chatPanel = (
    <>
      <div
        className="flex min-w-0 shrink-0 items-center gap-2"
        onMouseEnter={() => setIsTitleHovered(true)}
        onMouseLeave={() => setIsTitleHovered(false)}
      >
        <SidebarTrigger className="md:hidden" />
        <h2 className="min-w-0 flex-1 font-outfit text-base">
          <ChatTitleLabel title={displayTitle} isHovered={isTitleHovered} />
        </h2>
      </div>
      {error && (
        <Alert variant="destructive" className="shrink-0">
          <Icons.warning className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
        </Alert>
      )}
      <Chatbot
        prompt={prompt}
        chatId={chatId}
        onSnippetsGenerated={handleSnippetsGenerated}
        onToolError={handleToolError}
        onChatCreated={(id) => { createdChatIdRef.current = id }}
        compileError={compileError}
        fixRequest={fixRequest}
        resetKey={searchParams.get('new')}
        onToolClick={handleToolClick}
        currentSnippets={snippets}
        getEditorContext={getEditorContext}
        selectionContext={selectionContext}
        onClearSelection={handleClearSelection}
      />
    </>
  )

  return (
    <div className="flex h-full min-h-0 w-full max-w-full flex-1 overflow-hidden p-4">
      {isMobile ? (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
          {chatPanel}
        </div>
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel
            defaultSize={480}
            minSize={288}
            maxSize="50%"
            className="flex min-h-0 flex-col gap-4"
          >
            {chatPanel}
          </ResizablePanel>
          <ResizableHandle className="w-4 bg-transparent after:w-full" />
          <ResizablePanel minSize={400} className="min-h-0 overflow-hidden">
            {codeViewer}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {isMobile && (
        <Drawer 
          open={isDrawerOpen} 
          onOpenChange={(open) => {
            if (!open) {
              userDismissedDrawerRef.current = true
            }
            setIsDrawerOpen(open)
          }}
        >
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
