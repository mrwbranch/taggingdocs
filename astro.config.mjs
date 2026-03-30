import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

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
      sidebar: [
        {
          label: 'Foundations',
          autogenerate: { directory: 'foundations' },
        },
        {
          label: 'Client-Side GTM',
          items: [
            { label: 'Overview', link: '/client-side/' },
            { label: 'Setup', autogenerate: { directory: 'client-side/setup' } },
            { label: 'Triggers', autogenerate: { directory: 'client-side/triggers' } },
            { label: 'Variables', autogenerate: { directory: 'client-side/variables' } },
            { label: 'Tags', autogenerate: { directory: 'client-side/tags' } },
            { label: 'Tracking', autogenerate: { directory: 'client-side/tracking' } },
            { label: 'Debugging', autogenerate: { directory: 'client-side/debugging' } },
            { label: 'Management', autogenerate: { directory: 'client-side/management' } },
          ],
        },
        {
          label: 'Server-Side GTM',
          items: [
            { label: 'Overview', link: '/server-side/' },
            { label: 'Fundamentals', autogenerate: { directory: 'server-side/fundamentals' } },
            { label: 'Setup', autogenerate: { directory: 'server-side/setup' } },
            { label: 'Clients', autogenerate: { directory: 'server-side/clients' } },
            { label: 'Tags', autogenerate: { directory: 'server-side/tags' } },
            { label: 'Advanced', autogenerate: { directory: 'server-side/advanced' } },
            { label: 'Operations', autogenerate: { directory: 'server-side/operations' } },
          ],
        },
        {
          label: 'DataLayer',
          items: [
            { label: 'Overview', link: '/datalayer/' },
            { label: 'Specification', autogenerate: { directory: 'datalayer/specification' } },
            { label: 'Ecommerce Events', autogenerate: { directory: 'datalayer/ecommerce' } },
            { label: 'Custom Events', autogenerate: { directory: 'datalayer/custom-events' } },
            { label: 'Platforms', autogenerate: { directory: 'datalayer/platforms' } },
            { label: 'Validation', autogenerate: { directory: 'datalayer/validation' } },
          ],
        },
        {
          label: 'GA4',
          items: [
            { label: 'Overview', link: '/ga4/' },
            { label: 'Fundamentals', autogenerate: { directory: 'ga4/fundamentals' } },
            { label: 'Configuration', autogenerate: { directory: 'ga4/configuration' } },
            { label: 'Reporting', autogenerate: { directory: 'ga4/reporting' } },
            { label: 'BigQuery', autogenerate: { directory: 'ga4/bigquery' } },
            { label: 'Troubleshooting', autogenerate: { directory: 'ga4/troubleshooting' } },
          ],
        },
        {
          label: 'Consent & Privacy',
          autogenerate: { directory: 'consent' },
        },
        {
          label: 'Recipes',
          autogenerate: { directory: 'recipes' },
        },
        {
          label: 'Resources',
          autogenerate: { directory: 'resources' },
        },
      ],
    }),
    react(),
  ],
});
