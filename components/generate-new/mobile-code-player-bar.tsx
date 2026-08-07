'use client'

import { useState } from 'react'
import { Check, ChevronUp, Copy, Share2 } from 'lucide-react'
import { MorphButton } from '@/components/interior/morph-button'
import { Button } from '@/components/ui/button'

type MobileCodePlayerBarProps = {
  isPlaying: boolean
  canPlay: boolean
  hasCode: boolean
  isStreaming: boolean
  onTogglePlayback: () => void
  onCopy: () => void
  onShare: () => void
  onExpandCode: () => void
}

export function MobileCodePlayerBar({
  isPlaying,
  canPlay,
  hasCode,
  isStreaming,
  onTogglePlayback,
  onCopy,
  onShare,
  onExpandCode,
}: MobileCodePlayerBarProps) {
  const [hasCopied, setHasCopied] = useState(false)

  const handleCopy = () => {
    onCopy()
    setHasCopied(true)
    window.setTimeout(() => setHasCopied(false), 1500)
  }

  const actionsDisabled = isStreaming || !hasCode

  return (
    <div className="mb-3 grid grid-cols-3 items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={handleCopy}
          disabled={actionsDisabled}
          aria-label="Copy code"
        >
          {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
          onClick={onShare}
          disabled={actionsDisabled}
          aria-label="Share output"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex justify-center">
        <MorphButton
          active={isPlaying}
          onToggle={onTogglePlayback}
          disabled={!canPlay || isStreaming}
          showLabel
          className="h-9 shrink-0 px-4"
        />
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onExpandCode} className="shrink-0 gap-1">
          <ChevronUp className="size-3.5" />
          View code
        </Button>
      </div>
    </div>
  )
}
