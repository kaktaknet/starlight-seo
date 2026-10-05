import test from 'node:test'
import assert from 'node:assert/strict'
import { normalize } from '../lib/options.js'
import { resolvePage, retitle } from '../lib/page.js'
import { applyHead, graphOf, pushGraph } from '../lib/head.js'
import { resolveTitle } from '../lib/title.js'
import { breadcrumbs } from '../lib/breadcrumbs.js'
import { matcher, pick, serialize, length } from '../lib/text.js'

const options = normalize(
  {
    site: { name: 'MCP Doc', description: { ru: 'Справочник', en: 'Reference' }, about: { name: 'Model Context Protocol', sameAs: 'https://modelcontextprotocol.io/' } },
    publisher: { name: 'kaktak.net', url: 'https://kaktak.net/', logo: 'https://kaktak.net/logo.png' },
    title: { templates: [{ match: '/sdk/**', template: { ru: '{title} для MCP: установка и примеры', en: '{title} for MCP' } }] },
    types: [{ match: '/blog/*/', type: 'BlogPosting', section: 'Blog' }],
    image: { src: '/og/{slug}.png', alt: 'MCP Doc' },
  },
  { site: 'https://mcpdoc.ru/', delimiter: '|' },
)

const sidebar = [
  { type: 'link', label: 'Home', href: '/', isCurrent: false },
  {
    type: 'group',
    label: 'SDK',
    entries: [
      { type: 'link', label: 'Overview', href: '/sdk/', isCurrent: false },
      { type: 'link', label: 'Python SDK', href: '/sdk/python/', isCurrent: true },
    ],
  },
]

const input = (extra = {}) => ({
  pathname: '/sdk/python/',
  path: '/sdk/python/',
  lang: 'ru',
  locale: undefined,
  homeHref: '/',
  isHome: false,
  canonical: 'https://mcpdoc.ru/sdk/python/',
  label: 'Python SDK',
  description: 'Официальный Python SDK',
  template: 'doc',
  lastUpdated: new Date('2026-10-05T10:00:00Z'),
  siteTitle: 'MCP Doc',
  sidebar,
  seo: undefined,
  ...extra,
})

test('glob matcher', () => {
  assert.equal(matcher('/sdk/**')('/sdk/python/'), true)
  assert.equal(matcher('/blog/*/')('/blog/post/'), true)
  assert.equal(matcher('/blog/*/')('/blog/'), false)
  assert.equal(matcher('/blog/*/')('/blog/a/b/'), false)
  assert.equal(matcher('/a.b/')('/axb/'), false)
})

test('pick resolves per language', () => {
  assert.equal(pick({ ru: 'р', en: 'e' }, 'en-US'), 'e')
  assert.equal(pick({ root: 'r', en: 'e' }, 'ru', undefined), 'r')
  assert.equal(pick('plain', 'ru'), 'plain')
  assert.equal(pick(undefined, 'ru'), undefined)
})

test('title: frontmatter beats template beats label', () => {
  const base = { label: 'Python SDK', path: '/sdk/python/', lang: 'ru', siteName: 'MCP Doc', options: options.title }
  assert.deepEqual(resolveTitle({ ...base, seoTitle: 'Свой заголовок' }), { base: 'Свой заголовок', full: 'Свой заголовок | MCP Doc', source: 'frontmatter', branded: true })
  assert.equal(resolveTitle(base).base, 'Python SDK для MCP: установка и примеры')
  assert.equal(resolveTitle(base).source, 'template')
  assert.equal(resolveTitle({ ...base, path: '/x/' }).source, 'label')
})

