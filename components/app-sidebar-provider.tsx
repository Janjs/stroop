'use client'

import { useEffect } from 'react'
import { useConvexAuth } from 'convex/react'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'

function SidebarDefaultSync({ hasSavedPreference }: { hasSavedPreference: boolean }) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { setOpen } = useSidebar()

  useEffect(() => {
    if (hasSavedPreference || isLoading) return
    setOpen(isAuthenticated)
  }, [hasSavedPreference, isLoading, isAuthenticated, setOpen])

  return null
}

type AppSidebarProviderProps = {
  children: React.ReactNode
  defaultOpen: boolean
  hasSavedPreference: boolean
  style?: React.CSSProperties
}

export function AppSidebarProvider({
  children,
  defaultOpen,
  hasSavedPreference,
  style,
}: AppSidebarProviderProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen} style={style}>
      <SidebarDefaultSync hasSavedPreference={hasSavedPreference} />
      {children}
    </SidebarProvider>
  )
}
