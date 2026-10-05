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
| Plugin | 0.1.0 (tag `v0.1.0`) | |

Before installing, read the versions in the target project's `package.json`. Below the floor, stop and report: Starlight older than 0.32 has no `config:setup` hook and no plugin route middleware, so the plugin cannot load. Above the tested pair, install and rely on the verification step.

## Installing into a site

Work from the root of the Starlight project. Use the package manager the project already uses: the lockfile decides (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`).

1. **Detect.** Confirm `@astrojs/starlight` is a dependency and check the versions against the table above. Find the Astro config (`astro.config.mjs` or `.ts`) and the content config (`src/content.config.ts`, or `src/content/config.ts` on older projects).

2. **Add the package**, pinned to a tag.

   ```sh
   pnpm add github:kaktaknet/starlight-seo#v0.1.0
   npm install github:kaktaknet/starlight-seo#v0.1.0
   yarn add starlight-seo@github:kaktaknet/starlight-seo#v0.1.0
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

6. **Remove duplicate metadata.** Search the project for hand-written JSON-LD, `og:image`, `og:title` or `<title>` in a `Head` override, in `routeMiddleware`, in the Starlight `head` option, and in frontmatter `head`. Remove what the plugin now writes. Keep everything else (analytics, fonts, alternate links).

   ```sh
   grep -rn "ld+json\|og:image\|og:title" src astro.config.*
   ```

7. **Social image.** If the project has a 1200 x 630 image, pass it as `image: '/og.png'`. If it has none, do not create a placeholder: leave `image` out and set `audit: { rules: { 'image.missing': 'off' } }`, then tell the user.

8. **Build and read the audit.**

   ```sh
   pnpm astro build
   ```

   Errors fail the build. Report warnings to the user grouped by rule. Do not silence a rule to get a green build, except `image.missing` in the case above.

## Verifying

```sh
grep -o '<title>[^<]*</title>' dist/index.html
grep -c 'application/ld+json' dist/index.html
grep -o '<meta property="og:title"[^>]*>' dist/index.html
```

Pass: the build log ends with `[starlight-seo] audited N page(s): 0 error(s), ...`; every audited page has exactly one `application/ld+json` block; `og:title` carries the title without the site name.

Fail patterns:

| Symptom | Cause | Fix |
|---|---|---|
| `set site in the Astro config` | `site` is missing | step 3 |
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
- Bump `version` in `package.json` and add a `CHANGELOG.md` entry for every user-visible change. The install commands in both READMEs and in this file name the tag.
