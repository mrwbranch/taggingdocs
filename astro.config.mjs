import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import starlightLlmsTxt from 'starlight-llms-txt';

export default defineConfig({
  site: 'https://taggingdocs.com',
  trailingSlash: 'always',
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
      components: {
        Head: './src/components/Head.astro',
      },
      plugins: [
        starlightLlmsTxt({
          projectName: 'TaggingDocs',
          description: 'The GTM & GA4 reference that should have existed from the start.',
          rawContent: true,
        }),
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/mrwbranch/taggingdocs' },
      ],
      editLink: {
        baseUrl: 'https://github.com/mrwbranch/taggingdocs/edit/master/',
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
          label: 'How-To Guides',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/recipes/' },
            { label: 'Interaction Tracking', collapsed: true, autogenerate: { directory: 'recipes/interaction-tracking' } },
            { label: 'Ecommerce & Conversions', collapsed: true, autogenerate: { directory: 'recipes/ecommerce-conversions' } },
            { label: 'Cross-Domain & Setup', collapsed: true, autogenerate: { directory: 'recipes/cross-domain-setup' } },
            { label: 'Testing & Experimentation', collapsed: true, autogenerate: { directory: 'recipes/testing' } },
            { label: 'Privacy & Consent', collapsed: true, autogenerate: { directory: 'recipes/privacy-consent' } },
            { label: 'Reference', collapsed: true, autogenerate: { directory: 'recipes/reference' } },
          ],
        },
        {
          label: 'Ad Platforms & Integrations',
          collapsed: true,
          autogenerate: { directory: 'integrations' },
        },
        {
          label: 'Consent & Privacy',
          collapsed: true,
          items: [
            { label: 'Overview', link: '/consent/' },
            { label: 'Consent Mode', collapsed: true, autogenerate: { directory: 'consent/consent-mode' } },
            { label: 'CMP Integration', collapsed: true, autogenerate: { directory: 'consent/cmp-integration' } },
            { label: 'Advanced', collapsed: true, autogenerate: { directory: 'consent/advanced' } },
          ],
        },
        {
          label: 'Privacy & Browsers',
          collapsed: true,
          autogenerate: { directory: 'privacy' },
        },
        {
          label: 'GTM Advanced',
          collapsed: true,
          items: [
            { label: 'Internals', collapsed: true, autogenerate: { directory: 'internals' } },
            { label: 'Custom Templates', collapsed: true, autogenerate: { directory: 'templates' } },
            { label: 'Security & Governance', collapsed: true, autogenerate: { directory: 'security' } },
          ],
        },
        {
          label: 'Analytics Alternatives',
          collapsed: true,
          autogenerate: { directory: 'analytics-alternatives' },
        },
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
          label: 'Resources',
          collapsed: true,
          autogenerate: { directory: 'resources' },
        },
        {
          label: 'About',
          items: [
            { label: 'About TaggingDocs', link: '/about/' },
            { label: 'Support the Project', link: '/support/' },
          ],
        },
      ],
    }),
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const depth = path.split('/').filter(Boolean).length;
        if (path === '/') item.priority = 1.0;
        else if (depth === 1) item.priority = 0.9;
        else if (depth === 2) item.priority = 0.8;
        return item;
      },
    }),
  ],
});
