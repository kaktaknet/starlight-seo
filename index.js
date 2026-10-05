import { fileURLToPath } from 'node:url'
import { audit, report } from './lib/audit.js'
import { normalize } from './lib/options.js'

const OPTIONS = 'virtual:starlight-seo/options'
const EXTEND = 'virtual:starlight-seo/extend'

const virtual = (options, root) => {
  const extend = options.extend ? fileURLToPath(new URL(options.extend, root)) : null
  return {
    name: 'starlight-seo:virtual',
    resolveId(id) {
      if (id === OPTIONS || id === EXTEND) return `\0${id}`
    },
    load(id) {
      if (id === `\0${OPTIONS}`) return `export default ${JSON.stringify(options)}`
      if (id === `\0${EXTEND}`) {
        return extend
          ? `import * as user from ${JSON.stringify(extend)}\nconst hooks = { ...user }\nexport const page = hooks.page\nexport const graph = hooks.graph`
          : 'export const page = undefined\nexport const graph = undefined'
      }
    },
  }
}

export default function starlightSeo(userOptions = {}) {
  return {
    name: 'starlight-seo',
    hooks: {
      'config:setup'({ config, astroConfig, addRouteMiddleware, addIntegration }) {
        const root = !config.defaultLocale || config.defaultLocale === 'root'
        const options = normalize(userOptions, {
          site: astroConfig.site,
          delimiter: config.titleDelimiter,
          defaultPrefix: root ? '' : `/${config.defaultLocale}`,
        })

        addRouteMiddleware({ entrypoint: 'starlight-seo/middleware', order: 'post' })

        addIntegration({
          name: 'starlight-seo',
          hooks: {
            'astro:config:setup': ({ config: astro, updateConfig }) => {
              updateConfig({
                vite: {
                  plugins: [virtual(options, astro.root)],
                  ssr: { noExternal: ['starlight-seo'] },
                },
              })
            },
            'astro:build:done': async ({ dir, logger }) => {
              if (options.audit.failOn === 'off') return
              const result = await audit(fileURLToPath(dir), options)
              report(result, logger, options.audit.limit)
              const failed = result.errors > 0 || (options.audit.failOn === 'warn' && result.warnings > 0)
              if (failed) throw new Error(`[starlight-seo] audit failed: ${result.errors} error(s), ${result.warnings} warning(s)`)
            },
          },
        })
      },
    },
  }
}

export { audit } from './lib/audit.js'
export { normalize } from './lib/options.js'
