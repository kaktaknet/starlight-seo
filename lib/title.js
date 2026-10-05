import { fill, firstMatch, length, pick } from './text.js'

export function resolveTitle({ label, seoTitle, path, lang, locale, siteName, options }) {
  const rule = seoTitle ? undefined : firstMatch(options.templates, path)
  const template = rule ? pick(rule.template, lang, locale) : undefined
  const base = seoTitle ?? (template ? fill(template, { title: label, site: siteName }) : label)
  const source = seoTitle ? 'frontmatter' : template ? 'template' : 'label'
  const branded = `${base} ${options.delimiter} ${siteName}`
  const mentionsSite = base.toLowerCase().includes(String(siteName).toLowerCase())
  const withBrand =
    options.brand === 'always' ||
    (options.brand === 'auto' && !mentionsSite && length(branded) <= options.max)
  return { base, full: withBrand ? branded : base, source, branded: withBrand }
}
