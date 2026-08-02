'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HeartIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { ChatTitleLabel } from '@/components/chat-title-label'
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SidebarChatItemProps {
  chatId: Id<'chats'>
  title: string
  href: string
  isActive: boolean
  isPinned?: boolean
  isAnimating?: boolean
  onDelete: () => void | Promise<void>
  onNavigate?: () => void
}

export function SidebarChatItem({
  chatId,
  title,
  href,
  isActive,
  isPinned = false,
  isAnimating = false,
  onDelete,
  onNavigate,
}: SidebarChatItemProps) {
  const updateChat = useMutation(api.chats.update)
  const [isHovered, setIsHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(title)

  const openEdit = () => {
    setEditTitle(title)
    setIsEditOpen(true)
  }

  const handleSaveTitle = async () => {
    const nextTitle = editTitle.trim() || 'New chat'
    await updateChat({ id: chatId, title: nextTitle })
    setIsEditOpen(false)
  }

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await updateChat({ id: chatId, pinned: !isPinned })
  }

  const showActions = isHovered || isMenuOpen

  return (
    <>
      <SidebarMenuItem
        className={cn(
          isAnimating && 'animate-in fade-in-0 slide-in-from-top-2 duration-300'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={cn(
            'duration-200 [&>a>span]:truncate-none',
            'group-has-[[data-sidebar=menu-action]]/menu-item:!pr-2',
            showActions && 'group-has-[[data-sidebar=menu-action]]/menu-item:!pr-12'
          )}
        >
          <Link href={href} onClick={onNavigate} className="block min-w-0 w-full">
            <ChatTitleLabel title={title} isHovered={isHovered} className="w-full" />
          </Link>
        </SidebarMenuButton>

        <SidebarMenuAction
          className={cn('right-6', showActions ? 'opacity-100' : 'opacity-0')}
          onClick={(e) => void handleTogglePin(e)}
        >
          <HeartIcon className={cn('size-4', isPinned && 'fill-current')} />
          <span className="sr-only">{isPinned ? 'Unfavourite chat' : 'Favourite chat'}</span>
        </SidebarMenuAction>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className={showActions ? 'opacity-100' : 'opacity-0'}
              onClick={(e) => e.preventDefault()}
            >
              <MoreVerticalIcon className="size-4" />
              <span className="sr-only">Chat options</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="right">
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                openEdit()
              }}
            >
              <PencilIcon className="size-4" />
              Edit title
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.preventDefault()
                void onDelete()
              }}
            >
              <Trash2Icon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit chat title</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSaveTitle()
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveTitle()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
