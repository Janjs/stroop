'use client'

import useGenerateSearchParams from '@/hooks/useGenerateSearchParams'
import { usePathname } from 'next/navigation'
import { AuthButton } from '@/components/auth/auth-button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { useConvexAuth } from 'convex/react'

import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { useSearchParams } from 'next/navigation'

export default function Header() {
  const [prompt] = useGenerateSearchParams()
  const searchParams = useSearchParams()
  const chatId = searchParams.get('chatId')
  const title = searchParams.get('title')
  const { isAuthenticated } = useConvexAuth()

  const chat = useQuery(
    api.chats.get,
    chatId && isAuthenticated ? { id: chatId as Id<'chats'> } : 'skip'
  )

  const displayPrompt = chat?.title || title || prompt

  const pathname = usePathname()
  const isGeneratePage = pathname === '/generate'

  return (
    <header className="flex-shrink-0 relative">
      <nav className="flex gap-4 items-center px-4 py-3 min-h-[3.5rem]" aria-label="Global">
        <div className={`flex items-center gap-3 flex-shrink-0 ${isGeneratePage ? 'md:w-72 lg:w-[25rem]' : ''}`}>
          {(isAuthenticated || isGeneratePage) && <SidebarTrigger className="md:hidden" />}
          {!isAuthenticated && !isGeneratePage && (
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="flex aspect-square items-center justify-center">
                <Icons.logo className="size-6.5" />
              </div>
              <span className="text-2xl font-outfit">stroop</span>
            </Link>
          )}
          {displayPrompt ? (
            <h2 className="text-lg text-ellipsis overflow-hidden whitespace-nowrap max-w-[22rem] font-outfit">{`${displayPrompt}`}</h2>
          ) : null}
        </div>
        <div className="flex gap-3 ml-auto items-center">
          <AuthButton />
        </div>
      </nav>
    </header>
  )
}
