const CM_TOKEN_CHAR = '\u037C'

const OUR_STYLE_IDS = new Set([
  'strudel-app-theme',
  'strudel-example-theme',
  'strudel-shared-page-theme',
])

const STRUDEL_COMMENT_COLORS = new Set([
  '#7d8799',
  '#54636d',
  '#6272a4',
  '#9995b7',
  'rgb(125,135,153)',
  'rgb(84,99,109)',
  'rgb(98,114,164)',
  'rgb(153,149,183)',
])

const STRUDEL_LITERAL_COLORS = new Set([
  '#c3e88d',
  '#f78c6c',
  '#116644',
  '#aa1111',
  '#ee4400',
  '#008855',
  'rgb(195,232,141)',
  'rgb(247,140,108)',
  'rgb(17,102,68)',
  'rgb(170,17,17)',
  'rgb(238,68,0)',
  'rgb(0,136,85)',
])

const STRUDEL_FUNCTION_CLASSES = new Set([
  `${CM_TOKEN_CHAR}1r`,
  `${CM_TOKEN_CHAR}1n`,
  `${CM_TOKEN_CHAR}z`,
])

const STRUDEL_METHOD_CLASSES = new Set([
  `${CM_TOKEN_CHAR}1w`,
  `${CM_TOKEN_CHAR}1v`,
])

export type StrudelEditorThemeScope =
  | '#strudel-repl-container'
  | '.strudel-share-preview'
  | '.strudel-example-editor'

export type StrudelTokenThemeOptions = {
  isDark: boolean
  fg: string
  mutedFg: string
  primary: string
  accent: string
  secondary: string
  ring: string
}

let cachedCommentClasses: Set<string> | null = null
let cachedLiteralClasses: Set<string> | null = null

function normalizeCssColor(color: string): string {
  return color.toLowerCase().replace(/\s/g, '')
}

function isStrudelCommentColor(color: string): boolean {
  return STRUDEL_COMMENT_COLORS.has(normalizeCssColor(color))
}

function isStrudelLiteralColor(color: string): boolean {
  return STRUDEL_LITERAL_COLORS.has(normalizeCssColor(color))
}

function isFunctionClass(className: string): boolean {
  return STRUDEL_FUNCTION_CLASSES.has(className)
}

function isMethodClass(className: string): boolean {
  return STRUDEL_METHOD_CLASSES.has(className)
}

function isOurSelector(selector: string): boolean {
  return (
    selector.includes('strudel-repl-container') ||
    selector.includes('strudel-share-preview') ||
    selector.includes('strudel-example-editor')
  )
}

function collectStandaloneTokenColors(): Map<string, string> {
  const tokens = new Map<string, string>()
  for (const sheet of document.styleSheets) {
    try {
      const owner = sheet.ownerNode as HTMLElement | null
      if (owner?.id && OUR_STYLE_IDS.has(owner.id)) continue

      for (const rule of sheet.cssRules) {
        const cssRule = rule as CSSStyleRule
        const selector = cssRule.selectorText
        if (!selector?.includes(CM_TOKEN_CHAR) || !cssRule.style?.color || isOurSelector(selector)) {
          continue
        }

        const color = cssRule.style.color
        selector.match(new RegExp(`${CM_TOKEN_CHAR}[\\da-zA-Z]+`, 'g'))?.forEach((name) => {
          if (selector.trim() === `.${name}` && !tokens.has(name)) {
            tokens.set(name, color)
          }
        })
      }
    } catch {}
  }
  return tokens
}

function collectAllTokenClasses(): Set<string> {
  const tokenClasses = new Set<string>()
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const cssRule = rule as CSSStyleRule
        if (cssRule.selectorText?.includes(CM_TOKEN_CHAR) && cssRule.style?.color) {
          cssRule.selectorText
            .match(new RegExp(`${CM_TOKEN_CHAR}[\\da-zA-Z]+`, 'g'))
            ?.forEach((name) => tokenClasses.add(name))
        }
      }
    } catch {}
  }
  return tokenClasses
}

