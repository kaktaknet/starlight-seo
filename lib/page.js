import { breadcrumbs } from './breadcrumbs.js'
import { isArticle } from './graph.js'
import { resolveTitle } from './title.js'
import { fill, firstMatch, pick } from './text.js'

const slugOf = (path) => path.replace(/^\/+|\/+$/g, '') || 'index'

const absolute = (value, origin) => new URL(value, `${origin}/`).href

export function retitle(options, page, base) {
  const brand = pick(options.title.site, page.language, page.locale) ?? page.site.name
  const title = resolveTitle({ label: page.label, seoTitle: base, path: page.path, lang: page.language, locale: page.locale, siteName: brand, options: options.title })
  return { title: title.base, headTitle: title.full, titleSource: 'hook' }
}

export function resolvePage(options, input) {
  const { pathname, path, lang, locale, label, siteTitle, seo = {} } = input
  const siteName = pick(options.site.name, lang, locale) ?? siteTitle
  const home = { label: pick(options.breadcrumbs.home, lang, locale) ?? siteName, href: input.homeHref }

  const brand = pick(options.title.site, lang, locale) ?? siteName
  const title = resolveTitle({ label, seoTitle: seo.title, path, lang, locale, siteName: brand, options: options.title })
  const description = seo.description ?? input.description ?? pick(options.site.description, lang, locale)

  const rule = firstMatch(options.types, path)
  const type = seo.type ?? rule?.type ?? (input.isHome ? 'WebPage' : input.template === 'splash' ? 'CollectionPage' : options.defaultType)

  const source = seo.image ?? (options.image ? fill(pick(options.image.src, lang, locale), { slug: slugOf(path), lang: lang ?? '', locale: locale ?? '' }) : undefined)
  const image = source
    ? {
        url: absolute(source, options.origin),
        width: seo.image ? undefined : options.image.width,
        height: seo.image ? undefined : options.image.height,
        alt: seo.imageAlt ?? pick(options.image?.alt, lang, locale) ?? title.base,
      }
    : null

  return {
    url: input.canonical,
    pathname,
    path,
    language: lang,
    locale,
    isHome: input.isHome,
    label,
    title: title.base,
    headTitle: title.full,
    titleSource: title.source,
    description,
    type,
    article: isArticle(type),
    image,
    noindex: seo.noindex === true,
    published: seo.published,
    modified: seo.modified ?? input.lastUpdated,
    section: seo.section ?? rule?.section,
    keywords: seo.keywords,
    about: seo.about ?? pick(options.site.about, lang, locale),
    breadcrumbs: breadcrumbs({
      sidebar: input.sidebar,
      home,
      label,
      pathname,
      isHome: input.isHome,
      groups: options.breadcrumbs.groups,
    }),
    site: {
      origin: options.origin,
      name: siteName,
      alternateName: pick(options.site.alternateName, lang, locale),
      description: pick(options.site.description, lang, locale),
      about: pick(options.site.about, lang, locale),
    },
  }
}
