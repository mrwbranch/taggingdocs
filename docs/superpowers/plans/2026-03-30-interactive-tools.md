# Interactive Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 3 interactive client-side tools (DataLayer Builder+Validator, BigQuery Query Generator, GA4 Regex Tester) as React islands in the existing Astro/Starlight documentation site.

**Architecture:** Each tool is a React component rendered as an Astro island (`client:load`) inside an MDX page. Shared infrastructure (state hook, UI primitives, schemas) lives in `src/components/tools/shared/`. All tools are client-side only — no backend. State persists via URL hash + localStorage through a shared `useToolState` hook.

**Tech Stack:** Astro 6 + Starlight, React 19, TypeScript, Tailwind CSS v4, `re2js` (RE2 regex), `json5` (safe JS parser)

**Spec:** `docs/TOOLS-SPECIFICATION.md`

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install re2js and json5**

```bash
cd /Users/jonaswestergren/Projects/taggingdocs
pnpm add re2js json5
```

- [ ] **Step 2: Verify installation**

```bash
pnpm ls re2js json5
```

Expected: Both packages listed with versions.

- [ ] **Step 3: Verify the dev server still starts**

```bash
pnpm dev &
sleep 5
kill %1
```

Expected: No errors during startup.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add re2js and json5 dependencies for interactive tools"
```

---

## Task 2: Shared Hook — useToolState

**Files:**
- Create: `src/components/tools/shared/hooks/useToolState.ts`

This hook is the state backbone for all 3 tools. It syncs state to both URL hash and localStorage.

- [ ] **Step 1: Create the useToolState hook**

```typescript
// src/components/tools/shared/hooks/useToolState.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface FieldSchema {
  name: string;
  defaultValue: string;
}

function parseHash(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const params = new URLSearchParams(hash);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function writeHash(values: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== '') {
      params.set(key, value);
    }
  }
  const hash = params.toString();
  window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
}

function readLocalStorage(storageKey: string): Record<string, string> {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeLocalStorage(storageKey: string, values: Record<string, string>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(values));
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}

