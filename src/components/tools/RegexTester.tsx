import { useState, useCallback, useMemo } from 'react';
import { RE2JS } from 're2js';
import { useToolState } from './shared/hooks/useToolState';

// ── Types ────────────────────────────────────────────────────────────────────

type Context = 'ga4' | 'gtm';

interface TestString {
  id: number;
  value: string;
}

interface MatchResult {
  matched: boolean;
  fullMatch: string | null;
  groups: (string | null)[];
}

interface Re2Validation {
  valid: boolean;
  error: string | null;
  suggestion: string | null;
}

// ── PCRE-only feature detection ──────────────────────────────────────────────

const PCRE_CHECKS: { pattern: RegExp; label: string; suggestion: string }[] = [
  {
    pattern: /\(\?=/,
    label: 'positive lookahead (?=...)',
    suggestion: 'RE2 does not support lookaheads. Restructure the pattern to match without lookahead.',
  },
  {
    pattern: /\(\?!/,
    label: 'negative lookahead (?!...)',
    suggestion: 'RE2 does not support lookaheads. Use a different approach to exclude matches.',
  },
  {
    pattern: /\(\?<=/,
    label: 'positive lookbehind (?<=...)',
    suggestion: 'RE2 does not support lookbehinds. Capture the preceding context as a group instead.',
  },
  {
    pattern: /\(\?<!/,
    label: 'negative lookbehind (?<!...)',
    suggestion: 'RE2 does not support lookbehinds. Refactor to avoid requiring a preceding-context check.',
  },
  {
    pattern: /\(\?>/,
    label: 'atomic group (?>...)',
    suggestion: 'RE2 does not support atomic groups. Remove the atomic group wrapper — RE2 is linear by default.',
  },
  {
    pattern: /\\[1-9]/,
    label: 'backreference (\\1–\\9)',
    suggestion: 'RE2 does not support backreferences. Duplicate the sub-pattern or restructure the match.',
  },
  {
    pattern: /[+*?]\+/,
    label: 'possessive quantifier (++ *+ ?+)',
    suggestion: 'RE2 does not support possessive quantifiers. Use plain quantifiers — RE2 is already linear.',
  },
];

function checkPcreFeatures(pattern: string): { found: boolean; label: string; suggestion: string } | null {
  for (const check of PCRE_CHECKS) {
    if (check.pattern.test(pattern)) {
      return { found: true, label: check.label, suggestion: check.suggestion };
    }
  }
  return null;
}

function validateRe2(pattern: string, caseInsensitive: boolean): Re2Validation {
  if (!pattern) return { valid: true, error: null, suggestion: null };

  // Layer 1: PCRE feature scan
  const pcreIssue = checkPcreFeatures(pattern);
  if (pcreIssue) {
    return {
      valid: false,
      error: `PCRE-only feature detected: ${pcreIssue.label}`,
      suggestion: pcreIssue.suggestion,
    };
  }

  // Layer 2: Compile check
  try {
    const flags = caseInsensitive ? RE2JS.CASE_INSENSITIVE : 0;
    RE2JS.compile(pattern, flags);
    return { valid: true, error: null, suggestion: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      error: `Invalid RE2 pattern: ${msg}`,
      suggestion: 'Check the RE2 syntax reference at https://github.com/google/re2/wiki/Syntax',
    };
  }
}

function testString(
  pattern: string,
  input: string,
  caseInsensitive: boolean,
  fullMatch: boolean,
  context: Context
): MatchResult {
  try {
    const flags = caseInsensitive ? RE2JS.CASE_INSENSITIVE : 0;
    const compiled = RE2JS.compile(pattern, flags);
    const matcher = compiled.matcher(input);

    const useFullMatch = fullMatch || context === 'gtm';
    const didMatch = useFullMatch ? matcher.matches() : matcher.find();

    if (!didMatch) {
      return { matched: false, fullMatch: null, groups: [] };
    }

    const full = matcher.group(0);
    const groupCount = compiled.groupCount();
    const groups: (string | null)[] = [];
    for (let i = 1; i <= groupCount; i++) {
      groups.push(matcher.group(i));
    }

    return { matched: true, fullMatch: full, groups };
  } catch {
    return { matched: false, fullMatch: null, groups: [] };
  }
}

// ── Common pattern templates ──────────────────────────────────────────────────

interface Template {
  label: string;
  pattern: string;
  testStrings: string[];
}

const TEMPLATES: Template[] = [
  {
    label: 'Product pages',
    pattern: '/products/[^/]+$',
    testStrings: [
      '/products/blue-sneakers',
      '/products/t-shirt-xl',
      '/collections/shoes',
      '/products/',
    ],
  },
  {
    label: 'Blog posts',
    pattern: '/blog/\\d{4}/\\d{2}/',
    testStrings: [
      '/blog/2024/03/my-post',
      '/blog/2023/11/another-article',
      '/blog/latest-news',
      '/news/2024/03/article',
    ],
  },
  {
    label: 'Checkout steps',
    pattern: '/checkout/(shipping|payment|review)',
    testStrings: [
      '/checkout/shipping',
      '/checkout/payment',
      '/checkout/review',
      '/checkout/cart',
    ],
  },
  {
    label: 'Language paths',
    pattern: '^/(en|sv|de|fr)/',
    testStrings: [
      '/en/products',
      '/sv/om-oss',
      '/de/kontakt',
      '/products/sneakers',
    ],
  },
  {
    label: 'UTM source',
    pattern: 'utm_source=([^&]+)',
    testStrings: [
      'https://example.com/?utm_source=google&utm_medium=cpc',
      'https://example.com/?utm_source=newsletter',
      'https://example.com/?ref=homepage',
      'https://example.com/no-params',
    ],
  },
  {
    label: 'File downloads',
    pattern: '\\.(pdf|xlsx?|docx?|zip)$',
    testStrings: [
      '/assets/report.pdf',
      '/downloads/data.xlsx',
      '/files/contract.docx',
      '/images/banner.jpg',
    ],
  },
  {
    label: 'GA4 event names',
    pattern: '^[a-z][a-z0-9_]{0,39}$',
    testStrings: [
      'purchase',
      'view_item',
      'add_to_cart',
      'Add_To_Cart',
      '1invalid_name',
    ],
  },
  {
    label: 'Measurement ID',
    pattern: '^G-[A-Z0-9]{10}$',
    testStrings: [
      'G-ABCD123456',
      'G-1234567890',
      'G-abcd123456',
      'UA-12345678-1',
    ],
  },
];

// ── Tool State Configuration ──────────────────────────────────────────────────

const TOOL_FIELDS = [
  { name: 'context', defaultValue: 'ga4' },
  { name: 'pattern', defaultValue: '' },
  { name: 'case_insensitive', defaultValue: 'false' },
  { name: 'full_match', defaultValue: 'false' },
  { name: 'test_strings_json', defaultValue: JSON.stringify([{ id: 1, value: '' }]) },
];

// ── ID counter ────────────────────────────────────────────────────────────────

let nextId = 1;
function makeId() {
  return nextId++;
}

// ── Regex Reference Guide ────────────────────────────────────────────────────

const SYNTAX_ROWS: { syntax: string; meaning: string; example: string }[] = [
  { syntax: '.', meaning: 'Any character (except newline)', example: 'a.c matches "abc", "a1c"' },
  { syntax: '*', meaning: 'Zero or more of previous', example: 'ab*c matches "ac", "abc", "abbc"' },
  { syntax: '+', meaning: 'One or more of previous', example: 'ab+c matches "abc", "abbc" but not "ac"' },
  { syntax: '?', meaning: 'Zero or one of previous', example: 'colou?r matches "color", "colour"' },
  { syntax: '{n}', meaning: 'Exactly n of previous', example: '\\d{3} matches "123" but not "12"' },
  { syntax: '{n,m}', meaning: 'Between n and m of previous', example: '\\d{2,4} matches "12", "123", "1234"' },
  { syntax: '^', meaning: 'Start of string', example: '^hello matches "hello world"' },
  { syntax: '$', meaning: 'End of string', example: 'world$ matches "hello world"' },
  { syntax: '[abc]', meaning: 'Any character in the set', example: '[aeiou] matches any vowel' },
  { syntax: '[^abc]', meaning: 'Any character NOT in the set', example: '[^0-9] matches non-digits' },
  { syntax: '[a-z]', meaning: 'Character range', example: '[A-Za-z] matches any letter' },
  { syntax: '(a|b)', meaning: 'Alternation (a or b)', example: '(cat|dog) matches "cat" or "dog"' },
  { syntax: '(...)', meaning: 'Capture group', example: '(\\d+) captures digits' },
  { syntax: '(?:...)', meaning: 'Non-capturing group', example: '(?:www\\.)? optionally matches "www."' },
  { syntax: '\\d', meaning: 'Digit [0-9]', example: '\\d+ matches "123"' },
  { syntax: '\\w', meaning: 'Word char [a-zA-Z0-9_]', example: '\\w+ matches "hello_123"' },
  { syntax: '\\s', meaning: 'Whitespace', example: '\\s+ matches spaces, tabs' },
  { syntax: '\\b', meaning: 'Word boundary', example: '\\bcat\\b matches "cat" not "catch"' },
  { syntax: '\\.', meaning: 'Escaped special character', example: '\\. matches a literal dot' },
];

const RE2_COMPAT_ROWS: { feature: string; pcre: boolean; re2: boolean; alternative: string }[] = [
  { feature: 'Lookahead (?=...)', pcre: true, re2: false, alternative: 'Restructure pattern or use alternation' },
  { feature: 'Lookbehind (?<=...)', pcre: true, re2: false, alternative: 'Capture full match and extract in code' },
  { feature: 'Backreference \\1', pcre: true, re2: false, alternative: 'Use named groups (?P<name>...)' },
  { feature: 'Atomic group (?>...)', pcre: true, re2: false, alternative: 'Remove the ?> modifier' },
  { feature: 'Possessive a++', pcre: true, re2: false, alternative: 'Use standard quantifiers a+' },
  { feature: 'Named groups (?P<n>)', pcre: true, re2: true, alternative: '—' },
  { feature: 'Non-greedy *? +?', pcre: true, re2: true, alternative: '—' },
  { feature: 'Character classes \\d \\w', pcre: true, re2: true, alternative: '—' },
  { feature: 'Alternation a|b', pcre: true, re2: true, alternative: '—' },
  { feature: 'Anchors ^ $', pcre: true, re2: true, alternative: '—' },
  { feature: 'Word boundary \\b', pcre: true, re2: true, alternative: '—' },
  { feature: 'Flags (?i) (?m) (?s)', pcre: true, re2: true, alternative: '—' },
  { feature: 'Unicode \\p{L}', pcre: true, re2: true, alternative: '—' },
];

function RegexReference() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'syntax' | 'compat'>('syntax');

  const cellStyle: React.CSSProperties = {
    padding: '0.375rem 0.5rem',
    fontSize: '0.75rem',
    borderBottom: '1px solid rgb(51 65 85 / 0.4)',
    verticalAlign: 'top',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 600,
    color: '#94a3b8',
    borderBottom: '1px solid rgb(51 65 85 / 0.7)',
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-medium cursor-pointer"
        style={{ color: '#67e8f9', background: 'none', border: 'none', padding: 0 }}
      >
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          &#9654;
        </span>
        Regex Reference Guide
      </button>

      {open && (
        <div
          className="mt-3 rounded-md border overflow-hidden"
          style={{ borderColor: 'rgb(51 65 85 / 0.7)', backgroundColor: 'rgb(15 23 42 / 0.3)' }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid rgb(51 65 85 / 0.7)' }}>
            <button
              type="button"
              onClick={() => setTab('syntax')}
              className="flex-1 px-3 py-2 text-xs font-medium cursor-pointer"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: tab === 'syntax' ? '2px solid #06b6d4' : '2px solid transparent',
                color: tab === 'syntax' ? '#22d3ee' : '#64748b',
              }}
            >
              Syntax Cheat Sheet
            </button>
            <button
              type="button"
              onClick={() => setTab('compat')}
              className="flex-1 px-3 py-2 text-xs font-medium cursor-pointer"
              style={{
                background: 'none',
                border: 'none',
                borderBottom: tab === 'compat' ? '2px solid #06b6d4' : '2px solid transparent',
                color: tab === 'compat' ? '#22d3ee' : '#64748b',
              }}
            >
              RE2 vs PCRE Compatibility
            </button>
          </div>

          <div className="overflow-x-auto">
            {tab === 'syntax' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...headerCellStyle, width: '15%', textAlign: 'left' }}>Syntax</th>
                    <th style={{ ...headerCellStyle, width: '35%', textAlign: 'left' }}>Meaning</th>
                    <th style={{ ...headerCellStyle, textAlign: 'left' }}>Example</th>
                  </tr>
                </thead>
                <tbody>
                  {SYNTAX_ROWS.map((row) => (
                    <tr key={row.syntax}>
                      <td style={{ ...cellStyle, fontFamily: "'JetBrains Mono', monospace", color: '#f1fa8c', fontWeight: 600 }}>{row.syntax}</td>
                      <td style={{ ...cellStyle, color: '#e2e8f0' }}>{row.meaning}</td>
                      <td style={{ ...cellStyle, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem' }}>{row.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...headerCellStyle, textAlign: 'left' }}>Feature</th>
                    <th style={{ ...headerCellStyle, width: '60px', textAlign: 'center' }}>PCRE</th>
                    <th style={{ ...headerCellStyle, width: '60px', textAlign: 'center' }}>RE2</th>
                    <th style={{ ...headerCellStyle, textAlign: 'left' }}>RE2 Alternative</th>
                  </tr>
                </thead>
                <tbody>
                  {RE2_COMPAT_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td style={{ ...cellStyle, color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6875rem' }}>{row.feature}</td>
                      <td style={{ ...cellStyle, textAlign: 'center', color: '#4ade80' }}>&#10003;</td>
                      <td style={{ ...cellStyle, textAlign: 'center', color: row.re2 ? '#4ade80' : '#f87171' }}>{row.re2 ? '\u2713' : '\u2717'}</td>
                      <td style={{ ...cellStyle, color: '#94a3b8' }}>{row.alternative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegexTester() {
  const { values, setValue } = useToolState('regex-tester', TOOL_FIELDS);
  const [focusedId, setFocusedId] = useState<number | null>(null);

  // Derive state from stored values
  const context = values.context as Context;
  const pattern = values.pattern;
  const caseInsensitive = values.case_insensitive === 'true';
  const fullMatch = values.full_match === 'true';

  // Parse test strings from JSON
  const testStrings: TestString[] = useMemo(() => {
    try {
      const parsed = JSON.parse(values.test_strings_json);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ id: 1, value: '' }];
    } catch {
      return [{ id: 1, value: '' }];
    }
  }, [values.test_strings_json]);

  // Advance nextId past any restored IDs to avoid collisions
  useMemo(() => {
    const maxRestoredId = testStrings.reduce((max, ts) => Math.max(max, ts.id), 0);
    if (maxRestoredId >= nextId) {
      nextId = maxRestoredId + 1;
    }
  }, [testStrings]);

  const re2Validation = useMemo(
    () => validateRe2(pattern, caseInsensitive),
    [pattern, caseInsensitive]
  );

  const matchResults = useMemo<Map<number, MatchResult>>(() => {
    const map = new Map<number, MatchResult>();
    if (!pattern || !re2Validation.valid) return map;
    for (const ts of testStrings) {
      if (ts.value === '') continue;
      map.set(ts.id, testString(pattern, ts.value, caseInsensitive, fullMatch, context));
    }
    return map;
  }, [pattern, testStrings, caseInsensitive, fullMatch, context, re2Validation.valid]);

  const addTestString = useCallback(() => {
    const newTestStrings = [...testStrings, { id: makeId(), value: '' }];
    setValue('test_strings_json', JSON.stringify(newTestStrings));
  }, [testStrings, setValue]);

  const removeTestString = useCallback((id: number) => {
    if (testStrings.length === 1) return;
    const newTestStrings = testStrings.filter((ts) => ts.id !== id);
    setValue('test_strings_json', JSON.stringify(newTestStrings));
  }, [testStrings, setValue]);

  const updateTestString = useCallback((id: number, value: string) => {
    const newTestStrings = testStrings.map((ts) => (ts.id === id ? { ...ts, value } : ts));
    setValue('test_strings_json', JSON.stringify(newTestStrings));
  }, [testStrings, setValue]);

  const applyTemplate = useCallback((template: Template) => {
    setValue('pattern', template.pattern);
    const newTestStrings = template.testStrings.map((s) => ({ id: makeId(), value: s }));
    setValue('test_strings_json', JSON.stringify(newTestStrings));
    setFocusedId(null);
  }, [setValue]);

  const isGtm = context === 'gtm';
  const effectiveFullMatch = fullMatch || isGtm;

  const focusedResult = focusedId !== null ? matchResults.get(focusedId) : null;
  const focusedString = focusedId !== null ? testStrings.find((ts) => ts.id === focusedId) : null;

  return (
    <div
      className="my-6 rounded-lg border overflow-hidden not-content"
      style={{
        borderColor: 'rgb(51 65 85 / 0.7)',
        backgroundColor: 'rgb(15 23 42 / 0.5)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ borderColor: 'rgb(51 65 85 / 0.7)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#67e8f9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span className="text-sm font-semibold" style={{ color: '#67e8f9' }}>
          GA4 &amp; GTM Regex Tester
        </span>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Context toggle */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            Context
          </span>
          <div className="flex gap-2">
            {(
              [
                { value: 'ga4', label: 'GA4 Reports / Audiences' },
                { value: 'gtm', label: 'GTM Triggers' },
              ] as { value: Context; label: string }[]
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('context', value)}
                className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors border"
                style={
                  context === value
                    ? {
                        borderColor: '#06b6d4',
                        backgroundColor: 'rgb(6 182 212 / 0.1)',
                        color: '#22d3ee',
                      }
                    : {
                        borderColor: 'rgb(51 65 85 / 0.7)',
                        backgroundColor: 'transparent',
                        color: '#94a3b8',
                      }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* GTM info box */}
        {isGtm && (
          <div
            className="rounded-md px-3 py-2 text-xs border"
            style={{
              borderColor: 'rgb(103 232 249 / 0.3)',
              backgroundColor: 'rgb(103 232 249 / 0.05)',
              color: '#a5f3fc',
            }}
          >
            <strong>GTM Trigger mode:</strong> Patterns are tested as full-string matches — the
            entire input must match the pattern. This mirrors how GTM evaluates regex triggers. You
            don't need to add <code>^</code> or <code>$</code> anchors; they are implied.
          </div>
        )}

        {/* Pattern input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#e2e8f0' }}>
            Pattern
          </label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setValue('pattern', e.target.value)}
            placeholder="Enter a regex pattern…"
            className="px-3 py-2 rounded-md border text-sm font-mono outline-none transition-colors"
            style={{
              backgroundColor: 'rgb(15 23 42 / 0.5)',
              borderColor: 'rgb(51 65 85 / 0.7)',
              color: '#e2e8f0',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#06b6d4')}
            onBlur={(e) => (e.target.style.borderColor = 'rgb(51 65 85 / 0.7)')}
            spellCheck={false}
          />

          {/* RE2 validity badge — only show when there's an actual problem */}
          {pattern && !re2Validation.valid && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#f87171' }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: '#f87171' }}
                >
                  {re2Validation.error}
                </span>
              </div>
              {re2Validation.suggestion && (
                <p className="text-xs pl-3.5" style={{ color: '#94a3b8' }}>
                  {re2Validation.suggestion}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={caseInsensitive}
              onChange={(e) => setValue('case_insensitive', String(e.target.checked))}
              className="accent-cyan-500"
            />
            <span className="text-sm" style={{ color: '#e2e8f0' }}>
              Case insensitive
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveFullMatch}
              disabled={isGtm}
              onChange={(e) => !isGtm && setValue('full_match', String(e.target.checked))}
              className="accent-cyan-500"
              style={{ cursor: isGtm ? 'not-allowed' : 'pointer' }}
            />
            <span
              className="text-sm"
              style={{ color: isGtm ? '#64748b' : '#e2e8f0' }}
              title={isGtm ? 'Full match is always enabled in GTM mode' : undefined}
            >
              Full match{isGtm ? ' (auto-enabled in GTM mode)' : ''}
            </span>
          </label>
        </div>

        {/* Template buttons */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            Common patterns
          </span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => applyTemplate(t)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border transition-colors"
                style={{
                  borderColor: 'rgb(51 65 85 / 0.7)',
                  backgroundColor: 'rgb(30 41 59 / 0.5)',
                  color: '#94a3b8',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#67e8f9';
                  (e.currentTarget as HTMLButtonElement).style.color = '#67e8f9';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgb(51 65 85 / 0.7)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test strings */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748b', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            Test strings
          </span>
          <div className="flex flex-col gap-2">
            {testStrings.map((ts) => {
              const result = matchResults.get(ts.id);
              const hasResult = ts.value !== '' && result !== undefined;
              const borderColor = hasResult
                ? result!.matched
                  ? '#4ade80'
                  : '#f87171'
                : 'rgb(51 65 85 / 0.7)';

              return (
                <div key={ts.id} className="flex items-center gap-2">
                  {/* Match indicator */}
                  <div
                    className="flex-shrink-0 w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: hasResult
                        ? result!.matched
                          ? '#4ade80'
                          : '#f87171'
                        : 'rgb(51 65 85 / 0.4)',
                    }}
                    title={hasResult ? (result!.matched ? 'Match' : 'No match') : ''}
                  />
                  <input
                    type="text"
                    value={ts.value}
                    onChange={(e) => updateTestString(ts.id, e.target.value)}
                    onFocus={() => setFocusedId(ts.id)}
                    onBlur={() => setFocusedId(null)}
                    placeholder="Enter a test string…"
                    className="flex-1 px-3 py-1.5 rounded-md border text-sm font-mono outline-none transition-colors"
                    style={{
                      backgroundColor: 'rgb(15 23 42 / 0.5)',
                      borderColor,
                      color: '#e2e8f0',
                    }}
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => removeTestString(ts.id)}
                    disabled={testStrings.length === 1}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors"
                    style={{
                      color: testStrings.length === 1 ? '#334155' : '#64748b',
                      cursor: testStrings.length === 1 ? 'not-allowed' : 'pointer',
                    }}
                    title="Remove"
                    aria-label="Remove test string"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addTestString}
            className="self-start mt-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
            style={{
              borderColor: 'rgb(51 65 85 / 0.7)',
              backgroundColor: 'transparent',
              color: '#94a3b8',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#67e8f9';
              (e.currentTarget as HTMLButtonElement).style.color = '#67e8f9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgb(51 65 85 / 0.7)';
              (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
            }}
          >
            + Add test string
          </button>
        </div>

        {/* Regex reference guide */}
        <RegexReference />

        {/* Match details panel — shown when a test string is focused and matched */}
        {focusedResult && focusedResult.matched && focusedString && (
          <div
            className="rounded-md border p-3 flex flex-col gap-2"
            style={{
              borderColor: 'rgb(74 222 128 / 0.3)',
              backgroundColor: 'rgb(74 222 128 / 0.04)',
            }}
          >
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#4ade80', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              Match details
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2 text-xs">
                <span className="flex-shrink-0 font-medium" style={{ color: '#94a3b8' }}>
                  Full match:
                </span>
                <code
                  className="font-mono break-all"
                  style={{ color: '#e2e8f0' }}
                >
                  {focusedResult.fullMatch ?? '(empty)'}
                </code>
              </div>

              {focusedResult.groups.length > 0 && (
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
                    Capture groups:
                  </span>
                  {focusedResult.groups.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs pl-2">
                      <span className="flex-shrink-0 font-medium" style={{ color: '#94a3b8' }}>
                        ${i + 1}:
                      </span>
                      <code className="font-mono break-all" style={{ color: '#e2e8f0' }}>
                        {g === null ? <em style={{ color: '#64748b' }}>no match</em> : g}
                      </code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
