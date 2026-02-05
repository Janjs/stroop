'use client'

import { StrudelSnippet } from '@/types/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from '@/components/ai-elements/code-block'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StrudelCodeViewerProps {
  snippets: StrudelSnippet[]
  activeIndex: number
  onSelect: (index: number) => void
  isLoading?: boolean
}

const StrudelCodeViewer = ({ snippets, activeIndex, onSelect, isLoading = false }: StrudelCodeViewerProps) => {
  const clampedIndex = Math.min(Math.max(activeIndex, 0), Math.max(snippets.length - 1, 0))
  const activeSnippet = snippets[clampedIndex]
  const canOpen = Boolean(activeSnippet?.code)

  const handleOpenInStrudel = async () => {
    if (!activeSnippet?.code) return
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(activeSnippet.code)
      } catch {}
    }
    window.open('https://strudel.cc/', '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Strudel code</CardTitle>
            <CardDescription>Generated snippets ready for Strudel.</CardDescription>
          </div>
          {snippets.length > 1 && (
            <Select value={String(clampedIndex)} onValueChange={(value) => onSelect(Number(value))}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="Select snippet" />
              </SelectTrigger>
              <SelectContent>
                {snippets.map((snippet, index) => (
                  <SelectItem key={`${snippet.title ?? 'snippet'}-${index}`} value={String(index)}>
                    {snippet.title ?? `Pattern ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        {snippets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {isLoading ? 'Generating Strudel code...' : 'Your Strudel code will appear here.'}
          </div>
        ) : (
          <CodeBlock code={activeSnippet.code} language="javascript" className="flex-1 min-h-0">
            <CodeBlockHeader>
              <CodeBlockTitle>
                <CodeBlockFilename>{activeSnippet.title ?? `Pattern ${clampedIndex + 1}`}</CodeBlockFilename>
              </CodeBlockTitle>
              <CodeBlockActions>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleOpenInStrudel}
                  disabled={!canOpen}
                >
                  <ExternalLink />
                  Open in Strudel
                </Button>
                <CodeBlockCopyButton />
              </CodeBlockActions>
            </CodeBlockHeader>
          </CodeBlock>
        )}
      </CardContent>
    </Card>
  )
}

export default StrudelCodeViewer
