# TaggingDocs — Interactive Tools Specification

> All tools live at `taggingdocs.com/tools/*` as part of the main Astro site. Each tool is a React island (`client:load`) embedded in a Starlight docs page. Zero backend — everything runs client-side in the browser. Tools should be independently useful and shareable via URL.

---

## Technical Architecture

### How tools fit in the Astro/Starlight site

Each tool is:
1. An MDX page in `src/content/docs/tools/` with a short intro and the tool component
2. A React component in `src/components/tools/` loaded as an Astro island
3. Styled with Tailwind CSS, matching Starlight's dark/light theme via CSS variables
4. Self-contained — no API calls, no backend, no auth required

```
src/content/docs/tools/
├── index.mdx                           # Tools landing page with cards
├── datalayer-builder.mdx               # DataLayer Builder + Validator
├── bigquery-generator.mdx              # BigQuery Query Generator
└── regex-tester.mdx                    # GA4 Regex Tester

src/components/tools/
├── DataLayerBuilder.tsx                 # Combined builder + validator
├── BigQueryGenerator.tsx                # SQL query generator
├── RegexTester.tsx                      # RE2 regex tester
└── shared/
    ├── CodeOutput.tsx                   # Syntax-highlighted output with copy button
    ├── FieldBuilder.tsx                 # Reusable form field components
    └── schemas/
        ├── ecommerce-events.ts          # GA4 ecommerce event schemas
        ├── recommended-events.ts        # GA4 recommended event schemas
        ├── item-parameters.ts           # Item array parameter definitions
        └── bigquery-templates.ts        # SQL query templates
```

### Shared Design Principles

- **Dark/light mode**: Use Starlight's CSS variables (`--sl-color-*`) so tools match the theme automatically
- **Mobile responsive**: Tools must work on mobile (stacked layouts, no tiny inputs)
- **Copy button on all outputs**: One-click copy for generated code
- **URL state**: Tool configuration saved in URL hash/params so users can share configurations (e.g., `taggingdocs.com/tools/datalayer-builder#event=purchase`)
- **localStorage persistence**: Remember last-used values for convenience
- **No external dependencies**: Don't load external scripts. Use bundled libraries only.
- **Accessible**: Proper labels, keyboard navigation, screen reader support

---

## Tool 1: DataLayer Builder + Validator

**URL**: `taggingdocs.com/tools/datalayer-builder`
**Purpose**: Build correct `dataLayer.push()` code for any GA4 event, AND validate existing dataLayer code by pasting it.

This is two modes in one tool — a toggle at the top switches between **Build** and **Validate**.

### Build Mode

The user selects an event type and fills in fields. The tool generates the complete, correct `dataLayer.push()` code in real-time.

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Build]  [Validate]                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Event Type: [▼ Dropdown ─────────────────────────────]     │
│                                                              │
│  ┌─── Event Parameters ──────────────────────────────────┐  │
│  │                                                        │  │
│  │  (Dynamic fields based on selected event)              │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Items Array ───────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Item 1: [fields...]              [+ Add Item]         │  │
│  │  Item 2: [fields...]              [× Remove]           │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ☐ Include ecommerce clearing (recommended)                  │
│  ☐ Include user_data for Enhanced Conversions                │
│  ☐ Generate TypeScript types                                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Generated Code:                              [📋 Copy]     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  // Clear previous ecommerce data                      │  │
│  │  dataLayer.push({ ecommerce: null });                  │  │
│  │                                                        │  │
│  │  dataLayer.push({                                      │  │
│  │    event: 'purchase',                                  │  │
│  │    ecommerce: {                                        │  │
│  │      transaction_id: 'T12345',                         │  │
│  │      value: 59.98,                                     │  │
│  │      currency: 'USD',                                  │  │
│  │      ...                                               │  │
│  │    }                                                   │  │
│  │  });                                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Validation ────────────────────────────────────────────┐ │
│  │ ✅ All required fields present                          │ │
│  │ ✅ Values are correct types (numbers, not strings)      │ │
│  │ ✅ Currency is valid ISO 4217                           │ │
│  │ ✅ Ecommerce clearing included                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Event Types (grouped):**

