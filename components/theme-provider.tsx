'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes'

function ThemeGuard() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const resolvedThemeRef = React.useRef(resolvedTheme)
  resolvedThemeRef.current = resolvedTheme

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return
    const html = document.documentElement

    const sync = () => {
      const resolved = resolvedThemeRef.current
      if (!resolved) return
      const shouldBeDark = resolved === 'dark'
      const isDark = html.classList.contains('dark')
      const hasLight = html.classList.contains('light')
      const isCorrect = shouldBeDark ? isDark && !hasLight : hasLight && !isDark
      if (isCorrect) return
      html.classList.remove('light', 'dark')
      html.classList.add(shouldBeDark ? 'dark' : 'light')
      html.style.colorScheme = shouldBeDark ? 'dark' : 'light'
    }

    sync()

    let rafId = 0
    let syncing = false
    const observer = new MutationObserver(() => {
      if (syncing) return
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        syncing = true
        sync()
        syncing = false
      })
    })
    observer.observe(html, { attributes: true, attributeFilter: ['class', 'style'] })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [mounted, resolvedTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeGuard />
      {children}
    </NextThemesProvider>
  )
}
