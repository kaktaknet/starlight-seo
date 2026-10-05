import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import starlightSeo from 'starlight-seo'

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    starlight({
      title: 'Fixture Docs',
      lastUpdated: true,
      locales: { root: { label: 'English', lang: 'en' }, ru: { label: 'Русский', lang: 'ru' } },
      sidebar: [{ label: 'Guides', items: [{ slug: 'guides' }, { slug: 'guides/install' }] }],
      plugins: [
        starlightSeo({
          site: { description: { en: 'A fixture site for the plugin', ru: 'Проверочный сайт плагина' }, about: 'Fixtures' },
          publisher: { name: 'Example Org', url: 'https://example.org/', logo: 'https://example.org/logo.png' },
          title: { templates: [{ match: '/guides/**', template: { en: '{title}: a step-by-step guide', ru: '{title}: пошаговое руководство' } }] },
          types: [{ match: '/blog/*/', type: 'BlogPosting', section: 'Blog' }],
          image: { src: '/og.png', alt: 'Fixture Docs' },
          extend: './src/seo.js',
          audit: { failOn: 'error' },
        }),
      ],
    }),
  ],
})
