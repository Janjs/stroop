'use client'

import { useState, useEffect } from 'react'

export const ANONYMOUS_SESSION_KEY = 'stroop_anonymous_session'

export function useAnonymousSession() {
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let id = localStorage.getItem(ANONYMOUS_SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANONYMOUS_SESSION_KEY, id)
    }
    setSessionId(id)
  }, [])

  return sessionId
}

export function clearAnonymousSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ANONYMOUS_SESSION_KEY)
  window.location.reload()
}
