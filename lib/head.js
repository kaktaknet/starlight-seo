import { buildGraph, wrap } from './graph.js'
import { serialize } from './text.js'

const isMeta = (entry, key, value) => entry.tag === 'meta' && entry.attrs?.[key] === value

const setMeta = (head, key, value, content) => {
  const existing = head.find((entry) => isMeta(entry, key, value))
  if (content === undefined || content === null || content === '') {
    if (existing) head.splice(head.indexOf(existing), 1)
    return
  }
  if (existing) existing.attrs.content = String(content)
  else head.push({ tag: 'meta', attrs: { [key]: value, content: String(content) } })
}

const iso = (value) => (value instanceof Date ? value.toISOString() : value ? new Date(value).toISOString() : undefined)

export const canonicalOf = (head) => {
  const link = head.find((entry) => entry.tag === 'link' && entry.attrs?.rel === 'canonical')
  return typeof link?.attrs?.href === 'string' ? link.attrs.href : undefined
}

export const setCanonical = (head, href) => {
  const link = head.find((entry) => entry.tag === 'link' && entry.attrs?.rel === 'canonical')
  if (link) link.attrs.href = href
  else head.push({ tag: 'link', attrs: { rel: 'canonical', href } })
  setMeta(head, 'property', 'og:url', href)
}

export function applyHead(head, page, options) {
  const title = head.find((entry) => entry.tag === 'title')
  if (title) title.content = page.headTitle
  else head.push({ tag: 'title', content: page.headTitle })

  setMeta(head, 'property', 'og:title', page.title)
  setMeta(head, 'name', 'description', page.description)
  setMeta(head, 'property', 'og:description', page.description)
  setMeta(head, 'property', 'og:type', page.article ? 'article' : 'website')

  if (page.image) {
    setMeta(head, 'property', 'og:image', page.image.url)
    setMeta(head, 'property', 'og:image:width', page.image.width)
    setMeta(head, 'property', 'og:image:height', page.image.height)
    setMeta(head, 'property', 'og:image:alt', page.image.alt)
    setMeta(head, 'name', 'twitter:image', page.image.url)
    setMeta(head, 'name', 'twitter:image:alt', page.image.alt)
  } else {
    setMeta(head, 'name', 'twitter:card', 'summary')
  }

  if (page.article) {
    setMeta(head, 'property', 'article:published_time', iso(page.published))
    setMeta(head, 'property', 'article:modified_time', iso(page.modified))
  }

  const hasRobots = head.some((entry) => isMeta(entry, 'name', 'robots'))
  if (page.noindex) setMeta(head, 'name', 'robots', 'noindex, follow')
  else if (options.robots && !hasRobots) setMeta(head, 'name', 'robots', options.robots)
}

export function graphOf(page, options) {
  const publisher = {
    ...options.publisher,
    name: options.publisher.name ?? page.site.name,
    url: options.publisher.url ?? `${page.site.origin}/`,
  }
  return buildGraph({ site: page.site, publisher, page })
}

export function pushGraph(head, nodes) {
  head.push({ tag: 'script', attrs: { type: 'application/ld+json' }, content: serialize(wrap(nodes)) })
}