**Ecommerce Events:**
- `view_item_list` — Product listing / category page
- `select_item` — Click product in list
- `view_item` — Product detail page
- `add_to_cart` — Add product to cart
- `remove_from_cart` — Remove from cart
- `view_cart` — Cart page
- `begin_checkout` — Start checkout
- `add_shipping_info` — Shipping step
- `add_payment_info` — Payment step
- `purchase` — Order complete
- `refund` — Order refund
- `view_promotion` — View promotional banner
- `select_promotion` — Click promotional banner

**Engagement Events:**
- `login` — User login
- `sign_up` — User registration
- `search` — Site search
- `generate_lead` — Lead form submission
- `share` — Content sharing
- `select_content` — Content selection

**Custom Event:**
- Free-form event name with dynamic parameter builder (add key-value pairs)

**For each event, the schema defines:**
```typescript
interface EventSchema {
  name: string;                    // Event name (e.g., 'purchase')
  description: string;             // Human description
  category: 'ecommerce' | 'engagement' | 'custom';
  isEcommerce: boolean;            // Whether it uses the ecommerce object wrapper
  parameters: ParameterDef[];      // Event-level parameters
  hasItems: boolean;               // Whether items array is relevant
  itemParameters?: ParameterDef[]; // Item-level parameters (if hasItems)
}

interface ParameterDef {
  name: string;             // e.g., 'transaction_id'
  displayName: string;      // e.g., 'Transaction ID'
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  placeholder?: string;     // e.g., 'ORD-12345'
  description?: string;     // Tooltip help text
  validation?: {
    pattern?: RegExp;       // e.g., /^[A-Z]{3}$/ for currency
    min?: number;
    max?: number;
    enum?: string[];        // e.g., ['credit_card', 'paypal', 'klarna']
  };
  defaultValue?: string | number;
}
```

**Ecommerce item parameters** (shared across all ecommerce events):
- `item_id` (string, required) — Product SKU/ID
- `item_name` (string, required) — Product name
- `price` (number, required for most events) — Unit price
- `quantity` (number, required for cart/checkout/purchase) — Quantity
- `item_brand` (string, optional) — Brand name
- `item_category` (string, optional) — Primary category
- `item_category2` through `item_category5` (string, optional) — Sub-categories
- `item_variant` (string, optional) — Color, size, etc.
- `item_list_id` (string, optional) — List identifier
- `item_list_name` (string, optional) — List display name
- `index` (number, optional) — Position in list
- `coupon` (string, optional) — Item-level coupon
- `discount` (number, optional) — Item-level discount amount
- `affiliation` (string, optional) — Store/partner name

**Options checkboxes:**
- **Include ecommerce clearing**: Prepends `dataLayer.push({ ecommerce: null });` (on by default)
- **Include user_data**: Adds a `user_data` block with email, phone, address fields (for Enhanced Conversions)
- **Generate TypeScript types**: Additionally outputs a TypeScript interface for the dataLayer push

### Validate Mode

The user pastes existing `dataLayer.push()` code and gets instant validation feedback.

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Build]  [Validate]                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Paste your dataLayer.push() code:                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  (Monaco editor or textarea with syntax highlighting)  │  │
│  │                                                        │  │
│  │  dataLayer.push({                                      │  │
│  │    event: 'purchase',                                  │  │
│  │    ecommerce: {                                        │  │
│  │      value: '59.98',     // ← will flag as string     │  │
│  │      items: [...]                                      │  │
│  │    }                                                   │  │
│  │  });                                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [🔍 Validate]                                               │
│                                                              │
│  ┌─ Results ───────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │ ❌ ERROR: `value` should be a number, got string "59.98"│ │
│  │ ❌ ERROR: Missing required field `transaction_id`       │ │
│  │ ❌ ERROR: Missing required field `currency`             │ │
│  │ ⚠️ WARNING: No ecommerce clearing before push           │ │
│  │ ⚠️ WARNING: `item_category` has 4 levels but `item_    │ │
│  │    category3` is missing (skipped level)                │ │
│  │ ✅ Event name `purchase` is valid GA4 recommended event │ │
│  │ ✅ Items array has required fields (item_id, item_name) │ │
│  │ ℹ️ TIP: Consider adding `shipping` and `tax` parameters│ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [🔧 Auto-fix and switch to Build mode]                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Validation checks:**