test('title: brand is dropped when it does not fit or is already present', () => {
  const base = { label: 'x', path: '/x/', lang: 'ru', siteName: 'MCP Doc', options: options.title }
  const long = 'Очень длинный заголовок страницы, который занимает почти весь предел'
  assert.equal(resolveTitle({ ...base, seoTitle: long }).full, long)
  assert.equal(resolveTitle({ ...base, seoTitle: 'MCP Doc - справочник' }).full, 'MCP Doc - справочник')
  assert.equal(resolveTitle({ ...base, seoTitle: long, options: { ...options.title, brand: 'always' } }).full, `${long} | MCP Doc`)
  assert.equal(resolveTitle({ ...base, seoTitle: 'a', options: { ...options.title, brand: 'never' } }).full, 'a')
})

test('breadcrumbs come from the sidebar', () => {
  const trail = breadcrumbs({ sidebar, home: { label: 'MCP Doc', href: '/' }, label: 'Python SDK', pathname: '/sdk/python/', isHome: false, groups: 'link' })
  assert.deepEqual(trail, [
    { label: 'MCP Doc', href: '/' },
    { label: 'SDK', href: '/sdk/' },
    { label: 'Python SDK', href: '/sdk/python/' },
  ])
  const plain = breadcrumbs({ sidebar, home: { label: 'MCP Doc', href: '/' }, label: 'Python SDK', pathname: '/sdk/python/', isHome: false, groups: 'plain' })
  assert.equal(plain[1].href, undefined)
  const skipped = breadcrumbs({ sidebar, home: { label: 'MCP Doc', href: '/' }, label: 'Python SDK', pathname: '/sdk/python/', isHome: false, groups: 'skip' })
  assert.equal(skipped.length, 2)
  assert.deepEqual(breadcrumbs({ sidebar, home: { label: 'h', href: '/' }, label: 'x', pathname: '/', isHome: true, groups: 'link' }), [])
  const orphan = breadcrumbs({ sidebar: [], home: { label: 'h', href: '/' }, label: 'Post', pathname: '/blog/post/', isHome: false, groups: 'link' })
  assert.deepEqual(orphan, [{ label: 'h', href: '/' }, { label: 'Post', href: '/blog/post/' }])
  const landing = breadcrumbs({ sidebar: [{ type: 'group', label: 'SDK', entries: [{ type: 'link', label: 'Overview', href: '/sdk/', isCurrent: true }] }], home: { label: 'h', href: '/' }, label: 'Overview', pathname: '/sdk/', isHome: false, groups: 'link' })
  assert.equal(landing.length, 2)
})

test('page: template title, generated image, article type', () => {
  const page = resolvePage(options, input())
  assert.equal(page.title, 'Python SDK для MCP: установка и примеры')
  assert.equal(page.headTitle, 'Python SDK для MCP: установка и примеры | MCP Doc')
  assert.equal(page.type, 'TechArticle')
  assert.equal(page.article, true)
  assert.equal(page.image.url, 'https://mcpdoc.ru/og/sdk/python.png')
  assert.equal(page.image.width, 1200)
  assert.equal(page.site.description, 'Справочник')
})

test('page: frontmatter overrides', () => {
  const page = resolvePage(options, input({ seo: { title: 'T', description: 'D', type: 'FAQPage', image: '/custom.png', noindex: true } }))
  assert.equal(page.title, 'T')
  assert.equal(page.description, 'D')
  assert.equal(page.type, 'FAQPage')
  assert.equal(page.article, false)
  assert.equal(page.image.url, 'https://mcpdoc.ru/custom.png')
  assert.equal(page.image.width, undefined)
  assert.equal(page.noindex, true)
})

test('page: home, splash and type rules', () => {
  assert.equal(resolvePage(options, input({ pathname: '/', path: '/', isHome: true })).type, 'WebPage')
  assert.equal(resolvePage(options, input({ pathname: '/blog/', path: '/blog/', template: 'splash' })).type, 'CollectionPage')
  const post = resolvePage(options, input({ pathname: '/blog/post/', path: '/blog/post/' }))
  assert.equal(post.type, 'BlogPosting')
  assert.equal(post.section, 'Blog')
})

