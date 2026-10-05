import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { anyMatch, length } from './text.js'

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

const decode = (value) =>
  String(value)
    .replace(/&#x([0-9a-f]+);/gi, (whole, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (whole, code) => String.fromCodePoint(Number(code)))
    .replace(/&(\w+);/g, (whole, name) => ENTITIES[name] ?? whole)

const attributes = (source) => {
  const result = {}
  for (const match of source.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) result[match[1].toLowerCase()] = decode(match[2] ?? match[3])
  return result
}

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (entry.name.endsWith('.html')) yield full
  }
}

const routeOf = (root, file) => {
  const path = `/${relative(root, file).split(sep).join('/')}`
  return path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path
}

const trim = (value) => value.replace(/(index)?\.html$/, '').replace(/\/+$/, '') || '/'

const sameRoute = (canonical, path) => {
  try {
    return trim(decodeURIComponent(new URL(canonical).pathname)) === trim(path)
  } catch {
    return true
  }
}

const localPath = (href) => {
  const { pathname } = new URL(href)
  try {
    return decodeURIComponent(pathname)
  } catch {
    return pathname
  }
}

export function inspect(html) {
  const end = html.search(/<\/head>/i)
  const head = end === -1 ? html : html.slice(0, end)
  const tags = [...head.matchAll(/<(meta|link)\b([^>]*)>/gi)].map((match) => ({ tag: match[1].toLowerCase(), attrs: attributes(match[2]) }))
  const meta = (key, value) => tags.find((entry) => entry.tag === 'meta' && entry.attrs[key] === value)?.attrs.content
  const title = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)
  const scripts = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1])
  const nodes = []
  let invalid = 0
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script)
      for (const item of [].concat(parsed)) nodes.push(...(Array.isArray(item?.['@graph']) ? item['@graph'] : [item]))
    } catch {
      invalid += 1
    }
  }
  return {
    title: title ? decode(title[1]).trim() : undefined,
    description: meta('name', 'description'),
    ogTitle: meta('property', 'og:title'),
    ogImage: meta('property', 'og:image'),
    robots: meta('name', 'robots'),
    canonical: tags.find((entry) => entry.tag === 'link' && entry.attrs.rel === 'canonical')?.attrs.href,
    redirect: tags.some((entry) => entry.tag === 'meta' && entry.attrs['http-equiv']?.toLowerCase() === 'refresh'),
    scripts: scripts.length,
    invalid,
    nodes,
  }
}

export async function audit(root, options) {
  const levels = options.audit.rules
  const excluded = [...options.exclude, ...options.audit.exclude]
  const findings = []
  const add = (rule, path, message) => {
    if (levels[rule] !== 'off') findings.push({ rule, level: levels[rule], path, message })
  }
  const titles = new Map()
  const descriptions = new Map()
  let pages = 0

  for await (const file of walk(root)) {
    const path = routeOf(root, file)
    if (anyMatch(excluded, path)) continue
    const page = inspect(await readFile(file, 'utf8'))
    if (page.redirect || /\bnoindex\b/i.test(page.robots ?? '')) continue
    if (page.canonical && !sameRoute(page.canonical, path)) continue
    pages += 1

    if (!page.title) add('title.missing', path, 'no <title>')
    else {
      const size = length(page.title)
      if (size < options.title.min) add('title.short', path, `${size} < ${options.title.min}: ${page.title}`)
      if (size > options.title.max) add('title.long', path, `${size} > ${options.title.max}: ${page.title}`)
      titles.set(page.title, [...(titles.get(page.title) ?? []), path])
    }

    if (!page.description) add('description.missing', path, 'no meta description')
    else {
      const size = length(page.description)
      if (size < options.description.min) add('description.short', path, `${size} < ${options.description.min}`)
      if (size > options.description.max) add('description.long', path, `${size} > ${options.description.max}`)
      descriptions.set(page.description, [...(descriptions.get(page.description) ?? []), path])
    }

    if (!page.canonical) add('canonical.missing', path, 'no canonical link')

    if (page.invalid > 0) add('jsonld.invalid', path, `${page.invalid} JSON-LD block(s) do not parse`)
    if (page.scripts === 0) add('jsonld.missing', path, 'no JSON-LD')
    for (const node of page.nodes) {
      const id = String(node?.['@id'] ?? '')
      const name = id.endsWith('#article') ? node.headline : id.endsWith('#webpage') ? node.name : undefined
      if (name !== undefined && page.ogTitle !== undefined && name !== page.ogTitle) {
        add('jsonld.mismatch', path, `${id} says "${name}", og:title says "${page.ogTitle}"`)
      }
    }

    if (!page.ogImage) add('image.missing', path, 'no og:image')
    else if (page.ogImage.startsWith(`${options.origin}/`)) {
      const local = localPath(page.ogImage)
      const target = resolve(root, `.${local}`)
      const inside = target.startsWith(`${resolve(root)}${sep}`)
      if (!inside || !existsSync(target)) add('image.broken', path, `${local} is not in the build output`)
    }
  }

  for (const [title, paths] of titles) {
    if (paths.length > 1) for (const path of paths) add('title.duplicate', path, `shared by ${paths.length} pages: ${title}`)
  }
  for (const [, paths] of descriptions) {
    if (paths.length > 1) for (const path of paths) add('description.duplicate', path, `shared by ${paths.length} pages`)
  }

  return {
    pages,
    findings,
    errors: findings.filter((finding) => finding.level === 'error').length,
    warnings: findings.filter((finding) => finding.level === 'warn').length,
  }
}

export function report(result, logger, limit = 15) {
  const groups = new Map()
  for (const finding of result.findings) groups.set(finding.rule, [...(groups.get(finding.rule) ?? []), finding])
  for (const [rule, list] of groups) {
    const write = list[0].level === 'error' ? logger.error.bind(logger) : logger.warn.bind(logger)
    write(`${rule}: ${list.length} page(s)`)
    for (const finding of list.slice(0, limit)) write(`  ${finding.path}  ${finding.message}`)
    if (list.length > limit) write(`  ... and ${list.length - limit} more`)
  }
  logger.info(`audited ${result.pages} page(s): ${result.errors} error(s), ${result.warnings} warning(s)`)
}
