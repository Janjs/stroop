'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { StrudelSnippet, EditorContext, EditorSelectionContext } from '@/types/types'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useSignIn } from '@/hooks/useSignIn'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { DEFAULT_OPENAI_MODEL } from '@/lib/models'
import { DEFAULT_CHAT_TITLE, generateChatTitle } from '@/lib/chat-title'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputHeader,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputProvider,
  usePromptInputController,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'
import { Icons } from '@/components/icons'
import {
  Suggestions,
  Suggestion,
} from '@/components/ai-elements/suggestion'
import { Label } from '../ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDownIcon, ArrowDownIcon, XIcon } from 'lucide-react'

const MOODS = ['Happy', 'Sad', 'Dreamy', 'Energetic', 'Chill', 'Melancholic', 'Romantic', 'Mysterious']
const GENRES = ['Jazz', 'Pop', 'R&B', 'Classical', 'Lo-fi', 'Rock', 'Blues', 'Folk']
const TEMPOS = ['70 bpm', '90 bpm', '110 bpm', '130 bpm', '150 bpm']

const extractStrudelCode = (text: string): string | null => {
  const marker = '```strudel\n'
  const lastIdx = text.lastIndexOf(marker)
  if (lastIdx === -1) return null
  const codeStart = lastIdx + marker.length
  const remaining = text.substring(codeStart)
  const closingIdx = remaining.indexOf('```')
  const code = closingIdx !== -1 ? remaining.substring(0, closingIdx) : remaining
  return code.trim() || null
}

const isStrudelCodeBlockComplete = (text: string): boolean => {
  const marker = '```strudel\n'
  const lastIdx = text.lastIndexOf(marker)
  if (lastIdx === -1) return false
  const codeStart = lastIdx + marker.length
  return text.substring(codeStart).includes('```')
}

const splitAroundStrudelCode = (text: string): { before: string; after: string; hasCode: boolean } => {
  const marker = '```strudel\n'
  const idx = text.indexOf(marker)
  if (idx === -1) return { before: text, after: '', hasCode: false }
  const codeStart = idx + marker.length
  const remaining = text.substring(codeStart)
  const closingIdx = remaining.indexOf('```')
  const after = closingIdx !== -1 ? remaining.substring(closingIdx + 3).trim() : ''
  return { before: text.substring(0, idx).trim(), after, hasCode: true }
}

const getMessageFullText = (message: any): string => {
  if (message.parts) {
    return message.parts
      .filter((p: any) => p.type === 'text' && 'text' in p)
      .map((p: any) => p.text)
      .join('')
  }
  return 'content' in message ? String(message.content || '') : ''
}

const extractCodeFromMessage = (message: any): string | null => {
  const text = getMessageFullText(message)
  const code = extractStrudelCode(text)
  if (code) return code

  if (message.parts) {
    for (const part of message.parts) {
      const isToolPart =
        part?.type === 'tool-call' ||
        part?.type === 'tool-invocation' ||
        (typeof part?.type === 'string' && part.type.startsWith('tool-'))
      if (!isToolPart) continue

      const output = part.output ?? part.result ?? part.toolInvocation?.result
      if (!output) continue

      const parsed = typeof output === 'string'
        ? (() => { try { return JSON.parse(output) } catch { return null } })()
        : output
      if (parsed?.snippets?.[0]?.code) return parsed.snippets[0].code
    }
  }
  return null
}

const stripStrudelCodeFromText = (text: string): string => {
  const marker = '```strudel\n'
  let result = text
  while (true) {
    const idx = result.indexOf(marker)
    if (idx === -1) break
    const codeStart = idx + marker.length
    const remaining = result.substring(codeStart)
    const closingIdx = remaining.indexOf('```')
    if (closingIdx === -1) {
      result = result.substring(0, idx).trimEnd()
      break
    }
    const end = codeStart + closingIdx + 3
    result = (result.substring(0, idx) + result.substring(end)).trim()
  }
  return result.replace(/\n{3,}/g, '\n\n').trim()
}

const stripStrudelCodeFromMessages = (messages: any[]): any[] =>
  messages.map((message) => {
    if (message.parts) {
      return {
        ...message,
        parts: message.parts.map((part: any) =>
          part.type === 'text' && 'text' in part
            ? { ...part, text: stripStrudelCodeFromText(part.text) }
            : part
        ),
      }
    }
    if ('content' in message && typeof message.content === 'string') {
      return { ...message, content: stripStrudelCodeFromText(message.content) }
    }
    return message
  })

