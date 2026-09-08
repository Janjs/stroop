'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useSignIn } from '@/hooks/useSignIn'
import { Button } from '@/components/ui/button'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { SubscribeDialog } from '@/components/billing/subscribe-dialog'
import { useBilling } from '@/hooks/useBilling'
import { UsageMeter } from '@/components/billing/usage-meter'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Icons } from '@/components/icons'
import About from '@/components/about'
import ModeToggle from '@/components/mode-toggle'
import { AppearanceSettings } from '@/components/appearance-settings'
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
  usage: ReturnType<typeof useBilling>
  onSubscribe: () => void
  onManage: () => void
  isBillingBusy?: boolean
  onSignOut: () => void
  trigger: ReactNode
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
}

function UserMenu({
  user,
  initials,
  usage,
  onSubscribe,
  onManage,
  isBillingBusy,
  onSignOut,
  trigger,
  align = 'end',
  side = 'bottom',
}: UserMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        if (isBillingBusy && !next) return
        setOpen(next)
      }}
    >
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-72 p-0">
        <div className="px-3 py-2.5">
          <div className="flex flex-col space-y-1">
            {user?.name && <p className="text-sm font-medium">{user.name}</p>}
            {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
            {!user?.name && !user?.email && <p className="text-sm font-medium">User</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <AppearanceSettings />
        <DropdownMenuSeparator />
        <div className="p-1">
          {usage && <UsageMeter usage={usage} />}
          {usage?.isSubscribed ? (
            <DropdownMenuItem
              disabled={isBillingBusy}
              className="cursor-pointer"
              onSelect={(event) => {
                event.preventDefault()
                onManage()
              }}
            >
              {isBillingBusy ? <Icons.spinner className="h-4 w-4 animate-spin" /> : <Icons.pricing className="h-4 w-4" />}
              <span>Manage plan</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onSubscribe} className="cursor-pointer">
              <Icons.pricing className="h-4 w-4" />
              <span>Subscribe · $5/mo</span>
            </DropdownMenuItem>
          )}
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
        {isSigningIn ? <Icons.spinner className="animate-spin" /> : <Icons.google />}
        Sign in with Google
      </Button>
    </div>
  )
}

function SidebarAuthButton() {
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const usage = useBilling()
  const user = useQuery(api.user.getCurrentUser)
  const [subscribeOpen, setSubscribeOpen] = useState(false)
  const [isBillingBusy, setIsBillingBusy] = useState(false)
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
      <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <SubscribeDialog open={subscribeOpen} onOpenChange={setSubscribeOpen} />
        <UserMenu
          user={user}
          initials={initials}
          usage={usage}
          onSubscribe={() => setSubscribeOpen(true)}
          onManage={async () => {
            setIsBillingBusy(true)
            try {
              const response = await fetch('/api/billing/portal', { method: 'POST' })
              const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
              if (!response.ok || !data.url) throw new Error(data.error || 'Could not open portal')
              window.location.assign(data.url)
            } catch {
              setIsBillingBusy(false)
            }
          }}
          isBillingBusy={isBillingBusy}
          onSignOut={handleSignOut}
          align="start"
          side="top"
          trigger={
            <SidebarMenuButton
              size="lg"
              tooltip={displayName}
              className="h-12 rounded-xl focus-visible:ring-0 hover:bg-muted/70 data-[state=open]:bg-muted/70 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
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
