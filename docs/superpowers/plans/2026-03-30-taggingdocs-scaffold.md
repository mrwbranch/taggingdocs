# TaggingDocs Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the full TaggingDocs Astro + Starlight project with all ~156 placeholder MDX files, custom components, theme customization, and 5-6 fully written key content pages so the site can be previewed end-to-end.

**Architecture:** Astro 5 + Starlight docs framework with Tailwind CSS for styling, React islands for interactive components. All content in `src/content/docs/` as MDX. Static build output served via Nginx/Caddy.

**Tech Stack:** Astro 5, Starlight, Tailwind CSS, React, MDX, pnpm, Pagefind (built-in), Shiki/Expressive Code

---

## File Structure

```
taggingdocs/
├── astro.config.mjs              # Astro + Starlight + Tailwind + React config
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript config (Astro default)
├── tailwind.config.mjs            # Tailwind config
├── src/
│   ├── styles/
│   │   └── custom.css             # Starlight CSS overrides (colors, fonts, layout)
│   ├── components/
│   │   ├── DataLayerExample.astro # Formatted dataLayer.push() code block
│   │   ├── BrowserScreenshot.astro# Image with browser chrome wrapper
│   │   ├── TagConfig.astro        # GTM tag config card
│   │   ├── EventSchema.astro      # DataLayer event schema table
│   │   ├── Comparison.astro       # Side-by-side comparison
│   │   ├── VideoEmbed.astro       # Responsive video embed
│   │   ├── DecisionTree.tsx       # Interactive flowchart (React island)
│   │   └── QuickStartCards.astro  # Landing page entry-point cards
│   └── content/
│       └── docs/
│           ├── index.mdx          # Landing/splash page
│           ├── foundations/        # ~9 files
│           ├── client-side/       # ~40 files across subdirs
│           ├── server-side/       # ~22 files across subdirs
│           ├── datalayer/         # ~24 files across subdirs
│           ├── ga4/               # ~20 files across subdirs
│           ├── consent/           # ~9 files
│           ├── recipes/           # ~20 files
│           └── resources/         # ~7 files
└── CONTENT-PLAN.md                # Already exists
```

---

### Task 1: Initialize Astro + Starlight Project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`, `src/styles/custom.css`

- [ ] **Step 1: Initialize project with pnpm**

```bash
cd /Users/jonaswestergren/Projects/taggingdocs
pnpm init
```

- [ ] **Step 2: Install core dependencies**

```bash
pnpm add astro @astrojs/starlight @astrojs/tailwind tailwindcss @astrojs/react react react-dom
pnpm add -D @astrojs/check typescript @fontsource/plus-jakarta-sans @fontsource/jetbrains-mono
```

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://taggingdocs.com',
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
    tailwind({ applyBaseStyles: false }),
    react(),
  ],
});
```

- [ ] **Step 4: Create `tailwind.config.mjs`**

```js
import starlightPlugin from '@astrojs/starlight-tailwind';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  plugins: [starlightPlugin()],
};
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

- [ ] **Step 6: Create `src/styles/custom.css`**

```css
@import '@fontsource/plus-jakarta-sans/400.css';
@import '@fontsource/plus-jakarta-sans/500.css';
@import '@fontsource/plus-jakarta-sans/600.css';
@import '@fontsource/plus-jakarta-sans/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';

:root {
  --sl-color-accent-low: #083344;
  --sl-color-accent: #06b6d4;
  --sl-color-accent-high: #67e8f9;
  --sl-font: 'Plus Jakarta Sans', sans-serif;
  --sl-font-mono: 'JetBrains Mono', monospace;
}

:root[data-theme='dark'] {
  --sl-color-bg: #0f172a;
  --sl-color-bg-nav: #0c1524;
  --sl-color-bg-sidebar: #0c1524;
}

.sl-markdown-content {
  line-height: 1.75;
}
```

- [ ] **Step 7: Create initial `src/content/docs/index.mdx`** (minimal placeholder)

```mdx
---
title: TaggingDocs
description: The GTM & GA4 reference that should have existed from the start.
template: splash
hero:
  tagline: Opinionated, practical documentation for Google Tag Manager and GA4. Built by practitioners, for practitioners.
  actions:
    - text: Get Started
      link: /foundations/
      icon: right-arrow
      variant: primary
    - text: View on GitHub
      link: https://github.com/taggingdocs
      icon: external
---

Welcome to TaggingDocs. Content coming soon.
```

