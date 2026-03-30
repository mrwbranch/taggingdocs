import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://taggingdocs.com',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: 'TaggingDocs',
      tagline: 'The GTM & GA4 reference that should have existed from the start.',
      customCss: ['./src/styles/custom.css'],
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/taggingdocs' },
      ],
      editLink: {
        baseUrl: 'https://github.com/taggingdocs/taggingdocs/edit/main/',
      },
      expressiveCode: {
        themes: ['dracula', 'github-light'],
      },
      head: [
        // OpenGraph
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://taggingdocs.com/og-image.png' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'TaggingDocs — The GTM & GA4 reference' } },
        // Twitter
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://taggingdocs.com/og-image.png' } },
        // Structured data
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'TaggingDocs',
            url: 'https://taggingdocs.com',
            description: 'The GTM & GA4 reference that should have existed from the start.',
            publisher: {
              '@type': 'Organization',
              name: 'TaggingDocs',
              url: 'https://taggingdocs.com',
            },
          }),
        },
      ],
      sidebar: [
        {
          label: 'Tools',
          items: [
            { label: 'All Tools', link: '/tools/' },
            { label: 'DataLayer Builder', link: '/tools/datalayer-builder/' },
            { label: 'BigQuery Generator', link: '/tools/bigquery-generator/' },
            { label: 'Regex Tester', link: '/tools/regex-tester/' },
          ],
        },
        {
          label: 'Foundations',
          collapsed: true,
          autogenerate: { directory: 'foundations' },
        },
        {
          label: 'Client-Side GTM',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/client-side/' },
            { label: 'Setup', collapsed: true, autogenerate: { directory: 'client-side/setup' } },
            { label: 'Triggers', collapsed: true, autogenerate: { directory: 'client-side/triggers' } },
            { label: 'Variables', collapsed: true, autogenerate: { directory: 'client-side/variables' } },
            { label: 'Tags', collapsed: true, autogenerate: { directory: 'client-side/tags' } },
            { label: 'Tracking', collapsed: true, autogenerate: { directory: 'client-side/tracking' } },
            { label: 'Debugging', collapsed: true, autogenerate: { directory: 'client-side/debugging' } },
            { label: 'Management', collapsed: true, autogenerate: { directory: 'client-side/management' } },
          ],
        },
        {
          label: 'Server-Side GTM',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/server-side/' },
            { label: 'Fundamentals', collapsed: true, autogenerate: { directory: 'server-side/fundamentals' } },
            { label: 'Setup', collapsed: true, autogenerate: { directory: 'server-side/setup' } },
            { label: 'Clients', collapsed: true, autogenerate: { directory: 'server-side/clients' } },
            { label: 'Tags', collapsed: true, autogenerate: { directory: 'server-side/tags' } },
            { label: 'Advanced', collapsed: true, autogenerate: { directory: 'server-side/advanced' } },
            { label: 'Operations', collapsed: true, autogenerate: { directory: 'server-side/operations' } },
          ],
        },
        {
          label: 'DataLayer',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/datalayer/' },
            { label: 'Specification', collapsed: true, autogenerate: { directory: 'datalayer/specification' } },
            { label: 'Ecommerce Events', collapsed: true, autogenerate: { directory: 'datalayer/ecommerce' } },
            { label: 'Custom Events', collapsed: true, autogenerate: { directory: 'datalayer/custom-events' } },
            { label: 'Platforms', collapsed: true, autogenerate: { directory: 'datalayer/platforms' } },
            { label: 'Validation', collapsed: true, autogenerate: { directory: 'datalayer/validation' } },
          ],
        },
        {
          label: 'GA4',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/ga4/' },
            { label: 'Fundamentals', collapsed: true, autogenerate: { directory: 'ga4/fundamentals' } },
            { label: 'Configuration', collapsed: true, autogenerate: { directory: 'ga4/configuration' } },
            { label: 'Reporting', collapsed: true, autogenerate: { directory: 'ga4/reporting' } },
            { label: 'BigQuery', collapsed: true, autogenerate: { directory: 'ga4/bigquery' } },
            { label: 'Troubleshooting', collapsed: true, autogenerate: { directory: 'ga4/troubleshooting' } },
            { label: 'APIs', collapsed: true, autogenerate: { directory: 'ga4/apis' } },
          ],
        },
        {
          label: 'Consent & Privacy',
          collapsed: true,
          autogenerate: { directory: 'consent' },
        },
        {
          label: 'GTM Internals',
          collapsed: true,
          autogenerate: { directory: 'internals' },
        },
        {
          label: 'Custom Templates',
          collapsed: true,
          autogenerate: { directory: 'templates' },
        },
        {
          label: 'Security & Governance',
          collapsed: true,
          autogenerate: { directory: 'security' },
        },
        {
          label: 'Browser & Privacy',
          collapsed: true,
          autogenerate: { directory: 'privacy' },
        },
        {
          label: 'Ad Platforms',
          collapsed: true,
          autogenerate: { directory: 'integrations' },
        },
        {
          label: 'Recipes',
          collapsed: true,
          autogenerate: { directory: 'recipes' },
        },
        {
          label: 'Resources',
          collapsed: true,
          autogenerate: { directory: 'resources' },
        },
      ],
    }),
    react(),
    sitemap(),
  ],
});
