# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-12

The first stable release. The options, the hook contract, the node identifiers and the output shape are now covered by semantic versioning.

### Fixed

- A page without its own description lost its `description` and `og:description` when the site description was set only in the Starlight config. The Starlight `description` is now the fallback for `site.description`.
- A `type` returned by the `page` hook now also sets `og:type` and the `article:*` times, not only the JSON-LD node.
- `breadcrumbs.groups: 'plain'` no longer puts crumbs without a URL into the JSON-LD `BreadcrumbList`, which Google rejects; the crumbs stay in `page.breadcrumbs` for the hooks.
- A sidebar group whose first link is external no longer gets that link as its breadcrumb URL.
- The plugin `exclude` list is matched without the locale prefix in the audit too, as in the middleware, so an excluded translated page is no longer audited.
- `pushGraph` in `starlight-seo/core` is typed with its `options` argument; `AuditFinding.rule` is typed as `AuditRule` and `audit()` takes the resolved options.

### Changed

- A site served under a sub-path (an Astro `base` other than `/`, or a path in `site`) now stops the build with an error instead of producing wrong canonical URLs and an audit that checks nothing.
- `audit.failOn` is validated: anything but `'error'`, `'warn'` or `'off'` stops the build.
- A user `exclude` list is added to the default one, so the 404 page is always left alone.
- The lowest supported versions are Starlight 0.33.0 and Astro 5.1.5, measured: Starlight 0.32 has no `head` in its route data and the plugin cannot run there. CI now tests that floor on every change.
- Tested on Starlight 0.42.6 and Astro 7.3.8.

## [0.3.0] - 2026-10-12

### Added

- `breadcrumbs.section`: one fixed crumb after the first, for docs that live under a section the sidebar does not name.
- `breadcrumbs.standalone` (default `true`): whether the breadcrumb list is a separate JSON-LD block.
- `splitBlocks` in `starlight-seo/core`.

### Changed

- The `BreadcrumbList` is now a separate top-level `<script type="application/ld+json">` block instead of a node inside the `@graph`; `WebPage.breadcrumb` still points at it by `@id`. Yandex documents breadcrumbs only in this shape. Set `breadcrumbs.standalone: false` for the previous output.
- Every `ListItem` with a URL carries it as both `item` and `url`, the fields Google and Yandex read.

## [0.2.2] - 2026-10-05

### Fixed

- `site.about` given as one object (`{ name, url, sameAs }`) was read as a per-language map and reduced to its name; `url`, `sameAs` and `type` now reach the JSON-LD graph.

## [0.2.1] - 2026-10-05

### Changed

- The package is published to npm as `starlight-seo`; the install commands use the registry instead of a git tag.

## [0.2.0] - 2026-10-05

### Added

- `audit.limit`: how many pages per rule the build log shows (default 15).
- A `title` returned by the `page` hook now gets the site name by the same rule as any other title, so `<title>` and `og:title` stay consistent.
- Documentation: stable node identifiers, the hook contract, middleware order, how to keep existing titles and site-specific JSON-LD during an install.

### Changed

- The crumb of the current page carries its sidebar label instead of the page title.

### Fixed

- Nested sidebar groups that lead to the same page no longer produce two consecutive crumbs with one URL.
- The `image.broken` audit rule resolves the image path inside the build output only; a percent-encoded path can no longer point outside it, and a malformed one no longer throws.

## [0.1.0] - 2026-10-05

### Added

- Search titles separate from the sidebar label: `seo.title` in frontmatter, per-section `title.templates`, site name appended only when it fits.
- One JSON-LD `@graph` per page: `WebSite`, publisher, `WebPage`, article node, `BreadcrumbList`, `ImageObject`, linked by `@id`.
- Breadcrumbs derived from the Starlight sidebar.
- Open Graph completion: `og:image` with size and alternative text, `og:type`, article dates, `twitter:image`.
- `robots` meta with snippet directives, and `noindex` per page.
- Canonical URL of untranslated fallback pages pointed at the source page.
- `extend` module with `page` and `graph` hooks for site-specific data.
- Build audit with 14 rules that fails the build on errors.
- Per-language values for every text option.

[1.0.0]: https://github.com/kaktaknet/starlight-seo/releases/tag/v1.0.0
[0.3.0]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.3.0
[0.2.2]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.2.2
[0.2.1]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.2.1
[0.2.0]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.2.0
[0.1.0]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.1.0
