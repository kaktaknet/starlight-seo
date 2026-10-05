# starlight-seo - instructions for coding agents

## What this repository is

`starlight-seo` is a plugin for [Starlight](https://starlight.astro.build/), the documentation framework built on Astro. It gives every page a search-ready `<title>`, one connected JSON-LD `@graph`, complete Open Graph tags, and a build-time audit that fails the build on weak metadata. It works through Starlight route middleware and overrides no components.

It is not a general Astro SEO component. It does nothing on a site that does not use Starlight.

## Versions

| | Built for and tested on | Lowest supported |
|---|---|---|
| Starlight (`@astrojs/starlight`) | **0.42.5** | 0.32.0 |
| Astro | **7.3.5** | 5.0.0 |
| Node | 22, 24 | 20 |
| Plugin | 0.2.2 (npm `starlight-seo`, tag `v0.2.2`) | |

Before installing, read the versions in the target project's `package.json`. Below the floor, stop and report: Starlight older than 0.32 has no `config:setup` hook and no plugin route middleware, so the plugin cannot load. Above the tested pair, install and rely on the verification step.

## Installing into a site

Work from the root of the Starlight project. Use the package manager the project already uses: the lockfile decides (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`).

1. **Detect.** Confirm `@astrojs/starlight` is a dependency and check the versions against the table above. Find the Astro config (`astro.config.mjs` or `.ts`) and the content config (`src/content.config.ts`, or `src/content/config.ts` on older projects).

2. **Add the package** from npm: <https://www.npmjs.com/package/starlight-seo>. Source: <https://github.com/kaktaknet/starlight-seo>.

   ```sh
   pnpm add starlight-seo
   npm install starlight-seo
   yarn add starlight-seo
   ```

3. **Make sure `site` is set** in `defineConfig`. If it is missing, ask the user for the production URL. Do not invent one.

4. **Register the plugin** in the `starlight({ ... })` call.

   ```js
   import starlightSeo from 'starlight-seo'

   starlight({
     plugins: [starlightSeo({ publisher: { name: 'Org name', url: 'https://org.example/' } })],
   })
   ```

   If `plugins` already exists, append to the array. Take publisher values from the project (README, footer, existing metadata). Leave out what you cannot find.

5. **Extend the docs schema.**

   ```ts
   import { seoSchema } from 'starlight-seo/schema'

   docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: seoSchema() }) })
   ```

   If `docsSchema` already has `extend`, merge: `extend: seoSchema().extend({ ...existingFields })`. When the existing `extend` is a function, keep it and merge inside it: `extend: (ctx) => seoSchema().merge(existing(ctx))`.

6. **Move, then remove, the site's own metadata.** Do this in order, so nothing is lost:

   - **Existing titles.** If the site already computes good titles (a data file, a map, middleware), keep them. Feed them to the plugin as `title.templates` entries with an exact `match` and a `template` without `{title}`, or return `title` from the `page` hook of an `extend` module. Never let production titles fall back to sidebar labels.
   - **Site-specific JSON-LD** (extra properties, extra nodes such as `DefinedTermSet` or `SoftwareSourceCode`). Move it into the `graph` hook of an `extend` module (README, "Adding your own nodes"). Find built-in nodes by `@id`: `#website`, `#webpage`, `#article`, `#breadcrumb`, `#primaryimage`. The hook may also remove built-in nodes.
   - **The 404 page.** The plugin skips `/404/` and `/404.html`. If the code you are deleting also served the 404 page, keep that branch.
   - **Tests and gates of the site** that assert on the old shape (an `@id` such as `#page`, a list of `@type` values, the absence of a `robots` tag). Do not edit them silently: list each failing assertion for the user with the new value.

   Then **remove duplicate metadata.** Search the project for hand-written JSON-LD, `og:image`, `og:title` or `<title>` in a `Head` override, in `routeMiddleware`, in the Starlight `head` option, and in frontmatter `head`. Remove what the plugin now writes. Keep everything else (analytics, fonts, alternate links).

   ```sh
   grep -rn "ld+json\|og:image\|og:title" src astro.config.*
   ```

7. **Social image.** If the project has a 1200 x 630 image, pass it as `image: '/og.png'`. If it has none, do not create a placeholder: leave `image` out and set `audit: { rules: { 'image.missing': 'off' } }`, then tell the user.

