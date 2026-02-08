'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { StrudelSnippet } from '@/types/types'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuthActions } from '@convex-dev/auth/react'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
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
import { ChevronDownIcon, XIcon } from 'lucide-react'

const MOODS = ['Happy', 'Sad', 'Dreamy', 'Energetic', 'Chill', 'Melancholic', 'Romantic', 'Mysterious']
const GENRES = ['Jazz', 'Pop', 'R&B', 'Classical', 'Lo-fi', 'Rock', 'Blues', 'Folk']
const TEMPOS = ['70 bpm', '90 bpm', '110 bpm', '130 bpm', '150 bpm']

const getToolName = (part: any): string => {
  if (part && typeof part === 'object' && 'toolName' in part && typeof part.toolName === 'string') {
    return part.toolName
  }
  if (part && typeof part.type === 'string' && part.type.startsWith('tool-')) {
    return part.type.replace('tool-', '')
  }
  return ''
}

const parseToolResult = (value: unknown): { success?: boolean; snippets?: StrudelSnippet[]; error?: string } | null => {
  if (!value) {
    return null
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as { success?: boolean; snippets?: StrudelSnippet[]; error?: string }
    } catch {
      return null
    }
  }
  if (Array.isArray(value)) {
    return { snippets: value as StrudelSnippet[] }
  }
  if (typeof value === 'object') {
    const obj = value as { snippets?: StrudelSnippet[]; success?: boolean; error?: string; result?: unknown; data?: unknown; output?: unknown }
    if ('snippets' in obj || 'success' in obj || 'error' in obj) {
      return obj
    }
    if ('result' in obj && obj.result) {
      return parseToolResult(obj.result)
    }
    if ('data' in obj && obj.data) {
      return parseToolResult(obj.data)
    }
    if ('output' in obj && obj.output) {
      return parseToolResult(obj.output)
    }
  }
  return null
}

const getToolOutput = (part: any): { success?: boolean; snippets?: StrudelSnippet[]; error?: string } | null => {
  if (part && typeof part === 'object' && 'output' in part && part.output) {
    return parseToolResult(part.output)
  }
  if (part && typeof part === 'object' && 'result' in part && part.result) {
    return parseToolResult(part.result)
  }
  return null
}

const shouldUseToolResult = (result: { success?: boolean; snippets?: StrudelSnippet[]; error?: string } | null) => {
  if (!result || !result.snippets || result.snippets.length === 0) {
    return false
  }
  return result.success !== false
}

