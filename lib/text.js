export const length = (value) => [...String(value ?? '')].length

export const pick = (value, lang, locale) => {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'object' || Array.isArray(value)) return value
  const short = String(lang ?? '').split('-')[0]
  if (lang && lang in value) return value[lang]
  if (short && short in value) return value[short]
  if (locale && locale in value) return value[locale]
  if ('root' in value) return value.root
  return Object.values(value)[0]
}

const THING_KEYS = ['name', 'url', 'sameAs', 'type', '@id', '@type']

export const pickThing = (value, lang, locale) => {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && THING_KEYS.some((key) => key in value)) return value
  return pick(value, lang, locale)
}

export const fill = (template, values) =>
  String(template).replace(/\{(\w+)\}/g, (whole, key) => (key in values ? String(values[key]) : whole))

const ESCAPES = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' }

export const serialize = (value) => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => ESCAPES[char])

const SPECIAL = /[.+^${}()|[\]\\]/g

export const matcher = (pattern) => {
  const source = String(pattern)
    .replace(SPECIAL, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*')
    .replace(/\?/g, '[^/]')
  const expression = new RegExp(`^${source}$`)
  return (path) => expression.test(path)
}

export const firstMatch = (rules, path) => (rules ?? []).find((rule) => [].concat(rule.match).some((pattern) => matcher(pattern)(path)))

export const anyMatch = (patterns, path) => (patterns ?? []).some((pattern) => matcher(pattern)(path))