8. **Build and read the audit.** Use the project's own build script when it has one (`pnpm build`), otherwise:

   ```sh
   pnpm astro build
   ```

   Errors fail the build. Report warnings to the user grouped by rule. The log shows 15 pages per rule; set `audit.limit` higher to see all. Do not silence a rule to get a green build, except `image.missing` in the case above.

## Verifying

```sh
grep -o '<title>[^<]*</title>' dist/index.html
grep -c 'application/ld+json' dist/index.html
grep -o '<meta property="og:title"[^>]*>' dist/index.html
```

Pass: the build log ends with `[starlight-seo] audited N page(s): 0 error(s), ...`; every audited page has exactly one `application/ld+json` block; `og:title` carries the title without the site name.

Report these visible changes to the user even when the build is green: the `robots` meta tag with snippet directives on every page, `og:type` now `website` on non-article pages, `inLanguage` equal to the Starlight `lang`, the new node identifiers, and breadcrumbs built from the sidebar.

`title.long` on almost every page means the site name is long and `title.brand` is `'always'`: raise `title.max` to the length the site accepts, or shorten the suffix with `title.site`. Do not turn the rule off.

Fail patterns:

| Symptom | Cause | Fix |
|---|---|---|
| ``[starlight-seo] set `site` in the Astro config: ...`` | `site` is missing | step 3 |
| two `application/ld+json` blocks, or `jsonld.mismatch` | the site still writes its own JSON-LD | step 6 |
| `Unrecognized key: "seo"` on a content entry | the schema is not extended | step 5 |
| `title.duplicate` across locales | untranslated fallback pages with `fallback: 'keep'` | use the default `fallback: 'canonical'` |
| `Cannot find module 'virtual:starlight-seo/options'` | the package was externalized by a custom `vite.ssr.external` | remove `starlight-seo` from that list |

## Writing titles

Titles are the point of the plugin. After the install, improve them in this order:

1. Add `title.templates` for sections whose pages share a pattern (`/sdk/*/`, `/reference/**`).
2. Add `seo.title` to pages the templates do not cover.

A good title names the subject and answers the query in the first 50 to 60 characters. Do not put a year or a version in a title unless the page is about that year or version. Never change the page `title` to fix a search title: `title` is the sidebar label and the heading.

Do not invent facts in a title or a description. Every claim must be on the page.

## Working on this repository

```sh
pnpm install
pnpm test            # unit tests, node --test
pnpm test:fixture    # builds tests/fixture with real Starlight and asserts on the HTML
```

Both must pass before a change is done.

| Path | Role |
|---|---|
| `index.js` | plugin entry: registers middleware, the virtual modules and the audit hook |
| `middleware.js` | the only code that touches `route.head` at render time |
| `schema.js` | `seoSchema()` and `seoFields()` |
| `core.js` | public re-export of the pure functions |
| `lib/options.js` | defaults and validation; every option is normalized here |
| `lib/page.js` | resolves one page: title, description, type, image, breadcrumbs |
| `lib/title.js`, `lib/breadcrumbs.js`, `lib/graph.js`, `lib/head.js` | pure functions, one concern each |
| `lib/audit.js` | reads built HTML, no dependency on Astro |
| `*.d.ts` | hand-written types; update them with every public change |
| `tests/fixture/` | a two-locale Starlight site used by `pnpm test:fixture` |

Rules of the codebase:

- Plain ESM JavaScript. No TypeScript sources, no build step, no runtime dependencies. A dependency needs a reason stronger than convenience.
- No code comments. Names carry the meaning; the README carries the explanation.
- Options reach the middleware as JSON through a virtual module, so an option value cannot be a function. Behavior that needs code goes through the `extend` module.
- A new option needs: a default in `lib/options.js`, a type in `index.d.ts`, a row in both READMEs, a unit test.
- A new audit rule needs: an entry in `RULES`, the `AuditRule` type, a row in both READMEs, and a case in `tests/audit.test.js` that makes it fire.
- `README.md` is the source; `README.ru.md` is its translation and must be updated in the same change.
- Bump `version` in `package.json` and add a `CHANGELOG.md` entry for every user-visible change. Publish to npm from a clean tree after the tag is pushed.
