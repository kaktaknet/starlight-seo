# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/kaktaknet/starlight-seo/releases/tag/v0.1.0