test('graph: connected nodes with stable identifiers', () => {
  const page = resolvePage(options, input({ seo: { published: new Date('2026-09-01T00:00:00Z'), keywords: ['mcp', 'python'] } }))
  const nodes = graphOf(page, options)
  const by = Object.fromEntries(nodes.map((node) => [node['@type'], node]))
  assert.deepEqual(Object.keys(by), ['WebSite', 'Organization', 'WebPage', 'ImageObject', 'TechArticle', 'BreadcrumbList'])
  assert.equal(by.WebSite['@id'], 'https://mcpdoc.ru/#website')
  assert.equal(by.Organization['@id'], 'https://kaktak.net/#organization')
  assert.deepEqual(by.Organization.logo, { '@type': 'ImageObject', url: 'https://kaktak.net/logo.png' })
  assert.deepEqual(by.WebSite.publisher, { '@id': by.Organization['@id'] })
  assert.deepEqual(by.WebPage.isPartOf, { '@id': by.WebSite['@id'] })
  assert.deepEqual(by.WebPage.breadcrumb, { '@id': by.BreadcrumbList['@id'] })
  assert.deepEqual(by.TechArticle.mainEntityOfPage, { '@id': by.WebPage['@id'] })
  assert.equal(by.TechArticle.headline, page.title)
  assert.equal(by.TechArticle.datePublished, '2026-09-01')
  assert.equal(by.TechArticle.dateModified, '2026-10-05')
  assert.equal(by.TechArticle.keywords, 'mcp, python')
  assert.equal(by.TechArticle.about.name, 'Model Context Protocol')
  assert.equal(by.BreadcrumbList.itemListElement.length, 3)
  assert.equal(by.BreadcrumbList.itemListElement[1].item, 'https://mcpdoc.ru/sdk/')
  for (const node of nodes) for (const value of Object.values(node)) assert.notEqual(value, undefined)
})

test('graph: a non-article page is a single typed WebPage node', () => {
  const page = resolvePage(options, input({ pathname: '/', path: '/', isHome: true }))
  const nodes = graphOf(page, options)
  assert.deepEqual(nodes.map((node) => node['@type']), ['WebSite', 'Organization', 'WebPage', 'ImageObject'])
  assert.equal(nodes[2].about.name, 'Model Context Protocol')
})

test('head: tags are rewritten in place and completed', () => {
  const head = [
    { tag: 'title', content: 'Python SDK | MCP Doc' },
    { tag: 'link', attrs: { rel: 'canonical', href: 'https://mcpdoc.ru/sdk/python/' } },
    { tag: 'meta', attrs: { property: 'og:title', content: 'Python SDK' } },
    { tag: 'meta', attrs: { property: 'og:type', content: 'article' } },
    { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tag: 'meta', attrs: { name: 'description', content: 'old' } },
  ]
  const page = resolvePage(options, input())
  applyHead(head, page, options)
  pushGraph(head, graphOf(page, options))
  const meta = (key, value) => head.find((entry) => entry.attrs?.[key] === value)?.attrs.content
  assert.equal(head[0].content, 'Python SDK для MCP: установка и примеры | MCP Doc')
  assert.equal(meta('property', 'og:title'), 'Python SDK для MCP: установка и примеры')
  assert.equal(meta('name', 'description'), 'Официальный Python SDK')
  assert.equal(meta('property', 'og:image'), 'https://mcpdoc.ru/og/sdk/python.png')
  assert.equal(meta('property', 'og:image:width'), '1200')
  assert.equal(meta('name', 'twitter:image'), 'https://mcpdoc.ru/og/sdk/python.png')
  assert.equal(meta('property', 'article:modified_time'), '2026-10-05T10:00:00.000Z')
  assert.equal(meta('name', 'robots'), 'max-snippet:-1, max-image-preview:large, max-video-preview:-1')
  assert.equal(head.filter((entry) => entry.attrs?.property === 'og:title').length, 1)
  const script = head.at(-1)
  assert.equal(script.attrs.type, 'application/ld+json')
  assert.equal(JSON.parse(script.content)['@graph'].length, 6)
})

