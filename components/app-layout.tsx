'use client'

import { useConvexAuth } from 'convex/react'
import Header from '@/app/header'
import { SidebarInset } from '@/components/ui/sidebar'
import { AppSidebarProvider } from '@/components/app-sidebar-provider'
import { AppSidebar } from '@/components/app-sidebar'
import { BillingGate } from '@/components/billing/billing-gate'

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

  const defaultOpen = isAuthenticated && (hasSavedPreference ? defaultOpenFromCookie : true)

  return (
    <AppSidebarProvider
      defaultOpen={defaultOpen}
      style={{ '--sidebar-width': '14rem' } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <div className="relative z-[1] flex h-[100dvh] min-w-0 flex-col">
          <Header />
          <BillingGate />
          <div className="flex flex-1 min-h-0 overflow-auto justify-center min-w-0">{children}</div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  )
}
