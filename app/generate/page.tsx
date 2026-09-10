'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { EditorSelectionContext, StrudelSnippet } from '@/types/types'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Icons } from '@/components/icons'
import Chatbot, { type ChatSaveContext } from '@/components/generate-new/chatbot'
import { ChatTitleLabel } from '@/components/chat-title-label'
import { useIsMobile } from '@/hooks/use-mobile'
import StrudelCodeViewer, { type StrudelCodeViewerHandle, type StrudelPlayerState } from '@/components/strudel/strudel-code-viewer'
import { MobileCodePlayerBar } from '@/components/generate-new/mobile-code-player-bar'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { usePanelRef } from 'react-resizable-panels'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { DEFAULT_CHAT_TITLE, generateChatTitleFromCode } from '@/lib/chat-title'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'

export const dynamic = 'force-dynamic'

const CHAT_PANEL_DEFAULT_WIDTH = 480
const CHAT_PANEL_ANIMATION_MS = 200

const GenerateContent = () => {
  const [snippets, setSnippets] = useState<StrudelSnippet[]>([])
  const [isCodeStreaming, setIsCodeStreaming] = useState(false)
  const [chatStatus, setChatStatus] = useState<'ready' | 'streaming' | 'submitted' | 'error'>('ready')
  const [error, setError] = useState<string | null>(null)
  const [fixRequest, setFixRequest] = useState<{ message: string; code: string; id: number } | null>(null)
  const [selectionContext, setSelectionContext] = useState<EditorSelectionContext | null>(null)
  const editorRef = useRef<StrudelCodeViewerHandle>(null)
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isTitleHovered, setIsTitleHovered] = useState(false)
  const [playerState, setPlayerState] = useState<StrudelPlayerState>({
    isPlaying: false,
    hasEditorCode: false,
    canPlay: false,
  })
  const userDismissedDrawerRef = useRef(false)
  const chatPanelRef = usePanelRef()
  const savedChatWidthRef = useRef(CHAT_PANEL_DEFAULT_WIDTH)
  const chatAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const [isChatAnimating, setIsChatAnimating] = useState(false)

  const prompt = searchParams.get('prompt') || undefined
  const urlChatId = searchParams.get('chatId') || undefined
  const [createdChatId, setCreatedChatId] = useState<string>()
  const chatId = urlChatId || createdChatId
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
          setCreatedChatId(undefined)
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

  const handleSnippetsGenerated = useCallback((newSnippets: StrudelSnippet[], options?: { fromChatLoad?: boolean; streaming?: boolean; streamingOnly?: boolean }) => {
    const fromChatLoad = options?.fromChatLoad ?? false
    const streaming = options?.streaming ?? false
    if (options?.streamingOnly) {
      setIsCodeStreaming(streaming)
      return
    }
    setIsCodeStreaming(streaming)
    setSnippets((prev) => {
      const next = newSnippets.slice(-1)
      if (!streaming && prev[0]?.code === next[0]?.code) return prev
      return next
    })
    setError(null)
    userDismissedDrawerRef.current = false
    setFixRequest(null)
  }, [])

  useEffect(() => {
    if (chatStatus === 'ready' || chatStatus === 'error') {
      setIsCodeStreaming(false)
    }
  }, [chatStatus])

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
    setCreatedChatId(id)
  }, [])

  const handleEnsureChatForSave = useCallback(async (code: string) => {
    if (chatId) return chatId
    if (!isAuthenticated && !anonymousSessionId) return

    const messages = chatSaveContextRef.current?.getMessages() ?? []
    const model = chatSaveContextRef.current?.getModel()
    const snippet = { ...(snippets[0] ?? {}), code }

    const newChatId = await createChat({
      title: DEFAULT_CHAT_TITLE,
      sessionId: isAuthenticated ? undefined : anonymousSessionId ?? undefined,
      messages,
      snippets: [snippet],
      model,
    })

    pendingChatNavigationRef.current = newChatId
    pendingNavigationCodeRef.current = code
    createdChatIdRef.current = newChatId
    handleChatCreated(newChatId)
    setPersistedCode(code)
    setSnippets([snippet])
    hydratedChatSnippetsRef.current = true
    const params = new URLSearchParams({ chatId: newChatId })
    if (model) params.set('model', model)
    window.history.replaceState(null, '', `/generate?${params.toString()}`)

    void generateChatTitleFromCode(code).then((title) => {
      if (title !== DEFAULT_CHAT_TITLE) {
        void updateChat({
          id: newChatId as Id<'chats'>,
          title,
          sessionId: isAuthenticated ? undefined : anonymousSessionId ?? undefined,
        })
      }
    })
    return newChatId
  }, [chatId, isAuthenticated, anonymousSessionId, snippets, createChat, updateChat, handleChatCreated])

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
    userDismissedDrawerRef.current = false
    setIsDrawerOpen(true)
  }, [])

  const hasGeneratedCode = Boolean(snippets[0]?.code?.trim() || persistedCode?.trim())

  const handleMobileExpandCode = useCallback(() => {
    userDismissedDrawerRef.current = false
    setIsDrawerOpen(true)
  }, [])

  const handleMobileCopy = useCallback(() => {
    void editorRef.current?.copyCode()
  }, [])

  const handleMobileShare = useCallback(() => {
    editorRef.current?.openShare()
  }, [])

  const handleMobileTogglePlayback = useCallback(async () => {
    if (!playerState.canPlay) {
      userDismissedDrawerRef.current = false
      setIsDrawerOpen(true)
      return
    }
    await editorRef.current?.togglePlayback()
  }, [playerState.canPlay])

  const handlePlayerStateChange = useCallback((state: StrudelPlayerState) => {
    setPlayerState(state)
  }, [])

  useEffect(() => {
    return () => {
      if (chatAnimationTimeoutRef.current !== null) {
        clearTimeout(chatAnimationTimeoutRef.current)
      }
    }
  }, [])

  const finishChatPanelAnimation = useCallback((collapsed: boolean) => {
    chatAnimationTimeoutRef.current = null
    setIsChatAnimating(false)
    setIsChatCollapsed(collapsed)
  }, [])

  const handleChatPanelResize = useCallback((size: { inPixels: number }) => {
    const collapsed = size.inPixels <= 1
    setIsChatCollapsed(collapsed)
    if (!collapsed && !isChatAnimating) {
      savedChatWidthRef.current = size.inPixels
    }
  }, [isChatAnimating])

  const toggleChatPanel = useCallback(() => {
    const panel = chatPanelRef.current
    if (!panel || isChatAnimating) return

    if (chatAnimationTimeoutRef.current !== null) {
      clearTimeout(chatAnimationTimeoutRef.current)
    }

    if (isChatCollapsed || panel.isCollapsed()) {
      const target = savedChatWidthRef.current
      if (panel.isCollapsed()) {
        panel.expand()
        panel.resize(0)
      }
      setIsChatAnimating(true)
      requestAnimationFrame(() => {
        panel.resize(target)
        chatAnimationTimeoutRef.current = setTimeout(() => {
          finishChatPanelAnimation(false)
        }, CHAT_PANEL_ANIMATION_MS)
      })
      return
    }

    savedChatWidthRef.current = panel.getSize().inPixels || savedChatWidthRef.current
    setIsChatAnimating(true)
    panel.resize(0)
    chatAnimationTimeoutRef.current = setTimeout(() => {
      panel.collapse()
      finishChatPanelAnimation(true)
    }, CHAT_PANEL_ANIMATION_MS)
  }, [chatPanelRef, finishChatPanelAnimation, isChatAnimating, isChatCollapsed])

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
      onPlayerStateChange={handlePlayerStateChange}
      resetKey={searchParams.get('new')}
      chatId={chatId}
      shareTitle={searchParams.get('title') || prompt}
    />
  )

  const mobileCodePlayerBar = isMobile && (hasGeneratedCode || isCodeStreaming) ? (
    <MobileCodePlayerBar
      isPlaying={playerState.isPlaying}
      canPlay={playerState.canPlay}
      hasCode={hasGeneratedCode}
      isStreaming={isCodeStreaming}
      onTogglePlayback={() => void handleMobileTogglePlayback()}
      onCopy={handleMobileCopy}
      onShare={handleMobileShare}
      onExpandCode={handleMobileExpandCode}
    />
  ) : null

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
        {!isMobile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={toggleChatPanel}
            aria-label="Collapse chat"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        )}
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
        mobileCodePlayerBar={mobileCodePlayerBar}
      />
    </>
  )

  return (
    <div className="flex h-full min-h-0 w-full max-w-full flex-1 overflow-hidden">
      {isMobile ? (
        <>
          <div className="generate-chat-panel flex min-h-0 w-full flex-1 flex-col gap-3 overflow-hidden p-4">
            {chatPanel}
          </div>
          <div
            aria-hidden={!isDrawerOpen}
            className={cn(
              'generate-strudel-panel fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl transition-[height] duration-300 ease-out',
              isDrawerOpen ? 'h-[85vh] p-4' : 'pointer-events-none h-0 overflow-hidden p-0 opacity-0',
            )}
          >
            <div className={cn('mx-auto mb-4 h-2 w-[100px] shrink-0 rounded-full bg-muted', !isDrawerOpen && 'hidden')} />
            <div className="min-h-0 flex-1 overflow-hidden">{codeViewer}</div>
          </div>
          {isDrawerOpen && (
            <button
              type="button"
              aria-label="Close code viewer"
              className="fixed inset-0 z-40 bg-black/80"
              onClick={() => {
                userDismissedDrawerRef.current = true
                setIsDrawerOpen(false)
              }}
            />
          )}
        </>
      ) : (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
          data-panel-animating={isChatAnimating ? '' : undefined}
        >
          <ResizablePanel
            id="generate-chat"
            defaultSize={CHAT_PANEL_DEFAULT_WIDTH}
            minSize={288}
            maxSize="50%"
            collapsible
            panelRef={chatPanelRef}
            onResize={handleChatPanelResize}
            className="generate-chat-panel flex min-h-0 flex-col gap-3 overflow-hidden border-r border-border/25 p-4"
          >
            {chatPanel}
          </ResizablePanel>
          <ResizableHandle disabled={isChatCollapsed} className="w-px bg-border/25 after:hidden" />
          <ResizablePanel
            minSize={400}
            className="generate-strudel-panel relative min-h-0 overflow-hidden"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'absolute left-2 top-4 z-10 size-8 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none',
                isChatCollapsed
                  ? 'translate-x-0 opacity-100'
                  : 'pointer-events-none -translate-x-1 opacity-0',
              )}
              onClick={toggleChatPanel}
              aria-label="Expand chat"
              aria-hidden={!isChatCollapsed}
              tabIndex={isChatCollapsed ? 0 : -1}
            >
              <PanelLeftOpen className="size-4" />
            </Button>
            {codeViewer}
          </ResizablePanel>
        </ResizablePanelGroup>
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
