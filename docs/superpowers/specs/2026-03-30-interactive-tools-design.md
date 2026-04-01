# Interactive Tools — Implementation Design

**Date**: 2026-03-30
**Source spec**: `docs/TOOLS-SPECIFICATION.md`
**Status**: Approved

## Decisions Made During Brainstorming

- **Scope**: All 3 tools built in parallel (DataLayer Builder, BigQuery Generator, Regex Tester)
- **RE2 engine**: Use `re2js` npm package for true RE2 accuracy
- **Code parser**: Use `json5` npm package for safe dataLayer code parsing
- **State persistence**: Both localStorage (convenience) + URL hash (shareability) via shared hook

## File Structure

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
    ├── hooks/
    │   └── useToolState.ts             # URL hash + localStorage sync
    ├── ui/
    │   ├── CodeOutput.tsx              # Syntax-highlighted output + copy
    │   ├── CopyButton.tsx              # Copy-to-clipboard
    │   ├── FieldBuilder.tsx            # Form field components
    │   └── ValidationResult.tsx        # Error/warning/success messages
    └── schemas/
        ├── ecommerce-events.ts         # GA4 ecommerce event schemas
        ├── recommended-events.ts       # GA4 engagement event schemas
        ├── item-parameters.ts          # Shared item parameters
        └── bigquery-templates.ts       # SQL templates with generateSQL
```

## Dependencies to Add

- `re2js` — Client-side RE2 regex engine
- `json5` — Safe JS object literal parser

## Shared Infrastructure

### useToolState Hook

Single hook manages state persistence for all tools:
1. On mount: read URL hash params, fall back to localStorage
2. On state change: sync to both URL hash and localStorage
3. URL params take priority over localStorage (shared links override local defaults)
4. Each tool provides a schema of field names, types, and defaults

### CodeOutput Component

Lightweight syntax highlighting using CSS classes for JS/SQL keywords, strings, comments, numbers. No external syntax highlighting library. Includes integrated copy button.

### FieldBuilder Component

Renders form fields from schema definitions:
- Text, number, date, select, multiselect inputs
- Required/optional indicators
- Help text tooltips
- Validation state display

### ValidationResult Component

Displays validation messages with severity levels:
- Error (red) — must fix
- Warning (yellow) — should review
- Info (blue) — suggestions
- Success (green) — passing checks

## Tool 1: DataLayer Builder + Validator

### Build Mode

- Event type dropdown grouped by category (ecommerce, engagement, custom)
- Dynamic form fields rendered from event schema
- Items array builder with add/remove item controls
- Options: ecommerce clearing, user_data for Enhanced Conversions, TypeScript types
- Live code generation as fields change
- Inline validation panel showing field status

### Validate Mode

- Textarea for pasting dataLayer.push() code
- Parse with json5 after stripping `dataLayer.push(` wrapper and `);`
- Detect event type from parsed object
- Run 12 validation checks (syntax, event name, required fields, data types, currency, ecommerce structure, clearing, items array, naming convention, parameter limits, PII detection, duplicate items)
- Auto-fix button: corrects fixable issues, switches to Build mode pre-filled

### Schema Structure

Each event defined as:
```typescript
interface EventSchema {
  name: string;
  description: string;
  category: 'ecommerce' | 'engagement' | 'custom';
  isEcommerce: boolean;
  parameters: ParameterDef[];
  hasItems: boolean;
  itemParameters?: ParameterDef[];
}
```

## Tool 2: BigQuery Query Generator

### Architecture

- Query type selector grouped by category (basic, ecommerce, advanced, utility)
- Global config fields (dataset path, table name, date range) persist across query switches
- Query-specific config fields rendered dynamically from template definition
- Options: cost optimization comments, TABLE_SUFFIX partitioning, sample output columns
- SQL generated live from template's `generateSQL` function
- Explanation panel below output

### 20 Query Templates

All templates defined as self-contained objects with config fields and SQL generation functions. Templates grouped into: Basic (6), Ecommerce (5), Advanced (6), Utility (3).

### SQL Generation Rules

All queries: use `_TABLE_SUFFIX` filtering, no `SELECT *`, include comments, correct UNNEST patterns, use `SAFE_CAST`, offer `APPROX_COUNT_DISTINCT` option, consistent formatting.

## Tool 3: GA4 Regex Tester

### Architecture

- Context toggle: GA4 Reports/Audiences vs GTM Triggers
- Pattern input with RE2 validation via `re2js`
- RE2 compatibility indicator with specific error messages for unsupported PCRE features
- Test strings list with add/remove, match/no-match indicators
- Match details panel (full match, capture groups)
- Common pattern template buttons that pre-fill regex + test strings
- GTM mode: shows effective pattern with implicit `^...$` anchors

### RE2 Validation

Pre-scan for known PCRE-only features (lookaheads, lookbehinds, backreferences, atomic groups, possessive quantifiers) with specific error messages and RE2 alternatives. Then validate with `re2js` for comprehensive checking.

## Styling

- All components use Tailwind CSS classes
- Dark/light mode via Starlight CSS variables (`--sl-color-*`)
- Accent color: cyan (#06b6d4) matching existing site theme
- Mobile responsive: stacked layouts, no tiny inputs
- Consistent with existing component patterns (slate backgrounds, rounded corners, consistent spacing)

## Sidebar Integration

Add "Tools" section to astro.config.mjs sidebar configuration, linking to all 3 tool pages plus the landing page.

## SEO

Each tool page includes:
- Descriptive title and meta description targeting search intent
- Structured data: SoftwareApplication schema
- Canonical URL