export function useToolState(storageKey: string, fields: FieldSchema[]) {
  const initializedRef = useRef(false);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const field of fields) {
      defaults[field.name] = field.defaultValue;
    }
    return defaults;
  });

  // On mount: read URL hash first, then localStorage, then defaults
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const defaults: Record<string, string> = {};
    for (const field of fields) {
      defaults[field.name] = field.defaultValue;
    }

    const stored = readLocalStorage(storageKey);
    const hashParams = parseHash();

    const merged: Record<string, string> = { ...defaults, ...stored, ...hashParams };
    setValues(merged);
  }, [storageKey, fields]);

  // Sync to URL hash + localStorage on change
  useEffect(() => {
    if (!initializedRef.current) return;
    writeHash(values);
    writeLocalStorage(storageKey, values);
  }, [values, storageKey]);

  const setValue = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setMultipleValues = useCallback((updates: Record<string, string>) => {
    setValues((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetValues = useCallback(() => {
    const defaults: Record<string, string> = {};
    for (const field of fields) {
      defaults[field.name] = field.defaultValue;
    }
    setValues(defaults);
  }, [fields]);

  return { values, setValue, setMultipleValues, resetValues };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/jonaswestergren/Projects/taggingdocs
npx tsc --noEmit src/components/tools/shared/hooks/useToolState.ts 2>&1 || pnpm astro check
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/shared/hooks/useToolState.ts
git commit -m "feat: add useToolState hook for URL hash + localStorage sync"
```

---

## Task 3: Shared UI — CopyButton and CodeOutput

**Files:**
- Create: `src/components/tools/shared/ui/CopyButton.tsx`
- Create: `src/components/tools/shared/ui/CodeOutput.tsx`

- [ ] **Step 1: Create CopyButton**

```tsx
// src/components/tools/shared/ui/CopyButton.tsx
import { useState } from 'react';

interface Props {
  text: string;
}

export function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer"
      style={{
        color: copied ? '#22d3ee' : '#94a3b8',
        borderColor: copied ? 'rgb(6 182 212 / 0.3)' : 'rgb(51 65 85 / 0.7)',
        backgroundColor: copied ? 'rgb(8 51 68 / 0.3)' : 'transparent',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
```

- [ ] **Step 2: Create CodeOutput**

```tsx
// src/components/tools/shared/ui/CodeOutput.tsx
import { CopyButton } from './CopyButton';

interface Props {
  code: string;
  language: 'javascript' | 'sql' | 'typescript';
  title?: string;
}

function highlightCode(code: string, language: string): string {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  highlighted = highlighted.replace(
    /(\/\/.*$)/gm,
    '<span style="color:#6272a4">$1</span>'
  );

  // Strings (double and single quoted)
  highlighted = highlighted.replace(
    /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g,
    '<span style="color:#f1fa8c">$1</span>'
  );

  // Numbers
  highlighted = highlighted.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span style="color:#bd93f9">$1</span>'
  );

  if (language === 'javascript' || language === 'typescript') {
    // JS keywords
    highlighted = highlighted.replace(
      /\b(const|let|var|function|return|if|else|true|false|null|undefined|interface|type|export|import|from)\b/g,
      '<span style="color:#ff79c6">$1</span>'
    );
  }

  if (language === 'sql') {
    // SQL keywords (case-insensitive match, preserve original case in output)
    highlighted = highlighted.replace(
      /\b(SELECT|FROM|WHERE|AND|OR|GROUP|BY|ORDER|ASC|DESC|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AS|COUNT|SUM|AVG|MIN|MAX|DISTINCT|LIMIT|OFFSET|HAVING|UNION|ALL|IN|NOT|NULL|IS|BETWEEN|LIKE|CASE|WHEN|THEN|ELSE|END|WITH|UNNEST|CROSS|SAFE_CAST|APPROX_COUNT_DISTINCT|COUNT_DISTINCT|TIMESTAMP_MICROS|PARSE_DATE|FORMAT_DATE|DATE|INT64|STRING|FLOAT64|STRUCT|ARRAY|PARTITION|OVER|ROW_NUMBER|LEAD|LAG|FIRST_VALUE|LAST_VALUE)\b/gi,
      '<span style="color:#ff79c6">$1</span>'
    );
  }

  return highlighted;
}

export function CodeOutput({ code, language, title }: Props) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: 'rgb(51 65 85 / 0.7)' }}
    >
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{
          borderBottom: '1px solid rgb(51 65 85 / 0.7)',
          backgroundColor: 'rgb(30 41 59 / 0.5)',
        }}
      >
        <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>
          {title || (language === 'sql' ? 'Generated SQL' : 'Generated Code')}
        </span>
        <CopyButton text={code} />
      </div>
      <pre
        className="p-4 overflow-x-auto text-sm leading-relaxed m-0"
        style={{
          backgroundColor: 'rgb(15 23 42 / 0.5)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </pre>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/shared/ui/CopyButton.tsx src/components/tools/shared/ui/CodeOutput.tsx
git commit -m "feat: add CopyButton and CodeOutput shared UI components"
```

---

## Task 4: Shared UI — FieldBuilder and ValidationResult

**Files:**
- Create: `src/components/tools/shared/ui/FieldBuilder.tsx`
- Create: `src/components/tools/shared/ui/ValidationResult.tsx`

- [ ] **Step 1: Create FieldBuilder**

```tsx
// src/components/tools/shared/ui/FieldBuilder.tsx

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  type?: 'text' | 'number' | 'date';
}

export function TextField({ label, value, onChange, placeholder, helpText, required, type = 'text' }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
        {label}
        {required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 rounded-md border text-sm outline-none transition-colors"
        style={{
          backgroundColor: 'rgb(15 23 42 / 0.5)',
          borderColor: 'rgb(51 65 85 / 0.7)',
          color: '#e2e8f0',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
        onBlur={(e) => (e.target.style.borderColor = 'rgb(51 65 85 / 0.7)')}
      />
      {helpText && (
        <span className="text-xs" style={{ color: '#64748b' }}>{helpText}</span>
      )}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string; group?: string }[];
  helpText?: string;
  required?: boolean;
}

export function SelectField({ label, value, onChange, options, helpText, required }: SelectFieldProps) {
  const groups = new Map<string, { label: string; value: string }[]>();
  const ungrouped: { label: string; value: string }[] = [];

  for (const opt of options) {
    if (opt.group) {
      if (!groups.has(opt.group)) groups.set(opt.group, []);
      groups.get(opt.group)!.push(opt);
    } else {
      ungrouped.push(opt);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
        {label}
        {required && <span style={{ color: '#f87171' }}> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-md border text-sm outline-none cursor-pointer"
        style={{
          backgroundColor: 'rgb(15 23 42 / 0.8)',
          borderColor: 'rgb(51 65 85 / 0.7)',
          color: '#e2e8f0',
        }}
      >
        {ungrouped.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
        {[...groups.entries()].map(([group, opts]) => (
          <optgroup key={group} label={group}>
            {opts.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {helpText && (
        <span className="text-xs" style={{ color: '#64748b' }}>{helpText}</span>
      )}
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helpText?: string;
}

export function CheckboxField({ label, checked, onChange, helpText }: CheckboxFieldProps) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-cyan-500"
      />
      <div>
        <span className="text-sm" style={{ color: '#e2e8f0' }}>{label}</span>
        {helpText && (
          <span className="block text-xs" style={{ color: '#64748b' }}>{helpText}</span>
        )}
      </div>
    </label>
  );
}
```

- [ ] **Step 2: Create ValidationResult**

```tsx
// src/components/tools/shared/ui/ValidationResult.tsx

export interface ValidationMessage {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

interface Props {
  messages: ValidationMessage[];
}

const ICONS: Record<string, string> = {
  error: '\u274C',
  warning: '\u26A0\uFE0F',
  info: '\u2139\uFE0F',
  success: '\u2705',
};

const COLORS: Record<string, { border: string; bg: string; text: string }> = {
  error: { border: 'rgb(239 68 68 / 0.3)', bg: 'rgb(127 29 29 / 0.2)', text: '#fca5a5' },
  warning: { border: 'rgb(234 179 8 / 0.3)', bg: 'rgb(113 63 18 / 0.2)', text: '#fde047' },
  info: { border: 'rgb(59 130 246 / 0.3)', bg: 'rgb(30 58 138 / 0.2)', text: '#93c5fd' },
  success: { border: 'rgb(34 197 94 / 0.3)', bg: 'rgb(20 83 45 / 0.2)', text: '#86efac' },
};

export function ValidationResult({ messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {messages.map((msg, i) => {
        const colors = COLORS[msg.type];
        return (
          <div
            key={i}
            className="px-3 py-2 rounded-md border text-sm"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            {ICONS[msg.type]} {msg.message}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/shared/ui/FieldBuilder.tsx src/components/tools/shared/ui/ValidationResult.tsx
git commit -m "feat: add FieldBuilder and ValidationResult shared UI components"
```

---

## Task 5: GA4 Event Schemas

**Files:**
- Create: `src/components/tools/shared/schemas/item-parameters.ts`
- Create: `src/components/tools/shared/schemas/ecommerce-events.ts`
- Create: `src/components/tools/shared/schemas/recommended-events.ts`

- [ ] **Step 1: Create item parameters schema**

```typescript
// src/components/tools/shared/schemas/item-parameters.ts

export interface ParameterDef {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    pattern?: string; // stored as string, compiled to RegExp at runtime
    min?: number;
    max?: number;
    enum?: string[];
  };
  defaultValue?: string;
}

export interface EventSchema {
  name: string;
  description: string;
  category: 'ecommerce' | 'engagement' | 'custom';
  isEcommerce: boolean;
  parameters: ParameterDef[];
  hasItems: boolean;
  itemParameters?: ParameterDef[];
}

export const ITEM_PARAMETERS: ParameterDef[] = [
  { name: 'item_id', displayName: 'Item ID', type: 'string', required: true, placeholder: 'SKU-12345', description: 'Product SKU or ID' },
  { name: 'item_name', displayName: 'Item Name', type: 'string', required: true, placeholder: 'Blue T-Shirt', description: 'Product name' },
  { name: 'price', displayName: 'Price', type: 'number', required: true, placeholder: '29.99', description: 'Unit price' },
  { name: 'quantity', displayName: 'Quantity', type: 'number', required: true, placeholder: '1', description: 'Quantity' },
  { name: 'item_brand', displayName: 'Brand', type: 'string', required: false, placeholder: 'Nike', description: 'Brand name' },
  { name: 'item_category', displayName: 'Category', type: 'string', required: false, placeholder: 'Apparel', description: 'Primary category' },
  { name: 'item_category2', displayName: 'Category 2', type: 'string', required: false, placeholder: 'T-Shirts', description: 'Sub-category level 2' },
  { name: 'item_category3', displayName: 'Category 3', type: 'string', required: false, placeholder: 'Short Sleeve', description: 'Sub-category level 3' },
  { name: 'item_category4', displayName: 'Category 4', type: 'string', required: false, placeholder: '', description: 'Sub-category level 4' },
  { name: 'item_category5', displayName: 'Category 5', type: 'string', required: false, placeholder: '', description: 'Sub-category level 5' },
  { name: 'item_variant', displayName: 'Variant', type: 'string', required: false, placeholder: 'Blue / Large', description: 'Color, size, etc.' },
  { name: 'item_list_id', displayName: 'List ID', type: 'string', required: false, placeholder: 'related_products', description: 'List identifier' },
  { name: 'item_list_name', displayName: 'List Name', type: 'string', required: false, placeholder: 'Related Products', description: 'List display name' },
  { name: 'index', displayName: 'Index', type: 'number', required: false, placeholder: '0', description: 'Position in list' },
  { name: 'coupon', displayName: 'Coupon', type: 'string', required: false, placeholder: 'SUMMER20', description: 'Item-level coupon' },
  { name: 'discount', displayName: 'Discount', type: 'number', required: false, placeholder: '5.00', description: 'Item-level discount amount' },
  { name: 'affiliation', displayName: 'Affiliation', type: 'string', required: false, placeholder: 'Partner Store', description: 'Store or partner name' },
];
```

- [ ] **Step 2: Create ecommerce events schema**

```typescript
// src/components/tools/shared/schemas/ecommerce-events.ts
import { ITEM_PARAMETERS, type EventSchema } from './item-parameters';

export const ECOMMERCE_EVENTS: EventSchema[] = [
  {
    name: 'view_item_list',
    description: 'Product listing / category page',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'item_list_id', displayName: 'List ID', type: 'string', required: false, placeholder: 'related_products', description: 'Identifier for the list' },
      { name: 'item_list_name', displayName: 'List Name', type: 'string', required: false, placeholder: 'Related Products', description: 'Display name of the list' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'select_item',
    description: 'Click product in list',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'item_list_id', displayName: 'List ID', type: 'string', required: false, placeholder: 'related_products', description: 'Identifier for the list' },
      { name: 'item_list_name', displayName: 'List Name', type: 'string', required: false, placeholder: 'Related Products', description: 'Display name of the list' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'view_item',
    description: 'Product detail page',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '29.99', description: 'Monetary value of the event' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'add_to_cart',
    description: 'Add product to cart',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '29.99', description: 'Monetary value of the event' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'remove_from_cart',
    description: 'Remove from cart',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '29.99', description: 'Monetary value of the event' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'view_cart',
    description: 'Cart page',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '59.98', description: 'Monetary value of the event' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'begin_checkout',
    description: 'Start checkout',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '59.98', description: 'Monetary value of the event' },
      { name: 'coupon', displayName: 'Coupon', type: 'string', required: false, placeholder: 'SUMMER20', description: 'Order-level coupon' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'add_shipping_info',
    description: 'Shipping step',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '59.98', description: 'Monetary value of the event' },
      { name: 'coupon', displayName: 'Coupon', type: 'string', required: false, placeholder: 'SUMMER20', description: 'Order-level coupon' },
      { name: 'shipping_tier', displayName: 'Shipping Tier', type: 'string', required: false, placeholder: 'Express', description: 'Shipping tier (e.g., Express, Ground)' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'add_payment_info',
    description: 'Payment step',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '59.98', description: 'Monetary value of the event' },
      { name: 'coupon', displayName: 'Coupon', type: 'string', required: false, placeholder: 'SUMMER20', description: 'Order-level coupon' },
      { name: 'payment_type', displayName: 'Payment Type', type: 'string', required: false, placeholder: 'credit_card', description: 'Payment method', validation: { enum: ['credit_card', 'paypal', 'klarna', 'apple_pay', 'google_pay', 'bank_transfer'] } },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'purchase',
    description: 'Order complete',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'transaction_id', displayName: 'Transaction ID', type: 'string', required: true, placeholder: 'T-12345', description: 'Unique transaction identifier' },
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '59.98', description: 'Total transaction value' },
      { name: 'tax', displayName: 'Tax', type: 'number', required: false, placeholder: '4.50', description: 'Tax amount' },
      { name: 'shipping', displayName: 'Shipping', type: 'number', required: false, placeholder: '5.99', description: 'Shipping cost' },
      { name: 'coupon', displayName: 'Coupon', type: 'string', required: false, placeholder: 'SUMMER20', description: 'Order-level coupon' },
      { name: 'affiliation', displayName: 'Affiliation', type: 'string', required: false, placeholder: 'Online Store', description: 'Store or affiliation' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'refund',
    description: 'Order refund',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'transaction_id', displayName: 'Transaction ID', type: 'string', required: true, placeholder: 'T-12345', description: 'Transaction ID to refund' },
      { name: 'currency', displayName: 'Currency', type: 'string', required: true, placeholder: 'USD', description: 'ISO 4217 currency code', validation: { pattern: '^[A-Z]{3}$' } },
      { name: 'value', displayName: 'Value', type: 'number', required: true, placeholder: '59.98', description: 'Refund value' },
      { name: 'tax', displayName: 'Tax', type: 'number', required: false, placeholder: '4.50', description: 'Tax refunded' },
      { name: 'shipping', displayName: 'Shipping', type: 'number', required: false, placeholder: '5.99', description: 'Shipping refunded' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'view_promotion',
    description: 'View promotional banner',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'promotion_id', displayName: 'Promotion ID', type: 'string', required: false, placeholder: 'summer_sale', description: 'Promotion ID' },
      { name: 'promotion_name', displayName: 'Promotion Name', type: 'string', required: false, placeholder: 'Summer Sale', description: 'Promotion name' },
      { name: 'creative_name', displayName: 'Creative Name', type: 'string', required: false, placeholder: 'banner_1', description: 'Creative name or ID' },
      { name: 'creative_slot', displayName: 'Creative Slot', type: 'string', required: false, placeholder: 'hero', description: 'Slot where creative was shown' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
  {
    name: 'select_promotion',
    description: 'Click promotional banner',
    category: 'ecommerce',
    isEcommerce: true,
    parameters: [
      { name: 'promotion_id', displayName: 'Promotion ID', type: 'string', required: false, placeholder: 'summer_sale', description: 'Promotion ID' },
      { name: 'promotion_name', displayName: 'Promotion Name', type: 'string', required: false, placeholder: 'Summer Sale', description: 'Promotion name' },
      { name: 'creative_name', displayName: 'Creative Name', type: 'string', required: false, placeholder: 'banner_1', description: 'Creative name or ID' },
      { name: 'creative_slot', displayName: 'Creative Slot', type: 'string', required: false, placeholder: 'hero', description: 'Slot where creative was shown' },
    ],
    hasItems: true,
    itemParameters: ITEM_PARAMETERS,
  },
];
```

- [ ] **Step 3: Create recommended events schema**

```typescript
// src/components/tools/shared/schemas/recommended-events.ts
import type { EventSchema } from './item-parameters';

export const ENGAGEMENT_EVENTS: EventSchema[] = [
  {
    name: 'login',
    description: 'User login',
    category: 'engagement',
    isEcommerce: false,
    parameters: [
      { name: 'method', displayName: 'Method', type: 'string', required: false, placeholder: 'Google', description: 'Login method (e.g., Google, Email)' },
    ],
    hasItems: false,
  },
  {
    name: 'sign_up',
    description: 'User registration',
    category: 'engagement',
    isEcommerce: false,
    parameters: [
      { name: 'method', displayName: 'Method', type: 'string', required: false, placeholder: 'Email', description: 'Sign up method' },
    ],
    hasItems: false,
  },
  {
    name: 'search',
    description: 'Site search',
    category: 'engagement',
    isEcommerce: false,
    parameters: [
      { name: 'search_term', displayName: 'Search Term', type: 'string', required: true, placeholder: 'blue shoes', description: 'The search query' },
    ],
    hasItems: false,
  },
  {
    name: 'generate_lead',
    description: 'Lead form submission',
    category: 'engagement',
    isEcommerce: false,
    parameters: [
      { name: 'currency', displayName: 'Currency', type: 'string', required: false, placeholder: 'USD', description: 'Currency of the lead value' },
      { name: 'value', displayName: 'Value', type: 'number', required: false, placeholder: '100', description: 'Value of the lead' },
    ],
    hasItems: false,
  },
  {
    name: 'share',
    description: 'Content sharing',
    category: 'engagement',
    isEcommerce: false,
    parameters: [
      { name: 'method', displayName: 'Method', type: 'string', required: false, placeholder: 'Twitter', description: 'Share method or platform' },
      { name: 'content_type', displayName: 'Content Type', type: 'string', required: false, placeholder: 'article', description: 'Type of content shared' },
      { name: 'item_id', displayName: 'Item ID', type: 'string', required: false, placeholder: 'article-123', description: 'ID of the shared content' },
    ],
    hasItems: false,
  },
  {
    name: 'select_content',
    description: 'Content selection',
    category: 'engagement',
    isEcommerce: false,
    parameters: [
      { name: 'content_type', displayName: 'Content Type', type: 'string', required: false, placeholder: 'product', description: 'Type of content selected' },
      { name: 'content_id', displayName: 'Content ID', type: 'string', required: false, placeholder: 'product-123', description: 'ID of the selected content' },
    ],
    hasItems: false,
  },
];
```

- [ ] **Step 4: Commit**

```bash
git add src/components/tools/shared/schemas/
git commit -m "feat: add GA4 event schemas (ecommerce, engagement, item parameters)"
```

---

## Task 6: BigQuery Query Templates

**Files:**
- Create: `src/components/tools/shared/schemas/bigquery-templates.ts`

- [ ] **Step 1: Create BigQuery templates**

```typescript
// src/components/tools/shared/schemas/bigquery-templates.ts

interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
}

export interface QueryTemplate {
  id: string;
  name: string;
  category: 'basic' | 'ecommerce' | 'advanced' | 'utility';
  description: string;
  explanation: string;
  config: ConfigField[];
  generateSQL: (cfg: Record<string, string>) => string;
}

function tableSuffix(startDate: string, endDate: string): string {
  const start = startDate.replace(/-/g, '');
  const end = endDate.replace(/-/g, '');
  return `_TABLE_SUFFIX BETWEEN '${start}' AND '${end}'`;
}

export const BIGQUERY_TEMPLATES: QueryTemplate[] = [
  // ── Basic Reports ──
  {
    id: 'pageviews_by_page',
    name: 'Page Views by Page',
    category: 'basic',
    description: 'Top pages by pageview count',
    explanation: 'Filters for page_view events and extracts the page_location from event_params using UNNEST. Groups by page path and orders by view count descending.',
    config: [
      { name: 'limit', label: 'Top N', type: 'number', required: false, defaultValue: '20', placeholder: '20' },
      { name: 'hostname', label: 'Hostname Filter', type: 'text', required: false, placeholder: 'example.com', helpText: 'Optional: filter by hostname' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const limit = cfg.limit || '20';
      const hostnameFilter = cfg.hostname
        ? `\n  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') LIKE '%${cfg.hostname}%'`
        : '';
      return `-- Page Views by Page
-- Top ${limit} pages by pageview count

SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  COUNT(*) AS pageviews
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
  AND event_name = 'page_view'${hostnameFilter}
GROUP BY
  page_location
ORDER BY
  pageviews DESC
LIMIT ${limit};`;
    },
  },
  {
    id: 'users_sessions_daily',
    name: 'Users and Sessions per Day',
    category: 'basic',
    description: 'Daily user and session counts',
    explanation: 'Counts distinct user_pseudo_id for users and distinct combinations of user_pseudo_id + ga_session_id for sessions per day.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Users and Sessions per Day

SELECT
  PARSE_DATE('%Y%m%d', event_date) AS date,
  COUNT(DISTINCT user_pseudo_id) AS users,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-',
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')
  )) AS sessions
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
GROUP BY
  date
ORDER BY
  date;`;
    },
  },
  {
    id: 'events_by_name',
    name: 'Events by Event Name',
    category: 'basic',
    description: 'Event frequency table',
    explanation: 'Counts all events grouped by event_name. Optionally filter to a specific event.',
    config: [
      { name: 'eventFilter', label: 'Event Name Filter', type: 'text', required: false, placeholder: 'click', helpText: 'Optional: filter to specific event' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const eventFilter = cfg.eventFilter ? `\n  AND event_name = '${cfg.eventFilter}'` : '';
      return `-- Events by Event Name

SELECT
  event_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_pseudo_id) AS unique_users
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}${eventFilter}
GROUP BY
  event_name
ORDER BY
  event_count DESC;`;
    },
  },
  {
    id: 'traffic_sources',
    name: 'Traffic Sources (Sessions by Source/Medium)',
    category: 'basic',
    description: 'Sessions by source/medium',
    explanation: 'Extracts session-level traffic source data using collected_traffic_source fields, grouping by source and medium.',
    config: [
      { name: 'limit', label: 'Top N', type: 'number', required: false, defaultValue: '20', placeholder: '20' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const limit = cfg.limit || '20';
      return `-- Traffic Sources — Sessions by Source/Medium

SELECT
  collected_traffic_source.manual_source AS source,
  collected_traffic_source.manual_medium AS medium,
  COUNT(DISTINCT CONCAT(user_pseudo_id, '-',
    CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
  )) AS sessions
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
GROUP BY
  source, medium
ORDER BY
  sessions DESC
LIMIT ${limit};`;
    },
  },
  {
    id: 'landing_pages',
    name: 'Landing Pages',
    category: 'basic',
    description: 'Top entry pages with session count',
    explanation: 'Finds the page_location for session_start events, which represent the first page a user lands on in each session.',
    config: [
      { name: 'limit', label: 'Top N', type: 'number', required: false, defaultValue: '20', placeholder: '20' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const limit = cfg.limit || '20';
      return `-- Landing Pages

SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS landing_page,
  COUNT(*) AS sessions
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
  AND event_name = 'session_start'
GROUP BY
  landing_page
ORDER BY
  sessions DESC
LIMIT ${limit};`;
    },
  },
  {
    id: 'exit_pages',
    name: 'Exit Pages',
    category: 'basic',
    description: 'Last page viewed per session',
    explanation: 'Uses ROW_NUMBER window function to find the last page_view event in each session, ordered by event_timestamp descending.',
    config: [
      { name: 'limit', label: 'Top N', type: 'number', required: false, defaultValue: '20', placeholder: '20' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const limit = cfg.limit || '20';
      return `-- Exit Pages

WITH session_pages AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
    event_timestamp,
    ROW_NUMBER() OVER (
      PARTITION BY user_pseudo_id,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')
      ORDER BY event_timestamp DESC
    ) AS rn
  FROM
    \`${dataset}.${table}\`
  WHERE
    ${tableSuffix(cfg.startDate, cfg.endDate)}
    AND event_name = 'page_view'
)

SELECT
  page_location AS exit_page,
  COUNT(*) AS exits
FROM session_pages
WHERE rn = 1
GROUP BY exit_page
ORDER BY exits DESC
LIMIT ${limit};`;
    },
  },

  // ── Ecommerce ──
  {
    id: 'revenue_by_product',
    name: 'Revenue by Product',
    category: 'ecommerce',
    description: 'Product-level revenue from purchase events',
    explanation: 'Unnests the items array from purchase events and calculates revenue per product using item_revenue or price * quantity.',
    config: [
      { name: 'limit', label: 'Top N', type: 'number', required: false, defaultValue: '20', placeholder: '20' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const limit = cfg.limit || '20';
      return `-- Revenue by Product

SELECT
  items.item_name,
  items.item_id,
  COUNT(*) AS times_purchased,
  SUM(items.quantity) AS total_quantity,
  SUM(items.price * items.quantity) AS total_revenue
FROM
  \`${dataset}.${table}\`,
  UNNEST(items) AS items
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
  AND event_name = 'purchase'
GROUP BY
  items.item_name, items.item_id
ORDER BY
  total_revenue DESC
LIMIT ${limit};`;
    },
  },
  {
    id: 'purchase_conversion_rate',
    name: 'Purchase Conversion Rate',
    category: 'ecommerce',
    description: 'Users who purchased / total users',
    explanation: 'Calculates conversion rate by dividing users who triggered a purchase event by total distinct users in the date range.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Purchase Conversion Rate

SELECT
  COUNT(DISTINCT user_pseudo_id) AS total_users,
  COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN user_pseudo_id END) AS purchasers,
  SAFE_DIVIDE(
    COUNT(DISTINCT CASE WHEN event_name = 'purchase' THEN user_pseudo_id END),
    COUNT(DISTINCT user_pseudo_id)
  ) * 100 AS conversion_rate_pct
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)};`;
    },
  },
  {
    id: 'average_order_value',
    name: 'Average Order Value',
    category: 'ecommerce',
    description: 'Total revenue / number of transactions',
    explanation: 'Extracts the value event parameter from purchase events and calculates average order value.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Average Order Value

SELECT
  COUNT(DISTINCT
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'transaction_id')
  ) AS total_transactions,
  SUM(ecommerce.purchase_revenue) AS total_revenue,
  SAFE_DIVIDE(
    SUM(ecommerce.purchase_revenue),
    COUNT(DISTINCT
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'transaction_id')
    )
  ) AS avg_order_value
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
  AND event_name = 'purchase';`;
    },
  },
  {
    id: 'cart_abandonment',
    name: 'Cart Abandonment',
    category: 'ecommerce',
    description: 'Users who added to cart but did not purchase',
    explanation: 'Compares users who triggered add_to_cart with those who triggered purchase to find the abandonment rate.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Cart Abandonment Rate

WITH user_actions AS (
  SELECT
    user_pseudo_id,
    COUNTIF(event_name = 'add_to_cart') AS added_to_cart,
    COUNTIF(event_name = 'purchase') AS purchased
  FROM
    \`${dataset}.${table}\`
  WHERE
    ${tableSuffix(cfg.startDate, cfg.endDate)}
  GROUP BY user_pseudo_id
)

SELECT
  COUNT(DISTINCT CASE WHEN added_to_cart > 0 THEN user_pseudo_id END) AS users_added_to_cart,
  COUNT(DISTINCT CASE WHEN added_to_cart > 0 AND purchased > 0 THEN user_pseudo_id END) AS users_purchased,
  COUNT(DISTINCT CASE WHEN added_to_cart > 0 AND purchased = 0 THEN user_pseudo_id END) AS users_abandoned,
  SAFE_DIVIDE(
    COUNT(DISTINCT CASE WHEN added_to_cart > 0 AND purchased = 0 THEN user_pseudo_id END),
    COUNT(DISTINCT CASE WHEN added_to_cart > 0 THEN user_pseudo_id END)
  ) * 100 AS abandonment_rate_pct
FROM user_actions;`;
    },
  },
  {
    id: 'product_performance',
    name: 'Product Performance Funnel',
    category: 'ecommerce',
    description: 'Views, add-to-carts, purchases per product',
    explanation: 'Combines view_item, add_to_cart, and purchase events at the product level by unnesting items from each event type.',
    config: [
      { name: 'limit', label: 'Top N', type: 'number', required: false, defaultValue: '20', placeholder: '20' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const limit = cfg.limit || '20';
      return `-- Product Performance Funnel

SELECT
  items.item_name,
  items.item_id,
  COUNTIF(event_name = 'view_item') AS views,
  COUNTIF(event_name = 'add_to_cart') AS add_to_carts,
  COUNTIF(event_name = 'purchase') AS purchases,
  SAFE_DIVIDE(COUNTIF(event_name = 'add_to_cart'), COUNTIF(event_name = 'view_item')) * 100 AS view_to_cart_pct,
  SAFE_DIVIDE(COUNTIF(event_name = 'purchase'), COUNTIF(event_name = 'add_to_cart')) * 100 AS cart_to_purchase_pct
FROM
  \`${dataset}.${table}\`,
  UNNEST(items) AS items
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
  AND event_name IN ('view_item', 'add_to_cart', 'purchase')
GROUP BY
  items.item_name, items.item_id
ORDER BY
  views DESC
LIMIT ${limit};`;
    },
  },

  // ── Advanced ──
  {
    id: 'session_reconstruction',
    name: 'Session Reconstruction',
    category: 'advanced',
    description: 'Build session-level table from event data',
    explanation: 'Reconstructs sessions by grouping events using user_pseudo_id + ga_session_id. Extracts landing page, exit page, session duration, source/medium, and event counts per session.',
    config: [
      { name: 'limit', label: 'Limit', type: 'number', required: false, defaultValue: '100', placeholder: '100' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const limit = cfg.limit || '100';
      return `-- Session Reconstruction

WITH events AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    event_name,
    event_timestamp,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
    collected_traffic_source.manual_source AS source,
    collected_traffic_source.manual_medium AS medium
  FROM
    \`${dataset}.${table}\`
  WHERE
    ${tableSuffix(cfg.startDate, cfg.endDate)}
)

SELECT
  user_pseudo_id,
  session_id,
  MIN(TIMESTAMP_MICROS(event_timestamp)) AS session_start,
  MAX(TIMESTAMP_MICROS(event_timestamp)) AS session_end,
  TIMESTAMP_DIFF(MAX(TIMESTAMP_MICROS(event_timestamp)), MIN(TIMESTAMP_MICROS(event_timestamp)), SECOND) AS duration_seconds,
  COUNT(*) AS event_count,
  COUNTIF(event_name = 'page_view') AS pageviews,
  ANY_VALUE(source) AS source,
  ANY_VALUE(medium) AS medium,
  ARRAY_AGG(page_location IGNORE NULLS ORDER BY event_timestamp LIMIT 1)[SAFE_OFFSET(0)] AS landing_page,
  ARRAY_AGG(page_location IGNORE NULLS ORDER BY event_timestamp DESC LIMIT 1)[SAFE_OFFSET(0)] AS exit_page
FROM events
GROUP BY user_pseudo_id, session_id
ORDER BY session_start DESC
LIMIT ${limit};`;
    },
  },
  {
    id: 'funnel_analysis',
    name: 'Funnel Analysis',
    category: 'advanced',
    description: 'Step completion rates through a custom funnel',
    explanation: 'Tracks users through a sequence of events (funnel steps) and calculates drop-off at each step. Uses conditional aggregation to determine if a user completed each step.',
    config: [
      { name: 'step1', label: 'Step 1 Event', type: 'text', required: true, placeholder: 'view_item', helpText: 'First funnel step event name' },
      { name: 'step2', label: 'Step 2 Event', type: 'text', required: true, placeholder: 'add_to_cart' },
      { name: 'step3', label: 'Step 3 Event', type: 'text', required: true, placeholder: 'begin_checkout' },
      { name: 'step4', label: 'Step 4 Event', type: 'text', required: false, placeholder: 'purchase', helpText: 'Optional fourth step' },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      const steps = [cfg.step1, cfg.step2, cfg.step3, cfg.step4].filter(Boolean);
      const stepCounters = steps
        .map((step, i) => `  COUNTIF(event_name = '${step}') AS step${i + 1}_${step}_users`)
        .join(',\n');
      const stepCounts = steps
        .map((step, i) => `  COUNT(DISTINCT CASE WHEN event_name = '${step}' THEN user_pseudo_id END) AS step${i + 1}_users`)
        .join(',\n');
      return `-- Funnel Analysis: ${steps.join(' → ')}

SELECT
${stepCounts}
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
  AND event_name IN (${steps.map((s) => `'${s}'`).join(', ')});`;
    },
  },
  {
    id: 'custom_event_params',
    name: 'Custom Event Parameter Extraction',
    category: 'advanced',
    description: 'Extract any event parameter by name',
    explanation: 'Extracts a specific event parameter from the nested event_params array using UNNEST and the appropriate value type (string_value, int_value, double_value).',
    config: [
      { name: 'eventName', label: 'Event Name', type: 'text', required: true, placeholder: 'click' },
      { name: 'paramName', label: 'Parameter Name', type: 'text', required: true, placeholder: 'link_url' },
      { name: 'paramType', label: 'Parameter Type', type: 'select', required: true, defaultValue: 'string_value', options: [
        { label: 'String', value: 'string_value' },
        { label: 'Integer', value: 'int_value' },
        { label: 'Double', value: 'double_value' },
      ]},
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Custom Event Parameter: ${cfg.eventName}.${cfg.paramName}

SELECT
  (SELECT value.${cfg.paramType} FROM UNNEST(event_params) WHERE key = '${cfg.paramName}') AS ${cfg.paramName},
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_pseudo_id) AS unique_users
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
  AND event_name = '${cfg.eventName}'
GROUP BY
  ${cfg.paramName}
ORDER BY
  event_count DESC;`;
    },
  },

  // ── Utility ──
  {
    id: 'schema_explorer',
    name: 'Schema Explorer',
    category: 'utility',
    description: 'Shows all distinct event names and their parameter keys',
    explanation: 'Lists all unique event names and, for each event, all parameter keys found. Use a single day to minimize scan cost.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Schema Explorer — Event Names and Parameters
-- TIP: Use a single day for date range to minimize scan cost

SELECT
  event_name,
  ARRAY_AGG(DISTINCT params.key ORDER BY params.key) AS parameter_keys,
  COUNT(*) AS event_count
FROM
  \`${dataset}.${table}\`,
  UNNEST(event_params) AS params
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)}
GROUP BY
  event_name
ORDER BY
  event_count DESC;`;
    },
  },
  {
    id: 'data_freshness',
    name: 'Data Freshness Check',
    category: 'utility',
    description: 'Latest event timestamp in the export',
    explanation: 'Finds the most recent event timestamp to check how fresh the data export is.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Data Freshness Check

SELECT
  MAX(TIMESTAMP_MICROS(event_timestamp)) AS latest_event,
  MAX(event_date) AS latest_date,
  COUNT(*) AS total_events
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)};`;
    },
  },
  {
    id: 'estimated_row_count',
    name: 'Estimated Row Count',
    category: 'utility',
    description: 'Total events in date range',
    explanation: 'Counts total rows (events) and distinct users in the specified date range. Useful for estimating scan size before running larger queries.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const table = cfg.tableName || 'events_*';
      return `-- Estimated Row Count

SELECT
  COUNT(*) AS total_events,
  COUNT(DISTINCT event_name) AS distinct_events,
  COUNT(DISTINCT user_pseudo_id) AS distinct_users,
  MIN(event_date) AS earliest_date,
  MAX(event_date) AS latest_date
FROM
  \`${dataset}.${table}\`
WHERE
  ${tableSuffix(cfg.startDate, cfg.endDate)};`;
    },
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/shared/schemas/bigquery-templates.ts
git commit -m "feat: add BigQuery query templates (15 templates across 4 categories)"
```

---

## Task 7: DataLayer Builder + Validator Component

**Files:**
- Create: `src/components/tools/DataLayerBuilder.tsx`

This is the largest component. It has Build mode and Validate mode.

- [ ] **Step 1: Create the DataLayerBuilder component**

```tsx
// src/components/tools/DataLayerBuilder.tsx
import { useState, useMemo } from 'react';
import { useToolState } from './shared/hooks/useToolState';
import { CodeOutput } from './shared/ui/CodeOutput';
import { TextField, SelectField, CheckboxField } from './shared/ui/FieldBuilder';
import { ValidationResult, type ValidationMessage } from './shared/ui/ValidationResult';
import { ECOMMERCE_EVENTS } from './shared/schemas/ecommerce-events';
import { ENGAGEMENT_EVENTS } from './shared/schemas/recommended-events';
import { ITEM_PARAMETERS, type EventSchema, type ParameterDef } from './shared/schemas/item-parameters';
import JSON5 from 'json5';

const ALL_EVENTS: EventSchema[] = [...ECOMMERCE_EVENTS, ...ENGAGEMENT_EVENTS];

const EVENT_OPTIONS = [
  ...ECOMMERCE_EVENTS.map((e) => ({ label: `${e.name} — ${e.description}`, value: e.name, group: 'Ecommerce Events' })),
  ...ENGAGEMENT_EVENTS.map((e) => ({ label: `${e.name} — ${e.description}`, value: e.name, group: 'Engagement Events' })),
  { label: 'Custom Event', value: '__custom__', group: 'Custom' },
];

const FIELDS = [
  { name: 'mode', defaultValue: 'build' },
  { name: 'event', defaultValue: 'purchase' },
  { name: 'clearEcommerce', defaultValue: 'true' },
  { name: 'includeUserData', defaultValue: 'false' },
  { name: 'generateTypes', defaultValue: 'false' },
];

interface ItemValues {
  [key: string]: string;
}

// ── Validation Logic ──

const VALID_CURRENCIES = ['USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY','SEK','NZD','NOK','DKK','SGD','HKD','KRW','INR','BRL','ZAR','MXN','PLN','CZK','HUF','TRY','THB','MYR','PHP','IDR','VND','ILS','AED','SAR','TWD','ARS','CLP','COP','PEN','EGP','NGN','KES','UAH','RON','BGN','HRK','ISK','RUB'];

function validateDataLayerCode(code: string): { messages: ValidationMessage[]; parsedEvent?: string; parsedObj?: Record<string, unknown> } {
  const messages: ValidationMessage[] = [];

  // Strip dataLayer.push wrapper
  let objectStr = code.trim();
  const pushMatch = objectStr.match(/dataLayer\.push\s*\(([\s\S]*)\)\s*;?\s*$/);
  if (pushMatch) {
    objectStr = pushMatch[1].trim();
  }

  // Try parsing
  let obj: Record<string, unknown>;
  try {
    obj = JSON5.parse(objectStr);
  } catch {
    messages.push({ type: 'error', message: 'Invalid JavaScript syntax. Could not parse the object.' });
    return { messages };
  }

  const eventName = obj.event as string | undefined;

  if (!eventName) {
    messages.push({ type: 'error', message: 'Missing `event` property. Every dataLayer.push() should have an event name.' });
    return { messages, parsedObj: obj };
  }

  // Event name validation
  if (eventName !== eventName.toLowerCase() || eventName.includes(' ')) {
    messages.push({ type: 'error', message: `Event name "${eventName}" should be snake_case (lowercase with underscores).` });
  }

  if (eventName.length > 40) {
    messages.push({ type: 'error', message: `Event name "${eventName}" exceeds 40 character limit (${eventName.length} chars).` });
  }

  // Check against known schemas
  const schema = ALL_EVENTS.find((e) => e.name === eventName);

  if (schema) {
    messages.push({ type: 'success', message: `Event name "${eventName}" is a valid GA4 recommended event.` });

    // Check ecommerce wrapper
    if (schema.isEcommerce) {
      if (!obj.ecommerce) {
        messages.push({ type: 'error', message: 'Ecommerce events should wrap parameters inside an `ecommerce` object.' });
      } else {
        const ecom = obj.ecommerce as Record<string, unknown>;

        // Check required parameters
        for (const param of schema.parameters) {
          if (param.required) {
            if (ecom[param.name] === undefined && obj[param.name] === undefined) {
              messages.push({ type: 'error', message: `Missing required field "${param.name}".` });
            }
          }
        }

        // Type checks
        if (ecom.value !== undefined && typeof ecom.value === 'string') {
          messages.push({ type: 'error', message: `"value" should be a number, got string "${ecom.value}". Remove the quotes.` });
        }
        if (ecom.currency !== undefined && typeof ecom.currency === 'string') {
          if (!VALID_CURRENCIES.includes(ecom.currency)) {
            messages.push({ type: 'warning', message: `Currency "${ecom.currency}" may not be a valid ISO 4217 code.` });
          }
        }

        // Items check
        if (schema.hasItems) {
          const items = ecom.items as unknown[] | undefined;
          if (!items || !Array.isArray(items) || items.length === 0) {
            messages.push({ type: 'error', message: 'Missing or empty `items` array.' });
          } else {
            messages.push({ type: 'success', message: `Items array has ${items.length} item(s).` });
            for (let idx = 0; idx < items.length; idx++) {
              const item = items[idx] as Record<string, unknown>;
              if (!item.item_id && !item.item_name) {
                messages.push({ type: 'error', message: `Item ${idx + 1}: missing both item_id and item_name. At least one is required.` });
              }
              if (item.price !== undefined && typeof item.price === 'string') {
                messages.push({ type: 'error', message: `Item ${idx + 1}: "price" should be a number, got string "${item.price}".` });
              }
              if (item.quantity !== undefined && typeof item.quantity === 'string') {
                messages.push({ type: 'error', message: `Item ${idx + 1}: "quantity" should be a number, got string "${item.quantity}".` });
              }
            }

            // Duplicate item_id check
            const ids = items.map((it) => (it as Record<string, unknown>).item_id).filter(Boolean);
            const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
            if (dupes.length > 0) {
              messages.push({ type: 'info', message: `Duplicate item_id(s) found: ${[...new Set(dupes)].join(', ')}. This might be intentional.` });
            }
          }
        }
      }

      // Check ecommerce clearing
      if (!code.includes('ecommerce: null') && !code.includes("ecommerce:null")) {
        messages.push({ type: 'warning', message: 'No ecommerce clearing found. Add `dataLayer.push({ ecommerce: null })` before the event push.' });
      }
    } else {
      // Non-ecommerce event — check params at top level
      for (const param of schema.parameters) {
        if (param.required && obj[param.name] === undefined) {
          messages.push({ type: 'error', message: `Missing required field "${param.name}".` });
        }
      }
    }
  } else {
    messages.push({ type: 'info', message: `Event name "${eventName}" is not a GA4 recommended event (custom event).` });
  }

  // PII detection
  const codeStr = JSON.stringify(obj);
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(codeStr)) {
    messages.push({ type: 'warning', message: 'Possible email address detected in event parameters. Avoid sending PII in standard parameters.' });
  }
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(codeStr)) {
    messages.push({ type: 'warning', message: 'Possible phone number detected in event parameters. Avoid sending PII in standard parameters.' });
  }

  return { messages, parsedEvent: eventName, parsedObj: obj };
}

// ── Code Generation ──

function generateDataLayerCode(
  schema: EventSchema | null,
  paramValues: Record<string, string>,
  items: ItemValues[],
  options: { clearEcommerce: boolean; includeUserData: boolean; customEventName?: string }
): string {
  const lines: string[] = [];

  if (options.clearEcommerce && (schema?.isEcommerce ?? false)) {
    lines.push('// Clear previous ecommerce data');
    lines.push('dataLayer.push({ ecommerce: null });\n');
  }

  lines.push('dataLayer.push({');

  const eventName = schema ? schema.name : (options.customEventName || 'custom_event');
  lines.push(`  event: '${eventName}',`);

  if (schema?.isEcommerce) {
    lines.push('  ecommerce: {');

    // Event parameters
    for (const param of schema.parameters) {
      const val = paramValues[param.name];
      if (val !== undefined && val !== '') {
        if (param.type === 'number') {
          lines.push(`    ${param.name}: ${val},`);
        } else {
          lines.push(`    ${param.name}: '${val}',`);
        }
      }
    }

    // Items
    if (schema.hasItems && items.length > 0) {
      lines.push('    items: [');
      for (const item of items) {
        const itemEntries: string[] = [];
        for (const ip of ITEM_PARAMETERS) {
          const v = item[ip.name];
          if (v !== undefined && v !== '') {
            if (ip.type === 'number') {
              itemEntries.push(`        ${ip.name}: ${v}`);
            } else {
              itemEntries.push(`        ${ip.name}: '${v}'`);
            }
          }
        }
        // Include custom item params
        for (const [k, v] of Object.entries(item)) {
          if (v && !ITEM_PARAMETERS.find((p) => p.name === k)) {
            itemEntries.push(`        ${k}: '${v}'`);
          }
        }
        lines.push('      {');
        lines.push(itemEntries.join(',\n'));
        lines.push('      },');
      }
      lines.push('    ]');
    }

    lines.push('  }');
  } else if (schema) {
    // Non-ecommerce: params at top level
    for (const param of schema.parameters) {
      const val = paramValues[param.name];
      if (val !== undefined && val !== '') {
        if (param.type === 'number') {
          lines.push(`  ${param.name}: ${val},`);
        } else {
          lines.push(`  ${param.name}: '${val}',`);
        }
      }
    }
  }

  if (options.includeUserData) {
    lines.push('  user_data: {');
    lines.push("    email: '',        // Hashed or plain — GA4 hashes automatically");
    lines.push("    phone_number: '', // E.164 format");
    lines.push('    address: {');
    lines.push("      first_name: '',");
    lines.push("      last_name: '',");
    lines.push("      street: '',");
    lines.push("      city: '',");
    lines.push("      region: '',");
    lines.push("      postal_code: '',");
    lines.push("      country: ''");
    lines.push('    }');
    lines.push('  }');
  }

  lines.push('});');

  return lines.join('\n');
}

// ── Main Component ──

export default function DataLayerBuilder() {
  const { values, setValue } = useToolState('datalayer-builder', FIELDS);
  const mode = values.mode === 'validate' ? 'validate' : 'build';
  const selectedEvent = values.event || 'purchase';
  const clearEcommerce = values.clearEcommerce !== 'false';
  const includeUserData = values.includeUserData === 'true';
  const generateTypes = values.generateTypes === 'true';

  // Build mode state
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [items, setItems] = useState<ItemValues[]>([{}]);
  const [customEventName, setCustomEventName] = useState('my_custom_event');
  const [customParams, setCustomParams] = useState<{ key: string; value: string; type: 'string' | 'number' }[]>([]);

  // Validate mode state
  const [validateCode, setValidateCode] = useState('');
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);

  const schema = ALL_EVENTS.find((e) => e.name === selectedEvent) || null;
  const isCustom = selectedEvent === '__custom__';

  const generatedCode = useMemo(() => {
    if (isCustom) {
      const lines: string[] = [];
      lines.push('dataLayer.push({');
      lines.push(`  event: '${customEventName}',`);
      for (const p of customParams) {
        if (p.key && p.value) {
          lines.push(`  ${p.key}: ${p.type === 'number' ? p.value : `'${p.value}'`},`);
        }
      }
      lines.push('});');
      return lines.join('\n');
    }
    return generateDataLayerCode(schema, paramValues, items, {
      clearEcommerce,
      includeUserData,
      customEventName,
    });
  }, [schema, paramValues, items, clearEcommerce, includeUserData, isCustom, customEventName, customParams]);

  // Build mode validation
  const buildValidation = useMemo((): ValidationMessage[] => {
    if (mode !== 'build' || !schema) return [];
    const msgs: ValidationMessage[] = [];
    for (const param of schema.parameters) {
      if (param.required && !paramValues[param.name]) {
        msgs.push({ type: 'warning', message: `Required field "${param.displayName}" is empty.` });
      } else if (param.required && paramValues[param.name]) {
        msgs.push({ type: 'success', message: `${param.displayName} is set.` });
      }
    }
    if (schema.isEcommerce && clearEcommerce) {
      msgs.push({ type: 'success', message: 'Ecommerce clearing included.' });
    }
    if (schema.hasItems && items.length > 0 && items[0].item_id) {
      msgs.push({ type: 'success', message: `${items.length} item(s) configured.` });
    } else if (schema.hasItems) {
      msgs.push({ type: 'warning', message: 'No items configured yet.' });
    }
    return msgs;
  }, [schema, paramValues, items, clearEcommerce, mode]);

  const handleValidate = () => {
    const result = validateDataLayerCode(validateCode);
    setValidationMessages(result.messages);
  };

  const setParam = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }));
  };

  const setItemValue = (index: number, key: string, value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, {}]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: 600 as const,
    cursor: 'pointer' as const,
    border: 'none',
    borderBottom: active ? '2px solid #06b6d4' : '2px solid transparent',
    backgroundColor: 'transparent',
    color: active ? '#22d3ee' : '#94a3b8',
    transition: 'color 0.15s, border-color 0.15s',
  });

  const sectionStyle = {
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgb(51 65 85 / 0.7)',
    backgroundColor: 'rgb(30 41 59 / 0.3)',
  };

  return (
    <div
      className="my-6 rounded-lg border overflow-hidden"
      style={{ borderColor: 'rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(15 23 42 / 0.5)' }}
    >
      {/* Tabs */}
      <div
        className="flex"
        style={{ borderBottom: '1px solid rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(30 41 59 / 0.5)' }}
      >
        <button style={tabStyle(mode === 'build')} onClick={() => setValue('mode', 'build')}>Build</button>
        <button style={tabStyle(mode === 'validate')} onClick={() => setValue('mode', 'validate')}>Validate</button>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-6">
        {mode === 'build' ? (
          <>
            {/* Event selector */}
            <SelectField
              label="Event Type"
              value={selectedEvent}
              onChange={(v) => {
                setValue('event', v);
                setParamValues({});
                setItems([{}]);
              }}
              options={EVENT_OPTIONS}
              required
            />

            {/* Custom event name */}
            {isCustom && (
              <div className="flex flex-col gap-4" style={sectionStyle}>
                <TextField
                  label="Custom Event Name"
                  value={customEventName}
                  onChange={setCustomEventName}
                  placeholder="my_custom_event"
                  helpText="Use snake_case, max 40 characters"
                  required
                />
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium" style={{ color: '#e2e8f0' }}>Parameters</span>
                  {customParams.map((p, i) => (
                    <div key={i} className="flex gap-2 items-end">
                      <TextField label="Key" value={p.key} onChange={(v) => {
                        const next = [...customParams];
                        next[i] = { ...next[i], key: v };
                        setCustomParams(next);
                      }} placeholder="param_name" />
                      <TextField label="Value" value={p.value} onChange={(v) => {
                        const next = [...customParams];
                        next[i] = { ...next[i], value: v };
                        setCustomParams(next);
                      }} placeholder="value" />
                      <button
                        onClick={() => setCustomParams((prev) => prev.filter((_, j) => j !== i))}
                        className="px-2 py-2 text-sm rounded border cursor-pointer"
                        style={{ color: '#f87171', borderColor: 'rgb(51 65 85 / 0.7)', backgroundColor: 'transparent' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setCustomParams((prev) => [...prev, { key: '', value: '', type: 'string' }])}
                    className="self-start px-3 py-1.5 text-sm rounded border cursor-pointer"
                    style={{ color: '#06b6d4', borderColor: 'rgb(6 182 212 / 0.3)', backgroundColor: 'transparent' }}
                  >
                    + Add Parameter
                  </button>
                </div>
              </div>
            )}

            {/* Event parameters */}
            {schema && schema.parameters.length > 0 && (
              <div style={sectionStyle}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#67e8f9', margin: '0 0 0.75rem 0' }}>
                  Event Parameters
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schema.parameters.map((param) => (
                    <TextField
                      key={param.name}
                      label={param.displayName}
                      value={paramValues[param.name] || ''}
                      onChange={(v) => setParam(param.name, v)}
                      placeholder={param.placeholder}
                      helpText={param.description}
                      required={param.required}
                      type={param.type === 'number' ? 'number' : 'text'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Items array */}
            {schema?.hasItems && (
              <div style={sectionStyle}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold" style={{ color: '#67e8f9', margin: 0 }}>
                    Items Array
                  </h4>
                  <button
                    onClick={addItem}
                    className="px-3 py-1.5 text-xs font-medium rounded border cursor-pointer"
                    style={{ color: '#06b6d4', borderColor: 'rgb(6 182 212 / 0.3)', backgroundColor: 'transparent' }}
                  >
                    + Add Item
                  </button>
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="mb-4 p-3 rounded border" style={{ borderColor: 'rgb(51 65 85 / 0.5)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Item {idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(idx)}
                          className="text-xs cursor-pointer"
                          style={{ color: '#f87171', background: 'none', border: 'none' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {ITEM_PARAMETERS.filter((p) => p.required || item[p.name]).slice(0, 6).map((param) => (
                        <TextField
                          key={param.name}
                          label={param.displayName}
                          value={item[param.name] || ''}
                          onChange={(v) => setItemValue(idx, param.name, v)}
                          placeholder={param.placeholder}
                          required={param.required}
                          type={param.type === 'number' ? 'number' : 'text'}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Options */}
            <div className="flex flex-col gap-3">
              {schema?.isEcommerce && (
                <CheckboxField
                  label="Include ecommerce clearing (recommended)"
                  checked={clearEcommerce}
                  onChange={(v) => setValue('clearEcommerce', String(v))}
                  helpText="Prepends dataLayer.push({ ecommerce: null })"
                />
              )}
              <CheckboxField
                label="Include user_data for Enhanced Conversions"
                checked={includeUserData}
                onChange={(v) => setValue('includeUserData', String(v))}
                helpText="Adds user_data block with email, phone, address fields"
              />
            </div>

            {/* Generated code */}
            <CodeOutput code={generatedCode} language="javascript" title="Generated Code" />

            {/* Build validation */}
            <ValidationResult messages={buildValidation} />
          </>
        ) : (
          <>
            {/* Validate mode */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
                Paste your dataLayer.push() code:
              </label>
              <textarea
                value={validateCode}
                onChange={(e) => setValidateCode(e.target.value)}
                rows={12}
                className="px-4 py-3 rounded-md border text-sm outline-none"
                style={{
                  backgroundColor: 'rgb(15 23 42 / 0.5)',
                  borderColor: 'rgb(51 65 85 / 0.7)',
                  color: '#e2e8f0',
                  fontFamily: "'JetBrains Mono', monospace",
                  resize: 'vertical',
                }}
                placeholder={`dataLayer.push({\n  event: 'purchase',\n  ecommerce: {\n    transaction_id: 'T12345',\n    value: 59.98,\n    currency: 'USD',\n    items: [...]\n  }\n});`}
                onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
                onBlur={(e) => (e.target.style.borderColor = 'rgb(51 65 85 / 0.7)')}
              />
            </div>
            <button
              onClick={handleValidate}
              className="self-start px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
              style={{
                backgroundColor: '#06b6d4',
                color: '#0f172a',
                border: 'none',
              }}
            >
              Validate
            </button>
            <ValidationResult messages={validationMessages} />
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /Users/jonaswestergren/Projects/taggingdocs
pnpm astro check 2>&1 | tail -20
```

Expected: No errors in DataLayerBuilder.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/tools/DataLayerBuilder.tsx
git commit -m "feat: add DataLayer Builder + Validator tool component"
```

---

## Task 8: BigQuery Query Generator Component

**Files:**
- Create: `src/components/tools/BigQueryGenerator.tsx`

- [ ] **Step 1: Create the BigQueryGenerator component**

```tsx
// src/components/tools/BigQueryGenerator.tsx
import { useMemo } from 'react';
import { useToolState } from './shared/hooks/useToolState';
import { CodeOutput } from './shared/ui/CodeOutput';
import { TextField, SelectField } from './shared/ui/FieldBuilder';
import { BIGQUERY_TEMPLATES, type QueryTemplate } from './shared/schemas/bigquery-templates';

const FIELDS = [
  { name: 'dataset', defaultValue: 'your_project.analytics_XXXXXXXXX' },
  { name: 'tableName', defaultValue: 'events_*' },
  { name: 'startDate', defaultValue: '2024-01-01' },
  { name: 'endDate', defaultValue: '2024-01-31' },
  { name: 'queryType', defaultValue: 'pageviews_by_page' },
];

const QUERY_OPTIONS = BIGQUERY_TEMPLATES.map((t) => ({
  label: t.name,
  value: t.id,
  group: { basic: 'Basic Reports', ecommerce: 'Ecommerce', advanced: 'Advanced', utility: 'Utility' }[t.category],
}));

export default function BigQueryGenerator() {
  const { values, setValue } = useToolState('bigquery-generator', FIELDS);

  const selectedTemplate = BIGQUERY_TEMPLATES.find((t) => t.id === values.queryType) || BIGQUERY_TEMPLATES[0];

  // Query-specific config values
  const { values: configValues, setValue: setConfigValue } = useToolState(
    `bq-config-${selectedTemplate.id}`,
    selectedTemplate.config.map((c) => ({ name: c.name, defaultValue: c.defaultValue || '' }))
  );

  const generatedSQL = useMemo(() => {
    const cfg: Record<string, string> = {
      ...values,
      ...configValues,
    };
    return selectedTemplate.generateSQL(cfg);
  }, [values, configValues, selectedTemplate]);

  const sectionStyle = {
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgb(51 65 85 / 0.7)',
    backgroundColor: 'rgb(30 41 59 / 0.3)',
  };

  return (
    <div
      className="my-6 rounded-lg border overflow-hidden"
      style={{ borderColor: 'rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(15 23 42 / 0.5)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: '1px solid rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(30 41 59 / 0.5)' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#67e8f9' }}>
          GA4 BigQuery Query Generator
        </span>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-6">
        {/* Query type selector */}
        <SelectField
          label="Query Type"
          value={values.queryType}
          onChange={(v) => setValue('queryType', v)}
          options={QUERY_OPTIONS}
          required
        />

        <p className="text-sm m-0" style={{ color: '#94a3b8' }}>{selectedTemplate.description}</p>

        {/* Global config */}
        <div style={sectionStyle}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: '#67e8f9', margin: '0 0 0.75rem 0' }}>
            Configuration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Dataset"
              value={values.dataset}
              onChange={(v) => setValue('dataset', v)}
              placeholder="project_id.analytics_XXXXXXXXX"
              helpText="BigQuery dataset path"
              required
            />
            <TextField
              label="Table Name"
              value={values.tableName}
              onChange={(v) => setValue('tableName', v)}
              placeholder="events_*"
              helpText="Usually events_* or events_intraday_*"
            />
            <TextField
              label="Start Date"
              value={values.startDate}
              onChange={(v) => setValue('startDate', v)}
              type="date"
              required
            />
            <TextField
              label="End Date"
              value={values.endDate}
              onChange={(v) => setValue('endDate', v)}
              type="date"
              required
            />
          </div>
        </div>

        {/* Query-specific config */}
        {selectedTemplate.config.length > 0 && (
          <div style={sectionStyle}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: '#67e8f9', margin: '0 0 0.75rem 0' }}>
              Query Options
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.config.map((field) => {
                if (field.type === 'select' && field.options) {
                  return (
                    <SelectField
                      key={field.name}
                      label={field.label}
                      value={configValues[field.name] || field.defaultValue || ''}
                      onChange={(v) => setConfigValue(field.name, v)}
                      options={field.options}
                      helpText={field.helpText}
                      required={field.required}
                    />
                  );
                }
                return (
                  <TextField
                    key={field.name}
                    label={field.label}
                    value={configValues[field.name] || ''}
                    onChange={(v) => setConfigValue(field.name, v)}
                    placeholder={field.placeholder}
                    helpText={field.helpText}
                    required={field.required}
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Generated SQL */}
        <CodeOutput code={generatedSQL} language="sql" title="Generated SQL" />

        {/* Explanation */}
        <div style={sectionStyle}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: '#67e8f9', margin: '0 0 0.5rem 0' }}>
            Query Explanation
          </h4>
          <p className="text-sm m-0" style={{ color: '#cbd5e1' }}>
            {selectedTemplate.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/BigQueryGenerator.tsx
git commit -m "feat: add BigQuery Query Generator tool component"
```

---

## Task 9: GA4 Regex Tester Component

**Files:**
- Create: `src/components/tools/RegexTester.tsx`

- [ ] **Step 1: Create the RegexTester component**

```tsx
// src/components/tools/RegexTester.tsx
import { useState, useMemo } from 'react';
import { useToolState } from './shared/hooks/useToolState';
import { TextField, CheckboxField } from './shared/ui/FieldBuilder';
import RE2JS from 're2js';

const FIELDS = [
  { name: 'context', defaultValue: 'ga4' },
  { name: 'pattern', defaultValue: '' },
  { name: 'caseInsensitive', defaultValue: 'false' },
  { name: 'fullMatch', defaultValue: 'false' },
];

interface TestString {
  value: string;
  id: number;
}

interface MatchResult {
  matches: boolean;
  fullMatch?: string;
  groups?: string[];
}

// RE2-incompatible patterns
const RE2_UNSUPPORTED = [
  { pattern: /\(\?[=!]/, name: 'Lookahead', suggestion: "RE2 doesn't support lookaheads. Use alternation or restructure the pattern." },
  { pattern: /\(\?<[=!]/, name: 'Lookbehind', suggestion: "RE2 doesn't support lookbehinds. Capture the full match and extract in code." },
  { pattern: /\(\?>/, name: 'Atomic group', suggestion: "RE2 doesn't support atomic groups. Remove the ?> modifier." },
  { pattern: /[+*?]\+/, name: 'Possessive quantifier', suggestion: "RE2 doesn't support possessive quantifiers. Use standard quantifiers." },
  { pattern: /\\[1-9]/, name: 'Backreference', suggestion: "RE2 doesn't support backreferences. Use named groups (?P<name>...) instead." },
];

// Common pattern templates
const TEMPLATES: { label: string; pattern: string; testStrings: string[]; category: string }[] = [
  { label: 'Product pages', category: 'URL Patterns', pattern: '/products/[^/]+$', testStrings: ['https://example.com/products/shoes', 'https://example.com/products/hats', 'https://example.com/about', 'https://example.com/products'] },
  { label: 'Blog posts', category: 'URL Patterns', pattern: '/blog/\\d{4}/\\d{2}/', testStrings: ['https://example.com/blog/2024/03/my-post', 'https://example.com/blog/latest', 'https://example.com/blog/2024/12/'] },
  { label: 'Checkout steps', category: 'URL Patterns', pattern: '/checkout/(shipping|payment|review)', testStrings: ['https://shop.com/checkout/shipping', 'https://shop.com/checkout/payment', 'https://shop.com/checkout/review', 'https://shop.com/cart'] },
  { label: 'Language paths', category: 'URL Patterns', pattern: '^/(en|sv|de|fr)/', testStrings: ['/en/products', '/sv/om-oss', '/de/kontakt', '/products'] },
  { label: 'UTM source', category: 'Parameters', pattern: 'utm_source=([^&]+)', testStrings: ['https://example.com?utm_source=google&utm_medium=cpc', 'https://example.com?ref=twitter', 'https://example.com?utm_source=newsletter'] },
  { label: 'File downloads', category: 'Parameters', pattern: '\\.(pdf|xlsx?|docx?|zip)$', testStrings: ['report.pdf', 'data.xlsx', 'document.docx', 'image.png', 'archive.zip'] },
  { label: 'GA4 event names', category: 'GA4 Specific', pattern: '^[a-z][a-z0-9_]{0,39}$', testStrings: ['purchase', 'add_to_cart', 'my_custom_event', 'InvalidEvent', 'a'.repeat(41)] },
  { label: 'Measurement ID', category: 'GA4 Specific', pattern: '^G-[A-Z0-9]{10}$', testStrings: ['G-ABC1234567', 'G-123', 'UA-12345-1', 'G-ABCDEFGHIJ'] },
];

function testPattern(pattern: string, testValue: string, caseInsensitive: boolean, fullMatch: boolean): { result: MatchResult; error?: string } {
  try {
    let flags = '';
    if (caseInsensitive) flags += 'i';

    let effectivePattern = pattern;
    if (fullMatch && !pattern.startsWith('^')) {
      effectivePattern = '^(?:' + pattern + ')$';
    }

    const re2 = RE2JS.compile(effectivePattern, caseInsensitive ? RE2JS.CASE_INSENSITIVE : 0);
    const matcher = re2.matcher(testValue);
    const matches = fullMatch ? matcher.matches() : matcher.find();

    if (matches) {
      const groups: string[] = [];
      for (let i = 1; i <= matcher.groupCount(); i++) {
        const g = matcher.group(i);
        if (g !== null) groups.push(g);
      }
      return {
        result: {
          matches: true,
          fullMatch: matcher.group(0) || undefined,
          groups: groups.length > 0 ? groups : undefined,
        },
      };
    }

    return { result: { matches: false } };
  } catch (e) {
    return { result: { matches: false }, error: String(e) };
  }
}

function checkRE2Compatibility(pattern: string): { valid: boolean; issues: { name: string; suggestion: string }[] } {
  const issues: { name: string; suggestion: string }[] = [];
  for (const check of RE2_UNSUPPORTED) {
    if (check.pattern.test(pattern)) {
      issues.push({ name: check.name, suggestion: check.suggestion });
    }
  }
  return { valid: issues.length === 0, issues };
}

export default function RegexTester() {
  const { values, setValue } = useToolState('regex-tester', FIELDS);
  const context = values.context === 'gtm' ? 'gtm' : 'ga4';
  const pattern = values.pattern || '';
  const caseInsensitive = values.caseInsensitive === 'true';
  const fullMatch = values.fullMatch === 'true' || context === 'gtm';

  const [testStrings, setTestStrings] = useState<TestString[]>([
    { value: '', id: 1 },
  ]);
  const [nextId, setNextId] = useState(2);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);

  const re2Check = useMemo(() => checkRE2Compatibility(pattern), [pattern]);

  const results = useMemo(() => {
    if (!pattern) return testStrings.map(() => null);
    return testStrings.map((ts) => {
      if (!ts.value) return null;
      return testPattern(pattern, ts.value, caseInsensitive, fullMatch);
    });
  }, [pattern, testStrings, caseInsensitive, fullMatch]);

  const addTestString = () => {
    setTestStrings((prev) => [...prev, { value: '', id: nextId }]);
    setNextId((n) => n + 1);
  };

  const removeTestString = (id: number) => {
    setTestStrings((prev) => prev.filter((ts) => ts.id !== id));
  };

  const loadTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setValue('pattern', tmpl.pattern);
    const newStrings = tmpl.testStrings.map((s, i) => ({ value: s, id: nextId + i }));
    setTestStrings(newStrings);
    setNextId(nextId + tmpl.testStrings.length);
  };

  const sectionStyle = {
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgb(51 65 85 / 0.7)',
    backgroundColor: 'rgb(30 41 59 / 0.3)',
  };

  const radioStyle = (active: boolean) => ({
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 500 as const,
    cursor: 'pointer' as const,
    border: '1px solid',
    borderColor: active ? '#06b6d4' : 'rgb(51 65 85 / 0.7)',
    backgroundColor: active ? 'rgb(8 51 68 / 0.3)' : 'transparent',
    color: active ? '#22d3ee' : '#94a3b8',
    borderRadius: '0.375rem',
  });

  return (
    <div
      className="my-6 rounded-lg border overflow-hidden"
      style={{ borderColor: 'rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(15 23 42 / 0.5)' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: '1px solid rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(30 41 59 / 0.5)' }}
      >
        <span className="text-sm font-semibold" style={{ color: '#67e8f9' }}>
          GA4 & GTM Regex Tester
        </span>
      </div>

      <div className="p-4 md:p-6 flex flex-col gap-6">
        {/* Context toggle */}
        <div className="flex gap-2">
          <button style={radioStyle(context === 'ga4')} onClick={() => setValue('context', 'ga4')}>
            GA4 Reports / Audiences
          </button>
          <button style={radioStyle(context === 'gtm')} onClick={() => setValue('context', 'gtm')}>
            GTM Triggers
          </button>
        </div>

        {context === 'gtm' && (
          <div className="px-3 py-2 rounded text-xs" style={{ backgroundColor: 'rgb(8 51 68 / 0.3)', color: '#67e8f9', border: '1px solid rgb(6 182 212 / 0.2)' }}>
            GTM "matches RegEx" uses full match (implicit ^...$). The effective pattern is: <code>^(?:{pattern || '...'}){`$`}</code>
          </div>
        )}

        {/* Pattern input */}
        <div style={sectionStyle}>
          <TextField
            label="Regex Pattern"
            value={pattern}
            onChange={(v) => setValue('pattern', v)}
            placeholder="/products/[^/]+$"
            required
          />

          <div className="flex gap-4 mt-3">
            <CheckboxField
              label="Case insensitive"
              checked={caseInsensitive}
              onChange={(v) => setValue('caseInsensitive', String(v))}
            />
            {context === 'ga4' && (
              <CheckboxField
                label="Full match"
                checked={fullMatch}
                onChange={(v) => setValue('fullMatch', String(v))}
              />
            )}
          </div>

          {/* RE2 compatibility */}
          {pattern && (
            <div className="mt-3">
              {re2Check.valid ? (
                <div className="text-sm" style={{ color: '#86efac' }}>
                  Valid RE2 pattern
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {re2Check.issues.map((issue, i) => (
                    <div key={i} className="text-sm" style={{ color: '#fca5a5' }}>
                      RE2 incompatible: {issue.name} — {issue.suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Test strings */}
        <div style={sectionStyle}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#67e8f9' }}>Test Strings</span>
            <button
              onClick={addTestString}
              className="px-3 py-1 text-xs font-medium rounded border cursor-pointer"
              style={{ color: '#06b6d4', borderColor: 'rgb(6 182 212 / 0.3)', backgroundColor: 'transparent' }}
            >
              + Add
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {testStrings.map((ts, idx) => {
              const r = results[idx];
              const isMatch = r?.result.matches;
              return (
                <div key={ts.id} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ts.value}
                    onChange={(e) => {
                      setTestStrings((prev) => prev.map((s) => s.id === ts.id ? { ...s, value: e.target.value } : s));
                    }}
                    onFocus={() => setSelectedTest(ts.id)}
                    className="flex-1 px-3 py-2 rounded-md border text-sm outline-none"
                    style={{
                      backgroundColor: 'rgb(15 23 42 / 0.5)',
                      borderColor: isMatch === true ? 'rgb(34 197 94 / 0.5)' : isMatch === false && ts.value ? 'rgb(239 68 68 / 0.3)' : 'rgb(51 65 85 / 0.7)',
                      color: '#e2e8f0',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                    placeholder="Enter test string..."
                  />
                  <span className="text-sm w-16 text-center" style={{ color: isMatch ? '#86efac' : ts.value ? '#fca5a5' : '#64748b' }}>
                    {ts.value ? (isMatch ? 'Match' : 'No') : ''}
                  </span>
                  {testStrings.length > 1 && (
                    <button
                      onClick={() => removeTestString(ts.id)}
                      className="text-xs cursor-pointer px-1"
                      style={{ color: '#64748b', background: 'none', border: 'none' }}
                    >
                      x
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Match details */}
        {selectedTest && (() => {
          const idx = testStrings.findIndex((ts) => ts.id === selectedTest);
          const r = results[idx];
          if (!r?.result.matches) return null;
          return (
            <div style={sectionStyle}>
              <span className="text-sm font-semibold" style={{ color: '#67e8f9' }}>Match Details</span>
              <div className="mt-2 text-sm" style={{ color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>
                <div>Full match: <span style={{ color: '#86efac' }}>"{r.result.fullMatch}"</span></div>
                {r.result.groups?.map((g, i) => (
                  <div key={i}>Group {i + 1}: <span style={{ color: '#f1fa8c' }}>"{g}"</span></div>
                ))}
                {!r.result.groups && <div style={{ color: '#64748b' }}>No capture groups</div>}
              </div>
            </div>
          );
        })()}

        {/* Common patterns */}
        <div style={sectionStyle}>
          <span className="text-sm font-semibold" style={{ color: '#67e8f9' }}>Common Patterns</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                onClick={() => loadTemplate(tmpl)}
                className="px-3 py-1.5 text-xs rounded-md border cursor-pointer transition-colors"
                style={{
                  color: '#94a3b8',
                  borderColor: 'rgb(51 65 85 / 0.7)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgb(6 182 212 / 0.5)'; e.currentTarget.style.color = '#e2e8f0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgb(51 65 85 / 0.7)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tools/RegexTester.tsx
git commit -m "feat: add GA4 & GTM Regex Tester tool component"
```

---

## Task 10: MDX Tool Pages

**Files:**
- Create: `src/content/docs/tools/index.mdx`
- Create: `src/content/docs/tools/datalayer-builder.mdx`
- Create: `src/content/docs/tools/bigquery-generator.mdx`
- Create: `src/content/docs/tools/regex-tester.mdx`

- [ ] **Step 1: Create tools landing page**

```mdx
---
title: Free GTM & GA4 Tools
description: Interactive tools for Google Tag Manager and GA4 practitioners. Build dataLayer code, generate BigQuery SQL, test regex patterns — all free, all client-side.
template: splash
hero:
  title: Free GTM & GA4 Tools
  tagline: Interactive tools that run entirely in your browser. No signup, no backend, no tracking.
---

import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="DataLayer Builder + Validator" icon="document">
    Build correct `dataLayer.push()` code for any GA4 event, or validate existing code. Catches type errors, missing fields, and PII.

    [Open tool →](/tools/datalayer-builder)
  </Card>

  <Card title="BigQuery Query Generator" icon="laptop">
    Generate ready-to-use SQL queries for GA4 BigQuery export data. 15+ templates for traffic, ecommerce, funnels, and more.

    [Open tool →](/tools/bigquery-generator)
  </Card>

  <Card title="GA4 & GTM Regex Tester" icon="magnifier">
    Test regex patterns against RE2 (GA4's engine) and GTM matching rules. Includes common pattern templates.

    [Open tool →](/tools/regex-tester)
  </Card>
</CardGrid>
```

- [ ] **Step 2: Create DataLayer Builder page**

```mdx
---
title: DataLayer Builder + Validator
description: Build correct dataLayer.push() code for GA4 ecommerce events. Validates required fields, data types, and structure. Free, no signup.
---

import DataLayerBuilder from '../../../components/tools/DataLayerBuilder.tsx';

Build correct `dataLayer.push()` code for any GA4 event, or paste existing code to validate it.

**Build mode**: Select an event type, fill in the fields, and get ready-to-use code with live validation.

**Validate mode**: Paste existing `dataLayer.push()` code and get instant feedback on errors, warnings, and suggestions.

<DataLayerBuilder client:load />
```

- [ ] **Step 3: Create BigQuery Generator page**

```mdx
---
title: BigQuery Query Generator
description: Generate ready-to-use SQL queries for GA4 BigQuery export data. Templates for traffic, ecommerce, funnels, and more. Free, no signup.
---

import BigQueryGenerator from '../../../components/tools/BigQueryGenerator.tsx';

Generate ready-to-use SQL queries for your GA4 BigQuery export data. Select a query type, configure your dataset and date range, and get copy-paste-ready SQL.

All queries use `_TABLE_SUFFIX` filtering for cost optimization and follow BigQuery best practices for GA4 data.

<BigQueryGenerator client:load />
```

- [ ] **Step 4: Create Regex Tester page**

```mdx
---
title: GA4 & GTM Regex Tester
description: Test regex patterns against RE2 (GA4's regex engine) and GTM matching rules. Validates RE2 compatibility and includes common pattern templates.
---

import RegexTester from '../../../components/tools/RegexTester.tsx';

Test and build regex patterns for GA4 and GTM. GA4 uses **RE2 syntax** (not PCRE), which means no lookaheads, lookbehinds, or backreferences. This tool validates against the correct engine so your patterns work in production.

**GA4 mode**: Validates against RE2, partial match by default (like GA4 report filters).

**GTM mode**: Applies full match behavior (GTM wraps in `^...$` for "matches RegEx").

<RegexTester client:load />
```

- [ ] **Step 5: Commit**

```bash
git add src/content/docs/tools/
git commit -m "feat: add MDX pages for all 3 tool pages + landing page"
```

---

## Task 11: Sidebar Integration

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Add Tools section to sidebar**

In `astro.config.mjs`, add a new sidebar entry before the existing "Foundations" entry:

```javascript
// Add this as the FIRST item in the sidebar array, before 'Foundations'
{
  label: 'Tools',
  items: [
    { label: 'All Tools', link: '/tools/' },
    { label: 'DataLayer Builder', link: '/tools/datalayer-builder/' },
    { label: 'BigQuery Generator', link: '/tools/bigquery-generator/' },
    { label: 'Regex Tester', link: '/tools/regex-tester/' },
  ],
},
```

- [ ] **Step 2: Verify the site builds**

```bash
cd /Users/jonaswestergren/Projects/taggingdocs
pnpm build 2>&1 | tail -20
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat: add Tools section to sidebar navigation"
```

---

## Task 12: Build Verification and Smoke Test

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

```bash
cd /Users/jonaswestergren/Projects/taggingdocs
pnpm build 2>&1
```

Expected: Build succeeds. All tool pages are generated in `dist/tools/`.

- [ ] **Step 2: Verify tool pages exist in build output**

```bash
ls -la dist/tools/
ls -la dist/tools/datalayer-builder/
ls -la dist/tools/bigquery-generator/
ls -la dist/tools/regex-tester/
```

Expected: Each directory contains an `index.html` file.

- [ ] **Step 3: Run type check**

```bash
pnpm astro check
```

Expected: No type errors.

- [ ] **Step 4: Start dev server and verify pages load**

```bash
pnpm dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/tools/ && echo ""
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/tools/datalayer-builder/ && echo ""
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/tools/bigquery-generator/ && echo ""
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/tools/regex-tester/ && echo ""
kill %1
```

Expected: All return 200.