1. **Syntax**: Is it valid JavaScript? Can we parse the object?
2. **Event name**: Is it a recognized GA4 event? Is it snake_case?
3. **Required fields**: Based on the detected event type, are all required parameters present?
4. **Data types**: Are numbers actually numbers (not strings)? Is currency a string?
5. **Currency**: Is it a valid ISO 4217 code?
6. **Ecommerce structure**: Is the `ecommerce` wrapper present for ecommerce events?
7. **Ecommerce clearing**: Is there a `{ ecommerce: null }` push before the event?
8. **Items array**: Do items have `item_id` and `item_name`? Are `price` and `quantity` numbers?
9. **Event name convention**: snake_case, not camelCase or PascalCase?
10. **Parameter limits**: Event name ≤40 chars, parameter name ≤40 chars, parameter value ≤100 chars
11. **PII detection**: Flag if email addresses, phone numbers, or other PII appear in standard parameters
12. **Duplicate items**: Flag items with identical `item_id` (might be intentional but worth noting)

**Auto-fix button**: Parses the pasted code, fixes what it can (convert string numbers to numbers, add missing currency, add ecommerce clearing), and switches to Build mode pre-filled with the corrected values. User can then adjust and re-export.

**Parsing approach**: Use a safe JavaScript parser. Strip `dataLayer.push(` wrapper and closing `);`, then `JSON5.parse()` (or a custom parser that handles unquoted keys, single quotes, trailing commas). Don't use `eval()`.

---

## Tool 2: GA4 BigQuery Query Generator

