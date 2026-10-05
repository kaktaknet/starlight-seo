# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.2]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.2.2
[0.2.1]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.2.1
[0.2.0]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.2.0
[0.1.0]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.1.0
