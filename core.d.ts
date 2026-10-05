import type { SeoNode, SeoPage, StarlightSeoOptions } from './index.js'

export interface PageInput {
  pathname: string
  path: string
  lang: string
  locale?: string
  homeHref: string
  isHome: boolean
  canonical: string
  label: string
  description?: string
  template?: string
  lastUpdated?: Date
  siteTitle: string
  sidebar: unknown[]
  seo?: Record<string, unknown>
}

export interface HeadEntry {
  tag: string
  attrs?: Record<string, string | boolean | undefined>
  content?: string
}

export type ResolvedOptions = Record<string, any>

export function normalize(options: StarlightSeoOptions, context: { site?: string | URL; delimiter?: string; defaultPrefix?: string }): ResolvedOptions
export function resolvePage(options: ResolvedOptions, input: PageInput): SeoPage
export function applyHead(head: HeadEntry[], page: SeoPage, options: ResolvedOptions): void
export function graphOf(page: SeoPage, options: ResolvedOptions): SeoNode[]
export function pushGraph(head: HeadEntry[], nodes: SeoNode[]): void
export function wrap(nodes: SeoNode[]): { '@context': string; '@graph': SeoNode[] }
export function serialize(value: unknown): string
