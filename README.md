# TaggingDocs

**The GTM & GA4 reference that should have existed from the start.**

[taggingdocs.com](https://taggingdocs.com)

Opinionated, practical documentation for Google Tag Manager and Google Analytics 4. Built by practitioners, for practitioners.

## What this is

TaggingDocs covers the gaps, edge cases, and real-world implementations that Google's official documentation skips. Every page is written to help you do something — with real code, real configurations, and real-world gotchas.

**330+ articles** covering:

- **Client-Side GTM** — Container setup, triggers, variables, tags, tracking implementations, debugging
- **Server-Side GTM** — Architecture, setup guides, custom clients, cost management
- **DataLayer** — Event specifications, ecommerce events, platform guides (Shopify, Next.js, WooCommerce), validation
- **GA4** — Configuration, reporting, BigQuery integration, troubleshooting, APIs
- **Analytics Alternatives** — Plausible, Fathom, Simple Analytics, Matomo, Piwik Pro
- **Ad Platforms** — Google Ads, Meta, TikTok, LinkedIn, Pinterest, Snapchat, Microsoft, Twitter/X, Reddit, Amazon
- **Consent & Privacy** — Consent Mode v2, CMP integration, browser privacy restrictions
- **Recipes** — Copy-paste solutions for common tracking scenarios
- **Interactive Tools** — DataLayer Builder, BigQuery Query Generator, Regex Tester

## Tech stack

- [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) — documentation framework
- [React](https://react.dev) — interactive tool components
- [Tailwind CSS](https://tailwindcss.com) — styling

## Local development

```bash
pnpm install
pnpm dev
```

Requires Node.js 22+ and pnpm.

## Contributing

Every page has an "Edit page" link. If you spot an error, have a better approach, or want to add coverage for something we've missed — pull requests are welcome.

- **Fix errors** — typos, outdated information, broken examples
- **Improve articles** — better explanations, additional edge cases
- **Add new content** — topics we haven't covered yet
- **Report issues** — [open an issue](https://github.com/mrwbranch/taggingdocs/issues)

## License

MIT
