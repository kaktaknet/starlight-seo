import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { audit, inspect } from '../lib/audit.js'
import { normalize } from '../lib/options.js'

const html = ({ title, description, canonical, ogTitle, image, graph, extra = '' }) => `<!doctype html><html><head>
${title === undefined ? '' : `<title>${title}</title>`}
${description === undefined ? '' : `<meta name="description" content="${description}"/>`}
${canonical ? `<link href="${canonical}" rel="canonical">` : canonical === '' ? '' : '<link href="SELF" rel="canonical">'}
${ogTitle === undefined ? '' : `<meta content="${ogTitle}" property="og:title">`}
${image ? `<meta property="og:image" content="${image}">` : ''}
${graph === undefined ? '' : `<script type="application/ld+json">${graph}</script>`}
${extra}
</head><body><h1>x</h1></body></html>`

const good = 'A title that is long enough to pass the lower bound'
const text = 'A description that is comfortably longer than seventy characters, so it passes the lower bound.'
const graphFor = (name) => JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': 'https://example.com/x/#webpage', name }] })

const own = (path) => `https://example.com/${path.replace(/index\.html$/, '')}`

const site = async (pages) => {
  const root = await mkdtemp(join(tmpdir(), 'starlight-seo-'))
  for (const [path, content] of Object.entries(pages)) {
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), content.replace('SELF', own(path)))
  }
  return root
}

const run = async (pages, user = {}) => {
  const root = await site(pages)
  try {
    return await audit(root, normalize(user, { site: 'https://example.com' }))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

const rules = (result) => result.findings.map((finding) => finding.rule).sort()

test('inspect reads attributes in any order and decodes entities', () => {
  const page = inspect(html({ canonical: 'https://example.com/x/', title: 'A &amp; B', description: 'd &quot;q&quot;', ogTitle: 'A &#38; B', graph: graphFor('A & B') }))
  assert.equal(page.title, 'A & B')
  assert.equal(page.description, 'd "q"')
  assert.equal(page.ogTitle, 'A & B')
  assert.equal(page.canonical, 'https://example.com/x/')
  assert.equal(page.nodes.length, 1)
})

test('a clean page produces no findings', async () => {
  const result = await run({ 'x/index.html': html({ title: good, description: text, ogTitle: good, image: 'https://cdn.example.org/og.png', graph: graphFor(good) }) })
  assert.deepEqual(result.findings, [])
  assert.equal(result.pages, 1)
})

test('every rule fires on its own defect', async () => {
  const result = await run({
    'short/index.html': html({ title: 'Git | Docs', description: 'tiny', ogTitle: 'Git', image: 'https://example.com/missing.png', graph: graphFor('Other') }),
    'long/index.html': html({ title: `${good} ${good}`, description: `${text} ${text}`, canonical: '', ogTitle: 'x', graph: '{broken' }),
    'none/index.html': html({}),
    'dup-a/index.html': html({ title: good, description: text, ogTitle: good, image: 'https://cdn.example.org/a.png', graph: graphFor(good) }),
    'dup-b/index.html': html({ title: good, description: text, ogTitle: good, image: 'https://cdn.example.org/a.png', graph: graphFor(good) }),
  })
  assert.deepEqual([...new Set(rules(result))], [
    'canonical.missing',
    'description.duplicate',
    'description.long',
    'description.missing',
    'description.short',
    'image.broken',
    'image.missing',
    'jsonld.invalid',
    'jsonld.mismatch',
    'jsonld.missing',
    'title.duplicate',
    'title.long',
    'title.missing',
    'title.short',
  ])
  assert.ok(result.errors > 0)
  assert.ok(result.warnings > 0)
})

test('redirects, noindex pages and excluded paths are not audited', async () => {
  const result = await run(
    {
      'go/x/index.html': html({ extra: '<meta http-equiv="refresh" content="0;url=https://a.b">' }),
      'hidden/index.html': html({ extra: '<meta name="robots" content="noindex, follow">' }),
      'skip/me/index.html': html({}),
      '404.html': html({}),
      'copy/index.html': html({ canonical: 'https://example.com/original/' }),
    },
    { audit: { exclude: ['/skip/**'] } },
  )
  assert.equal(result.pages, 0)
  assert.deepEqual(result.findings, [])
})

test('a local image that exists is accepted and levels can be changed', async () => {
  const result = await run(
    {
      'x/index.html': html({ title: 'Git | Docs', description: text, ogTitle: 'Git', image: 'https://example.com/og.png', graph: graphFor('Git') }),
      'og.png': 'png',
    },
    { audit: { rules: { 'title.short': 'error' } } },
  )
  assert.deepEqual(rules(result), ['title.short'])
  assert.equal(result.errors, 1)
})

test('an image path cannot leave the build output', async () => {
  const result = await run({
    'x/index.html': html({ title: good, description: text, ogTitle: good, image: 'https://example.com/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/hostname', graph: graphFor(good) }),
    'y/index.html': html({ title: `${good} two`, description: `${text} Second.`, ogTitle: `${good} two`, image: 'https://example.com/%E0%A4%A', graph: graphFor(`${good} two`) }),
  })
  assert.deepEqual(rules(result), ['image.broken', 'image.broken'])
})
