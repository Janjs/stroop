'use client'

import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button } from '@/components/ui/button'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAnonymousSession } from '@/hooks/useAnonymousSession'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icons } from '@/components/icons'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/badge'
import About from '@/components/about'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'

export function AuthButton() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { signIn, signOut } = useAuthActions()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const anonymousSessionId = useAnonymousSession()
  const credits = useQuery(api.credits.getCredits, { anonymousSessionId: anonymousSessionId ?? undefined })
  const user = useQuery(api.user.getCurrentUser)

  const router = useRouter()

  const handleSignIn = () => {
    const isGeneratePage = pathname.startsWith('/generate')
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    void signIn('google', { redirectTo: isGeneratePage ? '/' : currentUrl })
  }

  const handleSignOut = async () => {
    await signOut()
    if (pathname.startsWith('/generate')) {
      router.push('/')
    }
  }

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    const initials = user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || user?.email?.[0].toUpperCase() || 'U'

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={(user?.image as string) ?? undefined} alt={(user?.name as string) ?? (user?.email as string) ?? 'User'} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-0">
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
                    className={`h-7 w-7 ${(theme === 'system' || (!theme)) ? 'bg-accent' : ''}`}
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
                    ? (credits.credits === null ? 'free' : credits.credits.toFixed(2))
                    : `${credits.credits} / 3`
                  }
                </Badge>
              )}
            </div>
            <About />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
            <Icons.signOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex gap-2 items-center">
      <About variant="icon" />
      <Button size="sm" className="h-8" onClick={handleSignIn}>
        Sign In
      </Button>
    </div>
  )
}
