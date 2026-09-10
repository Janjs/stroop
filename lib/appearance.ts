export const BACKGROUNDS = [
  { id: 'none', label: 'None' },
  { id: 'clouds', label: 'Clouds', image: '/backgrounds/clouds.webp', mood: 'Dreamy' },
  { id: 'forest', label: 'Forest', image: '/backgrounds/forest.webp', mood: 'Mysterious' },
  { id: 'dusk', label: 'Dusk', image: '/backgrounds/dusk.webp', mood: 'Melancholic' },
] as const

export type BackgroundId = (typeof BACKGROUNDS)[number]['id']

type RevealJob = { cancel: () => void }
let revealJob: RevealJob | null = null

function commitBackground(id: string) {
  const html = document.documentElement
  html.dataset.background = id
  html.style.removeProperty('--app-wallpaper')
}

export function applyBackground(id: string, options?: { animate?: boolean; origin?: { x: number; y: number } }) {
  if (!BACKGROUNDS.some((bg) => bg.id === id)) return
  localStorage.setItem('background', id)
  const current = document.documentElement.dataset.background || 'none'
  if (current === id && !revealJob) return
  revealJob?.cancel()
  revealJob = null
  if (!options?.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    commitBackground(id)
    return
  }
  revealJob = startCircleReveal(current, id, options.origin ?? revealOrigin())
}

export const PANEL_OPACITY_KEY = 'panelOpacity'
export const DEFAULT_PANEL_OPACITY = 85
export const DEFAULT_STRUDEL_OPACITY = 90
export const MIN_PANEL_OPACITY = 50
export const MAX_PANEL_OPACITY = 100
const STRUDEL_OPACITY_RATIO = DEFAULT_STRUDEL_OPACITY / DEFAULT_PANEL_OPACITY
const MIN_STRUDEL_OPACITY = 12

export function strudelOpacityFromChrome(chromeOpacity: number) {
  return Math.min(100, Math.max(MIN_STRUDEL_OPACITY, Math.round(chromeOpacity * STRUDEL_OPACITY_RATIO)))
}

export function clampPanelOpacity(value: number) {
  return Math.min(MAX_PANEL_OPACITY, Math.max(MIN_PANEL_OPACITY, Math.round(value)))
}

export function applyPanelOpacity(opacity: number) {
  const chrome = clampPanelOpacity(opacity)
  const content = strudelOpacityFromChrome(chrome)
  document.documentElement.style.setProperty('--app-chrome-opacity', `${chrome}%`)
  document.documentElement.style.setProperty('--app-chat-opacity', `${chrome}%`)
  document.documentElement.style.setProperty('--app-strudel-opacity', `${content}%`)
  return chrome
}

export function readStoredPanelOpacity() {
  if (typeof window === 'undefined') return DEFAULT_PANEL_OPACITY
  const saved = localStorage.getItem(PANEL_OPACITY_KEY)
  if (!saved) return DEFAULT_PANEL_OPACITY
  const parsed = Number(saved)
  return Number.isFinite(parsed) ? clampPanelOpacity(parsed) : DEFAULT_PANEL_OPACITY
}

export function storePanelOpacity(opacity: number) {
  const chrome = clampPanelOpacity(opacity)
  localStorage.setItem(PANEL_OPACITY_KEY, String(chrome))
  applyPanelOpacity(chrome)
  return chrome
}

export function surfaceIsDark() {
  const background = document.documentElement.dataset.background
  if (background === 'clouds') return false
  if (background === 'forest' || background === 'dusk') return true
  return document.documentElement.classList.contains('dark')
}

export function subscribeAppearance(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-background'],
  })
  return () => observer.disconnect()
}

const REVEAL_MS = 820
const EDGE_FADE = 180

function revealOrigin(origin?: { x: number; y: number }) {
  if (origin) return origin
  const el = document.activeElement
  if (el instanceof HTMLElement && el !== document.body && el !== document.documentElement) {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.42 }
}

function wallpaperOf(id: string) {
  const bg = BACKGROUNDS.find((item) => item.id === id)
  return bg && 'image' in bg ? bg.image : undefined
}

function startCircleReveal(from: string, to: string, origin?: { x: number; y: number }): RevealJob {
  let raf = 0
  let dead = false
  const toUrl = wallpaperOf(to)
  const fromUrl = wallpaperOf(from)
  const url = toUrl ?? fromUrl
  if (!url) {
    commitBackground(to)
    return { cancel() {} }
  }

  const { x: ox, y: oy } = revealOrigin(origin)
  const maxR =
    Math.hypot(Math.max(ox, window.innerWidth - ox), Math.max(oy, window.innerHeight - oy)) + EDGE_FADE
  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.dataset.bgReveal = ''
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0'
  layer.style.setProperty('--reveal-wallpaper', `url(${url})`)
  document.body.appendChild(layer)
  if (toUrl) {
    const html = document.documentElement
    const held = getComputedStyle(html).getPropertyValue('--app-wallpaper').trim()
    html.dataset.background = to
    html.style.setProperty('--app-wallpaper', held || 'none')
  } else {
    commitBackground(to)
  }

  const paint = (r: number) => {
    const inner = Math.max(0, r - EDGE_FADE)
    const mask = toUrl
      ? `radial-gradient(circle at ${ox}px ${oy}px, #000 ${inner}px, transparent ${Math.max(r, 1)}px)`
      : `radial-gradient(circle at ${ox}px ${oy}px, transparent ${inner}px, #000 ${Math.max(r, 1)}px)`
    layer.style.maskImage = mask
    layer.style.webkitMaskImage = mask
  }

  const finish = () => {
    if (dead) return
    dead = true
    cancelAnimationFrame(raf)
    layer.remove()
    commitBackground(to)
    if (revealJob?.cancel === cancel) revealJob = null
  }

  const cancel = () => {
    if (dead) return
    dead = true
    cancelAnimationFrame(raf)
    layer.remove()
  }

  paint(0)
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
  const start = performance.now()
  const tick = (now: number) => {
    if (dead) return
    const t = Math.min(1, (now - start) / REVEAL_MS)
    paint(ease(t) * maxR)
    if (t >= 1) finish()
    else raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return { cancel }
}