const getPreviousGenerationCode = (
  messages: any[],
  currentSnippets?: StrudelSnippet[],
): string | undefined => {
  const fromSnippets = currentSnippets?.map((s) => s.code).filter(Boolean).join('\n\n')
  if (fromSnippets) return fromSnippets

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (!message || message.role !== 'assistant') continue
    const code = extractCodeFromMessage(message)
    if (code) return code
  }

  return undefined
}

const isHiddenMessage = (message: any) => Boolean((message.metadata as { hidden?: boolean })?.hidden)

const extractSnippetsFromMessages = (messages: any[]): StrudelSnippet[] => {
  const snippets: StrudelSnippet[] = []
  for (const m of messages) {
    if (m.role !== 'assistant') continue
    const text = getMessageFullText(m)
    const code = extractStrudelCode(text)
    if (code) snippets.push({ code })

    if (m.parts) {
      for (const part of m.parts) {
        const isToolPart =
          part?.type === 'tool-call' ||
          part?.type === 'tool-invocation' ||
          (typeof part?.type === 'string' && part.type.startsWith('tool-'))
        if (!isToolPart) continue

        const output = part.output ?? part.result ?? part.toolInvocation?.result
        if (!output) continue

        const parsed = typeof output === 'string'
          ? (() => { try { return JSON.parse(output) } catch { return null } })()
          : output
        if (parsed?.snippets?.length) snippets.push(...parsed.snippets)
      }
    }
  }
  return snippets
}


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

