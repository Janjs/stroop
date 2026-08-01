'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface ChatTitleLabelProps {
  title: string
  isHovered?: boolean
  className?: string
}

export function ChatTitleLabel({
  title,
  isHovered = false,
  className,
}: ChatTitleLabelProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [marqueeStyle, setMarqueeStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      const text = textRef.current
      if (!container || !text) return

      const overflows = text.scrollWidth > container.clientWidth

      if (!isHovered || !overflows) {
        setShouldAnimate(false)
        setMarqueeStyle({})
        return
      }

      const offset = Math.min(0, container.clientWidth - text.scrollWidth)
      setShouldAnimate(true)
      setMarqueeStyle({
        '--marquee-offset': `${offset}px`,
        '--marquee-duration': `${Math.max(3, title.length * 0.1)}s`,
      } as React.CSSProperties)
    }

    measure()
    const frame = window.requestAnimationFrame(measure)
    return () => window.cancelAnimationFrame(frame)
  }, [isHovered, title])

  return (
    <span ref={containerRef} className={cn('block min-w-0 overflow-hidden', className)}>
      <span
        ref={textRef}
        className={cn('inline-block whitespace-nowrap', shouldAnimate && 'animate-title-marquee')}
        style={shouldAnimate ? marqueeStyle : undefined}
      >
        {title}
      </span>
    </span>
  )
}