- [ ] **Step 8: Initialize git and verify build**

```bash
cd /Users/jonaswestergren/Projects/taggingdocs
git init
echo "node_modules/\ndist/\n.astro/\n.DS_Store" > .gitignore
pnpm astro check || true
pnpm astro build
```

Expected: Build succeeds, static files in `dist/`.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: initialize Astro + Starlight project with theme config"
```

---

### Task 2: Create All Placeholder MDX Files

**Files:**
- Create: ~156 MDX files across `src/content/docs/` matching the full directory structure from the spec

Each placeholder has proper frontmatter (title, description) and a brief "Content coming soon" body. Section index files get a slightly richer placeholder with section description.

- [ ] **Step 1: Create all directory structure**

Create every directory listed in the content spec:
```
src/content/docs/foundations/
src/content/docs/client-side/setup/
src/content/docs/client-side/triggers/
src/content/docs/client-side/variables/
src/content/docs/client-side/tags/
src/content/docs/client-side/tracking/
src/content/docs/client-side/debugging/
src/content/docs/client-side/management/
src/content/docs/server-side/fundamentals/
src/content/docs/server-side/setup/
src/content/docs/server-side/clients/
src/content/docs/server-side/tags/
src/content/docs/server-side/advanced/
src/content/docs/server-side/operations/
src/content/docs/datalayer/specification/
src/content/docs/datalayer/ecommerce/
src/content/docs/datalayer/custom-events/
src/content/docs/datalayer/platforms/
src/content/docs/datalayer/validation/
src/content/docs/ga4/fundamentals/
src/content/docs/ga4/configuration/
src/content/docs/ga4/reporting/
src/content/docs/ga4/bigquery/
src/content/docs/ga4/troubleshooting/
src/content/docs/consent/
src/content/docs/recipes/
src/content/docs/resources/
```

- [ ] **Step 2: Generate foundations/ placeholder files**

Each file follows this pattern (example for `how-gtm-works.mdx`):
```mdx
---
title: How GTM Works
description: Demystify what Google Tag Manager actually does at a technical level — the execution model, container lifecycle, and dataLayer mechanics.
sidebar:
  badge:
    text: Beginner
    variant: success
---

This article is under development. Check back soon for the complete guide.
```

Files to create:
- `foundations/index.mdx` — "Foundations" / section overview
- `foundations/how-gtm-works.mdx` — Beginner
- `foundations/tags-triggers-variables.mdx` — Beginner
- `foundations/when-not-to-use-gtm.mdx` — Intermediate
- `foundations/datalayer-deep-dive.mdx` — Intermediate
- `foundations/gtm-for-developers.mdx` — Beginner
- `foundations/gtm-for-marketers.mdx` — Beginner
- `foundations/gtm-account-structure.mdx` — Beginner
- `foundations/glossary.mdx` — Beginner

- [ ] **Step 3: Generate client-side/ placeholder files (~40 files)**

All files under `client-side/` with proper titles, descriptions, and difficulty badges per the content plan. Section index at `client-side/index.mdx`.

- [ ] **Step 4: Generate server-side/ placeholder files (~22 files)**

All files under `server-side/` with proper frontmatter.

- [ ] **Step 5: Generate datalayer/ placeholder files (~24 files)**

All files under `datalayer/` with proper frontmatter.

- [ ] **Step 6: Generate ga4/ placeholder files (~20 files)**

All files under `ga4/` with proper frontmatter.

- [ ] **Step 7: Generate consent/ placeholder files (~9 files)**

All files under `consent/` with proper frontmatter.

- [ ] **Step 8: Generate recipes/ placeholder files (~20 files)**

All files under `recipes/` with proper frontmatter.

- [ ] **Step 9: Generate resources/ placeholder files (~7 files)**

All files under `resources/` with proper frontmatter.

- [ ] **Step 10: Verify build with all placeholders**

```bash
pnpm astro build
```

Expected: All pages build successfully, sidebar navigation renders all sections.

- [ ] **Step 11: Commit**

```bash
git add src/content/docs/
git commit -m "feat: add all placeholder MDX files for full site structure"
```

---

### Task 3: Build Custom Astro Components

**Files:**
- Create: `src/components/DataLayerExample.astro`
- Create: `src/components/BrowserScreenshot.astro`
- Create: `src/components/TagConfig.astro`
- Create: `src/components/EventSchema.astro`
- Create: `src/components/Comparison.astro`
- Create: `src/components/VideoEmbed.astro`
- Create: `src/components/QuickStartCards.astro`

All pure Astro components (no client-side JS). Props-driven, styled with Tailwind utility classes.

- [ ] **Step 1: Create `DataLayerExample.astro`**

Props: `event: string`, `description?: string`
Renders a styled code block header with event name label, then a `<slot />` for the code content.

```astro
---
interface Props {
  event: string;
  description?: string;
}

