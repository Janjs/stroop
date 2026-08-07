'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useSignIn } from '@/hooks/useSignIn'
import { Button } from '@/components/ui/button'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Icons } from '@/components/icons'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/badge'
import About from '@/components/about'
import ModeToggle from '@/components/mode-toggle'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

type AuthButtonProps = {
  variant?: 'header' | 'sidebar'
}

type UserMenuProps = {
  user: {
    name?: string | null
    email?: string | null
    image?: unknown
  } | null | undefined
  initials: string
  credits: {
    isAuthenticated?: boolean
    credits?: number | null
  } | null | undefined
  theme: string | undefined
  setTheme: (theme: string) => void
  onSignOut: () => void
  trigger: ReactNode
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
}

function UserMenu({
  user,
  initials,
  credits,
  theme,
  setTheme,
  onSignOut,
  trigger,
  align = 'end',
  side = 'bottom',
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-56 p-0">
        <div className="px-3 py-2.5">
          <div className="flex flex-col space-y-1">
            {user?.name && <p className="text-sm font-medium">{user.name}</p>}
            {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            {!user?.name && !user?.email && <p className="text-sm font-medium">User</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="px-3 py-2.5">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Preferences</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm">Theme</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${theme === 'system' || !theme ? 'bg-accent' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <Icons.laptop className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${theme === 'light' ? 'bg-accent' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Icons.sun className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${theme === 'dark' ? 'bg-accent' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Icons.moon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="p-1">
          <div className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm w-full">
            <Icons.credits className="h-4 w-4" />
            <span>Credits</span>
            {credits && (
              <Badge variant="outline" className="ml-auto text-xs">
                {credits.isAuthenticated
                  ? credits.credits === null || credits.credits === undefined
                    ? 'free'
                    : credits.credits.toFixed(2)
                  : `${credits.credits ?? 0} / 3`}
              </Badge>
            )}
          </div>
          <About />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
          <Icons.signOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function HeaderAuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signIn } = useAuthActions()
  const pathname = usePathname()
  const [isSigningIn, setIsSigningIn] = useState(false)

  if (isLoading || isAuthenticated) {
    return null
  }

  const handleSignIn = () => {
    setIsSigningIn(true)
    void signIn('google', { redirectTo: pathname })
  }

  return (
    <div className="flex gap-2 items-center">
      <About variant="icon" />
      <ModeToggle />
      <Button onClick={handleSignIn} disabled={isSigningIn}>
        {isSigningIn && <Icons.spinner className="animate-spin" />}
        Sign In
      </Button>
    </div>
  )
}

function SidebarAuthButton() {
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })
  const user = useQuery(api.user.getCurrentUser)
  const router = useRouter()

  const isGeneratePage = pathname.startsWith('/generate')
  const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
  const { handleSignIn, isSigningIn } = useSignIn({ redirectTo: isGeneratePage ? '/' : currentUrl })

  const handleSignOut = async () => {
    await signOut()
    if (pathname.startsWith('/generate')) {
      router.push('/')
    }
  }

  if (isAuthenticated) {
    const initials =
      user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ||
      user?.email?.[0].toUpperCase() ||
      'U'
    const displayName = user?.name || user?.email || 'User'

    return (
      <SidebarFooter className="mt-auto px-2 pt-2 pb-4 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <UserMenu
              user={user}
              initials={initials}
              credits={credits}
              theme={theme}
              setTheme={setTheme}
              onSignOut={handleSignOut}
              align="start"
              side="top"
              trigger={
                <SidebarMenuButton
                  size="lg"
                  variant="outline"
                  tooltip={displayName}
                  className="h-10 focus-visible:ring-0 data-[state=open]:bg-muted group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                >
                  <Avatar className="size-7 group-data-[collapsible=icon]:size-6">
                    <AvatarImage
                      src={(user?.image as string) ?? undefined}
                      alt={(user?.name as string) ?? (user?.email as string) ?? 'User'}
                    />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{displayName}</span>
                    {user?.email && user?.name && (
                      <span className="truncate text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    )
  }

  return null
}

export function AuthButton({ variant = 'header' }: AuthButtonProps) {
  if (variant === 'header') {
    return <HeaderAuthButton />
  }

  return <SidebarAuthButton />
}