function getCommentClasses(): Set<string> {
  const fromTheme = new Set<string>()
  for (const [name, color] of collectStandaloneTokenColors()) {
    if (isStrudelCommentColor(color) || name.slice(1).toLowerCase().includes('comment')) {
      fromTheme.add(name)
    }
  }

  if (fromTheme.size) {
    cachedCommentClasses = fromTheme
    return fromTheme
  }

  return cachedCommentClasses ?? fromTheme
}

function getLiteralClasses(): Set<string> {
  const fromTheme = new Set<string>()
  for (const [name, color] of collectStandaloneTokenColors()) {
    if (isStrudelLiteralColor(color)) {
      fromTheme.add(name)
    }
  }

  if (fromTheme.size) {
    cachedLiteralClasses = fromTheme
    return fromTheme
  }

  return cachedLiteralClasses ?? fromTheme
}

export function buildStrudelNotePulseRules(
  scopes: StrudelEditorThemeScope[],
  options: { isDark: boolean; accentFg: string },
): string {
  const { isDark, accentFg } = options
  const peakBg = isDark
    ? `color-mix(in oklab, ${accentFg} 30%, transparent)`
    : `color-mix(in oklab, ${accentFg} 20%, transparent)`
  const midBg = isDark
    ? `color-mix(in oklab, ${accentFg} 18%, transparent)`
    : `color-mix(in oklab, ${accentFg} 12%, transparent)`

  let rules = `@keyframes strudel-note-pulse{0%{background-color:transparent;transform:scale(0.82);opacity:0}16%{background-color:${peakBg};transform:scale(1.1);opacity:1}30%{background-color:${midBg};transform:scale(0.96)}44%{transform:scale(1.03)}100%{background-color:transparent;transform:scale(1);opacity:0}}`

  for (const scope of scopes) {
    rules += `${scope} .cm-content span[style*="outline"]{outline:none !important;border:none !important;box-shadow:none !important;background-color:transparent;border-radius:9999px;padding:0 0.22em;margin:0 -0.12em;display:inline-block;vertical-align:baseline;transform-origin:center;box-decoration-break:clone;-webkit-box-decoration-break:clone;animation:strudel-note-pulse 480ms cubic-bezier(0.34,1.56,0.64,1) both;}`
  }

  return rules
}

export function buildStrudelTokenColorRules(
  scopes: StrudelEditorThemeScope[],
  options: StrudelTokenThemeOptions,
): string {
  const { isDark, fg, mutedFg, primary, accent, secondary, ring } = options
  const pastel = (color: string) =>
    isDark
      ? `color-mix(in oklab, ${color} 55%, ${fg})`
      : `color-mix(in oklab, ${color} 70%, ${fg})`

  const palette = isDark
    ? [pastel(primary), pastel(accent), pastel(secondary), pastel(mutedFg), pastel(ring), pastel(fg)]
    : [fg, primary, ring, `color-mix(in oklab, ${primary} 75%, ${fg})`]

  const commentColor = isDark
    ? `color-mix(in oklab, ${mutedFg} 80%, transparent)`
    : `color-mix(in oklab, ${mutedFg} 40%, transparent)`

  const argumentColor = isDark
    ? `color-mix(in oklab, ${primary} 28%, ${fg})`
    : `color-mix(in oklab, ${primary} 45%, ${mutedFg})`

  const functionColor = `color-mix(in oklab, var(--primary) 60%, ${fg})`
  const methodColor = primary

  const commentClasses = getCommentClasses()
  const literalClasses = getLiteralClasses()
  let idx = 0
  let rules = ''

  collectAllTokenClasses().forEach((cls) => {
    const isComment = commentClasses.has(cls)
    const isLiteral = literalClasses.has(cls)
    const isFunction = !isDark && isFunctionClass(cls)
    const isMethod = !isDark && isMethodClass(cls)
    const color = isComment
      ? commentColor
      : isLiteral
        ? argumentColor
        : isFunction
          ? functionColor
          : isMethod
            ? methodColor
            : palette[idx % palette.length]
    idx += 1

    for (const scope of scopes) {
      if (isComment) {
        rules += `${scope} .cm-editor .${cls}{color:${commentColor} !important;opacity:0.5;}`
      } else {
        rules += `${scope} .cm-editor .${cls}{color:${color} !important;}`
      }
    }
  })

  return rules
}
