export const graph = (nodes, page) =>
  page.path === '/guides/install/'
    ? [...nodes, { '@type': 'SoftwareSourceCode', '@id': `${page.url}#code`, name: 'fixture', codeRepository: 'https://example.org/repo' }]
    : nodes

export const page = (page) => (page.locale === 'ru' && page.isHome ? { type: 'BlogPosting' } : undefined)