function ConversationWithFade({ children, className, onViewportReady }: { children: React.ReactNode; className?: string; onViewportReady?: (viewport: HTMLElement | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showTopFade, setShowTopFade] = useState(false)
  const [showBottomFade, setShowBottomFade] = useState(false)
  const viewportRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const onViewportReadyRef = useRef(onViewportReady)
  onViewportReadyRef.current = onViewportReady

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const findScrollableElement = (): HTMLElement | null => {
      const elements = Array.from(container.querySelectorAll('*'))
      for (const el of elements) {
        const htmlEl = el as HTMLElement
        const style = getComputedStyle(htmlEl)
        if (htmlEl.scrollHeight > htmlEl.clientHeight + 1 &&
          (style.overflowY === 'auto' || style.overflowY === 'scroll')) {
          return htmlEl
        }
      }
      return null
    }

    const checkScroll = () => {
      const viewport = viewportRef.current
      if (!viewport) return
      const { scrollTop, scrollHeight, clientHeight } = viewport
      setShowTopFade(scrollTop > 0)
      setShowBottomFade(scrollTop < scrollHeight - clientHeight - 1)
    }

    const attachListeners = () => {
      const viewport = findScrollableElement()
      if (!viewport) {
        timeoutId = setTimeout(attachListeners, 50)
        return
      }

      viewportRef.current = viewport
      onViewportReadyRef.current?.(viewport)
      checkScroll()
      viewport.addEventListener('scroll', checkScroll)
      window.addEventListener('resize', checkScroll)

      observerRef.current = new MutationObserver(checkScroll)
      observerRef.current.observe(viewport, { childList: true, subtree: true })
    }

    attachListeners()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (viewportRef.current) {
        viewportRef.current.removeEventListener('scroll', checkScroll)
      }
      window.removeEventListener('resize', checkScroll)
      observerRef.current?.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative flex flex-col min-h-0 ${className || ''}`}>
      {showTopFade && (
        <div className="absolute left-0 right-0 top-0 h-8 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
      )}
      {showBottomFade && (
        <div className="absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
      )}
      {children}
    </div>
  )
}

interface ChatbotProps {
  prompt?: string
  chatId?: string
  onSnippetsGenerated?: (snippets: StrudelSnippet[], options?: { fromChatLoad?: boolean; streaming?: boolean }) => void
  onToolError?: (message: string) => void
  onChatCreated?: (chatId: string) => void
  compileError?: { message: string; code: string; id: number } | null
  fixRequest?: { message: string; code: string; id: number } | null
  resetKey?: string | null
  onToolClick?: (toolName: string, output: any) => void
  currentSnippets?: StrudelSnippet[]
  getEditorContext?: () => EditorContext
  selectionContext?: EditorSelectionContext | null
  onClearSelection?: () => void
}

function ChatbotContent({ prompt: externalPrompt, chatId, onSnippetsGenerated, onToolError, onChatCreated, compileError, fixRequest, resetKey, onToolClick, currentSnippets, getEditorContext, selectionContext, onClearSelection }: ChatbotProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedTempo, setSelectedTempo] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastAutoPromptRef = useRef<string>('')
  const handledToolCallIdsRef = useRef(new Set<string>())
  const currentChatIdRef = useRef<string | null>(chatId || null)
  const pendingNavigationChatIdRef = useRef<string | null>(null)
  const isCreatingChatRef = useRef(false)
  const [sessionKey, setSessionKey] = useState(() => chatId ?? resetKey ?? 'new')
  const lastSavedMessagesLengthRef = useRef<number>(0)
  const lastSubmittedPromptRef = useRef<string | null>(null)
  const lastHandledCompileErrorIdRef = useRef<number | null>(null)
  const compileRetryCountRef = useRef(0)
  const totalCompileRetryCountRef = useRef(0)
  const lastCompileErrorCodeRef = useRef<string | null>(null)
  const lastSnippetScopeKeyRef = useRef<string | null>(null)

  const lastPushedCodeRef = useRef<string | null>(null)
  const isLoadingChatRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(false)
  const wasWaitingForResponseRef = useRef(false)
  const activeChatKeyRef = useRef<string | undefined>(undefined)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const onSnippetsGeneratedRef = useRef(onSnippetsGenerated)
  onSnippetsGeneratedRef.current = onSnippetsGenerated
  const onToolErrorRef = useRef(onToolError)
  onToolErrorRef.current = onToolError
  const onToolClickRef = useRef(onToolClick)
  onToolClickRef.current = onToolClick

  const pushSnippets = useCallback((snippets: StrudelSnippet[], options?: { fromChatLoad?: boolean; streaming?: boolean }) => {
    const code = snippets[0]?.code?.trim()
    if (!code) return
    if (!options?.fromChatLoad && !options?.streaming && code === lastPushedCodeRef.current) return

    if (!options?.streaming) {
      lastPushedCodeRef.current = code
    }
    onSnippetsGeneratedRef.current?.(snippets, options)
  }, [])

  const { isAuthenticated } = useConvexAuth()
  const { handleSignIn, isSigningIn } = useSignIn()
  const router = useRouter()
  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })
  const useCredit = useMutation(api.credits.useCredit)
  const createChat = useMutation(api.chats.create)
  const updateChat = useMutation(api.chats.update)

  const ensureChatCreated = useCallback(async (userText: string) => {
    if (!isAuthenticated || chatId || currentChatIdRef.current || isCreatingChatRef.current) {
      return
    }

    isCreatingChatRef.current = true
    try {
      const newChatId = await createChat({
        title: DEFAULT_CHAT_TITLE,
        messages: [],
        snippets: [],
      })

      pendingNavigationChatIdRef.current = newChatId
      currentChatIdRef.current = newChatId
      lastSavedMessagesLengthRef.current = 0
      onChatCreated?.(newChatId)
      router.replace(`/generate?chatId=${newChatId}`, { scroll: false })

      void generateChatTitle(userText).then((title) => {
        if (currentChatIdRef.current === newChatId && title !== DEFAULT_CHAT_TITLE) {
          void updateChat({ id: newChatId as Id<'chats'>, title })
        }
      })
    } catch (e) {
      console.error('Failed to create chat', e)
    } finally {
      isCreatingChatRef.current = false
    }
  }, [isAuthenticated, chatId, createChat, updateChat, onChatCreated, router])
  const existingChat = useQuery(
    api.chats.get,
    chatId && isAuthenticated ? { id: chatId as Id<'chats'> } : 'skip'
  )

  const { textInput } = usePromptInputController()
  const [, setPrompt] = useGenerateSearchParams()

  const chatRequestContextRef = useRef({
    currentSnippets: undefined as StrudelSnippet[] | undefined,
    getEditorContext: undefined as (() => EditorContext) | undefined,
  })
  chatRequestContextRef.current.currentSnippets = currentSnippets
  chatRequestContextRef.current.getEditorContext = getEditorContext

  const chatTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ messages, body }) => {
          const editorContext = chatRequestContextRef.current.getEditorContext?.()
          const bodyRecord = body as { currentCode?: string; repairContext?: unknown }
          const hasPriorAssistantMessage = messages.some((message) => message.role === 'assistant')
          const shouldIncludeCurrentCode =
            hasPriorAssistantMessage ||
            Boolean(bodyRecord.repairContext) ||
            Boolean(editorContext?.selection)

          const currentCode = shouldIncludeCurrentCode
            ? editorContext?.code ||
              bodyRecord.currentCode ||
              getPreviousGenerationCode(messages, chatRequestContextRef.current.currentSnippets)
            : undefined

          return {
            body: {
              ...body,
              currentCode: currentCode || undefined,
              selectionContext: editorContext?.selection,
              messages: stripStrudelCodeFromMessages(messages),
            },
          }
        },
      }),
    [],
  )

  const { messages, sendMessage: rawSendMessage, status, setMessages, stop } = useChat({
    id: sessionKey,
    transport: chatTransport,
    onFinish: async () => {},
    onError: (error: Error) => {
      console.error('Chat error:', error)
      setError(error.message || 'An error occurred. Please try again.')
    },
  })

  const sendMessageRef = useRef(rawSendMessage)
  sendMessageRef.current = rawSendMessage
  const stopRef = useRef(stop)
  stopRef.current = stop
  const sendMessage = useCallback((...args: Parameters<typeof rawSendMessage>) => {
    return sendMessageRef.current(...args)
  }, [])

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    const visibleUserCount = messages.filter((m) => m.role === 'user' && !isHiddenMessage(m)).length
    const isFirstGeneration = visibleUserCount <= 1

    if (status === 'streaming' && isFirstGeneration) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage?.role === 'assistant') {
        const text = getMessageFullText(lastMessage)
        const code = extractCodeFromMessage(lastMessage)
        if (code) {
          pushSnippets([{ code }], { streaming: !isStrudelCodeBlockComplete(text) })
        }
      }
      return
    }

    if (status === 'streaming') return

    if (isLoadingChatRef.current) {
      isLoadingChatRef.current = false
      return
    }

    const snippetScopeKey = `${chatId || 'new'}:${resetKey || 'none'}`
    if (lastSnippetScopeKeyRef.current !== snippetScopeKey) {
      lastSnippetScopeKeyRef.current = snippetScopeKey
      if (messages.length === 0) return
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i]
      if (!message || message.role !== 'assistant') continue
      const code = extractCodeFromMessage(message)
      if (code) {
        pushSnippets([{ code }])
        return
      }
    }
  }, [messages, chatId, resetKey, status, pushSnippets])

  useEffect(() => {
    if (!chatId) return

    if (pendingNavigationChatIdRef.current === chatId) {
      pendingNavigationChatIdRef.current = null
      currentChatIdRef.current = chatId
      return
    }

    if (chatId !== sessionKey) {
      stopRef.current()
      currentChatIdRef.current = chatId
      lastSavedMessagesLengthRef.current = 0
      setSessionKey(chatId)
    }
  }, [chatId, sessionKey])

  useEffect(() => {
    if (chatId || resetKey || pendingNavigationChatIdRef.current) return
    if (!currentChatIdRef.current) return

    stopRef.current()
    currentChatIdRef.current = null
    lastSavedMessagesLengthRef.current = 0
    setSessionKey(`fresh-${Date.now()}`)
  }, [chatId, resetKey])

  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') return
    if (!existingChat || !chatId || chatId !== sessionKey) return
    if (!existingChat.messages?.length) return

    const lastMessage = messages[messages.length - 1]
    const existingLastMessage = existingChat.messages[existingChat.messages.length - 1]

    if (messages.length === 0 || (lastMessage && existingLastMessage && lastMessage.id !== existingLastMessage.id)) {
      if (messages.length > existingChat.messages.length) {
        return
      }
      isLoadingChatRef.current = true
      lastSavedMessagesLengthRef.current = existingChat.messages.length
      setMessages(existingChat.messages as any)
      if (existingChat.snippets && existingChat.snippets.length > 0) {
        pushSnippets(existingChat.snippets, { fromChatLoad: true })
      }
    }
  }, [existingChat, setMessages, messages, chatId, sessionKey, status, pushSnippets])

  useEffect(() => {
    if (status === 'submitted' || (messages.length > 0 && messages[messages.length - 1]?.role === 'user')) {
      setIsSuggestionsOpen(false)
    }
    if (status === 'error') {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && 'error' in lastMessage && lastMessage.error) {
        const errorMessage = typeof lastMessage.error === 'string'
          ? lastMessage.error
          : (lastMessage.error as any)?.message || 'An error occurred. Please try again.'
        setError(errorMessage)
      }
    }
  }, [status, messages])

  const lastExternalPromptRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (chatId) return
    if (messages.length > 0) return

    if (externalPrompt && externalPrompt !== lastExternalPromptRef.current && status === 'ready') {
      lastExternalPromptRef.current = externalPrompt
      setError(null)
      setIsSuggestionsOpen(false)
      void (async () => {
        await ensureChatCreated(externalPrompt)
        sendMessage(
          { text: externalPrompt },
          { body: { model: DEFAULT_OPENAI_MODEL } }
        )
      })()
    }
  }, [externalPrompt, status, sendMessage, messages.length, chatId, ensureChatCreated])

  useEffect(() => {
    const MAX_RETRIES_PER_CODE = 2
    const MAX_TOTAL_RETRIES = 5

    if (!compileError || status !== 'ready') return
    if (lastHandledCompileErrorIdRef.current === compileError.id) return
    if (totalCompileRetryCountRef.current >= MAX_TOTAL_RETRIES) return
    if (lastCompileErrorCodeRef.current === compileError.code && compileRetryCountRef.current >= MAX_RETRIES_PER_CODE) {
      return
    }
    lastHandledCompileErrorIdRef.current = compileError.id
    if (lastCompileErrorCodeRef.current !== compileError.code) {
      lastCompileErrorCodeRef.current = compileError.code
      compileRetryCountRef.current = 0
    }
    compileRetryCountRef.current += 1
    totalCompileRetryCountRef.current += 1

    const currentMessages = messagesRef.current
    const lastUserMessage = [...currentMessages]
      .reverse()
      .find((message) => message?.role === 'user' && !isHiddenMessage(message))
    const lastUserText =
      (lastUserMessage && 'content' in lastUserMessage ? String((lastUserMessage as any).content || '') : '') ||
      lastSubmittedPromptRef.current ||
      externalPrompt ||
      ''
    sendMessage(
      { text: 'Please fix the compilation error.', metadata: { hidden: true } },
      {
        body: {
          model: DEFAULT_OPENAI_MODEL,
          repairContext: {
            type: 'compile',
            error: compileError.message,
            code: compileError.code,
            originalRequest: lastUserText || undefined,
            attempt: totalCompileRetryCountRef.current,
            maxAttempts: MAX_TOTAL_RETRIES,
          },
        },
      }
    )
  }, [compileError, status, externalPrompt, sendMessage])

  const lastHandledFixRequestIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!fixRequest || status !== 'ready') return
    if (lastHandledFixRequestIdRef.current === fixRequest.id) return
    lastHandledFixRequestIdRef.current = fixRequest.id

    sendMessage(
      { text: 'Fix syntax error', metadata: { hidden: true } },
      {
        body: {
          model: DEFAULT_OPENAI_MODEL,
          repairContext: {
            type: 'fix',
            error: fixRequest.message,
            code: fixRequest.code,
          },
        },
      }
    )
  }, [fixRequest, status, sendMessage])

  const lastResetKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (resetKey && resetKey !== lastResetKeyRef.current) {
      stopRef.current()
      lastResetKeyRef.current = resetKey
      pendingNavigationChatIdRef.current = null
      currentChatIdRef.current = null
      lastSavedMessagesLengthRef.current = 0
      setSessionKey(resetKey)
      setError(null)
      setIsSuggestionsOpen(true)
      lastPushedCodeRef.current = null
      onSnippetsGeneratedRef.current?.([])
      lastSnippetScopeKeyRef.current = null

      textInput.setInput('')
      setSelectedMood(null)
      setSelectedGenre(null)
      setSelectedTempo(null)
      lastSubmittedPromptRef.current = null
      compileRetryCountRef.current = 0
      totalCompileRetryCountRef.current = 0
      lastCompileErrorCodeRef.current = null
    }
  }, [resetKey, textInput])

  // Save chat to Convex when messages change (allowing both authenticated and anonymous users with session)
  useEffect(() => {
    if (!isAuthenticated || messages.length === 0 || status !== 'ready') {
      return
    }

    const visibleMessages = messages.filter((m) => !isHiddenMessage(m))

    // Don't save if we haven't received any new messages
    // Note: checking > ensures we only save when we add content. 
    // If we just loaded from DB, messages.length == lastSaved.
    if (visibleMessages.length <= lastSavedMessagesLengthRef.current) {
      return
    }

    const saveChat = async () => {
      const firstUserMessage = visibleMessages.find((m) => m.role === 'user')
      if (!firstUserMessage) return

      const messagesToSave = visibleMessages.map((m) => ({
        id: String(m.id),
        role: m.role as 'user' | 'assistant',
        content: getMessageFullText(m),
        parts: m.parts,
        createdAt: ((m as any).createdAt instanceof Date) ? (m as any).createdAt.getTime() : Date.now(),
      }))

      try {
        const snippets = extractSnippetsFromMessages(messagesToSave)

        if (currentChatIdRef.current) {
          await updateChat({
            id: currentChatIdRef.current as Id<'chats'>,
            messages: messagesToSave,
            snippets: snippets,
          })
        }
        // Creation is handled when the first message is submitted

        lastSavedMessagesLengthRef.current = visibleMessages.length
      } catch (err) {
        console.error('Failed to save chat:', err)
      }
    }

    saveChat()
  }, [messages, status, isAuthenticated, updateChat])

  const constructPrompt = () => {
    const parts: string[] = []
    if (selectedMood) parts.push(selectedMood)
    if (selectedGenre) parts.push(selectedGenre)
    if (selectedTempo) parts.push(`at ${selectedTempo}`)

    if (parts.length === 0) {
      return 'e.g., dreamy lo-fi beat at 90 bpm'
    }

    return parts.join(' ')
  }

  useEffect(() => {
    const prompt = constructPrompt()
    if (prompt !== 'e.g., dreamy lo-fi beat at 90 bpm') {
      const currentText = textInput.value || ''
      if (currentText === '' || currentText === lastAutoPromptRef.current) {
        textInput.setInput(prompt)
        lastAutoPromptRef.current = prompt
      }
    } else {
      if (!textInput.value || textInput.value === lastAutoPromptRef.current) {
        textInput.setInput('')
      }
      lastAutoPromptRef.current = ''
    }
  }, [selectedMood, selectedGenre, selectedTempo])

  const handleMoodClick = (mood: string) => {
    setSelectedMood(selectedMood === mood ? null : mood)
  }

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre)
  }

  const handleTempoClick = (tempo: string) => {
    setSelectedTempo(selectedTempo === tempo ? null : tempo)
  }

  const handleSubmit = async (message: PromptInputMessage) => {
    console.log('handleSubmit called', message)
    const hasText = Boolean(message.text?.trim())
    if (!hasText) {
      console.log('No text in message, returning early')
      return
    }

    if (credits === undefined) {
      setError('Loading credits...')
      return
    }

    if (!isAuthenticated && credits.credits === 0) {
      setError('You have used all 3 free generations. Please sign in to continue.')
      return
    }

    if (!isAuthenticated) {
      if (!anonymousSessionId) {
        setError('Session not initialized. Please refresh the page.')
        return
      }
      const result = await useCredit({ anonymousSessionId })
      if (!result.success) {
        if (result.reason === 'limit_reached') {
          setError('You have used all 3 free generations. Please sign in to continue.')
        } else {
          setError('Failed to use credit. Please try again.')
        }
        return
      }
    }

    setError(null)
    compileRetryCountRef.current = 0
    totalCompileRetryCountRef.current = 0
    lastCompileErrorCodeRef.current = null
    const textToSend = message.text || constructPrompt()
    console.log('Sending message:', textToSend)

    // Update title for both anonymous and authenticated users for immediate feedback
    // setPrompt(textToSend) // This causes a double-send because it updates the URL, triggering a re-render/re-mount loop
    if (!isAuthenticated) {
      setPrompt(textToSend)
      // Prevent the auto-send effect from firing when the prompt prop updates via URL
      lastExternalPromptRef.current = textToSend
    }
    lastSubmittedPromptRef.current = textToSend

    if (isAuthenticated && !chatId && !currentChatIdRef.current) {
      await ensureChatCreated(textToSend)
    }

    sendMessage(
      { text: textToSend },
      { body: { model: DEFAULT_OPENAI_MODEL } }
    )

    onClearSelection?.()

    setSelectedMood(null)
    setSelectedGenre(null)
    setSelectedTempo(null)
    setIsSuggestionsOpen(false)
  }

  const defaultPrompt = constructPrompt()
  const hasSelections = selectedMood || selectedGenre || selectedTempo
  const hasText = Boolean(textInput.value?.trim()) || hasSelections
  const canSubmit = hasText && status === 'ready' && credits !== undefined && anonymousSessionId !== null && (isAuthenticated || (credits.credits ?? 0) > 0)
  const showSignInPrompt = !isAuthenticated && credits !== undefined && credits.credits === 0
  const visibleMessages = messages.filter((message) => !isHiddenMessage(message))
  const isWaitingForResponse = status === 'submitted' || status === 'streaming'
  const showResponseSpacer = visibleMessages.length > 1 || isWaitingForResponse
  const activeChatKey = sessionKey

  const updateScrollButton = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 70
    setShowScrollButton(!atBottom)
    if (!atBottom) {
      stickToBottomRef.current = false
    }
  }, [])

  const scrollToChatPosition = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const overflows = el.scrollHeight > el.clientHeight + 1
    const shouldStartAtBottom = overflows && visibleMessages.length > 1
    el.scrollTop = shouldStartAtBottom ? el.scrollHeight : 0
    stickToBottomRef.current = false
    updateScrollButton()
  }, [updateScrollButton, visibleMessages.length])

  useLayoutEffect(() => {
    if (activeChatKey === activeChatKeyRef.current) return
    activeChatKeyRef.current = activeChatKey
    stickToBottomRef.current = false
    wasWaitingForResponseRef.current = false
    scrollToChatPosition()
  }, [activeChatKey, scrollToChatPosition])

  useLayoutEffect(() => {
    if (isLoadingChatRef.current) {
      isLoadingChatRef.current = false
      scrollToChatPosition()
    }
  })

  useLayoutEffect(() => {
    if (isWaitingForResponse && !wasWaitingForResponseRef.current) {
      stickToBottomRef.current = true
      const el = scrollContainerRef.current
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      }
    }
    if (!isWaitingForResponse) {
      stickToBottomRef.current = false
    }
    wasWaitingForResponseRef.current = isWaitingForResponse
  }, [isWaitingForResponse])

  useLayoutEffect(() => {
    if (!isWaitingForResponse || !stickToBottomRef.current) return
    const el = scrollContainerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
    updateScrollButton()
  }, [messages, isWaitingForResponse, updateScrollButton])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const handleScroll = () => updateScrollButton()
    el.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()
    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [updateScrollButton, activeChatKey, visibleMessages.length])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error && (
        <Alert variant="destructive" className="mb-4 shrink-0">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
            >
              <XIcon className="size-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}
      {showSignInPrompt && (
        <Alert className="mb-4 shrink-0">
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You've used all 3 free generations. Sign in to continue generating Strudel code.</span>
            <Button size="sm" onClick={handleSignIn} disabled={isSigningIn}>
              {isSigningIn && <Icons.spinner className="animate-spin" />}
              Sign In
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <ConversationWithFade className="min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-y-auto"
          role="log"
        >
          <div className="flex flex-col gap-4 p-4">
            {(() => {
              const messagesToRender = [...visibleMessages]
              if ((status === 'submitted' || status === 'streaming') && messagesToRender.length > 0 && messagesToRender[messagesToRender.length - 1].role !== 'assistant') {
                messagesToRender.push({
                  id: 'generating-placeholder',
                  role: 'assistant',
                  content: '',
                  parts: [{ type: 'text', text: '' }]
                } as any)
              }

              return messagesToRender.map((message, messageIndex) => {
                const isLastMessage = messageIndex === messagesToRender.length - 1
                const showTypingIndicator = isLastMessage && message.role === 'assistant' && (status === 'streaming' || status === 'submitted')

                return (
                  <div
                    key={message.id}
                    className="flex flex-col gap-2"
                  >
                    {(() => {
                      const fullText = getMessageFullText(message)
                      const { before, after, hasCode } = message.role === 'assistant'
                        ? splitAroundStrudelCode(fullText)
                        : { before: fullText, after: '', hasCode: false }
                      const isCodeStreamingNow = hasCode && isLastMessage && status === 'streaming' && !isStrudelCodeBlockComplete(fullText)
                      const hasVisibleToolPart = message.parts?.some((part) =>
                        (part.type === 'tool-call' || (typeof part.type === 'string' && part.type.startsWith('tool-'))) &&
                        'state' in part &&
                        'input' in part
                      )
                      const showWaitingIndicator = showTypingIndicator && !fullText.trim() && !hasVisibleToolPart

                      if (message.role === 'assistant' && hasCode) {
                        return (
                          <>
                            {before && (
                              <Message from="assistant">
                                <MessageContent>
                                  <MessageResponse>{before}</MessageResponse>
                                </MessageContent>
                              </Message>
                            )}
                            <div
                              className={`flex items-center gap-2 p-3 rounded-md border bg-muted/30 transition-shadow ${isCodeStreamingNow ? 'shadow-[0_0_15px_hsl(var(--primary)/0.4)] animate-pulse' : 'cursor-pointer hover:bg-muted/50'}`}
                              onClick={() => {
                                if (!isCodeStreamingNow) {
                                  const code = extractStrudelCode(fullText)
                                  if (code) {
                                    pushSnippets([{ code }])
                                    onToolClickRef.current?.('generateStrudelCode', { snippets: [{ code }] })
                                  }
                                }
                              }}
                            >
                              <Icons.chatbotLogo className={`size-5 ${isCodeStreamingNow ? 'opacity-50' : ''}`} />
                              <span className="text-sm font-medium">
                                {isCodeStreamingNow ? 'Generating Strudel Code...' : 'Generated Strudel Code'}
                              </span>
                            </div>
                            {after && (
                              <Message from="assistant">
                                <MessageContent>
                                  <MessageResponse>{after}</MessageResponse>
                                </MessageContent>
                              </Message>
                            )}
                          </>
                        )
                      }

                      return (
                        <>
                          {showWaitingIndicator && (
                            <Message from="assistant">
                              <MessageContent>
                                <div className="flex items-center gap-2 text-sm leading-none text-muted-foreground" role="status" aria-live="polite">
                                  <Icons.chatbotLogo className="size-4 shrink-0 animate-pulse text-primary" />
                                  <span>Stroop is thinking…</span>
                                </div>
                              </MessageContent>
                            </Message>
                          )}
                          {(() => {
                            const renderedParts = message.parts?.map((part, i) => {
                              if (part.type === 'text' && 'text' in part) {
                                if (!part.text.trim()) return null
                                return (
                                  <Message key={`${message.id}-${i}`} from={message.role}>
                                    <MessageContent>
                                      <MessageResponse>{part.text}</MessageResponse>
                                    </MessageContent>
                                  </Message>
                                )
                              }
                              if (
                                (part.type === 'tool-call' || (typeof part.type === 'string' && part.type.startsWith('tool-'))) &&
                                'state' in part &&
                                'input' in part
                              ) {
                                const isLoading = part.state === 'input-streaming' || part.state === 'input-available'
                                const isCompleted = part.state === 'output-available'
                                return (
                                  <div
                                    key={i}
                                    className={`flex items-center gap-2 p-3 rounded-md border bg-muted/30 transition-shadow ${isLoading ? 'shadow-[0_0_15px_hsl(var(--primary)/0.4)] animate-pulse' : ''} ${isCompleted ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                                    onClick={() => {
                                      if (isCompleted && onToolClickRef.current && 'output' in part) {
                                        onToolClickRef.current('generateStrudelCode', part.output)
                                      }
                                    }}
                                  >
                                    <Icons.chatbotLogo className={`size-5 ${isLoading ? 'opacity-50' : ''}`} />
                                    <span className="text-sm font-medium">
                                      {isLoading ? 'Generating Strudel Code...' : isCompleted ? 'Generated Strudel Code' : 'Strudel Code Tool'}
                                    </span>
                                  </div>
                                )
                              }
                              return null
                            })

                            if (renderedParts?.some(Boolean)) {
                              return renderedParts
                            }

                            if (!showWaitingIndicator && before.trim()) {
                              return (
                                <Message from={message.role}>
                                  <MessageContent>
                                    <MessageResponse>{before}</MessageResponse>
                                  </MessageContent>
                                </Message>
                              )
                            }

                            return renderedParts ?? null
                          })()}
                        </>
                      )
                    })()}
                  </div>
                )
              })
            })()}
            <div
              aria-hidden
              className={`shrink-0 flex-1 min-h-0 ${showResponseSpacer ? 'min-h-[24vh]' : ''}`}
            />
          </div>
        </div>
        {showScrollButton && (
          <Button
            className="absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full dark:bg-background dark:hover:bg-muted"
            onClick={() => {
              const el = scrollContainerRef.current
              if (!el) return
              stickToBottomRef.current = true
              el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
            }}
            size="icon"
            type="button"
            variant="outline"
          >
            <ArrowDownIcon className="size-4" />
          </Button>
        )}
      </ConversationWithFade>
      <div className="shrink-0">
      <Collapsible open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen} className="group">
        <CollapsibleTrigger className="flex items-center justify-between gap-2 mb-1.5 w-full">
          <Label className="text-sm font-semibold text-muted-foreground">Suggestions</Label>
          <ChevronDownIcon className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
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
            <Suggestions className="mb-2 py-1 ml-0.5">
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
        </CollapsibleContent>
      </Collapsible>

      <PromptInput onSubmit={handleSubmit}>
        {selectionContext && (
          <PromptInputHeader className="px-3 pt-3">
            <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Selected code</p>
                <p className="mt-1 line-clamp-2 font-mono text-xs">{selectionContext.text}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={onClearSelection}
                aria-label="Clear selection context"
              >
                <XIcon className="size-3.5" />
              </Button>
            </div>
          </PromptInputHeader>
        )}
        <PromptInputBody>
          <PromptInputTextarea placeholder={defaultPrompt} />
        </PromptInputBody>
        <PromptInputFooter className="flex w-full items-end justify-between">
          {credits && !isAuthenticated && (
            <Badge variant="secondary" className="text-xs border-0">
              {credits.credits} / 3 free generations
            </Badge>
          )}
          <div className="ml-auto">
            <PromptInputSubmit
              disabled={!canSubmit || status !== 'ready'}
              status={status}
            />
          </div>
        </PromptInputFooter>
      </PromptInput>
      </div>
    </div>
  )
}

export default function Chatbot({ prompt, chatId, onSnippetsGenerated, onToolError, onChatCreated, compileError, fixRequest, resetKey, onToolClick, currentSnippets, getEditorContext, selectionContext, onClearSelection }: ChatbotProps) {
  return (
    <PromptInputProvider>
      <ChatbotContent
        prompt={prompt}
        chatId={chatId}
        onSnippetsGenerated={onSnippetsGenerated}
        onToolError={onToolError}
        onChatCreated={onChatCreated}
        compileError={compileError}
        fixRequest={fixRequest}
        resetKey={resetKey}
        onToolClick={onToolClick}
        currentSnippets={currentSnippets}
        getEditorContext={getEditorContext}
        selectionContext={selectionContext}
        onClearSelection={onClearSelection}
      />
    </PromptInputProvider>
  )
}
