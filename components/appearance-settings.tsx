'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Icons } from '@/components/icons'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
  applyBackground,
  applyPanelOpacity,
  BACKGROUNDS,
  type BackgroundId,
  DEFAULT_PANEL_OPACITY,
  MAX_PANEL_OPACITY,
  MIN_PANEL_OPACITY,
  readStoredPanelOpacity,
  storePanelOpacity,
} from '@/lib/appearance'

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [background, setBackground] = useState<BackgroundId>('none')
  const [panelOpacity, setPanelOpacity] = useState(DEFAULT_PANEL_OPACITY)

  useEffect(() => {
    const saved = localStorage.getItem('background') as BackgroundId | null
    if (BACKGROUNDS.some((option) => option.id === saved)) setBackground(saved!)
    const opacity = readStoredPanelOpacity()
    setPanelOpacity(opacity)
    applyPanelOpacity(opacity)
  }, [])

  const chooseBackground = (value: BackgroundId) => {
    setBackground(value)
    applyBackground(value)
  }

  const choosePanelOpacity = (value: number[]) => {
    const next = storePanelOpacity(value[0] ?? DEFAULT_PANEL_OPACITY)
    setPanelOpacity(next)
  }

  const themes = [
    { id: 'system', label: 'System', icon: Icons.laptop },
    { id: 'light', label: 'Light', icon: Icons.sun },
    { id: 'dark', label: 'Dark', icon: Icons.moon },
  ]

  return (
    <div className="space-y-4 p-3">
      <section aria-labelledby="theme-heading">
        <h3 id="theme-heading" className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Appearance
        </h3>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1" role="radiogroup" aria-label="Color theme">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={(theme || 'system') === id}
              onClick={() => setTheme(id)}
              className={cn(
                'flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-[background-color,box-shadow,transform] active:scale-[0.97]',
                (theme || 'system') === id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="background-heading">
        <h3 id="background-heading" className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Background
        </h3>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="App background">
          {BACKGROUNDS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={background === option.id}
              onClick={() => chooseBackground(option.id)}
              className={cn(
                'group relative h-16 overflow-hidden rounded-xl border text-left transition-[border-color,box-shadow,transform] active:scale-[0.98]',
                background === option.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border/70 hover:border-foreground/25',
                !('image' in option) && 'bg-muted',
              )}
              style={'image' in option ? { backgroundImage: `url(${option.image})`, backgroundPosition: 'center', backgroundSize: 'cover' } : undefined}
            >
              <span className={cn('absolute inset-0', 'image' in option ? 'bg-gradient-to-t from-black/60 via-black/5 to-transparent' : 'bg-[radial-gradient(circle_at_50%_35%,var(--card),var(--muted))]')} />
              <span className={cn('absolute inset-x-2 bottom-1.5', 'image' in option ? 'text-white' : 'text-foreground')}>
                <span className="block text-xs font-semibold">{'mood' in option ? option.mood : option.label}</span>
                {'mood' in option && (
                  <span className="block text-[10px] font-medium opacity-80">{option.label}</span>
                )}
              </span>
              {background === option.id && (
                <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="opacity-heading">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 id="opacity-heading" className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Panel opacity
          </h3>
          <span className="text-xs tabular-nums text-muted-foreground">{panelOpacity}%</span>
        </div>
        <Slider
          value={[panelOpacity]}
          min={MIN_PANEL_OPACITY}
          max={MAX_PANEL_OPACITY}
          step={1}
          onValueChange={choosePanelOpacity}
          aria-label="Panel opacity"
        />
      </section>
    </div>
  )
}
