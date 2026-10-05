import { defineRouteMiddleware } from '@astrojs/starlight/route-data'
import options from 'virtual:starlight-seo/options'
import { graph as graphHook, page as pageHook } from 'virtual:starlight-seo/extend'
import { applyHead, canonicalOf, graphOf, pushGraph, setCanonical } from './lib/head.js'
import { resolvePage, retitle } from './lib/page.js'
import { anyMatch } from './lib/text.js'

export const onRequest = defineRouteMiddleware(async (context, next) => {
  await next()

  const route = context.locals.starlightRoute
  const data = route?.entry?.data
  if (!data) return

  const pathname = context.url.pathname
  const locale = route.locale
  const prefix = locale ? `/${locale}` : ''
  const path = prefix && pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname
  if (anyMatch(options.exclude, path)) return

  if (route.isFallback && options.fallback === 'canonical') {
    setCanonical(route.head, new URL(`${options.defaultPrefix}${path}`, `${options.origin}/`).href)
  }

  const page = resolvePage(options, {
    pathname,
    path,
    lang: route.lang,
    locale,
    homeHref: `${prefix}/`,
    isHome: path === '/',
    canonical: canonicalOf(route.head) ?? new URL(pathname, `${options.origin}/`).href,
    label: data.title,
    description: data.description,
    template: data.template,
    lastUpdated: route.lastUpdated,
    siteTitle: route.siteTitle,
    sidebar: route.sidebar,
    seo: data.seo,
  })

  if (typeof pageHook === 'function') {
    const patch = (await pageHook(page, context)) ?? {}
    Object.assign(page, patch)
    if (patch.title !== undefined && patch.headTitle === undefined) Object.assign(page, retitle(options, page, patch.title))
  }

  applyHead(route.head, page, options)

  let nodes = graphOf(page, options)
  if (typeof graphHook === 'function') nodes = (await graphHook(nodes, page, context)) ?? nodes
  pushGraph(route.head, nodes)
})
