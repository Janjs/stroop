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

  const showSignedOutHeader = !isLoading && !isAuthenticated
  const showMobileSidebarTrigger = !isLoading && (isAuthenticated || !isLandingPage)

  return (
    <header className="relative z-10 w-full flex-shrink-0">
      <nav className="flex w-full items-center gap-4 px-4 py-3 min-h-[3.5rem]" aria-label="Global">
        <div className="flex items-center gap-3 min-w-0">
          {showMobileSidebarTrigger && <SidebarTrigger className="md:hidden" />}
          {!isLoading && !isAuthenticated && isLandingPage && (
            <Link href="/" className="flex items-center gap-2 mr-4">
              <div className="flex aspect-square items-center justify-center">
                <Icons.logo className="size-6.5" />
              </div>
              <span className="text-2xl font-outfit">stroop</span>
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