test('head: noindex, website type and the card without an image', () => {
  const bare = normalize({}, { site: 'https://example.com' })
  const head = [{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } }]
  const page = resolvePage(bare, input({ pathname: '/', path: '/', isHome: true, canonical: 'https://example.com/', seo: { noindex: true } }))
  applyHead(head, page, bare)
  const meta = (key, value) => head.find((entry) => entry.attrs?.[key] === value)?.attrs.content
  assert.equal(meta('name', 'robots'), 'noindex, follow')
  assert.equal(meta('property', 'og:type'), 'website')
  assert.equal(meta('name', 'twitter:card'), 'summary')
  assert.equal(meta('property', 'og:image'), undefined)
})

test('serialization cannot close the script element', () => {
  const out = serialize({ a: '</script><b>&' })
  assert.equal(out.includes('<'), false)
  assert.equal(JSON.parse(out).a, '</script><b>&')
})

test('length counts code points', () => {
  assert.equal(length('Привет'), 6)
  assert.equal(length('a😀'), 2)
})

test('options are validated', () => {
  assert.throws(() => normalize({}, {}), /set `site`/)
  assert.throws(() => normalize({ audit: { rules: { nope: 'error' } } }, { site: 'https://x.y' }), /unknown audit rule/)
  assert.throws(() => normalize({ audit: { rules: { 'title.long': 'loud' } } }, { site: 'https://x.y' }), /expected one of/)
  assert.throws(() => normalize({ title: { brand: 'yes' } }, { site: 'https://x.y' }), /title.brand/)
  assert.equal(normalize({ audit: false }, { site: 'https://x.y' }).audit.failOn, 'off')
})

test('title brand and image source can differ per language', () => {
  const custom = normalize({ site: { name: 'LLMs Full Text' }, title: { site: 'llms-full-txt.ru' }, image: { src: { ru: '/og.png', en: '/og-en.png' } } }, { site: 'https://llms-full-txt.ru' })
  const ru = resolvePage(custom, input({ canonical: 'https://llms-full-txt.ru/sdk/python/' }))
  assert.equal(ru.headTitle, 'Python SDK | llms-full-txt.ru')
  assert.equal(ru.site.name, 'LLMs Full Text')
  assert.equal(ru.image.url, 'https://llms-full-txt.ru/og.png')
  assert.equal(resolvePage(custom, input({ lang: 'en', locale: 'en' })).image.url, 'https://llms-full-txt.ru/og-en.png')
})

test('breadcrumbs: nested groups that share a landing page collapse, the last crumb is the sidebar label', () => {
  const nested = [{ type: 'group', label: 'Guides', entries: [{ type: 'group', label: 'Connect', entries: [
    { type: 'link', label: 'Overview', href: '/connect/', isCurrent: false },
    { type: 'link', label: 'Claude', href: '/connect/claude/', isCurrent: true },
  ] }] }]
  const trail = breadcrumbs({ sidebar: nested, home: { label: 'Home', href: '/' }, label: 'Connecting Claude', pathname: '/connect/claude/', isHome: false, groups: 'link' })
  assert.deepEqual(trail, [
    { label: 'Home', href: '/' },
    { label: 'Guides', href: '/connect/' },
    { label: 'Claude', href: '/connect/claude/' },
  ])
})

test('a title returned by the page hook is branded like any other', () => {
  const page = resolvePage(options, input())
  Object.assign(page, retitle(options, page, 'Hook title for the page'))
  assert.equal(page.title, 'Hook title for the page')
  assert.equal(page.headTitle, 'Hook title for the page | MCP Doc')
  assert.equal(page.titleSource, 'hook')
})
