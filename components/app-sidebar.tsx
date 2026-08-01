'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PlusIcon, PanelLeftIcon } from 'lucide-react'
import { useMutation, useConvexAuth, usePaginatedQuery } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Icons } from '@/components/icons'
import { AuthButton } from '@/components/auth/auth-button'
import { SidebarChatItem } from '@/components/sidebar-chat-item'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()

  const { results: chats, status, loadMore } = usePaginatedQuery(
    api.chats.list,
    isAuthenticated ? {} : 'skip',
    { initialNumItems: 20 }
  )
  const removeChat = useMutation(api.chats.remove)
  const seenChatIdsRef = useRef<Set<string>>(new Set())
  const [animatingChatIds, setAnimatingChatIds] = useState<Set<string>>(new Set())

  const currentChatId = searchParams.get('chatId')

  useEffect(() => {
    if (!chats) return

    const newIds = chats
      .map((chat) => chat._id)
      .filter((id) => !seenChatIdsRef.current.has(id))

    if (newIds.length === 0) return

    for (const id of newIds) {
      seenChatIdsRef.current.add(id)
    }

    setAnimatingChatIds((prev) => new Set([...prev, ...newIds]))

    const timeoutId = window.setTimeout(() => {
      setAnimatingChatIds((prev) => {
        const next = new Set(prev)
        for (const id of newIds) {
          next.delete(id)
        }
        return next
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [chats])

  if (!isAuthenticated && !isAuthLoading) {
    return null
  }

  if (isAuthLoading && !pathname.startsWith('/generate')) {
    return null
  }

  const handleNewChat = () => {
    if (pathname.startsWith('/generate')) {
      router.push(`/generate?new=${Date.now()}`)
    } else {
      router.push('/')
    }
  }

  const handleDeleteChat = async (chatId: Id<'chats'>) => {
    await removeChat({ id: chatId })
    if (currentChatId === chatId) {
      if (pathname.startsWith('/generate')) {
        router.push('/generate')
      } else {
        router.push('/')
      }
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-muted data-[state=open]:text-foreground hover:bg-background"
            >
              <Link href="/" className="flex min-h-12 items-center gap-2 ml-1">
                <div className="flex aspect-square items-center justify-center">
                  <Icons.logo className="size-6.5" />
                </div>
                <span className="text-2xl font-outfit">Stroop</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton onClick={toggleSidebar}>
                  <PanelLeftIcon className="size-4" />
                  <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" hidden={!isCollapsed || isMobile}>
                {isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton onClick={handleNewChat}>
                  <PlusIcon className="size-4" />
                  <span>New Chat</span>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" hidden={!isCollapsed || isMobile}>
                New Chat
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {isAuthenticated && (isMobile || !isCollapsed) && (
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              {chats && chats.length > 0 ? (
                <SidebarMenu>
                  {chats.map((chat) => (
                    <SidebarChatItem
                      key={chat._id}
                      chatId={chat._id}
                      title={chat.title}
                      href={`/generate?chatId=${chat._id}&title=${encodeURIComponent(chat.title)}`}
                      isActive={currentChatId === chat._id}
                      isAnimating={animatingChatIds.has(chat._id)}
                      isMobile={isMobile}
                      onDelete={() => handleDeleteChat(chat._id)}
                      onNavigate={() => isMobile && setOpenMobile(false)}
                    />
                  ))}
                </SidebarMenu>
              ) : null}
            </SidebarGroupContent>
          </SidebarGroup>
          {isAuthenticated && status === 'CanLoadMore' && (
            <div className="p-4 flex justify-center">
              <SidebarMenuButton onClick={() => loadMore(20)} className='justify-center text-muted-foreground'>
                Load More
              </SidebarMenuButton>
            </div>
          )}
        </SidebarContent>
      )}
      {isAuthenticated && <AuthButton variant="sidebar" />}
    </Sidebar>
  )
}
