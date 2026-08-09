import { cookies } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ConvexClientProvider from '@/lib/convex-client'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import { AppLayout } from '@/components/app-layout'
import { themeInitScript } from '@/lib/theme-script'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://stroop.janjs.dev'),
  title: 'stroop',
  description: 'Strudel Code Generator',
  content: 'width=device-width, initial-scale=1',
  name: 'viewport',
}

import { Outfit, Fascinate } from 'next/font/google'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const fascinate = Fascinate({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-fascinate',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get('sidebar_state')?.value
  const hasSavedPreference = sidebarState !== undefined
  const defaultOpen = hasSavedPreference ? sidebarState === 'true' : false

  return (
    <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${fascinate.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <ConvexAuthNextjsServerProvider apiRoute="/api/auth">
          <ConvexClientProvider>
            <ThemeProvider>
              <AppLayout
                defaultOpenFromCookie={defaultOpen}
                hasSavedPreference={hasSavedPreference}
              >
                {children}
              </AppLayout>
            </ThemeProvider>
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
