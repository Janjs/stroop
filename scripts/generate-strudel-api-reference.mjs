import { readFile, writeFile, mkdtemp, rm } from 'fs/promises'
import { execSync } from 'child_process'
import os from 'os'
import path from 'path'

const ROOT = path.join(import.meta.dirname, '..')
const DEFAULT_DOC_JSON = path.join(ROOT, 'docs', 'strudel-doc.json')
const OUTPUT = path.join(ROOT, 'docs', 'strudel-api-reference.md')

async function resolveDocJson() {
  if (process.env.STRUDEL_DOC_JSON) {
    return process.env.STRUDEL_DOC_JSON
  }

  try {
    await readFile(DEFAULT_DOC_JSON)
    return DEFAULT_DOC_JSON
  } catch {
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'strudel-doc-'))
    try {
      execSync('git clone --depth 1 https://codeberg.org/uzu/strudel.git .', {
        cwd: tmpDir,
        stdio: 'pipe',
      })
      execSync('pnpm add -wD jsdoc jsdoc-json', { cwd: tmpDir, stdio: 'pipe' })
      execSync('pnpm run jsdoc-json', { cwd: tmpDir, stdio: 'pipe' })
      const docJson = await readFile(path.join(tmpDir, 'doc.json'), 'utf8')
      await writeFile(DEFAULT_DOC_JSON, docJson)
      return DEFAULT_DOC_JSON
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  }
}

function tagValues(tags) {
  if (!tags?.length) return ['untagged']
  return tags
    .map((t) => (typeof t === 'string' ? t : t?.value ?? t?.text))
    .filter(Boolean)
}

function isValid(doc) {
  const tags = tagValues(doc.tags)
  const isSupradoughOnly = tags.includes('supradough') && !tags.includes('superdough')
  const isSuperdirtOnly = tags.includes('superdirt') && !tags.includes('superdough')
  return doc.name && !doc.name.startsWith('_') && doc.description && !isSupradoughOnly && !isSuperdirtOnly
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function collectFunctions(docs) {
  const seen = new Set()
  const functions = []

  for (const doc of docs) {
    if (!isValid(doc)) continue
    if (seen.has(doc.name)) continue
    seen.add(doc.name)

    const tags = tagValues(doc.tags).filter((t) => t !== 'supradough' && t !== 'superdirt')
    functions.push({
      name: doc.name,
      synonyms: doc.synonyms ?? [],
      tags,
      description: stripHtml(doc.description),
      params: (doc.params ?? []).map((p) => ({
        name: p.name,
        types: p.type?.names?.join(' | ') ?? '',
        description: p.description ? stripHtml(p.description) : '',
      })),
      examples: doc.examples ?? [],
    })
  }

  return functions.sort((a, b) => a.name.localeCompare(b.name))
}

function renderMarkdown(functions) {
  const lines = [
    '# Strudel API Reference',
    '',
    'Auto-generated from the official Strudel JSDoc source ([codeberg.org/uzu/strudel](https://codeberg.org/uzu/strudel)),',
    'the same data that powers the Reference tab on [strudel.cc](https://strudel.cc/).',
    '',
    'Regenerate with: `pnpm run generate:strudel-api-reference`',
    '',
    `${functions.length} functions. You do not need all of these — a small set covers most patterns.`,
    '',
  ]

  for (const fn of functions) {
    lines.push(`## ${fn.name}`)
    if (fn.synonyms.length) {
      lines.push(`Synonyms: ${fn.synonyms.join(', ')}`)
    }
    if (fn.tags.length && !(fn.tags.length === 1 && fn.tags[0] === 'untagged')) {
      lines.push(`Tags: ${fn.tags.join(', ')}`)
    }
    lines.push('')
    lines.push(fn.description)
    lines.push('')

    if (fn.params.length) {
      lines.push('Parameters:')
      for (const p of fn.params) {
        const desc = p.description ? ` — ${p.description}` : ''
        lines.push(`- \`${p.name}\` (${p.types})${desc}`)
      }
      lines.push('')
    }

    for (const example of fn.examples) {
      lines.push('```strudel')
      lines.push(example.trim())
      lines.push('```')
      lines.push('')
    }
  }

  return lines.join('\n')
}

const docJsonPath = await resolveDocJson()
const raw = JSON.parse(await readFile(docJsonPath, 'utf8'))
const functions = collectFunctions(raw.docs)
const markdown = renderMarkdown(functions)
await writeFile(OUTPUT, markdown)
console.log(`Wrote ${functions.length} functions to ${OUTPUT} (${markdown.length} bytes)`)