const extractSnippetsFromMessages = (messages: any[]): StrudelSnippet[] => {
  const snippets: StrudelSnippet[] = []
  for (const m of messages) {
    if (m.role === 'assistant' && m.parts) {
      for (const part of m.parts) {
        const toolName = getToolName(part)
        if (!toolName || toolName !== 'generateStrudelCode') {
          continue
        }
        const result = getToolOutput(part)
        if (shouldUseToolResult(result)) {
          snippets.push(...(result?.snippets ?? []))
        }
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
  onSnippetsGenerated?: (snippets: StrudelSnippet[], shouldReplace?: boolean) => void
  onToolError?: (message: string) => void
  onChatCreated?: (chatId: string) => void
  compileError?: { message: string; code: string; id: number } | null
  fixRequest?: { message: string; code: string; id: number } | null
  resetKey?: string | null
  onToolClick?: (toolName: string, output: any) => void
  currentSnippets?: StrudelSnippet[]
}

function ChatbotContent({ prompt: externalPrompt, chatId, onSnippetsGenerated, onToolError, onChatCreated, compileError, fixRequest, resetKey, onToolClick, currentSnippets }: ChatbotProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedTempo, setSelectedTempo] = useState<string | null>(null)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastAutoPromptRef = useRef<string>('')
  const handledToolCallIdsRef = useRef(new Set<string>())
  const currentChatIdRef = useRef<string | null>(chatId || null)
  const lastSavedMessagesLengthRef = useRef<number>(0)
  const lastSubmittedPromptRef = useRef<string | null>(null)
  const lastHandledCompileErrorIdRef = useRef<number | null>(null)
  const compileRetryCountRef = useRef(0)
  const totalCompileRetryCountRef = useRef(0)
  const lastCompileErrorCodeRef = useRef<string | null>(null)
  const lastSnippetScopeKeyRef = useRef<string | null>(null)

  const [isTyping, setIsTyping] = useState(false)

  const onSnippetsGeneratedRef = useRef(onSnippetsGenerated)
  onSnippetsGeneratedRef.current = onSnippetsGenerated
  const onToolErrorRef = useRef(onToolError)
  onToolErrorRef.current = onToolError
  const onToolClickRef = useRef(onToolClick)
  onToolClickRef.current = onToolClick

  const { isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })
  const useCredit = useMutation(api.credits.useCredit)
  const createChat = useMutation(api.chats.create)
  const updateChat = useMutation(api.chats.update)
  const existingChat = useQuery(
    api.chats.get,
    chatId && isAuthenticated ? { id: chatId as Id<'chats'> } : 'skip'
  )

  const handleSignIn = () => {
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: currentUrl })
  }

  const { textInput } = usePromptInputController()
  const [, setPrompt] = useGenerateSearchParams()

  const { messages, sendMessage: rawSendMessage, status, setMessages } = useChat({
    api: '/api/chat',
    onFinish: async (message: any) => {
      const finishSnippets = extractSnippetsFromMessages([message as any])
      if (finishSnippets.length > 0) {
        onSnippetsGeneratedRef.current?.(finishSnippets)
      }
      // Create a new chat if we don't have one, only for authenticated users
      if (isAuthenticated && !chatId && !currentChatIdRef.current) {
        try {
          // Use the prompt from URL params if available (set by handleSubmit), or try to find it in messages
          const promptParam = searchParams.get('prompt')

          // Note: messages in this closure might be stale (from start of request). 
          // We should construct the messages array carefully.
          // formatting the assistant message for storage
          const assistantMessage = {
            id: message.id || crypto.randomUUID(),
            role: 'assistant' as const,
            content: message.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '',
            parts: message.parts,
            createdAt: Date.now()
          }

          // Try to get user message
          let userMessageContent = promptParam
          if (!userMessageContent && lastSubmittedPromptRef.current) {
            userMessageContent = lastSubmittedPromptRef.current
          }

          // Construct messages array for saving
          // If we have messages in state, use them (filtering out the partial assistant message if present)
          let messagesToSave: any[] = []

          if (messages.length > 0) {
            messagesToSave = messages.map(m => ({
              id: m.id,
              role: m.role,
              content: 'content' in m ? String(m.content || '') : '',
              parts: 'parts' in m ? m.parts : undefined,
              createdAt: (m as any).createdAt instanceof Date ? (m as any).createdAt.getTime() : Date.now()
            }))
            // Check if the last message in state is the same as the finished message
            const lastStateMsg = messagesToSave[messagesToSave.length - 1]
            if (lastStateMsg.id === assistantMessage.id) {
              messagesToSave[messagesToSave.length - 1] = assistantMessage
            } else {
              messagesToSave.push(assistantMessage)
            }
          } else {
            // Fallback if messages state is empty
            messagesToSave = [
              {
                id: crypto.randomUUID(),
                role: 'user',
                content: userMessageContent || 'New Chat',
                parts: [{ type: 'text', text: userMessageContent || 'New Chat' }],
                createdAt: Date.now() - 1000
              },
              assistantMessage
            ]
          }

          const title = userMessageContent ? userMessageContent.slice(0, 50) : 'New Chat'

          const snippets = extractSnippetsFromMessages(messagesToSave)
          if (snippets.length > 0) {
            onSnippetsGeneratedRef.current?.(snippets, true)
          }

          // Create chat mutation
          const newChatId = await createChat({
            title: title || 'New Chat',
            messages: messagesToSave,
            snippets: snippets,
          })

          // 1. Create Chat -> get ID.
          currentChatIdRef.current = newChatId
          // 2. Redirect - preserve prompt if it exists
          const redirectUrl = promptParam
            ? `/generate?chatId=${newChatId}&prompt=${encodeURIComponent(promptParam)}`
            : `/generate?chatId=${newChatId}`
          router.push(redirectUrl)
        } catch (e) {
          console.error("Failed to create chat", e)
        }
      }
    },
    onError: (error: Error) => {
      console.error('Chat error:', error)
      setError(error.message || 'An error occurred. Please try again.')
    },
  } as any)

  const sendMessageRef = useRef(rawSendMessage)
  sendMessageRef.current = rawSendMessage
  const sendMessage = useCallback((...args: Parameters<typeof rawSendMessage>) => {
    return sendMessageRef.current(...args)
  }, [])

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  useEffect(() => {
    const snippetScopeKey = `${chatId || 'new'}:${resetKey || 'none'}`
    if (lastSnippetScopeKeyRef.current !== snippetScopeKey) {
      lastSnippetScopeKeyRef.current = snippetScopeKey
      if (messages.length === 0) {
        return
      }
    }
    for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
      const message = messages[messageIndex]
      if (!message || message.role !== 'assistant') {
        continue
      }
      if (!message.parts) {
        continue
      }
      for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
        const part = message.parts[partIndex]
        const toolName = getToolName(part)
        if (!toolName || toolName !== 'generateStrudelCode') {
          continue
        }
        const callId = 'toolCallId' in part && typeof part.toolCallId === 'string'
          ? part.toolCallId
          : `${message.id}-${partIndex}`
        if (handledToolCallIdsRef.current.has(callId)) {
          continue
        }
        const result = getToolOutput(part)
        if (result?.error) {
          setError(result.error)
          onToolErrorRef.current?.(result.error)
          handledToolCallIdsRef.current.add(callId)
          return
        }
        if (shouldUseToolResult(result) && onSnippetsGeneratedRef.current) {
          setError(null)
          onSnippetsGeneratedRef.current(result!.snippets!)
          handledToolCallIdsRef.current.add(callId)
          return
        }
      }
    }
  }, [messages, chatId, resetKey])

  // Load existing chat
  useEffect(() => {
    const normalizedChatId = chatId || null
    if (normalizedChatId !== currentChatIdRef.current) {
      setMessages([])
      currentChatIdRef.current = normalizedChatId
    }

    if (existingChat && existingChat.messages && existingChat.messages.length > 0) {
      if (currentChatIdRef.current === existingChat._id) {
        const lastMessage = messages[messages.length - 1]
        const existingLastMessage = existingChat.messages[existingChat.messages.length - 1]

        if (messages.length === 0 || (lastMessage && existingLastMessage && lastMessage.id !== existingLastMessage.id)) {
          if (messages.length > existingChat.messages.length) {
            return
          }
          setMessages(existingChat.messages as any)
          if (existingChat.snippets && existingChat.snippets.length > 0) {
            onSnippetsGeneratedRef.current?.(existingChat.snippets, true)
          }
        }
      }
    }
  }, [existingChat, setMessages, messages.length, chatId])

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
      sendMessage(
        { text: externalPrompt },
        { body: { model: 'gpt-5.2' } }
      )
    }
  }, [externalPrompt, status, sendMessage, messages.length, chatId])

  useEffect(() => {
    if (status === 'streaming') {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 200)
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
    }
  }, [messages, status])

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
    const lastUserMessage = [...currentMessages].reverse().find((message) => message?.role === 'user')
    const lastUserText =
      (lastUserMessage && 'content' in lastUserMessage ? String((lastUserMessage as any).content || '') : '') ||
      lastSubmittedPromptRef.current ||
      externalPrompt ||
      ''
    const retryPrompt = [
      `The generated Strudel code failed to compile (auto-retry ${totalCompileRetryCountRef.current}/${MAX_TOTAL_RETRIES}).`,
      `Error: ${compileError.message}`,
      '',
      'Failing code:',
      '```',
      compileError.code,
      '```',
      '',
      lastUserText ? `Original request: ${lastUserText}` : '',
      'Fix the compilation error and regenerate valid Strudel code.',
    ].filter(Boolean).join('\n')
    const currentCode = currentSnippets?.map(s => s.code).filter(Boolean).join('\n\n') || undefined
    sendMessage(
      { text: retryPrompt },
      { body: { model: 'gpt-5.2', currentCode } }
    )
  }, [compileError, status, externalPrompt, sendMessage])

  const lastHandledFixRequestIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (!fixRequest || status !== 'ready') return
    if (lastHandledFixRequestIdRef.current === fixRequest.id) return
    lastHandledFixRequestIdRef.current = fixRequest.id

    const fixPrompt = [
      `The Strudel code has a syntax error. Please fix it.`,
      `Error: ${fixRequest.message}`,
      '',
      'Failing code:',
      '```',
      fixRequest.code,
      '```',
      '',
      'Fix the error and regenerate valid Strudel code.',
    ].join('\n')
    const currentCode = currentSnippets?.map(s => s.code).filter(Boolean).join('\n\n') || undefined
    sendMessage(
      { text: fixPrompt },
      { body: { model: 'gpt-5.2', currentCode } }
    )
  }, [fixRequest, status, sendMessage])

  const lastResetKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (resetKey && resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey
      setMessages([])
      setError(null)
      setIsSuggestionsOpen(true)
      onSnippetsGeneratedRef.current?.([], true)
      currentChatIdRef.current = null
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
  }, [resetKey, setMessages, textInput])

  // Save chat to Convex when messages change (allowing both authenticated and anonymous users with session)
  useEffect(() => {
    if (!isAuthenticated || messages.length === 0 || status !== 'ready') {
      return
    }

    // Don't save if we haven't received any new messages
    // Note: checking > ensures we only save when we add content. 
    // If we just loaded from DB, messages.length == lastSaved.
    if (messages.length <= lastSavedMessagesLengthRef.current) {
      return
    }

    const saveChat = async () => {
      const firstUserMessage = messages.find((m) => m.role === 'user')
      if (!firstUserMessage) return

      const title =
        'content' in firstUserMessage
          ? String(firstUserMessage.content).slice(0, 100)
          : firstUserMessage.parts?.find((p) => p.type === 'text' && 'text' in p)
            ? (firstUserMessage.parts.find((p) => p.type === 'text' && 'text' in p) as { text: string }).text.slice(0, 100)
            : 'New Chat'

      const messagesToSave = messages.map((m) => ({
        id: String(m.id),
        role: m.role as 'user' | 'assistant',
        content: 'content' in m ? String(m.content || '') : '',
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
        // Creation is handled by onFinish to avoid race conditions and duplicates

        lastSavedMessagesLengthRef.current = messages.length
      } catch (err) {
        console.error('Failed to save chat:', err)
      }
    }

    saveChat()
  }, [messages, status, isAuthenticated, updateChat])

  const constructPrompt = () => {
    const parts: string[] = []
    if (selectedMood) parts.push(selectedMood.toLowerCase())
    if (selectedGenre) parts.push(selectedGenre.toLowerCase())
    if (selectedTempo) parts.push(`at ${selectedTempo}`)

    if (parts.length === 0) {
      return 'e.g., dreamy lo-fi beat at 90 bpm'
    }

    let prompt = parts.join(' ') + ' strudel pattern'

    return prompt
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

    const currentCode = currentSnippets?.map(s => s.code).filter(Boolean).join('\n\n') || undefined
    sendMessage(
      { text: textToSend },
      {
        body: {
          model: 'gpt-5.2',
          currentCode,
        },
      }
    )

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

  return (
    <div className="flex flex-col h-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
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
        <Alert className="mb-4">
          <AlertTitle>Sign in required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>You've used all 3 free generations. Sign in to continue generating Strudel code.</span>
            <Button size="sm" onClick={handleSignIn}>Sign In</Button>
          </AlertDescription>
        </Alert>
      )}
      <ConversationWithFade className="flex-1 min-h-0">
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="pt-8 gap-4">
            {(() => {
              const messagesToRender = [...messages]
              if (status === 'submitted' && messagesToRender.length > 0 && messagesToRender[messagesToRender.length - 1].role !== 'assistant') {
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
                    {message.parts ? (
                      message.parts.map((part, i) => {
                        if (part.type === 'text' && 'text' in part) {
                          return (
                            <Message key={`${message.id}-${i}`} from={message.role}>
                              <MessageContent>
                                <MessageResponse>
                                  {part.text}
                                </MessageResponse>
                                {showTypingIndicator && i === (message.parts?.length ?? 0) - 1 && (
                                  <div className="text-left">
                                    <Icons.music className={`size-4 inline-block ${isTyping ? 'animate-pulse' : ''}`} />
                                  </div>
                                )}
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
                          const ToolIcon = Icons.music
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
                              <ToolIcon className={`size-5 ${isLoading ? 'opacity-50' : ''}`} />
                              <span className="text-sm font-medium">
                                {isLoading ? 'Generating Strudel Code...' : isCompleted ? 'Generated Strudel Code' : 'Strudel Code Tool'}
                              </span>
                            </div>
                          )
                        }
                        return null
                      })
                    ) : (
                      <Message from={message.role}>
                        <MessageContent>
                          <MessageResponse>
                            {'content' in message ? String(message.content || '') : ''}
                          </MessageResponse>
                          {showTypingIndicator && (
                            <div className="text-left">
                              <Icons.music className={`size-4 inline-block ${isTyping ? 'animate-pulse' : ''}`} />
                            </div>
                          )}
                        </MessageContent>
                      </Message>
                    )}
                  </div>
                )
              })
            })()}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </ConversationWithFade>
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
  )
}

export default function Chatbot({ prompt, chatId, onSnippetsGenerated, onToolError, onChatCreated, compileError, fixRequest, resetKey, onToolClick, currentSnippets }: ChatbotProps) {
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
      />
    </PromptInputProvider>
  )
}
