const ARTICLES = new Set([
  'Article',
  'TechArticle',
  'APIReference',
  'BlogPosting',
  'NewsArticle',
  'Report',
  'ScholarlyArticle',
  'SocialMediaPosting',
  'DiscussionForumPosting',
])

export const isArticle = (type) => ARTICLES.has(type)

const day = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value).slice(0, 10) : undefined)

const compact = (node) => Object.fromEntries(Object.entries(node).filter(([, value]) => value !== undefined && value !== null && value !== ''))

const thing = (value) => {
  if (!value) return undefined
  if (typeof value === 'string') return { '@type': 'Thing', name: value }
  return compact({ '@type': value.type ?? 'Thing', name: value.name, description: value.description, url: value.url, sameAs: value.sameAs })
}

const things = (value) => {
  if (!value) return undefined
  const list = [].concat(value).map(thing).filter(Boolean)
  return list.length === 0 ? undefined : list.length === 1 ? list[0] : list
}

export const ids = (site, publisher, url) => ({
  website: `${site.origin}/#website`,
  publisher: publisher.id ?? `${publisher.url ?? `${site.origin}/`}#${publisher.type === 'Person' ? 'person' : 'organization'}`,
  webpage: `${url}#webpage`,
  article: `${url}#article`,
  breadcrumb: `${url}#breadcrumb`,
  image: `${url}#primaryimage`,
})

export function buildGraph({ site, publisher, page }) {
  const id = ids(site, publisher, page.url)
  const publisherRef = { '@id': id.publisher }
  const article = isArticle(page.type)
  const hasTrail = page.breadcrumbs.length > 1
  const about = things(page.about)

  const nodes = [
    compact({
      '@type': 'WebSite',
      '@id': id.website,
      url: `${site.origin}/`,
      name: site.name,
      alternateName: site.alternateName,
      description: site.description,
      inLanguage: page.language,
      publisher: publisherRef,
      about: things(site.about),
    }),
    compact({
      '@type': publisher.type ?? 'Organization',
      '@id': id.publisher,
      name: publisher.name,
      url: publisher.url,
      logo: publisher.logo ? { '@type': 'ImageObject', url: publisher.logo } : undefined,
      sameAs: publisher.sameAs,
    }),
    compact({
      '@type': article ? 'WebPage' : page.type,
      '@id': id.webpage,
      url: page.url,
      name: page.title,
      description: page.description,
      inLanguage: page.language,
      isPartOf: { '@id': id.website },
      breadcrumb: hasTrail ? { '@id': id.breadcrumb } : undefined,
      primaryImageOfPage: page.image ? { '@id': id.image } : undefined,
      datePublished: day(page.published),
      dateModified: day(page.modified),
      about: article ? undefined : about,
    }),
  ]

  if (page.image) {
    nodes.push(
      compact({
        '@type': 'ImageObject',
        '@id': id.image,
        url: page.image.url,
        contentUrl: page.image.url,
        width: page.image.width,
        height: page.image.height,
        caption: page.image.alt,
      }),
    )
  }

  if (article) {
    nodes.push(
      compact({
        '@type': page.type,
        '@id': id.article,
        headline: page.title,
        description: page.description,
        inLanguage: page.language,
        url: page.url,
        mainEntityOfPage: { '@id': id.webpage },
        isPartOf: { '@id': id.webpage },
        author: publisherRef,
        publisher: publisherRef,
        datePublished: day(page.published),
        dateModified: day(page.modified ?? page.published),
        image: page.image ? { '@id': id.image } : undefined,
        articleSection: page.section,
        keywords: page.keywords?.length ? page.keywords.join(', ') : undefined,
        about,
      }),
    )
  }

  if (hasTrail) {
    nodes.push({
      '@type': 'BreadcrumbList',
      '@id': id.breadcrumb,
      itemListElement: page.breadcrumbs.map((crumb, index) =>
        compact({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.label,
          item: crumb.href ? new URL(crumb.href, site.origin).href : undefined,
        }),
      ),
    })
  }

  return nodes
}

export const wrap = (nodes) => ({ '@context': 'https://schema.org', '@graph': nodes })
