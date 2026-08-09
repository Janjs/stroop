'use client'

import { SidebarProvider } from '@/components/ui/sidebar'

type AppSidebarProviderProps = {
  children: React.ReactNode
  defaultOpen: boolean
  style?: React.CSSProperties
}

export function AppSidebarProvider({
  children,
  defaultOpen,
  style,
}: AppSidebarProviderProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen} style={style}>
      {children}
    </SidebarProvider>
  )
}
