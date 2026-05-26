let loadPromise: Promise<void> | null = null
let themeObserver: MutationObserver | null = null

const neutralizeStrudelThemeVars = () => {
  const el = document.getElementById('strudel-theme-vars')
  if (el instanceof HTMLStyleElement && el.textContent?.trim()) {
    el.textContent = ''
  }
}

const ensureThemeVarsObserver = () => {
  if (themeObserver) return
  themeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLStyleElement && node.id === 'strudel-theme-vars') {
            neutralizeStrudelThemeVars()
            return
          }
        }
      }
      if (
        m.type === 'characterData' &&
        m.target.parentElement instanceof HTMLStyleElement &&
        m.target.parentElement.id === 'strudel-theme-vars'
      ) {
        neutralizeStrudelThemeVars()
        return
      }
    }
  })
  themeObserver.observe(document.head, { childList: true, subtree: true, characterData: true })
  neutralizeStrudelThemeVars()
}

export function loadStrudelRepl() {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }
  if (!loadPromise) {
    loadPromise = import('@strudel/repl').then(() => {
      ensureThemeVarsObserver()
    })
  }
  return loadPromise
}
