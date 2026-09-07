'use client'

import { usePathname } from 'next/navigation'
import { AuthButton } from '@/components/auth/auth-button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Icons } from '@/components/icons'
import Link from 'next/link'
import { useConvexAuth } from 'convex/react'

export default function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  if (pathname === '/generate') {
    return null
  }

  if (!isLoading && isAuthenticated && isLandingPage) {
    return null
  }

  const showSignedOutHeader = !isLoading && !isAuthenticated
  const showMobileSidebarTrigger = !isLoading && (isAuthenticated || !isLandingPage)

  return (
    <header className={`relative z-10 w-full flex-shrink-0 ${showSignedOutHeader ? 'px-5 md:px-10 lg:px-16' : 'px-3 pt-3 md:px-4'}`}>
      <nav
        className={
          showSignedOutHeader
            ? 'mx-auto flex min-h-14 w-full max-w-6xl items-center py-3'
            : 'flex min-h-12 w-full items-center gap-4 rounded-2xl border border-white/30 bg-background/65 px-3 shadow-sm backdrop-blur-2xl dark:border-white/10'
        }
        aria-label="Global"
      >
        <div className="flex items-center gap-3 min-w-0">
          {showMobileSidebarTrigger && <SidebarTrigger className="md:hidden" />}
          {!isLoading && !isAuthenticated && isLandingPage && (
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="flex aspect-square items-center justify-center">
                <Icons.logo className="size-6.5" />
              </div>
              <span className="font-outfit text-xl font-semibold tracking-[-0.03em]">stroop</span>
            </Link>
          )}
        </div>
        {showSignedOutHeader ? (
          <div className="flex gap-3 ml-auto items-center">
            <AuthButton />
          </div>
        ) : null}
      </nav>
    </header>
  )
}
