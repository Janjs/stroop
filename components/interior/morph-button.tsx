'use client'

import { motion, useReducedMotion } from 'motion/react'
import { buttonVariants, type ButtonProps } from '@/components/ui/button'
import {
  useIconMorph,
  type IconMorphPreset,
  type IconMorphSemantics,
  type MorphShape,
} from '@/components/interior/icon-morph'
import { cn } from '@/lib/utils'

const CROSSFADE = { type: 'spring', stiffness: 260, damping: 34, mass: 0.8 } as const
const INSTANT = { duration: 0 } as const

type MorphButtonProps = {
  preset?: IconMorphPreset
  shapes?: readonly MorphShape[]
  active: boolean
  onToggle: () => void
  disabled?: boolean
  showLabel?: boolean
  iconSize?: number
  strokeWidth?: number
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  semantics?: IconMorphSemantics
  className?: string
}

export function MorphButton({
  preset = 'play-pause',
  shapes,
  active,
  onToggle,
  disabled = false,
  showLabel = true,
  iconSize = 16,
  strokeWidth = 1.75,
  variant = 'default',
  size,
  semantics = 'pressed',
  className,
}: MorphButtonProps) {
  const reduced = useReducedMotion()
  const fade = reduced ? INSTANT : CROSSFADE

  const { index, slots, rotate, mode, label, labels, transition } = useIconMorph({
    preset,
    shapes,
    active,
  })

  const stroked = mode === 'stroke'

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={semantics === 'pressed' ? active : undefined}
      aria-expanded={semantics === 'expanded' ? active : undefined}
      whileTap={disabled || reduced ? undefined : { y: 1 }}
      transition={transition}
      className={cn(
        buttonVariants({ variant, size }),
        'select-none justify-center',
        showLabel && 'min-w-28 rounded-full shadow-sm',
        !showLabel && 'rounded-full',
        className,
      )}
      style={{ touchAction: 'manipulation' }}
    >
      <span
        aria-hidden="true"
        className="grid shrink-0 place-items-center overflow-visible"
        style={{ width: iconSize, height: iconSize }}
      >
        <motion.span
          initial={false}
          animate={{ rotate }}
          transition={transition}
          className="col-start-1 row-start-1 grid place-items-center overflow-visible"
          style={{ width: iconSize, height: iconSize }}
        >
          <svg
            viewBox="0 0 24 24"
            width={iconSize}
            height={iconSize}
            focusable="false"
            fill={stroked ? 'none' : 'currentColor'}
            stroke={stroked ? 'currentColor' : 'none'}
            strokeWidth={stroked ? strokeWidth : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="overflow-visible"
            style={{ display: 'block', overflow: 'visible' }}
          >
            {slots.map((slot) => (
              <motion.path
                key={slot.key}
                initial={false}
                animate={{ d: slot.d, opacity: slot.visible ? 1 : 0 }}
                transition={transition}
              />
            ))}
          </svg>
        </motion.span>
      </span>

      {showLabel ? (
        <span aria-hidden="true" className="grid">
          {labels.map((text, i) => {
            const isActive = i === index
            return (
              <motion.span
                key={text}
                initial={false}
                animate={
                  isActive
                    ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                    : { opacity: 0, y: 3, filter: 'blur(3px)' }
                }
                transition={fade}
                className="col-start-1 row-start-1 whitespace-nowrap"
              >
                {text}
              </motion.span>
            )
          })}
        </span>
      ) : null}
    </motion.button>
  )
}
