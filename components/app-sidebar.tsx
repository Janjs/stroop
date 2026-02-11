'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { PlusIcon, PanelLeftIcon, Trash2Icon, ChevronUp } from 'lucide-react'
import { useQuery, useMutation, useConvexAuth, usePaginatedQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import { useAuthActions } from '@convex-dev/auth/react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

function groupChatsByDate(
  chats: Array<{ _id: Id<'chats'>; title: string; updatedAt: number }>
) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const groups: Record<string, typeof chats> = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    'Last 30 days': [],
    Older: [],
  }

  for (const chat of chats) {
    const chatDate = new Date(chat.updatedAt)
    if (chatDate >= today) {
      groups.Today.push(chat)
    } else if (chatDate >= yesterday) {
      groups.Yesterday.push(chat)
    } else if (chatDate >= lastWeek) {
      groups['Last 7 days'].push(chat)
    } else if (chatDate >= lastMonth) {
      groups['Last 30 days'].push(chat)
    } else {
      groups.Older.push(chat)
    }
  }

  return groups
}

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { state, toggleSidebar, isMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const { isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()

  const { results: chats, status, loadMore } = usePaginatedQuery(
    api.chats.list,
    isAuthenticated ? {} : 'skip',
    { initialNumItems: 20 }
  )
  const removeChat = useMutation(api.chats.remove)

  const currentChatId = searchParams.get('chatId')

  if (!isAuthenticated && pathname === '/') {
    return null
  }

  const handleNewChat = () => {
    if (pathname.startsWith('/generate')) {
      router.push(`/generate?new=${Date.now()}`)
    } else {
      router.push('/')
    }
  }

  const handleDeleteChat = async (
    e: React.MouseEvent,
    chatId: Id<'chats'>
  ) => {
    e.preventDefault()
    e.stopPropagation()
    await removeChat({ id: chatId })
    if (currentChatId === chatId) {
      if (pathname.startsWith('/generate')) {
        router.push('/generate')
      } else {
        router.push('/')
      }
    }
  }

  const handleSignIn = () => {
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: currentUrl })
  }

  const groupedChats = chats ? groupChatsByDate(chats) : null

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-muted data-[state=open]:text-foreground hover:bg-background "
            >
              <Link href="/" className="flex items-center min-h-12 ml-1 gap-2">
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

      {(isMobile || !isCollapsed) && (
        <SidebarContent>
          {isAuthenticated ? (
            <>
              {groupedChats &&
                Object.entries(groupedChats).map(
                  ([group, chatsInGroup]) =>
                    chatsInGroup.length > 0 && (
                      <Collapsible key={group} defaultOpen className="group/collapsible">
                        <SidebarGroup>
                          <SidebarGroupLabel asChild>
                            <CollapsibleTrigger>
                              {group}
                              <ChevronUp className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                          </SidebarGroupLabel>
                          <CollapsibleContent>
                            <SidebarGroupContent>
                              <SidebarMenu>
                                {chatsInGroup.map((chat) => (
                                  <SidebarMenuItem key={chat._id}>
                                    <SidebarMenuButton
                                      asChild
                                      isActive={currentChatId === chat._id}
                                      tooltip={chat.title}
                                      className={cn(
                                        "group-has-[[data-sidebar=menu-action]]/menu-item:pr-2 group-has-[[data-sidebar=menu-action]]/menu-item:group-hover/menu-item:pr-8 duration-200",
                                        isMobile && "group-has-[[data-sidebar=menu-action]]/menu-item:pr-8"
                                      )}
                                    >
                                      <Link href={`/generate?chatId=${chat._id}&title=${encodeURIComponent(chat.title)}`}>
                                        <span>{chat.title}</span>
                                      </Link>
                                    </SidebarMenuButton>
                                    <SidebarMenuAction
                                      onClick={(e) => handleDeleteChat(e, chat._id)}
                                      className="group-hover/menu-item:opacity-100 md:opacity-0 hover:bg-destructive hover:text-destructive-foreground transition-opacity"
                                    >
                                      <Trash2Icon className="size-4" />
                                      <span className="sr-only">Delete</span>
                                    </SidebarMenuAction>
                                  </SidebarMenuItem>
                                ))}
                              </SidebarMenu>
                            </SidebarGroupContent>
                          </CollapsibleContent>
                        </SidebarGroup>
                      </Collapsible>
                    )
                )}
              {chats && chats.length === 0 && (
                <SidebarGroup>
                  <SidebarGroupContent>
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      No chat history yet
                    </div>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
              {status === 'CanLoadMore' && (
                <div className="p-4 flex justify-center">
                  <SidebarMenuButton onClick={() => loadMore(20)} className='justify-center text-muted-foreground'>
                    Load More
                  </SidebarMenuButton>
                </div>
              )}
            </>
          ) : (
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="px-2 py-4 text-sm text-muted-foreground text-center mb-2">
                  Sign in to save your history
                </div>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignIn}>
                      <span>Sign In</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      )}
    </Sidebar>
  )
}
