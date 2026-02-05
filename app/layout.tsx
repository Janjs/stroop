import { Suspense } from 'react'
import Header from './header'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ConvexClientProvider from '@/lib/convex-client'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export const metadata = {
  title: 'Stroop',
  description: 'Strudel Code Generator',
  content: 'width=device-width, initial-scale=1',
  name: 'viewport',
}

import { Outfit } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <head>
       {/* <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />  */}
      </head>
      <body className="font-sans">
        <ConvexAuthNextjsServerProvider apiRoute="/api/auth">
          <ConvexClientProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              <SidebarProvider defaultOpen={false} style={{ '--sidebar-width': '13rem' } as React.CSSProperties}>
                <AppSidebar />
                <SidebarInset>
                  <div className="h-[100dvh] flex flex-col min-w-0">
                    <Suspense fallback={null}>
                      <Header />
                    </Suspense>
                    <div className="flex flex-1 overflow-hidden justify-center min-w-0">{children}</div>
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
