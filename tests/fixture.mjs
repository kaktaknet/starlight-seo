import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { inspect } from '../lib/audit.js'

const root = fileURLToPath(new URL('./fixture/', import.meta.url))
execFileSync('pnpm', ['exec', 'astro', 'build', '--root', root], { stdio: 'inherit' })

const page = (path) => {
  const html = readFileSync(`${root}dist${path}index.html`, 'utf8')
  return { html, ...inspect(html) }
}
const node = (data, suffix) => data.nodes.find((item) => String(item['@id']).endsWith(suffix))

const home = page('/')
assert.equal(home.title, 'Fixture Docs - a reference used to test the plugin')
assert.equal(home.html.includes('property="og:type" content="website"'), true)
assert.equal(node(home, '#webpage')['@type'], 'WebPage')
assert.equal(node(home, '#website').description, 'A fixture site for the plugin')
assert.equal(node(home, '#organization').logo.url, 'https://example.org/logo.png')

const install = page('/guides/install/')
assert.equal(install.title, 'Install: a step-by-step guide | Fixture Docs')
assert.equal(install.ogTitle, 'Install: a step-by-step guide')
assert.equal(install.ogImage, 'https://example.com/og.png')
assert.match(install.html, /<h1[^>]*>Install<\/h1>/)
assert.equal(node(install, '#article')['@type'], 'TechArticle')
assert.equal(node(install, '#article').headline, 'Install: a step-by-step guide')
assert.equal(node(install, '#code').codeRepository, 'https://example.org/repo')
assert.deepEqual(
  node(install, '#breadcrumb').itemListElement.map((item) => [item.name, item.item]),
  [
    ['Fixture Docs', 'https://example.com/'],
    ['Guides', 'https://example.com/guides/'],
    ['Install', 'https://example.com/guides/install/'],
  ],
)
assert.equal(install.html.match(/<title>/g).length, 1)
assert.equal(install.html.match(/property="og:title"/g).length, 1)

const post = page('/blog/first/')
assert.equal(post.invalid, 0)
assert.equal(node(post, '#article')['@type'], 'BlogPosting')
assert.equal(node(post, '#article').headline, 'First post about <script> & "quotes" in the fixture')
assert.equal(node(post, '#article').datePublished, '2026-09-01')
assert.equal(node(post, '#article').articleSection, 'Blog')
assert.equal(post.html.includes('article:published_time'), true)

const ru = page('/ru/guides/install/')
assert.equal(ru.title, 'Установка: пошаговое руководство | Fixture Docs')
assert.equal(node(ru, '#website').description, 'Проверочный сайт плагина')
assert.equal(node(ru, '#article').inLanguage, 'ru')
assert.equal(node(ru, '#breadcrumb').itemListElement[0].item, 'https://example.com/ru/')

const hidden = page('/hidden/')
assert.equal(hidden.robots, 'noindex, follow')

console.log('fixture: all assertions passed')

const fallback = page('/ru/blog/first/')
assert.equal(fallback.canonical, 'https://example.com/blog/first/')
assert.equal(page('/ru/guides/install/').canonical, 'https://example.com/ru/guides/install/')
console.log('fixture: fallback pages point at the source page')
