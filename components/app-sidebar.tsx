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
import { useSignIn } from '@/hooks/useSignIn'
import { Button } from '@/components/ui/button'
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
  const { handleSignIn, isSigningIn } = useSignIn()

  const { results: chats, status, loadMore } = usePaginatedQuery(
    api.chats.list,
    isAuthenticated ? {} : 'skip',
    { initialNumItems: 20 }
  )
  const removeChat = useMutation(api.chats.remove)
  const seenChatIdsRef = useRef<Set<string>>(new Set())
  const [animatingChatIds, setAnimatingChatIds] = useState<Set<string>>(new Set())

  const currentChatId = searchParams.get('chatId')

  const favouriteChats = chats
    ? [...chats]
        .filter((chat) => chat.pinned)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    : []

  const regularChats = chats
    ? [...chats]
        .filter((chat) => !chat.pinned)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    : []

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

  if (isAuthLoading && !pathname.startsWith('/generate')) {
    return null
  }

  if (!isAuthenticated && pathname === '/') {
    return null
  }

  const handleNewChat = () => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }
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

  const renderChatItems = (chatList: NonNullable<typeof chats>) => (
    <SidebarMenu>
      {chatList.map((chat) => (
        <SidebarChatItem
          key={chat._id}
          chatId={chat._id}
          title={chat.title}
          href={`/generate?chatId=${chat._id}&title=${encodeURIComponent(chat.title)}`}
          isActive={currentChatId === chat._id}
          isPinned={chat.pinned ?? false}
          isAnimating={animatingChatIds.has(chat._id)}
          onDelete={() => handleDeleteChat(chat._id)}
          onNavigate={() => isMobile && setOpenMobile(false)}
        />
      ))}
    </SidebarMenu>
  )

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
          {favouriteChats.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Favourites</SidebarGroupLabel>
              <SidebarGroupContent>
                {renderChatItems(favouriteChats)}
              </SidebarGroupContent>
            </SidebarGroup>
          )}
          <SidebarGroup>
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              {regularChats.length > 0 ? renderChatItems(regularChats) : null}
            </SidebarGroupContent>
          </SidebarGroup>
          {status === 'CanLoadMore' && (
            <div className="p-4 flex justify-center">
              <SidebarMenuButton onClick={() => loadMore(20)} className='justify-center text-muted-foreground'>
                Load More
              </SidebarMenuButton>
            </div>
          )}
        </SidebarContent>
      )}
      {!isAuthenticated && (isMobile || !isCollapsed) && (
        <SidebarContent className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              If you want to store your chat history, sign in to pick up where you left off.
            </p>
            <Button onClick={handleSignIn} disabled={isSigningIn} size="sm">
              {isSigningIn && <Icons.spinner className="animate-spin" />}
              Sign In
            </Button>
          </div>
        </SidebarContent>
      )}
      {isAuthenticated && <AuthButton variant="sidebar" />}
    </Sidebar>
  )
}
