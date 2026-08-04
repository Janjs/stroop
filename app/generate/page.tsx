'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EditorSelectionContext, StrudelSnippet } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import Chatbot, { type ChatSaveContext } from '@/components/generate-new/chatbot'
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
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { DEFAULT_CHAT_TITLE, generateChatTitleFromCode } from '@/lib/chat-title'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'

export const dynamic = 'force-dynamic'

const GenerateContent = () => {
  const [snippets, setSnippets] = useState<StrudelSnippet[]>([])
  const [isCodeStreaming, setIsCodeStreaming] = useState(false)
  const [chatStatus, setChatStatus] = useState<'ready' | 'streaming' | 'submitted' | 'error'>('ready')
  const [error, setError] = useState<string | null>(null)
  const [fixRequest, setFixRequest] = useState<{ message: string; code: string; id: number } | null>(null)
  const [selectionContext, setSelectionContext] = useState<EditorSelectionContext | null>(null)
  const editorRef = useRef<StrudelCodeViewerHandle>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isTitleHovered, setIsTitleHovered] = useState(false)
  const userDismissedDrawerRef = useRef(false)

  const prompt = searchParams.get('prompt') || undefined
  const chatId = searchParams.get('chatId') || undefined
  const title = searchParams.get('title') || undefined
  const { isAuthenticated } = useConvexAuth()
  const anonymousSessionId = useAnonymousSession()
  const createChat = useMutation(api.chats.create)
  const updateChat = useMutation(api.chats.update)
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
  const [editorSessionKey, setEditorSessionKey] = useState(() => `editor-${Date.now()}`)
  const hydratedChatSnippetsRef = useRef(false)
  const pendingSaveAfterFixRef = useRef(false)
  const preFixCodeRef = useRef<string | null>(null)
  const chatSaveContextRef = useRef<ChatSaveContext | null>(null)
  const pendingChatNavigationRef = useRef<string | null>(null)
  const pendingNavigationCodeRef = useRef<string | null>(null)
  const [persistedCode, setPersistedCode] = useState<string | null>(null)

  useEffect(() => {
    if (pendingChatNavigationRef.current === chatId) return
    hydratedChatSnippetsRef.current = false
  }, [chatId])

  useEffect(() => {
    if (hasInitializedRef.current) {
      const isSaveNavigation =
        pendingChatNavigationRef.current === chatId ||
        createdChatIdRef.current === chatId
      const isChatChange = prevChatIdRef.current !== chatId && !isSaveNavigation
      const isReset = newParam && newParam !== prevNewParamRef.current
      if (isChatChange || isReset) {
        setSnippets([])
        setPersistedCode(null)
        setIsCodeStreaming(false)
        setError(null)
        setFixRequest(null)
        setSelectionContext(null)
        if (isReset) {
          setEditorSessionKey(`editor-${Date.now()}`)
        }
      }
    } else {
      hasInitializedRef.current = true
    }

    prevChatIdRef.current = chatId
    prevNewParamRef.current = newParam
    if (createdChatIdRef.current !== chatId) {
      createdChatIdRef.current = undefined
    }
  }, [chatId, newParam])

  useEffect(() => {
    const code = snippets[0]?.code?.trim()
    if (code) {
      setPersistedCode(code)
    }
  }, [snippets])

  useEffect(() => {
    if (!chatId || !pendingNavigationCodeRef.current) return

    const code = pendingNavigationCodeRef.current
    pendingNavigationCodeRef.current = null
    setPersistedCode(code)
    setSnippets([{ code }])
    hydratedChatSnippetsRef.current = true

    window.requestAnimationFrame(() => {
      editorRef.current?.applyCode(code)
    })
  }, [chatId])

  useEffect(() => {
    if (!chatId || !chat?.snippets?.length || isCodeStreaming) return
    if (hydratedChatSnippetsRef.current) return
    const next = chat.snippets.slice(-1)
    if (!next[0]?.code?.trim()) return
    hydratedChatSnippetsRef.current = true
    setSnippets(next)
    if (next[0]?.code?.trim()) {
      setPersistedCode(next[0].code.trim())
    }
  }, [chatId, chat?.snippets, isCodeStreaming])

  useEffect(() => {
    if (!pendingSaveAfterFixRef.current) return
    if (chatStatus !== 'ready' || isCodeStreaming) return

    const code = snippets[0]?.code?.trim()
    if (!code) return

    if (preFixCodeRef.current && code === preFixCodeRef.current) return

    pendingSaveAfterFixRef.current = false
    preFixCodeRef.current = null
    const codeToSave = code

    window.requestAnimationFrame(() => {
      void editorRef.current?.saveWithCode(codeToSave).catch((error) => {
        console.error('Failed to auto-save after fix:', error)
      })
    })
  }, [snippets, isCodeStreaming, chatStatus])

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

  const handleFixInChat = useCallback((message: string, code: string) => {
    pendingSaveAfterFixRef.current = true
    preFixCodeRef.current = code.trim()
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
    setPersistedCode(code)
    setSnippets((current) => {
      const activeSnippet = current[0]
      return [{ ...activeSnippet, code }]
    })
    window.requestAnimationFrame(() => {
      editorRef.current?.applyCode(code)
    })
  }, [])

  const handleChatCreated = useCallback((id: string) => {
    createdChatIdRef.current = id
  }, [])

  const handleEnsureChatForSave = useCallback(async (code: string) => {
    if (chatId) return

    if (!isAuthenticated && !anonymousSessionId) {
      throw new Error('Sign in to save your code to a new chat')
    }

    const messages = chatSaveContextRef.current?.getMessages() ?? []
    const snippet = { ...(snippets[0] ?? {}), code }

    const newChatId = await createChat({
      title: DEFAULT_CHAT_TITLE,
      messages,
      snippets: [snippet],
      sessionId: anonymousSessionId ?? undefined,
    })

    pendingChatNavigationRef.current = newChatId
    pendingNavigationCodeRef.current = code
    createdChatIdRef.current = newChatId
    handleChatCreated(newChatId)
    setPersistedCode(code)
    setSnippets([snippet])
    hydratedChatSnippetsRef.current = true
    router.replace(`/generate?chatId=${newChatId}`, { scroll: false })

    void generateChatTitleFromCode(code).then((title) => {
      if (title !== DEFAULT_CHAT_TITLE) {
        void updateChat({
          id: newChatId as Id<'chats'>,
          title,
          sessionId: anonymousSessionId ?? undefined,
        })
      }
    })
  }, [chatId, isAuthenticated, anonymousSessionId, snippets, createChat, updateChat, router, handleChatCreated])

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
      key={editorSessionKey}
      snippets={snippets}
      persistedCode={persistedCode}
      isCodeStreaming={isCodeStreaming}
      isLoading={isChatLoading || (snippets.length === 0 && !persistedCode && !!prompt && !error)}
      onFixInChat={handleFixInChat}
      onAddSelectionToContext={handleAddSelectionToContext}
      onCodeSaved={handleCodeSaved}
      onEnsureChat={handleEnsureChatForSave}
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
        onChatCreated={handleChatCreated}
        fixRequest={fixRequest}
        resetKey={searchParams.get('new')}
        onToolClick={handleToolClick}
        currentSnippets={snippets}
        getEditorContext={getEditorContext}
        selectionContext={selectionContext}
        onClearSelection={handleClearSelection}
        saveContextRef={chatSaveContextRef}
        pendingChatNavigationRef={pendingChatNavigationRef}
        onChatStatusChange={setChatStatus}
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