**URL**: `taggingdocs.com/tools/bigquery-generator`
**Purpose**: Select what you want to query from GA4 BigQuery export data, configure parameters, and get a ready-to-use SQL query.

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  GA4 BigQuery Query Generator                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Query Type: [▼ Dropdown ─────────────────────────────]     │
│                                                              │
│  ┌─── Configuration ─────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Dataset: [my_project.analytics_123456789  ]           │  │
│  │  Date Range: [2024-01-01] to [2024-01-31]              │  │
│  │                                                        │  │
│  │  (Query-specific fields appear here dynamically)       │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Options ───────────────────────────────────────────┐  │
│  │  ☐ Add cost optimization comments                      │  │
│  │  ☐ Use _TABLE_SUFFIX for date partitioning             │  │
│  │  ☐ Include sample output columns                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Generated SQL:                               [📋 Copy]     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  -- Sessions by source/medium                          │  │
│  │  -- Date range: 2024-01-01 to 2024-01-31               │  │
│  │  -- Estimated scan: ~X GB                              │  │
│  │                                                        │  │
│  │  SELECT                                                │  │
│  │    traffic_source.source,                              │  │
│  │    traffic_source.medium,                              │  │
│  │    COUNT(DISTINCT ...                                  │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Query Explanation ─────────────────────────────────────┐ │
│  │ This query extracts session-level traffic source data   │ │
│  │ by unnesting event_params to get ga_session_id, then    │ │
│  │ aggregating by source/medium. The _TABLE_SUFFIX filter  │ │
│  │ ensures you only scan data in your date range.          │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Query Categories and Templates

**Basic Reports:**

1. **Page views by page** — Top pages by pageview count
   - Config: date range, limit (top N), filter by hostname (optional)
   - UNNEST: `page_location` from event_params

2. **Users and sessions per day** — Daily user/session counts
   - Config: date range
   - UNNEST: `ga_session_id` from event_params

3. **Events by event name** — Event frequency table
   - Config: date range, event name filter (optional)

4. **Traffic sources** — Sessions by source/medium
   - Config: date range, limit
   - Uses: `traffic_source.source`, `traffic_source.medium`

5. **Landing pages** — Top entry pages with session count
   - Config: date range, limit
   - UNNEST: `page_location` where `event_name = 'session_start'`

6. **Exit pages** — Last page viewed per session
   - Config: date range, limit
   - Uses window functions to find last page_view per session

**Ecommerce:**

7. **Revenue by product** — Product-level revenue from purchase events
   - Config: date range, limit
   - UNNEST: items array

8. **Purchase conversion rate** — Users who purchased / total users
   - Config: date range

9. **Average order value** — Total revenue / number of transactions
   - Config: date range

10. **Cart abandonment** — Users who added to cart but didn't purchase
    - Config: date range

11. **Product performance** — Views, add-to-carts, purchases per product
    - Config: date range, product ID filter (optional)

**Advanced:**

12. **Session reconstruction** — Build session-level table from event data
    - Config: date range
    - Complex: ga_session_id + user_pseudo_id grouping, landing page, session duration, exit page, source/medium

13. **Funnel analysis** — Step completion rates through a custom funnel
    - Config: date range, funnel steps (array of event names)
    - Sequential event matching with time constraints

14. **User journey / path analysis** — Event sequences per user
    - Config: date range, max path length, starting event (optional)

15. **Custom event parameter extraction** — Extract any event parameter by name
    - Config: date range, event name, parameter name, value type (string/int/double)

16. **Custom channel grouping** — Source/medium to custom channel mapping
    - Config: date range, channel rules (editable mapping table)

17. **Cohort analysis** — Retention by first-visit cohort
    - Config: date range, cohort granularity (day/week/month), retention metric

**Utility:**

18. **Schema explorer query** — Shows all distinct event names and their parameter keys
    - Config: date range (1 day recommended for cost)

19. **Data freshness check** — Latest event timestamp in the export
    - Config: none

20. **Estimated row count** — Total events in date range
    - Config: date range

### Query Template Structure

```typescript
interface QueryTemplate {
  id: string;                    // e.g., 'sessions_by_source'
  name: string;                  // e.g., 'Traffic Sources (Sessions by Source/Medium)'
  category: 'basic' | 'ecommerce' | 'advanced' | 'utility';
  description: string;           // What this query does
  explanation: string;           // How it works (shown below output)
  config: ConfigField[];         // Dynamic configuration fields
  generateSQL: (config: Record<string, any>) => string;  // Template function
  estimatedScanNote?: string;    // Cost guidance
}

interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'multiselect' | 'eventPicker';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];  // For select/multiselect
}
```

### Global Configuration (persistent)

These fields appear at the top and persist across query types:
- **Dataset path**: `project_id.dataset_id` (e.g., `my-project.analytics_123456789`)
- **Table name pattern**: defaults to `events_*` but configurable
- **Date range**: start and end date pickers

### SQL Generation Rules

All generated queries must:
1. Use `_TABLE_SUFFIX` filtering for date partitioning (cost optimization)
2. Never use `SELECT *` (scan minimization)
3. Include comments explaining each section
4. Handle the GA4 UNNEST pattern correctly (repeated RECORD fields)
5. Use `SAFE_CAST` where type coercion is needed
6. Include `APPROX_COUNT_DISTINCT` option vs `COUNT(DISTINCT)` with a comment explaining the tradeoff
7. Be formatted with consistent indentation
8. Be copy-paste ready for BigQuery console

---

## Tool 3: GA4 Regex Tester

**URL**: `taggingdocs.com/tools/regex-tester`
**Purpose**: Test and build regex patterns specifically for GA4 and GTM contexts. GA4 uses RE2 syntax (not PCRE), and GTM has specific matching behaviors. This tool validates against the correct engine and provides context-specific templates.

### Why This Is Needed

GA4 report filters and audience conditions use **RE2 regex** (Google's regex engine). RE2 does NOT support:
- Lookaheads `(?=...)`
- Lookbehinds `(?<=...)`
- Backreferences `\1`
- Atomic groups `(?>...)`
- Possessive quantifiers `a++`

People constantly write PCRE regex that works in their regex tester but fails in GA4. This tool validates against RE2 specifically.

GTM trigger conditions use a different matching system:
- `matches RegEx` = full match (implicit `^...$`)
- `contains` = partial match
- `matches RegEx (ignore case)` = case-insensitive full match

### UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  GA4 & GTM Regex Tester                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Context: ( ) GA4 Reports/Audiences  ( ) GTM Triggers       │
│                                                              │
│  ┌─── Pattern ───────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Regex: [                                         ]    │  │
│  │                                                        │  │
│  │  ☐ Case insensitive  ☐ Full match (GTM default)       │  │
│  │                                                        │  │
│  │  RE2 Compatibility: ✅ Valid RE2 pattern                │  │
│  │                      (or ❌ with explanation)           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Test Strings ──────────────────────────────────────┐  │
│  │                                                        │  │
│  │  https://example.com/products/shoes          ✅ Match  │  │
│  │  https://example.com/products/hats           ✅ Match  │  │
│  │  https://example.com/about                   ❌ No     │  │
│  │  https://example.com/products                ✅ Match  │  │
│  │                                                        │  │
│  │  [+ Add test string]                                   │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Match Details ─────────────────────────────────────┐  │
│  │                                                        │  │
│  │  Full match: "https://example.com/products/shoes"      │  │
│  │  Group 1: "shoes"                                      │  │
│  │  Group 2: (none)                                       │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─── Common Patterns ───────────────────────────────────┐  │
│  │                                                        │  │
│  │  [Product pages]  [Blog posts]  [UTM parameters]      │  │
│  │  [File downloads] [Phone numbers] [Email detection]    │  │
│  │  [Category pages] [Checkout steps] [Language paths]    │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Context Modes

**GA4 Reports/Audiences mode:**
- Validates against RE2 syntax
- Warns if using unsupported PCRE features
- Shows how GA4 applies the regex (partial match in most contexts)
- Explains that GA4 dimension filters use partial match by default

**GTM Triggers mode:**
- Applies full match behavior (GTM wraps in `^...$` for "matches RegEx")
- Explains the difference between "matches RegEx" (full) and "contains" (partial)
- Shows the effective pattern with implicit anchors
- Toggle for "contains" mode (partial match)

### RE2 Validation

```typescript
// Patterns that are valid PCRE but invalid RE2
const RE2_UNSUPPORTED = [
  { pattern: /\(\?[=!<]/, name: 'Lookahead/lookbehind', suggestion: 'RE2 doesn\'t support lookaheads or lookbehinds. Use alternation or restructure the pattern.' },
  { pattern: /\\[1-9]/, name: 'Backreference', suggestion: 'RE2 doesn\'t support backreferences. Use named groups or restructure.' },
  { pattern: /\(\?>/, name: 'Atomic group', suggestion: 'RE2 doesn\'t support atomic groups. Remove the ?> modifier.' },
  { pattern: /[+*?]\+/, name: 'Possessive quantifier', suggestion: 'RE2 doesn\'t support possessive quantifiers. Use standard quantifiers.' },
];
```

For actual matching, use a client-side RE2 implementation. Options:
- `re2js` npm package (JavaScript port of RE2)
- Or: use standard JS regex with a pre-validation step that rejects RE2-incompatible features (simpler, covers 95% of cases)

### Common Pattern Templates

Clicking a template fills in the regex and test strings:

**URL Patterns:**
| Template | Regex | Use Case |
|----------|-------|----------|
| Product pages | `/products/[^/]+$` | Match product detail pages |
| Category pages | `/category/[^/]+(/[^/]+)?$` | Match category and subcategory |
| Blog posts | `/blog/\d{4}/\d{2}/` | Match blog posts by date path |
| Checkout steps | `/checkout/(shipping\|payment\|review)` | Match checkout funnel pages |
| Language prefixed | `^/(en\|sv\|de\|fr)/` | Match language-prefixed paths |
| Exclude paths | `^(?!.*(admin\|staging)).*$` | Exclude admin/staging (⚠️ not RE2 compatible — show the alternative!) |

**Parameter Patterns:**
| Template | Regex | Use Case |
|----------|-------|----------|
| UTM source | `utm_source=([^&]+)` | Extract UTM source value |
| Product ID in URL | `/products/(\d+)` | Extract numeric product ID |
| File extensions | `\.(pdf\|xlsx?\|docx?\|zip)$` | Match downloadable files |
| Phone numbers | `tel:[\+]?[\d\-\(\)\s]+` | Match tel: links |
| Email pattern | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` | Detect email addresses (for PII filtering) |

**GA4-Specific:**
| Template | Regex | Use Case |
|----------|-------|----------|
| Internal traffic | `^(192\.168\.\|10\.\|172\.(1[6-9]\|2[0-9]\|3[01])\.)` | Match internal IP ranges |
| GA4 event names | `^[a-z][a-z0-9_]{0,39}$` | Validate GA4 event name format |
| Measurement ID | `^G-[A-Z0-9]{10}$` | Validate GA4 Measurement ID format |

### RE2 vs PCRE Cheat Sheet

Display a collapsible reference panel showing:

| Feature | PCRE | RE2 | Alternative |
|---------|------|-----|-------------|
| Lookahead `(?=...)` | ✅ | ❌ | Restructure pattern or use alternation |
| Lookbehind `(?<=...)` | ✅ | ❌ | Capture the full match and extract in code |
| Backreference `\1` | ✅ | ❌ | Use named groups `(?P<name>...)` |
| Named groups `(?P<name>...)` | ✅ | ✅ | — |
| Non-greedy `*?` `+?` | ✅ | ✅ | — |
| Character classes `\d` `\w` `\s` | ✅ | ✅ | — |
| Alternation `a|b` | ✅ | ✅ | — |
| Anchors `^` `$` | ✅ | ✅ | — |
| Word boundary `\b` | ✅ | ✅ | — |
| Flags `(?i)` `(?m)` `(?s)` | ✅ | ✅ | — |
| Unicode `\p{L}` | ✅ | ✅ | — |
| Possessive `a++` | ✅ | ❌ | Use `a+` (non-possessive) |
| Atomic `(?>...)` | ✅ | ❌ | Remove atomic modifier |

---

## Tools Landing Page

**URL**: `taggingdocs.com/tools`
**Content**: Card grid linking to each tool with a one-line description and icon.

```mdx
---
title: Free GTM & GA4 Tools
description: Interactive tools for Google Tag Manager and GA4 practitioners. Build dataLayer code, generate BigQuery SQL, test regex patterns — all free, all client-side.
template: splash
---

import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="DataLayer Builder + Validator" icon="document">
    Build correct dataLayer.push() code for any GA4 event, or validate existing code. Catches type errors, missing fields, and PII.
    [Open tool →](/tools/datalayer-builder)
  </Card>

  <Card title="BigQuery Query Generator" icon="laptop">
    Generate ready-to-use SQL queries for GA4 BigQuery export data. 20+ templates for traffic, ecommerce, funnels, and more.
    [Open tool →](/tools/bigquery-generator)
  </Card>

  <Card title="GA4 & GTM Regex Tester" icon="magnifier">
    Test regex patterns against RE2 (GA4's engine) and GTM matching rules. Includes common pattern templates.
    [Open tool →](/tools/regex-tester)
  </Card>
</CardGrid>
```

---

## Future Tools (add later)

These can be added incrementally after launch:

- **Consent Mode Config Generator** — Pick CMP, select regions, generate code (natural Gretelfy upsell)
- **sGTM Cost Calculator** — Estimate hosting costs across providers
- **Cross-Platform Event Mapper** — Interactive event name mapping table across ad platforms
- **UTM Builder** — With naming convention enforcement and bulk mode
- **Container Size Analyzer** — Paste container JSON, get size breakdown
- **GA4 Custom Dimension Planner** — Plan your 50+25 slots
- **Measurement Protocol Tester** — Send/validate test events (uses GA4 validation endpoint)
- **GA4 Schema Explorer** — Interactive visualization of BigQuery export schema

---

## SEO Notes

Each tool page should have:
- Descriptive `<title>`: e.g., "Free GA4 DataLayer Builder & Validator — TaggingDocs"
- Meta description targeting search intent: "Build correct dataLayer.push() code for GA4 ecommerce events. Validates required fields, data types, and structure. Free, no signup."
- Structured data: `SoftwareApplication` schema
- Canonical URL
- OpenGraph image showing the tool interface

These tools should rank for searches like:
- "dataLayer.push generator"
- "GA4 purchase event dataLayer"
- "GA4 BigQuery query examples"
- "GA4 regex tester RE2"
- "GTM regex tester"
