import type { StarlightPlugin } from '@astrojs/starlight/types'

export type Localized<T> = T | Record<string, T>

export interface ThingInput {
  type?: string
  name: string
  description?: string
  url?: string
  sameAs?: string | string[]
}

export type AuditLevel = 'error' | 'warn' | 'off'

export type AuditRule =
  | 'title.missing'
  | 'title.short'
  | 'title.long'
  | 'title.duplicate'
  | 'description.missing'
  | 'description.short'
  | 'description.long'
  | 'description.duplicate'
  | 'canonical.missing'
  | 'jsonld.missing'
  | 'jsonld.invalid'
  | 'jsonld.mismatch'
  | 'image.missing'
  | 'image.broken'

export interface StarlightSeoOptions {
  site?: {
    name?: Localized<string>
    alternateName?: Localized<string>
    description?: Localized<string>
    about?: Localized<string | ThingInput | Array<string | ThingInput>>
  }
  publisher?: {
    type?: 'Organization' | 'Person'
    id?: string
    name?: string
    url?: string
    logo?: string
    sameAs?: string[]
  }
  title?: {
    min?: number
    max?: number
    brand?: 'auto' | 'always' | 'never'
    delimiter?: string
    site?: Localized<string>
    templates?: Array<{ match: string | string[]; template: Localized<string> }>
  }
  description?: { min?: number; max?: number }
  types?: Array<{ match: string | string[]; type: string; section?: string }>
  defaultType?: string
  image?: string | { src: Localized<string>; width?: number; height?: number; alt?: Localized<string> }
  robots?: string | false
  breadcrumbs?: { groups?: 'link' | 'plain' | 'skip'; home?: Localized<string> }
  fallback?: 'canonical' | 'keep'
  exclude?: string[]
  extend?: string
  audit?: false | { failOn?: 'error' | 'warn' | 'off'; exclude?: string[]; rules?: Partial<Record<AuditRule, AuditLevel>> }
}

export interface SeoCrumb {
  label: string
  href?: string
}

export interface SeoPage {
  url: string
  pathname: string
  path: string
  language: string
  locale: string | undefined
  isHome: boolean
  label: string
  title: string
  headTitle: string
  titleSource: 'frontmatter' | 'template' | 'label'
  description: string | undefined
  type: string
  article: boolean
  image: { url: string; width?: number; height?: number; alt?: string } | null
  noindex: boolean
  published: Date | string | undefined
  modified: Date | string | undefined
  section: string | undefined
  keywords: string[] | undefined
  about: unknown
  breadcrumbs: SeoCrumb[]
  site: { origin: string; name: string; alternateName?: string; description?: string; about?: unknown }
}

export type SeoNode = Record<string, unknown>

export type SeoPageHook = (page: SeoPage, context: import('astro').APIContext) => Partial<SeoPage> | void | Promise<Partial<SeoPage> | void>

export type SeoGraphHook = (nodes: SeoNode[], page: SeoPage, context: import('astro').APIContext) => SeoNode[] | void | Promise<SeoNode[] | void>

export default function starlightSeo(options?: StarlightSeoOptions): StarlightPlugin

export { audit } from './lib/audit.js'
export { normalize } from './core.js'
