const LEVELS = ['error', 'warn', 'off']
const EXCLUDE = ['/404/', '/404.html']

export const RULES = {
  'title.missing': 'error',
  'title.short': 'warn',
  'title.long': 'warn',
  'title.duplicate': 'error',
  'description.missing': 'error',
  'description.short': 'warn',
  'description.long': 'warn',
  'description.duplicate': 'error',
  'canonical.missing': 'error',
  'jsonld.missing': 'warn',
  'jsonld.invalid': 'error',
  'jsonld.mismatch': 'error',
  'image.missing': 'warn',
  'image.broken': 'error',
}

const fail = (message) => {
  throw new Error(`[starlight-seo] ${message}`)
}

export function normalize(user = {}, context = {}) {
  const origin = context.site ? String(context.site).replace(/\/+$/, '') : undefined
  if (!origin) fail('set `site` in the Astro config: canonical URLs and JSON-LD identifiers need an absolute origin')
  if (new URL(`${origin}/`).pathname !== '/' || (context.base && context.base.replace(/\/+$/, '') !== '')) {
    fail('a site served under a sub-path (Astro `base`, or a path in `site`) is not supported: canonical URLs, breadcrumbs and the audit assume the site root')
  }

  const title = user.title ?? {}
  const description = user.description ?? {}
  const audit = user.audit === false ? { failOn: 'off' } : (user.audit ?? {})
  const rules = { ...RULES, ...(audit.rules ?? {}) }
  for (const [rule, level] of Object.entries(rules)) {
    if (!(rule in RULES)) fail(`unknown audit rule "${rule}"`)
    if (!LEVELS.includes(level)) fail(`audit rule "${rule}" has level "${level}", expected one of ${LEVELS.join(', ')}`)
  }
  const failOn = audit.failOn ?? 'error'
  if (!LEVELS.includes(failOn)) fail(`\`audit.failOn\` must be ${LEVELS.map((level) => `"${level}"`).join(', ')}`)
  const brand = title.brand ?? 'auto'
  if (!['auto', 'always', 'never'].includes(brand)) fail('`title.brand` must be "auto", "always" or "never"')
  const groups = user.breadcrumbs?.groups ?? 'link'
  if (!['link', 'plain', 'skip'].includes(groups)) fail('`breadcrumbs.groups` must be "link", "plain" or "skip"')
  const section = user.breadcrumbs?.section
  if (section !== undefined && (typeof section?.href !== 'string' || !section.href.startsWith('/') || section.label === undefined)) {
    fail('`breadcrumbs.section` must be { label, href } with href starting with "/"')
  }
  const standalone = user.breadcrumbs?.standalone ?? true
  if (typeof standalone !== 'boolean') fail('`breadcrumbs.standalone` must be true or false')

  if (!['canonical', 'keep'].includes(user.fallback ?? 'canonical')) fail('`fallback` must be "canonical" or "keep"')

  const image = typeof user.image === 'string' ? { src: user.image } : user.image
  const publisher = user.publisher ?? {}

  return {
    origin,
    site: {
      name: user.site?.name,
      alternateName: user.site?.alternateName,
      description: user.site?.description ?? context.description,
      about: user.site?.about,
    },
    publisher: {
      type: publisher.type ?? 'Organization',
      id: publisher.id,
      name: publisher.name,
      url: publisher.url,
      logo: publisher.logo,
      sameAs: publisher.sameAs,
    },
    title: {
      min: title.min ?? 30,
      max: title.max ?? 60,
      brand,
      delimiter: title.delimiter ?? context.delimiter ?? '|',
      templates: title.templates ?? [],
      site: title.site,
    },
    description: { min: description.min ?? 70, max: description.max ?? 160 },
    types: user.types ?? [],
    defaultType: user.defaultType ?? 'TechArticle',
    image: image ? { src: image.src, width: image.width ?? 1200, height: image.height ?? 630, alt: image.alt } : null,
    robots: user.robots === undefined ? 'max-snippet:-1, max-image-preview:large, max-video-preview:-1' : user.robots,
    breadcrumbs: { groups, home: user.breadcrumbs?.home, section, standalone },
    exclude: [...EXCLUDE, ...(user.exclude ?? [])],
    locales: context.locales ?? [],
    extend: user.extend,
    fallback: user.fallback ?? 'canonical',
    defaultPrefix: context.defaultPrefix ?? '',
    audit: {
      failOn,
      exclude: audit.exclude ?? [],
      limit: audit.limit ?? 15,
      rules,
    },
  }
}