const { event, description } = Astro.props;
---

<div class="not-content datalayer-example my-6 rounded-lg border border-cyan-800/30 overflow-hidden">
  <div class="flex items-center gap-2 px-4 py-2 bg-cyan-950/50 border-b border-cyan-800/30">
    <span class="text-xs font-mono font-medium text-cyan-400">dataLayer.push()</span>
    <span class="text-xs font-medium text-cyan-200/70">{event}</span>
  </div>
  {description && (
    <p class="px-4 pt-3 pb-0 text-sm text-slate-300/80 m-0">{description}</p>
  )}
  <div class="datalayer-code p-0">
    <slot />
  </div>
</div>
```

- [ ] **Step 2: Create `BrowserScreenshot.astro`**

Props: `alt: string`, `caption?: string`, `src: string`
Renders an image wrapped in browser-chrome styled container.

```astro
---
interface Props {
  src: string;
  alt: string;
  caption?: string;
}

const { src, alt, caption } = Astro.props;
---

<figure class="not-content my-6">
  <div class="rounded-lg border border-slate-700 overflow-hidden bg-slate-900">
    <div class="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-b border-slate-700">
      <span class="w-2.5 h-2.5 rounded-full bg-red-500/60"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-green-500/60"></span>
    </div>
    <img src={src} alt={alt} class="w-full" loading="lazy" />
  </div>
  {caption && (
    <figcaption class="text-center text-sm text-slate-400 mt-2">{caption}</figcaption>
  )}
</figure>
```

- [ ] **Step 3: Create `TagConfig.astro`**

Props: `name: string`, `type: string`, `trigger: string`, `variables?: string[]`
Renders a structured card showing GTM tag configuration.

```astro
---
interface Props {
  name: string;
  type: string;
  trigger: string;
  variables?: string[];
}

const { name, type, trigger, variables = [] } = Astro.props;
---

<div class="not-content my-6 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
  <div class="flex items-center gap-2 mb-3">
    <span class="text-xs font-semibold uppercase tracking-wider text-cyan-400">Tag Configuration</span>
  </div>
  <h4 class="text-lg font-semibold text-white m-0 mb-3">{name}</h4>
  <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm m-0">
    <dt class="font-medium text-slate-400">Type</dt>
    <dd class="text-slate-200 m-0">{type}</dd>
    <dt class="font-medium text-slate-400">Trigger</dt>
    <dd class="text-slate-200 m-0">{trigger}</dd>
    {variables.length > 0 && (
      <>
        <dt class="font-medium text-slate-400">Variables</dt>
        <dd class="text-slate-200 m-0">
          {variables.map((v) => (
            <code class="text-xs bg-slate-700 px-1.5 py-0.5 rounded mr-1">{v}</code>
          ))}
        </dd>
      </>
    )}
  </dl>
</div>
```

- [ ] **Step 4: Create `EventSchema.astro`**

Props: `event: string`, `parameters: Array<{ name: string; type: string; required: boolean; description: string }>`
Renders a styled table of event parameters.

```astro
---
interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface Props {
  event: string;
  parameters: Parameter[];
}

const { event, parameters } = Astro.props;
---

