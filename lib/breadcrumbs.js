const firstLink = (entry) => {
  for (const child of entry.entries ?? []) {
    if (child.type === 'link' && child.href) return child.href
    const nested = firstLink(child)
    if (nested) return nested
  }
  return undefined
}

const walk = (entries, trail) => {
  for (const entry of entries ?? []) {
    if (entry.type === 'link' && entry.isCurrent) return [...trail, { label: entry.label, href: entry.href, current: true }]
    if (entry.type === 'group') {
      const found = walk(entry.entries, [...trail, { label: entry.label, href: firstLink(entry), group: true }])
      if (found) return found
    }
  }
  return null
}

const distinct = (crumbs) => crumbs.filter((crumb, index) => !crumb.href || crumb.href !== crumbs[index - 1]?.href)

export function breadcrumbs({ sidebar, home, label, pathname, isHome, groups }) {
  if (isHome) return []
  const found = walk(sidebar, []) ?? [{ label, href: pathname, current: true }]
  const current = found.at(-1)
  const middle = found
    .filter((crumb) => !crumb.current)
    .filter(() => groups !== 'skip')
    .map((crumb) => (groups === 'plain' ? { label: crumb.label } : { label: crumb.label, href: crumb.href }))
    .filter((crumb) => crumb.href !== pathname)
  return [{ label: home.label, href: home.href }, ...distinct(middle), { label: current.label ?? label, href: pathname }]
}
