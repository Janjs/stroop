'use client'

import { useConvexAuth } from 'convex/react'
import Header from '@/app/header'
import { SidebarInset } from '@/components/ui/sidebar'
import { AppSidebarProvider } from '@/components/app-sidebar-provider'
import { AppSidebar } from '@/components/app-sidebar'

type AppLayoutProps = {
  children: React.ReactNode
  defaultOpenFromCookie: boolean
  hasSavedPreference: boolean
}

export function AppLayout({ children, defaultOpenFromCookie, hasSavedPreference }: AppLayoutProps) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return <div className="min-h-svh bg-background" aria-busy="true" />
  }

  const defaultOpen = hasSavedPreference ? defaultOpenFromCookie : isAuthenticated

  return (
    <AppSidebarProvider
      defaultOpen={defaultOpen}
      style={{ '--sidebar-width': '13rem' } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <div className="h-[100dvh] flex flex-col min-w-0">
          <Header />
          <div className="flex flex-1 min-h-0 overflow-auto justify-center min-w-0">{children}</div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  )
}
