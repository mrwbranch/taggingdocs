import { useState, useCallback, useMemo } from 'react';
import { RE2JS } from 're2js';

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

// ── ID counter ────────────────────────────────────────────────────────────────

let nextId = 1;
function makeId() {
  return nextId++;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RegexTester() {
  const [context, setContext] = useState<Context>('ga4');
  const [pattern, setPattern] = useState('');
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [fullMatch, setFullMatch] = useState(false);
  const [testStrings, setTestStrings] = useState<TestString[]>([
    { id: makeId(), value: '' },
  ]);
  const [focusedId, setFocusedId] = useState<number | null>(null);

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
    setTestStrings((prev) => [...prev, { id: makeId(), value: '' }]);
  }, []);

  const removeTestString = useCallback((id: number) => {
    setTestStrings((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((ts) => ts.id !== id);
    });
  }, []);

  const updateTestString = useCallback((id: number, value: string) => {
    setTestStrings((prev) => prev.map((ts) => (ts.id === id ? { ...ts, value } : ts)));
  }, []);

  const applyTemplate = useCallback((template: Template) => {
    setPattern(template.pattern);
    setTestStrings(template.testStrings.map((s) => ({ id: makeId(), value: s })));
    setFocusedId(null);
  }, []);

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
                onClick={() => setContext(value)}
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
            onChange={(e) => setPattern(e.target.value)}
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

          {/* RE2 validity badge */}
          {pattern && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: re2Validation.valid ? '#4ade80' : '#f87171' }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: re2Validation.valid ? '#4ade80' : '#f87171' }}
                >
                  {re2Validation.valid ? 'Valid RE2 pattern' : re2Validation.error}
                </span>
              </div>
              {!re2Validation.valid && re2Validation.suggestion && (
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
              onChange={(e) => setCaseInsensitive(e.target.checked)}
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
              onChange={(e) => !isGtm && setFullMatch(e.target.checked)}
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
