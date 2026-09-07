export const PANEL_OPACITY_KEY = 'panelOpacity'
export const DEFAULT_PANEL_OPACITY = 85
export const DEFAULT_STRUDEL_OPACITY = 50
export const MIN_PANEL_OPACITY = 50
export const MAX_PANEL_OPACITY = 100
const STRUDEL_OPACITY_RATIO = DEFAULT_STRUDEL_OPACITY / DEFAULT_PANEL_OPACITY
const MIN_STRUDEL_OPACITY = 12

export function strudelOpacityFromChrome(chromeOpacity: number) {
  return Math.max(MIN_STRUDEL_OPACITY, Math.round(chromeOpacity * STRUDEL_OPACITY_RATIO))
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