<div class="not-content my-6 rounded-lg border border-slate-700 overflow-hidden">
  <div class="px-4 py-2 bg-slate-800 border-b border-slate-700">
    <span class="text-xs font-semibold uppercase tracking-wider text-cyan-400">Event Schema</span>
    <span class="ml-2 font-mono text-sm text-white">{event}</span>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-slate-700 bg-slate-800/50">
          <th class="px-4 py-2 text-left font-medium text-slate-300">Parameter</th>
          <th class="px-4 py-2 text-left font-medium text-slate-300">Type</th>
          <th class="px-4 py-2 text-left font-medium text-slate-300">Required</th>
          <th class="px-4 py-2 text-left font-medium text-slate-300">Description</th>
        </tr>
      </thead>
      <tbody>
        {parameters.map((param) => (
          <tr class="border-b border-slate-700/50">
            <td class="px-4 py-2 font-mono text-cyan-300">{param.name}</td>
            <td class="px-4 py-2 text-slate-300">{param.type}</td>
            <td class="px-4 py-2">
              {param.required
                ? <span class="text-xs font-medium text-green-400">Required</span>
                : <span class="text-xs font-medium text-slate-500">Optional</span>
              }
            </td>
            <td class="px-4 py-2 text-slate-300">{param.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

- [ ] **Step 5: Create `Comparison.astro`**

Props: `leftTitle: string`, `rightTitle: string`, `leftType?: 'good' | 'bad' | 'neutral'`, `rightType?: 'good' | 'bad' | 'neutral'`
Side-by-side comparison with named slots.

```astro
---
interface Props {
  leftTitle: string;
  rightTitle: string;
  leftType?: 'good' | 'bad' | 'neutral';
  rightType?: 'good' | 'bad' | 'neutral';
}

const { leftTitle, rightTitle, leftType = 'neutral', rightType = 'neutral' } = Astro.props;

const colors = {
  good: 'border-green-700/50 bg-green-950/20',
  bad: 'border-red-700/50 bg-red-950/20',
  neutral: 'border-slate-700 bg-slate-800/30',
};

const labelColors = {
  good: 'text-green-400',
  bad: 'text-red-400',
  neutral: 'text-slate-300',
};
---

<div class="not-content my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div class={`rounded-lg border p-4 ${colors[leftType]}`}>
    <h4 class={`text-sm font-semibold uppercase tracking-wider m-0 mb-3 ${labelColors[leftType]}`}>{leftTitle}</h4>
    <div class="comparison-content text-sm">
      <slot name="left" />
    </div>
  </div>
  <div class={`rounded-lg border p-4 ${colors[rightType]}`}>
    <h4 class={`text-sm font-semibold uppercase tracking-wider m-0 mb-3 ${labelColors[rightType]}`}>{rightTitle}</h4>
    <div class="comparison-content text-sm">
      <slot name="right" />
    </div>
  </div>
</div>
```

- [ ] **Step 6: Create `VideoEmbed.astro`**

Props: `url: string`, `title: string`
Responsive 16:9 embed wrapper.

```astro
---
interface Props {
  url: string;
  title: string;
}

const { url, title } = Astro.props;

// Convert YouTube watch URLs to embed URLs
let embedUrl = url;
if (url.includes('youtube.com/watch')) {
  const videoId = new URL(url).searchParams.get('v');
  embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
} else if (url.includes('youtu.be/')) {
  const videoId = url.split('youtu.be/')[1]?.split('?')[0];
  embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
}
---

<div class="not-content my-6">
  <div class="relative w-full rounded-lg overflow-hidden" style="padding-bottom: 56.25%;">
    <iframe
      src={embedUrl}
      title={title}
      class="absolute top-0 left-0 w-full h-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy"
    ></iframe>
  </div>
</div>
```

- [ ] **Step 7: Create `QuickStartCards.astro`**

Landing page component with entry-point cards for common user journeys.

```astro
---
const cards = [
  {
    title: 'Setting up GTM for the first time',
    description: 'Install your container, understand the basics, and fire your first tag.',
    href: '/foundations/how-gtm-works/',
    icon: '🚀',
  },
  {
    title: 'Implementing ecommerce tracking',
    description: 'Complete dataLayer specification for GA4 ecommerce events.',
    href: '/datalayer/ecommerce/ecommerce-overview/',
    icon: '🛒',
  },
  {
    title: 'Migrating to server-side GTM',
    description: 'Architecture, setup guides, and cost management for sGTM.',
    href: '/server-side/',
    icon: '🖥️',
  },
  {
    title: 'Building a dataLayer specification',
    description: 'Naming conventions, event design, and validation strategies.',
    href: '/datalayer/',
    icon: '📋',
  },
];
---

<div class="not-content grid grid-cols-1 sm:grid-cols-2 gap-4 my-8">
  {cards.map((card) => (
    <a
      href={card.href}
      class="group block rounded-lg border border-slate-700 bg-slate-800/50 p-5 no-underline hover:border-cyan-600/50 hover:bg-slate-800 transition-colors"
    >
      <span class="text-2xl mb-2 block">{card.icon}</span>
      <h3 class="text-base font-semibold text-white m-0 mb-1 group-hover:text-cyan-400 transition-colors">
        {card.title}
      </h3>
      <p class="text-sm text-slate-400 m-0">{card.description}</p>
    </a>
  ))}
</div>
```

- [ ] **Step 8: Verify components render (build test)**

```bash
pnpm astro build
```

- [ ] **Step 9: Commit**

```bash
git add src/components/
git commit -m "feat: add custom Astro components (DataLayerExample, EventSchema, Comparison, etc.)"
```

---

### Task 4: Build DecisionTree React Component

**Files:**
- Create: `src/components/DecisionTree.tsx`

- [ ] **Step 1: Create `DecisionTree.tsx`**

Interactive flowchart component loaded as a React island with `client:visible`.

```tsx
import { useState } from 'react';

interface TreeNode {
  question: string;
  options: {
    label: string;
    next?: string; // ID of next node
    result?: string; // Final answer
    resultDescription?: string;
    resultLink?: string;
  }[];
}

interface Props {
  title: string;
  nodes: Record<string, TreeNode>;
  startNode: string;
}

export default function DecisionTree({ title, nodes, startNode }: Props) {
  const [history, setHistory] = useState<string[]>([startNode]);

  const currentNodeId = history[history.length - 1];
  const currentNode = nodes[currentNodeId];

  const handleSelect = (next?: string, result?: string) => {
    if (next) {
      setHistory([...history, next]);
    }
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory(history.slice(0, -1));
    }
  };

  const handleReset = () => {
    setHistory([startNode]);
  };

  if (!currentNode) return null;

  return (
    <div
      style={{
        margin: '1.5rem 0',
        borderRadius: '0.5rem',
        border: '1px solid rgb(51 65 85 / 0.7)',
        backgroundColor: 'rgb(15 23 42 / 0.5)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid rgb(51 65 85 / 0.7)',
          backgroundColor: 'rgb(30 41 59 / 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#67e8f9' }}>{title}</span>
        {history.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleBack}
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleReset}
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: '1.5rem' }}>
        <p style={{ fontSize: '1.125rem', fontWeight: 500, color: 'white', margin: '0 0 1rem 0' }}>
          {currentNode.question}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {currentNode.options.map((option, i) => {
            if (option.result) {
              return (
                <div
                  key={i}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid rgb(6 182 212 / 0.3)',
                    backgroundColor: 'rgb(8 51 68 / 0.3)',
                  }}
                >
                  <p style={{ fontWeight: 600, color: '#22d3ee', margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>
                    {option.label}
                  </p>
                  <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.875rem' }}>{option.result}</p>
                  {option.resultDescription && (
                    <p style={{ color: '#94a3b8', margin: '0.5rem 0 0 0', fontSize: '0.8125rem' }}>
                      {option.resultDescription}
                    </p>
                  )}
                  {option.resultLink && (
                    <a
                      href={option.resultLink}
                      style={{ color: '#06b6d4', fontSize: '0.8125rem', marginTop: '0.5rem', display: 'inline-block' }}
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(option.next)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgb(51 65 85 / 0.7)',
                  backgroundColor: 'rgb(30 41 59 / 0.5)',
                  color: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgb(6 182 212 / 0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgb(51 65 85 / 0.7)')}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DecisionTree.tsx
git commit -m "feat: add DecisionTree React island component"
```

---

### Task 5: Write Landing Page (Full Content)

**Files:**
- Modify: `src/content/docs/index.mdx`

- [ ] **Step 1: Write the complete landing page**

Replace the placeholder `index.mdx` with full landing page content using the splash template, hero section, QuickStartCards component, section overview cards, and "What makes this different" section.

The page imports `QuickStartCards` and uses Starlight's `<CardGrid>` and `<LinkCard>` for section navigation.

- [ ] **Step 2: Verify in dev server**

```bash
pnpm astro dev
```

Open `http://localhost:4321` and verify landing page renders correctly.

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/index.mdx
git commit -m "feat: write full landing page with quick-start cards and section overview"
```

---

### Task 6: Write Key Content Page — foundations/how-gtm-works.mdx

**Files:**
- Modify: `src/content/docs/foundations/how-gtm-works.mdx`

- [ ] **Step 1: Write the complete article**

Full ~2,500 word article following the content plan brief. Must include:
- GTM snippet annotated line-by-line
- Container lifecycle explanation
- DataLayer queue/replay mechanism
- Execution model diagram (described in text/code)
- Common Mistakes section
- Cross-links to related articles
- Uses `<DataLayerExample>` and `<Comparison>` custom components
- Uses Starlight `<Aside>` and `<Steps>` built-in components

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/foundations/how-gtm-works.mdx
git commit -m "feat: write complete foundations/how-gtm-works article"
```

---

### Task 7: Write Key Content Page — foundations/datalayer-deep-dive.mdx

**Files:**
- Modify: `src/content/docs/foundations/datalayer-deep-dive.mdx`

- [ ] **Step 1: Write the complete article**

Full ~3,000 word article. Must include:
- DataLayer as message bus explanation
- Push mechanism and recursive merge
- Object persistence ("sticky") behavior with code examples
- Event key significance
- Ecommerce clearing pattern
- TypeScript interface for typed dataLayer
- Uses `<DataLayerExample>`, `<EventSchema>`, `<Comparison>` components
- Common Mistakes section
- Cross-links

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/foundations/datalayer-deep-dive.mdx
git commit -m "feat: write complete foundations/datalayer-deep-dive article"
```

---

### Task 8: Write Key Content Page — datalayer/ecommerce/purchase.mdx

**Files:**
- Modify: `src/content/docs/datalayer/ecommerce/purchase.mdx`

- [ ] **Step 1: Write the complete article**

Full ~2,500 word article. Must include:
- Complete purchase event dataLayer.push() with full item array
- EventSchema component showing all parameters
- GTM configuration (tag + trigger + variables)
- TypeScript type definition
- Platform-specific examples (vanilla JS, React, Next.js)
- Validation checklist
- Common Mistakes section
- Cross-links to other ecommerce events

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/datalayer/ecommerce/purchase.mdx
git commit -m "feat: write complete datalayer/ecommerce/purchase article"
```

---

### Task 9: Write Key Content Page — client-side/triggers/custom-event-triggers.mdx

**Files:**
- Modify: `src/content/docs/client-side/triggers/custom-event-triggers.mdx`

- [ ] **Step 1: Write the complete article**

Full ~2,000 word article. Must include:
- What custom events are and when to use them
- Creating a custom event trigger in GTM (step-by-step)
- DataLayer.push() with custom events
- Regex matching on event names
- Using custom event triggers with ecommerce
- Real-world examples (form submissions, video plays, tab switches)
- Uses `<TagConfig>`, `<DataLayerExample>`, `<Steps>` components
- Common Mistakes section

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/client-side/triggers/custom-event-triggers.mdx
git commit -m "feat: write complete client-side/triggers/custom-event-triggers article"
```

---

### Task 10: Write Key Content Page — server-side/fundamentals/why-server-side.mdx

**Files:**
- Modify: `src/content/docs/server-side/fundamentals/why-server-side.mdx`

- [ ] **Step 1: Write the complete article**

Full ~2,500 word article. Must include:
- The case for server-side tagging
- Privacy/compliance benefits
- Performance benefits (fewer client-side scripts)
- Data quality improvements
- Server-side vs client-side comparison table
- Cost considerations (honest assessment)
- DecisionTree component: "Should you use server-side GTM?"
- Uses `<Comparison>` component for client vs server
- Cross-links to setup guides

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/server-side/fundamentals/why-server-side.mdx
git commit -m "feat: write complete server-side/fundamentals/why-server-side article"
```

---

### Task 11: Final Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build**

```bash
pnpm astro build
```

Expected: Clean build, no errors, all ~156 pages generated.

- [ ] **Step 2: Preview the built site**

```bash
pnpm astro preview
```

Verify: Landing page, navigation, key content pages, custom components, dark/light mode toggle, search (Pagefind), breadcrumbs, TOC.

- [ ] **Step 3: Final commit if any adjustments needed**

```bash
git add .
git commit -m "fix: final build adjustments"
```
