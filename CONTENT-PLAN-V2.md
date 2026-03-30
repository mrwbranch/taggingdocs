# TaggingDocs — Expanded Content Plan (Volume 2)

> This document contains **150+ additional articles** identified through deep research of Simo Ahava, Analytics Mania, MeasureSchool, Stape, Elevar, GA4BigQuery, Tanelytics, and Google's official documentation. Each article fills a gap in the original content plan and targets real problems practitioners encounter daily.
>
> Articles are organized into the existing site structure where they fit, with new sections added where needed. Each brief follows the same format as the original content plan.

---

## Global Content Guidelines

Same voice, tone, and structure rules as the original CONTENT-PLAN.md. Every article should:
1. Open with 2-3 sentences on what the page covers and why it matters
2. Include real, copy-pasteable code examples
3. Be opinionated — recommend the best approach
4. Include "Common Mistakes" sections where relevant
5. End with related article links

---

## NEW SECTION: GTM Internals & Edge Cases

> These articles go in a new directory: `src/content/docs/internals/`
> Sidebar section: 🔬 **GTM Internals** — How GTM actually works under the hood

These are the "Simo Ahava-depth" articles that no other documentation site covers. They explain the mechanics that cause 90% of debugging headaches.

---

### internals/data-model-deep-dive.mdx
**Difficulty**: Advanced
**Purpose**: Explain the critical difference between the dataLayer array and GTM's internal data model

**Must cover**:
- The dataLayer array is a message queue; GTM's internal Abstract Data Model is a recursive-merge state machine
- How `dataLayer.push({a: {b: 1}})` followed by `dataLayer.push({a: {c: 2}})` results in internal state `{a: {b: 1, c: 2}}` — not replacement
- Why Data Layer Variables read from the internal model, not the array
- The sticky value problem: pushed properties persist until explicitly overwritten
- How to inspect the internal data model: `google_tag_manager["GTM-XXXX"].dataLayer.get("key")`
- The `_clear: true` key for resetting nested objects
- Array handling in the data model (arrays replace, objects merge)
- Why this matters: stale ecommerce data, SPA page data bleeding between views

**Key opinions**:
- Understanding the data model vs. the array is the single most important technical concept in GTM
- Most "random data appearing" bugs are data model merge behavior, not code bugs

**Code examples**:
- Step-by-step merge demonstration
- The `_clear` pattern for resetting state
- Console commands to inspect internal state

---

### internals/flushing-stale-variables.mdx
**Difficulty**: Intermediate
**Purpose**: How to properly clear dataLayer variables between events in SPAs

**Must cover**:
- The problem: navigating from product A to product B in an SPA, but product A's data still appears in events on product B's page
- Pushing `undefined` to clear specific keys
- The `ecommerce: null` pattern and why it's critical before every ecommerce push
- Flushing all custom variables between virtual pageviews
- The `_clear` key approach for nested objects
- Building a "reset" dataLayer push that fires on every route change
- Common pitfall: clearing too early (before tags fire) vs. too late (after next event pushes)

**Code examples**:
- SPA route change cleanup function
- Ecommerce clearing pattern
- Generic flush function for all custom variables

---

### internals/persisting-datalayer-across-pages.mdx
**Difficulty**: Advanced
**Purpose**: Maintaining dataLayer state across hard page navigations

**Must cover**:
- The problem: multi-step checkout flows, form wizards, and funnels where data from step 1 is needed on step 3
- localStorage-based persistence pattern: serialize dataLayer state, restore on next page
- sessionStorage alternative for session-scoped persistence
- Cookie-based persistence for critical values (campaign data, user segments)
- Persisting campaign/UTM data from landing page through to conversion page
- Server-side session storage as the cleanest alternative
- Security considerations: never persist PII in client storage

**Code examples**:
- localStorage persist/restore pattern
- Campaign data cookie persistence
- Session-scoped dataLayer bridge

---

### internals/datalayer-push-functions.mdx
**Difficulty**: Advanced
**Purpose**: The undocumented ability to push functions to the dataLayer

**Must cover**:
- Pushing a function to `dataLayer` executes it with the data model interface as `this`
- Use cases: conditional data injection, computed values, reading current data model state
- How `this.get()` and `this.set()` work inside pushed functions
- Accessing the full data model from within the function
- Timing: functions execute synchronously when pushed
- Why this is powerful: inject data based on current state without knowing what's already been pushed

**Code examples**:
- Basic function push with `this.get()`
- Conditional ecommerce data injection
- Computing derived values from existing data model state

---

### internals/container-snippet-decoded.mdx
**Difficulty**: Advanced
**Purpose**: Line-by-line breakdown of what the GTM container snippet actually does

**Must cover**:
- The `<script>` portion: creates the dataLayer array, pushes the `gtm.js` event with timestamp, creates a script element, sets async src to `gtm.js` endpoint, inserts before the first script tag
- The `<noscript>` portion: iframe fallback for environments without JavaScript
- Why the IIFE pattern is used (avoiding global namespace pollution)
- The `dl` parameter: custom dataLayer name support
- The `l` parameter: namespace for the container's internal reference
- Why placement matters: `<head>` for the script (earliest execution), after `<body>` opening for noscript
- What happens if you modify the snippet: adding async/defer (it's already async), deferring load, removing noscript

**Key opinions**:
- Don't modify the snippet unless you fully understand what each part does
- The noscript portion is nearly useless in modern web — but keep it for compliance

---

### internals/race-conditions-tag-timing.mdx
**Difficulty**: Advanced
**Purpose**: Systematic guide to race conditions in GTM

**Must cover**:
- Tag firing order is non-deterministic for tags on the same trigger with the same priority
- The dataLayer push timing problem: pushing data after container load but before tags evaluate
- Consent manager timing: CMP loads async, consent state may not be set when tags evaluate
- SPA route change: History Change fires before React/Vue has rendered the new page
- The Google Tag auto-load behavior: GA4 event tags wait for the Google Tag, creating implicit sequencing
- `beforeunload` and page exit: tags may not complete before navigation
- Cross-domain: `_gl` parameter must be present before user clicks the link

**Key opinions**:
- If you have a timing bug, the answer is almost always "use Custom Event triggers with explicit dataLayer pushes" instead of relying on DOM-based triggers
- Tag sequencing is a band-aid; proper dataLayer architecture prevents most race conditions

**Code examples**:
- Guaranteed-order event chain pattern
- Waiting for framework render before pushing pageview
- Consent-aware tag initialization

---

### internals/google-tag-auto-loading.mdx
**Difficulty**: Intermediate
**Purpose**: How the Google Tag update changed GTM's behavior

**Must cover**:
- GTM now auto-loads a Google Tag when Ads or Floodlight tags are present
- This means a `gtag()` instance is created even without a GA4 Configuration tag
- Impact: changes to Google Tag settings (like consent defaults) now propagate to Ads tags
- The combined Google Tag: how GA4 and Ads share a single Google Tag instance
- Timing implications: GA4 event tags now wait for the Google Tag initialization
- How this affects consent mode: Google Tag inherits consent settings

---

### internals/dual-deployment-conflicts.mdx
**Difficulty**: Intermediate
**Purpose**: What happens when both GTM and hardcoded gtag.js exist on the same page

**Must cover**:
- The problem: many sites have gtag.js hardcoded AND load it again through GTM
- Double-counting: two trackers sending duplicate hits
- Consent mode conflicts: different consent states for each instance
- The correct approach: use GTM exclusively, or gtag.js exclusively, never both
- If both must coexist: how to prevent tracker collisions
- Special case: gtag.js for Consent Mode defaults, GTM for everything else (a valid pattern)

---

### internals/file-protocol-edge-environments.mdx
**Difficulty**: Advanced
**Purpose**: Running GTM in non-HTTP environments

**Must cover**:
- The `file://` protocol: GTM's protocol check and how it affects loading
- Local development: why GTM may not load on `localhost` without configuration
- Electron apps: embedding GTM in desktop applications
- WebView contexts: GTM in mobile app webviews
- Protocol-relative URLs in the GTM snippet and when they cause issues

---

## NEW SECTION: Custom Templates

> These articles go in a new directory: `src/content/docs/templates/`
> Sidebar section: 🧩 **Custom Templates** — Building and using GTM templates

---

### templates/index.mdx
**Section landing page.** Overview of the custom template system: what it is, why it exists, and when to use templates vs. Custom HTML tags. Link to subsections.

---

### templates/sandboxed-javascript.mdx
**Difficulty**: Advanced
**Purpose**: Complete guide to the sandboxed JavaScript environment

**Must cover**:
- What's NOT available: no `window`, `document`, `this`, `new`, `prototype`, `class`, `try/catch` in standard form
- Available APIs organized by category: DOM/globals (`setInWindow`, `copyFromWindow`, `createQueue`, `createArgumentsQueue`), HTTP (`sendPixel`, `sendHttpGet`, `sendHttpRequest`), cookies (`getCookieValues`, `setCookie`), scripts (`injectScript`), storage (`localStorage`, `templateDataStorage`), logging (`logToConsole`), and utilities
- The function wrapper behavior: how GTM wraps exposed globals
- String operations and limited regex support
- Server-side specific APIs: `getRequestHeader`, `setResponseHeader`, `returnResponse`, `claimRequest`, `runContainer`, `getGoogleAuth`

**Key opinions**:
- The sandboxed environment is intentionally restrictive for security — don't fight it
- If you need capabilities the sandbox doesn't provide, the answer is usually server-side GTM

**Code examples**:
- Accessing and setting global variables
- Queue-based SDK initialization pattern
- Cookie read/write in sandboxed JS

---

### templates/building-tag-templates.mdx
**Difficulty**: Advanced
**Purpose**: Step-by-step guide to building a custom tag template

**Must cover**:
- Template editor walkthrough: Fields, Code, Permissions, Tests tabs
- Field types: text, dropdown, checkbox, radio, simple_table, param_table, group, label
- Code structure: the main execution function
- Using field values in code
- The `data` object and how field values are passed
- Building a real vendor pixel template from scratch (e.g., LinkedIn Insight Tag)
- Permission auto-detection and manual configuration
- Gallery metadata: categories, logo, documentation URL

**Code examples**:
- Simple pixel template end-to-end
- Template with dynamic parameters from a param_table field
- Template with conditional logic based on dropdown selection

---

### templates/building-variable-templates.mdx
**Difficulty**: Advanced
**Purpose**: Creating custom variable templates

**Must cover**:
- Variable template structure: must return a value
- Use cases: custom cookie parsing, URL parameter extraction, data transformation
- The difference between variable templates and Custom JavaScript variables
- When to build a variable template vs. use inline Custom JS
- Server-side variable templates: async patterns with Promises

**Code examples**:
- Cookie parser variable template
- URL parameter extractor
- Server-side Firestore lookup variable

---

### templates/building-client-templates.mdx
**Difficulty**: Advanced
**Purpose**: Creating custom client templates for server-side GTM

**Must cover**:
- Client template structure: `claimRequest()`, event model building, `runContainer()`
- Reading incoming request data: headers, body, query parameters, path
- The `claimRequest()` mechanism: how and when to claim
- Building the event model from arbitrary data formats
- Setting response headers and cookies
- Setting response status code and body
- Testing client templates

**Code examples**:
- Webhook receiver client (receives JSON POST, builds event model)
- Custom tracking endpoint client
- Client that receives data from a non-Google analytics tool

---

### templates/testing-custom-templates.mdx
**Difficulty**: Advanced
**Purpose**: Writing and running tests for custom templates

**Must cover**:
- The test runner: `runCode()` to execute template code
- Assertion APIs: `assertThat()`, `assertApi()` for verifying API calls
- Mocking: `mock()` for faking API responses (sendPixel, injectScript, etc.)
- Test patterns for each API category
- The Test tab in the template editor
- Running tests programmatically
- Common test failures and how to diagnose them

**Code examples**:
- Test suite for a pixel tag template
- Mocking `injectScript` to test callback behavior
- Testing cookie operations

---

### templates/template-permissions-security.mdx
**Difficulty**: Advanced
**Purpose**: The permissions model and Template Policies

**Must cover**:
- Granular permissions: `inject_script`, `send_pixel`, `access_globals`, `get_cookies`, `set_cookies`, `read_data_layer`, `access_consent_state`, etc.
- Auto-detection: permissions inferred from code
- Manual permission editing and the Community Gallery gotcha (editing breaks the link)
- Template Policies: `gtag('policy', permissionId, function)` for page-level control
- How policies override template permissions
- Security implications: what a malicious template could do without policies

---

### templates/community-gallery-guide.mdx
**Difficulty**: Intermediate
**Purpose**: Navigating and using the Community Template Gallery

**Must cover**:
- What's available: categorized overview of popular templates (analytics, advertising, consent, utility)
- How to evaluate a template: reading permissions, checking the GitHub source, version history
- Installing from the Gallery vs. importing from GitHub
- Template updates: how they work (commit SHA-based), when to update
- Recommended essential templates: Core Web Vitals, Value Hasher, Cookie Writer, CAPI Gateway
- When to use Gallery templates vs. build custom vs. use Custom HTML
- How to submit your own template: `.tpl` format, Apache 2.0 license, GitHub requirements

---

### templates/template-publishing.mdx
**Difficulty**: Advanced
**Purpose**: Building and submitting templates to the Community Template Gallery

**Must cover**:
- Repository structure: `template.tpl`, `metadata.yaml`, `LICENSE`
- The `.tpl` file format: sections, field definitions, code, permissions, tests
- `metadata.yaml`: homepage, documentation, categories, changelog
- The submission process: GitHub repository, Google form, review timeline
- Version updates: commit SHA mechanism
- Requirements: Apache 2.0 license, test coverage, documentation
- Common rejection reasons and how to avoid them

---

## NEW SECTION: Security & Governance

> These articles go in a new directory: `src/content/docs/security/`
> Sidebar section: 🛡️ **Security & Governance** — Protecting your GTM implementation

---

### security/index.mdx
**Section landing page.** Frame as: "GTM has publish access to your production website. Treat it with the same security rigor as a code deployment."

---

### security/gtm-attack-vectors.mdx
**Difficulty**: Intermediate
**Purpose**: How GTM can be exploited and how to prevent it

**Must cover**:
- GTM as an XSS vector: Custom HTML tags execute arbitrary JavaScript
- Credit card skimming through injected tags (real-world examples from Magecart attacks)
- Data exfiltration: sending user data to unauthorized endpoints
- Red flags to watch for: Base64 encoded strings, hexadecimal blobs, outbound requests to unknown domains
- Social engineering: unauthorized users gaining GTM access
- Supply chain attacks through compromised community templates
- The finding that custom templates could previously inject arbitrary scripts bypassing sandbox protections

**Key opinions**:
- Every GTM publish is a production code deployment — treat it that way
- Never give Publish access to people who don't understand the security implications
- Audit Custom HTML tags monthly

---

### security/content-security-policy.mdx
**Difficulty**: Advanced
**Purpose**: Configuring CSP to work with GTM

**Must cover**:
- Required CSP directives for GTM: `script-src`, `img-src`, `style-src`, `connect-src`, `frame-src`
- The full list of Google domains to allowlist
- The `nonce` + `strict-dynamic` approach (recommended)
- Chrome's nonce-masking behavior and the `data-nonce` attribute workaround
- Preview mode: additional CSP requirements (different from production)
- CSP reporting: monitoring violations without breaking GTM
- The tradeoff: strict CSP limits what Custom HTML tags can do (which is a good thing)

**Code examples**:
- Complete CSP header for GTM + GA4
- CSP with nonce-based approach
- CSP report-only configuration for testing

---

### security/tag-auditing.mdx
**Difficulty**: Intermediate
**Purpose**: Regular audit process for GTM containers

**Must cover**:
- Weekly quick-scan: check for new Custom HTML tags, unexpected outbound domains
- Monthly deep dive: review all tags, triggers, variables for relevance
- Container size monitoring: large containers = potential bloat or injection
- Identifying dead tags: tags that haven't fired in 90+ days
- Orphaned triggers and unused variables
- Version history review: who changed what and when
- Tools: GTM's built-in audit, browser extension scanners, ObservePoint
- The "delete paused tags after 90 days" rule

---

### security/version-controlled-publishing.mdx
**Difficulty**: Intermediate
**Purpose**: Treating GTM changes like code deployments

**Must cover**:
- Container JSON export: what it contains, how to export
- Git workflow: export → commit → PR review → approve → publish
- Automated export scripts using the GTM API
- Diff viewing: comparing container versions in Git
- Rollback procedures: restoring a known-good version
- Branch strategy: one branch per workspace
- CI/CD integration: automated testing before publish

**Code examples**:
- Script to auto-export container JSON
- GitHub Actions workflow for GTM version tracking

---

### security/enterprise-governance.mdx
**Difficulty**: Intermediate
**Purpose**: GTM governance for large organizations

**Must cover**:
- Permission tier design: read-only analysts, edit-only implementers, publish-only leads, admin-only managers
- The principle of least privilege applied to GTM
- Centralized vs. decentralized management models
- GTM 360 features: approval workflows, zones
- Change management process: request → review → implement → test → approve → publish
- Training requirements for new GTM users
- Quarterly access reviews: removing departed employees, revoking unnecessary permissions
- Documentation requirements: every tag must have a documented purpose and owner

---

## NEW SECTION: Browser & Privacy

> These articles go in a new directory: `src/content/docs/privacy/`
> Sidebar section: 🌐 **Browser & Privacy** — Navigating browser restrictions and privacy requirements

---

### privacy/index.mdx
**Section landing page.** Overview of the browser privacy landscape and its impact on tracking. Frame as: "The rules keep changing. Here's what you need to know to stay compliant and accurate."

---

### privacy/itp-history-impact.mdx
**Difficulty**: Intermediate
**Purpose**: Comprehensive guide to Safari's Intelligent Tracking Prevention

**Must cover**:
- ITP evolution: 1.0 (third-party cookie blocking) → 2.1 (first-party JS cookie 7-day cap) → 2.2 (24-hour cap for classified domains) → 2.3 (CNAME cloaking restrictions) → current state
- Which GA4 cookies are affected: `_ga` (7-day cap from JS), `_ga_XXXX` (same)
- Impact on analytics: inflated user counts, lost returning user attribution, shorter attribution windows
- The GA4 `_ga` cookie: how it's set by JavaScript vs. server-side and why it matters
- ITP exemptions: cookies set by the server on the first-party domain are NOT capped

**Key opinions**:
- ITP is the single biggest reason server-side tagging exists
- If your Safari users look like 70% new visitors, ITP is probably the cause

---

### privacy/cross-browser-tracking-differences.mdx
**Difficulty**: Intermediate
**Purpose**: How each major browser handles tracking differently

**Must cover**:
- Safari (ITP): JS cookie caps, third-party cookie blocking, link decoration restrictions
- Firefox (ETP): tracking protection lists, partitioned cookies, redirect tracking protection
- Chrome: Privacy Sandbox, Topics API, Attribution Reporting API, third-party cookie deprecation timeline
- Brave: aggressive blocking of all third-party requests, fingerprinting protection
- Edge: tracking prevention levels (Basic/Balanced/Strict)
- Impact comparison table: what each browser blocks for GA4 specifically
- Testing across browsers: what to verify

---

### privacy/extending-cookie-lifetimes.mdx
**Difficulty**: Advanced
**Purpose**: Server-side techniques for bypassing browser cookie restrictions

**Must cover**:
- Why server-set cookies bypass ITP: HTTP `Set-Cookie` headers from the server are not subject to JavaScript cookie caps
- The sGTM cookie refresh pattern: reading and re-setting `_ga` via server response headers
- Cookie Keeper (Stape): how it works, configuration, pricing
- CDN-based cookie extension via edge workers (Cloudflare Workers, AWS CloudFront Functions)
- The FPID cookie: how sGTM's first-party identifier works
- Ethical considerations: extending cookie lifetimes still requires consent
- Legal context: GDPR/ePrivacy view on cookie lifetime extension

**Code examples**:
- Server-side cookie set via sGTM tag
- Cloudflare Worker cookie refresh pattern

---

### privacy/fpid-cookie-management.mdx
**Difficulty**: Advanced
**Purpose**: Understanding and controlling the FPID cookie in sGTM

**Must cover**:
- What the FPID cookie is: a first-party identifier set by the server-side GA4 client
- How it interacts with the client-side `client_id`: FPID takes precedence when present
- Cookie attributes: name (`FPID`), domain, path, expiry (400 days), Secure, HttpOnly, SameSite
- How FPID improves user identification over JavaScript-set cookies
- When to suppress FPID: consent not granted, specific privacy requirements
- The `x-sst-system-properties` event parameter for controlling FPID behavior
- FPID vs. `_ga` cookie: when they diverge and how to reconcile

**Code examples**:
- Suppressing FPID via server-side tag configuration
- Reading FPID value in server-side variables

---

### privacy/ad-blocker-impact.mdx
**Difficulty**: Intermediate
**Purpose**: How ad blockers affect GTM/GA4 and what you can do

**Must cover**:
- What ad blockers block: the GTM script, GA4 collection endpoint, specific marketing pixels
- Impact quantification: typically 15-30% of users blocked, varies by audience
- Server-side tagging as a partial solution: first-party domain avoids some blocklist entries
- Custom loader scripts: loading GTM from your own domain
- Ethical framing: respecting user choice vs. maintaining data accuracy
- The Stape approach: custom GTM loader from your own subdomain
- What you should NOT do: deceptive practices to circumvent ad blockers

**Key opinions**:
- Don't fight ad blockers with deception — that's a losing battle and ethically questionable
- Server-side tagging through a first-party domain is the legitimate approach
- Accept that 100% tracking coverage is impossible and plan accordingly

---

## ADDITIONS TO EXISTING SECTIONS

### Added to: foundations/

---

### foundations/browser-apis-for-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Browser APIs that unlock advanced tracking capabilities

**Must cover**:
- Page Visibility API: detecting tab switches, minimizing, actual engaged time
- `navigator.sendBeacon()`: reliable data delivery during page unload
- `IntersectionObserver`: element viewability measurement (IAB-compliant)
- `PerformanceObserver`: Web Vitals measurement (LCP, INP, CLS)
- `MutationObserver`: detecting DOM changes for dynamic content tracking
- Clipboard API: copy/paste event detection
- `requestIdleCallback`: deferring non-critical tracking to idle periods

**Code examples**:
- Page Visibility engagement timer
- sendBeacon for exit tracking
- IntersectionObserver for impression tracking

---

### Added to: client-side/triggers/

---

### client-side/triggers/element-visibility-trigger.mdx
**Difficulty**: Intermediate
**Purpose**: The Element Visibility trigger — one of GTM's most powerful and underused triggers

**Must cover**:
- What it detects: when an element becomes visible in the viewport
- Configuration: element selector (ID or CSS), minimum percent visible, minimum on-screen duration
- Fire on: once per page, once per element, every time
- Use cases: impression tracking for product cards, lazy-loaded content engagement, ad viewability
- The `IntersectionObserver` under the hood
- Variables available: Percent Visible, On-Screen Duration
- Combining with other data for engagement scoring
- Performance: many visibility observers = potential performance impact

**Key opinions**:
- Element Visibility is massively underused — it's perfect for "did the user actually SEE this?" questions
- Use it for true product impression tracking instead of firing on page load

---

### client-side/triggers/exit-intent-trigger.mdx
**Difficulty**: Intermediate
**Purpose**: Detecting when a user is about to leave the page

**Must cover**:
- The `mouseout` event on `document.documentElement` with `clientY < 0` pattern
- `beforeunload` event: when it fires, what you can do in it
- `sendBeacon` for reliable exit data delivery
- Combining mouse exit with scroll depth and time for engagement scoring
- Mobile: there is no mouse exit — use `visibilitychange` instead
- Use cases: exit-intent surveys, saving final engagement state, "last interaction" tracking
- Custom HTML implementation for GTM

**Code examples**:
- Exit intent detection via Custom HTML
- sendBeacon exit tracking
- Combined desktop + mobile exit detection

---

### Added to: client-side/variables/

---

### client-side/variables/css-selectors-for-gtm.mdx
**Difficulty**: Intermediate
**Purpose**: Complete CSS selector reference for GTM trigger conditions and DOM element variables

**Must cover**:
- Basic selectors: element, class, ID, attribute
- Attribute selectors: `[href$=".pdf"]` for downloads, `[href^="tel:"]` for phone clicks, `[href*="mailto:"]` for email, `[data-*]` for custom data attributes
- Combinators: descendant, child, sibling, general sibling
- Pseudo-classes: `:checked`, `:not()`, `:first-child`, `:nth-child()`
- The critical `element, element *` pattern: why your click trigger misses child elements
- `matches()` vs. `closest()` for element identification in Custom JS variables
- Testing selectors in browser DevTools before using in GTM
- Performance: complex selectors vs. simple ones

**Key opinions**:
- Master `[data-*]` attribute selectors — they're the most stable selector strategy
- Always include the wildcard descendant `button, button *` in click triggers
- Test every CSS selector in DevTools console with `document.querySelectorAll()` first

**Code examples**:
- 20+ practical CSS selector patterns for common tracking scenarios
- The descendant wildcard pattern for button tracking
- Data attribute patterns for ecommerce product tracking

---

### Added to: client-side/tracking/

---

### client-side/tracking/shadow-dom-tracking.mdx
**Difficulty**: Advanced
**Purpose**: Tracking interactions inside Shadow DOM web components

**Must cover**:
- What Shadow DOM is and why it blocks GTM's event listeners
- Open vs. closed Shadow DOM: different access levels
- Why GTM's click trigger doesn't see clicks inside shadow roots
- The `composed: true` event property: which events bubble through shadow boundaries
- Workaround for open Shadow DOM: global variable reference to shadow root, `addEventListener` inside
- Workaround for closed Shadow DOM: the `attachShadow` monkey-patch pattern
- Custom Event dispatching from inside web components to the dataLayer
- The long-term solution: component developers should push to dataLayer

**Code examples**:
- Attaching listeners to open shadow DOM elements
- Custom HTML tag for shadow DOM click detection
- Web component with built-in dataLayer integration

---

### client-side/tracking/core-web-vitals.mdx
**Difficulty**: Intermediate
**Purpose**: Measuring Core Web Vitals through GTM and sending to GA4

**Must cover**:
- What CWV are: LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift)
- The `web-vitals` library: how to load it and capture metrics
- Simo Ahava's Core Web Vitals custom template: installation and configuration
- Sending CWV data to GA4 as events with parameters
- Building BigQuery dashboards for CWV field data
- CWV impact of GTM itself: how to measure and mitigate
- CrUX vs. field data vs. lab data: understanding the different measurement contexts

**Code examples**:
- Web Vitals library integration via Custom HTML
- Custom template configuration
- GA4 event structure for CWV data
- BigQuery query for CWV analysis

---

### client-side/tracking/comprehensive-link-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Track and categorize ALL link clicks in a single system

**Must cover**:
- Building one GA4 event that categorizes every click: internal, outbound, download, mailto, tel, anchor, social
- CSS attribute selector approach for URL patterns
- RegEx Table variable for link categorization
- Capturing: link URL, link text, link destination category, click position
- Excluding navigation elements you don't want tracked
- The "link click ledger" concept: a single reusable tag that handles all link types
- Performance: one trigger vs. many specialized triggers

**Code examples**:
- Single All Clicks trigger with categorization variable
- RegEx Table for link type classification
- GA4 event tag with dynamic parameters

---

### client-side/tracking/form-builder-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Tracking specific form builders that don't work with standard methods

**Must cover**:
- Gravity Forms: DOM structure, AJAX submission detection, `gform_confirmation_loaded` event
- Contact Form 7: the `wpcf7mailsent` DOM event, AJAX callback
- Typeform: embedded vs. popup, `onSubmit` callback from the Typeform Embed SDK
- HubSpot Forms: `window.addEventListener('message')` for cross-origin form submission detection
- Webflow: native form vs. custom form, AJAX form handling
- Calendly: embed event listeners for booking completion
- Each builder: tested GTM trigger configuration and dataLayer push pattern

**Code examples**:
- Gravity Forms AJAX detection
- HubSpot Forms postMessage listener
- Typeform onSubmit callback integration
- Contact Form 7 event listener

---

### client-side/tracking/offline-tracking.mdx
**Difficulty**: Advanced
**Purpose**: Queuing analytics hits when users go offline

**Must cover**:
- The problem: mobile users, PWAs, and intermittent connectivity
- Service Worker approach: intercept outbound tracking requests, queue in IndexedDB, replay when online
- The `navigator.onLine` API and `online`/`offline` events
- Background sync API for reliable delivery
- GA4 Measurement Protocol for replaying queued events server-side
- Timestamp management: using original event time, not replay time
- Storage limits and cleanup strategies

**Code examples**:
- Service Worker request interceptor for GA4 collection endpoints
- IndexedDB queue and replay pattern
- Online/offline detection with dataLayer push

---

### Added to: client-side/debugging/

---

### client-side/debugging/why-tag-not-firing.mdx
**Difficulty**: Beginner
**Purpose**: Systematic troubleshooting for tags that don't fire

**Must cover** (as a diagnostic flowchart):
1. Is the container published? (Check version in console)
2. Is the container loading? (Network tab, check for `gtm.js` request)
3. Is Preview mode connected? (Verify Tag Assistant connection)
4. Is the trigger configured correctly? (Check trigger conditions in Preview)
5. Is there a blocking trigger/exception? (Check for active exceptions)
6. Is consent blocking the tag? (Check consent state in Preview)
7. Is the tag paused? (Check tag status)
8. Is the tag firing but failing silently? (Check browser console for errors)
9. Is the tag firing but data not appearing? (Processing delay, wrong property, filters)
10. Is an ad blocker preventing the tag? (Test in incognito without extensions)
11. Is CSP blocking the tag? (Check console for CSP violations)
12. Is tag sequencing causing a dependency failure? (Check setup/cleanup tag status)

**Include**: Interactive DecisionTree component for step-by-step diagnosis

---

### client-side/debugging/iframe-debugging.mdx
**Difficulty**: Intermediate
**Purpose**: Debugging GTM inside iframes

**Must cover**:
- Why Preview mode doesn't work in iframes by default
- Same-origin iframes: accessing the iframe's GTM instance from parent
- Cross-origin iframes: the Preview mode connection limitation
- Using the `?gtm_debug=x` URL parameter to force debug mode in iframes
- postMessage debugging: monitoring parent-child communication
- Network tab: filtering requests by frame
- Console debugging: switching console context to iframe execution context

---

### Added to: client-side/tags/

---

### client-side/tags/meta-pixel-setup.mdx
**Difficulty**: Intermediate
**Purpose**: Complete Meta/Facebook Pixel implementation via GTM

**Must cover**:
- Community Template Gallery approach (recommended over Custom HTML)
- Base pixel code: PageView event
- Standard events: ViewContent, AddToCart, Purchase, Lead, CompleteRegistration, etc.
- Custom events with dynamic parameters
- Advanced Matching: hashed email, phone, first name, last name
- Consent Mode integration: the `fbq('consent', 'grant')` pattern
- Meta Events Manager: verifying events, the diagnostics tab
- Deduplication with CAPI (event_id matching)
- The `fbq` queue mechanism and how GTM templates replicate it

**Code examples**:
- Community template configuration for each standard event
- Custom event with dynamic product parameters
- Advanced Matching configuration

---

### client-side/tags/google-ads-troubleshooting.mdx
**Difficulty**: Intermediate
**Purpose**: Why Google Ads conversions aren't working — complete diagnostic guide

**Must cover** (problem → fix format):
- Conversion Linker tag missing (required for cookie-based attribution)
- Consent Mode blocking `ad_storage` (no cookies set, no conversion tracked)
- Cross-domain tracking breaking `gclid` handoff
- GTM container not published (changes only visible in Preview)
- Wrong Conversion ID or Label (copy-paste errors)
- Conversion counting set to "One" when it should be "Every" (or vice versa)
- GA4 → Google Ads linked but conversion not imported correctly
- The bug where linking GA4 before creating a conversion removes the GTM option
- Value not passing correctly (string vs. number, missing currency)
- Enhanced Conversions not hashing data correctly
- Conversion window mismatch between GTM and Google Ads
- Tags firing on wrong pages (thank-you page trigger matching other pages)

---

### client-side/tags/conversion-linker.mdx
**Difficulty**: Beginner
**Purpose**: The Conversion Linker tag explained

**Must cover**:
- What the Conversion Linker does: reads `gclid` and `wbraid`/`gbraid` from URL, stores in first-party cookies
- When it's needed: for Google Ads conversion tracking via GTM
- How it relates to the Google Tag (the Google Tag includes Conversion Linker functionality)
- Configuration: fire on All Pages, no additional settings needed usually
- Cross-domain: enabling the Conversion Linker to pass data across domains
- How it interacts with Consent Mode: only writes cookies when `ad_storage` is granted
- Common mistake: deploying Ads conversion tags without the Conversion Linker

---

### Added to: client-side/management/

---

### client-side/management/multi-container-strategy.mdx
**Difficulty**: Intermediate
**Purpose**: When and how to use multiple GTM containers on one site

**Must cover**:
- Decision framework: when multiple containers make sense (separate teams, compliance boundaries, different site sections)
- Installing multiple containers: both snippets on every page
- Container interaction: do they see each other's dataLayer? (Yes — same array, different consumers)
- Naming and organization across containers
- Performance impact: each container = additional network request and JS execution
- The shared GA4 Measurement ID pattern: both containers sending to the same GA4 property
- Alternative: GTM 360 Zones for segmenting within a single container

**Key opinions**:
- One container is almost always better than two. Multiple containers = multiple points of failure.
- The main valid use case is agency separation: your container + client's marketing container

---

### client-side/management/container-cleanup.mdx
**Difficulty**: Beginner
**Purpose**: Systematic process for cleaning up bloated containers

**Must cover**:
- Identifying dead tags: tags with no trigger, paused tags older than 90 days
- Identifying orphaned triggers: triggers not used by any tag
- Identifying unused variables: variables not referenced anywhere
- Container size audit: what's taking up space
- The cleanup workflow: inventory → categorize → verify → delete → publish
- Documentation: recording what was removed and why
- Prevention: establishing rules for tag lifecycle (every tag gets a review date)
- Using the GTM API for bulk cleanup operations

---

### Added to: server-side/advanced/

---

### server-side/advanced/webhook-integrations.mdx
**Difficulty**: Advanced
**Purpose**: Receiving and processing webhooks through sGTM

**Must cover**:
- Building a custom client to receive webhook POST requests
- Use cases: CRM events (HubSpot, Salesforce), order management events, subscription platforms (Stripe webhooks)
- Parsing webhook payloads into the Event Model
- Authentication: validating webhook signatures
- Forwarding webhook data to ad platform Conversions APIs (offline conversion import)
- Rate limiting and error handling for webhook ingestion
- Debugging webhooks: the Preview Header technique for non-browser requests

**Code examples**:
- Custom client for Stripe webhook events
- Webhook signature validation pattern
- Forwarding CRM events to Meta CAPI

---

### server-side/advanced/building-custom-cdp.mdx
**Difficulty**: Advanced
**Purpose**: Using sGTM + Firestore as a lightweight CDP

**Must cover**:
- The concept: use Firestore as a real-time user data store, sGTM as the processing engine
- User profile creation: writing user attributes to Firestore on login/purchase events
- Data enrichment: reading user profiles from Firestore to augment outgoing events
- Segment computation: classifying users based on accumulated behavior
- Sending enriched data to ad platforms: Meta CAPI, Google Ads with user segments
- POAS (Profit on Ad Spend): enriching conversion events with profit margin data
- Cost considerations: Firestore read/write pricing at scale
- Limitations: this is not a full CDP — define the boundaries clearly

**Code examples**:
- Firestore write tag for user profile updates
- Firestore lookup variable for enrichment
- POAS enrichment pattern

---

### server-side/advanced/bot-detection-filtering.mdx
**Difficulty**: Advanced
**Purpose**: Filtering non-human traffic in server-side GTM

**Must cover**:
- Why bot filtering matters: bots inflate analytics, waste ad spend, skew conversion rates
- User Agent analysis: matching known bot patterns
- IP-based filtering: datacenter IP ranges, known crawlers
- Behavioral signals: request frequency, missing headers, absence of JavaScript execution
- Building a bot score (0-100) and filtering based on threshold
- Forwarding only human traffic to ad platforms
- GA4's built-in bot filtering vs. server-side filtering (complementary approaches)
- Internal traffic filtering: IP ranges for office/VPN

---

### server-side/advanced/event-deduplication.mdx
**Difficulty**: Advanced
**Purpose**: Preventing duplicate conversions across client-side and server-side

**Must cover**:
- The problem: both client-side pixel AND server-side CAPI send the same conversion
- The solution: shared `event_id` parameter sent from client to server
- Meta CAPI deduplication: `event_id` matching between browser pixel and CAPI
- TikTok Events API deduplication: same pattern
- Google Ads: `gclid`-based deduplication
- Generating unique event IDs in the dataLayer
- Verifying deduplication: checking platform dashboards for duplicate indicators
- Common failure: different event IDs on client vs. server due to timing

**Code examples**:
- UUID generation for event IDs
- DataLayer push with event_id
- Server-side variable reading event_id from Event Model
- Platform-specific deduplication configuration

---

### server-side/advanced/conversion-adjustments.mdx
**Difficulty**: Advanced
**Purpose**: Handling returns, cancellations, and value adjustments via sGTM

**Must cover**:
- What conversion adjustments are: modifying the value or removing a conversion after it was recorded
- Google Ads Conversion Adjustments: RETRACT (cancel), RESTATE (change value)
- The sGTM pattern: receive order update webhooks, send adjustment to Google Ads
- Meta CAPI: no native adjustment — send refund event instead
- Data sources: order management system webhooks, Shopify refund webhooks, manual CSV uploads
- Timing: adjustments must reference the original `order_id` and `gclid`

**Code examples**:
- Google Ads Conversion Adjustment tag configuration
- Webhook client for receiving refund notifications
- Adjustment data mapping from order system to Google Ads format

---

### server-side/advanced/same-origin-proxy.mdx
**Difficulty**: Advanced
**Purpose**: Running sGTM through the same origin via reverse proxy

**Must cover**:
- The concept: route sGTM traffic through `example.com/collect` instead of `sgtm.example.com`
- Why: true same-origin context, bypasses more ad blockers, better cookie access
- Cloudflare Workers: path-based routing to sGTM backend
- nginx reverse proxy configuration
- CDN-level routing (Fastly, Vercel Edge)
- DNS vs. path routing: tradeoffs
- SSL certificate handling
- The Google Tag Gateway alternative (managed by Google)

**Code examples**:
- Cloudflare Worker reverse proxy config
- nginx proxy_pass configuration

---

### Added to: server-side/operations/

---

### server-side/operations/hosting-comparison.mdx
**Difficulty**: Intermediate
**Purpose**: Detailed comparison of all sGTM hosting options

**Must cover**:
- Google Cloud Run: autoscaling, cold starts, pricing model, regional availability
- Google App Engine: the original option, scaling differences from Cloud Run
- Stape: managed hosting, power-ups, pricing tiers, limitations
- AWS (ECS Fargate): configuration, cost, comparison with GCP
- Addingwell: managed European hosting alternative
- Self-hosted Docker: on any VPS/cloud, complete control
- Comparison table: cost at 1M/10M/100M requests, features, maintenance burden, geographic options
- Decision framework: which hosting for which team size and traffic level

---

### Added to: datalayer/

---

### datalayer/specification/designing-custom-events.mdx
**Difficulty**: Intermediate
**Purpose**: Framework for designing new custom events from scratch

**Must cover**:
- The decision tree: should this be a new event or a parameter on an existing event?
- Naming checklist: snake_case, <40 chars, descriptive, not duplicating a GA4 recommended event
- Parameter design: required vs. optional, data types, max length
- Impact assessment: will this use a custom dimension slot? Is cardinality manageable?
- The documentation template: event name, description, when it fires, parameters table, example push
- Review process: who approves new events, how to communicate to stakeholders
- Testing before production: staging environment validation, DebugView verification
- Version management: what happens when you need to change an existing event

---

### Added to: datalayer/platforms/

---

### datalayer/platforms/shopify-custom-pixels.mdx
**Difficulty**: Advanced
**Purpose**: Shopify's Custom Pixel system and its limitations

**Must cover**:
- What Custom Pixels are: sandboxed JavaScript environments for tracking code
- The web worker sandbox: no DOM access, no `document`, no `window.location`
- How GTM loads inside a Custom Pixel (in a restricted iframe)
- Which GTM triggers work and which don't (no Click, Form, Scroll triggers)
- The storefront click listener workaround
- Customer Events API: `analytics.subscribe()` for ecommerce events
- Custom Pixel vs. App Pixel vs. checkout.liquid (comparison)
- When to use Custom Pixels vs. theme-based GTM vs. server-side tracking

**Key opinions**:
- Custom Pixels are useful but limited — server-side tracking is the real solution for Shopify
- For checkout events, server-side is the only reliable approach post-Checkout Extensibility

**Code examples**:
- Custom Pixel with GTM loading
- Customer Events API subscription for purchase events
- Event mapping: Shopify events → GA4 ecommerce events

---

### datalayer/platforms/shopify-checkout-extensibility.mdx
**Difficulty**: Advanced
**Purpose**: How Shopify's Checkout Extensibility migration affects tracking

**Must cover**:
- What changed: `checkout.liquid` → Checkout UI Extensions + server-side tracking
- Timeline: when standard Shopify stores lose `checkout.liquid` access
- Impact: GTM no longer works in the checkout for non-Plus merchants
- The server-side solution: using Shopify's server-side pixel or sGTM
- Shopify Plus merchants: checkout.liquid still available but deprecated
- Migration path: what to move to server-side, what can stay client-side
- The "optimized" pixel data sharing feature and its impact on tracking

---

### datalayer/platforms/shopify-headless.mdx
**Difficulty**: Advanced
**Purpose**: Tracking on headless Shopify storefronts (Hydrogen, Next.js, Gatsby)

**Must cover**:
- The headless challenge: no Liquid templates, no theme-based dataLayer, SPA behavior
- Cart handling: Shopify Storefront API vs. localStorage cart, tracking add-to-cart
- Checkout events: must use Shopify's checkout completion redirect or server-side tracking
- GTM installation in Hydrogen (Remix-based)
- GTM installation in headless Next.js with Shopify API
- DataLayer management: React hooks for ecommerce events
- Shopify Markets in headless: multi-currency and multi-region tracking
- The 10 most common headless tracking failures and their solutions

**Code examples**:
- Hydrogen GTM setup with Remix
- React hook for Shopify ecommerce events
- Headless cart tracking with Storefront API

---

### datalayer/platforms/shopify-advanced.mdx
**Difficulty**: Intermediate
**Purpose**: Advanced Shopify tracking patterns

**Must cover**:
- Post-purchase upsell tracking: Zipify, Carthook, Rebuy integration patterns
- Subscription tracking: recurring order attribution, first order vs. renewal
- Multi-currency: sending correct currency code and value per market
- Shopify Markets: different GTM containers or configurations per market
- Discount and coupon code tracking
- Shopify B2B: wholesale pricing and custom pricing tracking
- Server-side tracking setup for Shopify (Stape integration)
- `ShopifyAnalytics.meta.page.customerId` for user identification

---

### datalayer/platforms/woocommerce-advanced.mdx
**Difficulty**: Intermediate
**Purpose**: Advanced WooCommerce tracking beyond the basics

**Must cover**:
- GTM4WP plugin deep configuration: every setting explained
- Custom dataLayer hooks: adding your own data to GTM4WP's output
- Variable product tracking: color/size variant as item_variant
- Subscription tracking: WooCommerce Subscriptions recurring events
- Multi-currency with WPML or WooCommerce Multicurrency
- High Performance Order Storage (HPOS) impact on tracking
- Full page cache compatibility: how caching plugins affect dataLayer
- AJAX add-to-cart: the `added_to_cart` jQuery event pattern

---

### Added to: ga4/

---

### ga4/configuration/enhanced-measurement-pitfalls.mdx
**Difficulty**: Intermediate
**Purpose**: What Enhanced Measurement gets wrong and when to replace it

**Must cover**:
- `page_view`: works well, but double-fires with manual page_view in SPAs
- `scroll`: only fires at 90% — not enough for content analysis
- `outbound_click`: misclassifies subdomain links as outbound
- `site_search`: requires URL parameter configuration, misses AJAX search
- `video_engagement`: requires `enablejsapi=1` on YouTube embeds to work
- `file_download`: only catches standard file extensions, misses dynamic downloads
- `form_interaction` / `form_submit`: triggers on search inputs, misses AJAX forms
- When to disable specific Enhanced Measurement events and replace with GTM

**Key opinions**:
- Enhanced Measurement is a good starting point but NOT a complete tracking solution
- Always audit what it's actually capturing — the defaults have surprises
- Disable any Enhanced Measurement event you're tracking manually in GTM to prevent duplicates

---

### ga4/configuration/data-limits-cardinality.mdx
**Difficulty**: Intermediate
**Purpose**: Every GA4 limit that silently breaks your reporting

**Must cover**:
- 500 distinct event names per property (exceeding this causes data loss)
- 50 event-scoped custom dimensions, 25 user-scoped custom dimensions
- 50 custom metrics
- 25 event parameters per event
- 25 user properties per property
- Event name: 40 characters max
- Parameter name: 40 characters max, parameter value: 100 characters max
- The "(other)" row: appears when dimension cardinality exceeds threshold (~500 unique values)
- Threshold application: low-count rows hidden for privacy (affects Explorations and API)
- Daily event volume limits: 1M for free BigQuery export, 10M+ before sampling in UI
- The retroactive impact: exceeding limits can't be undone by deleting events

**Key opinions**:
- Plan your event taxonomy BEFORE implementing — hitting the 500 event limit is painful to fix
- High-cardinality dimensions (page URL, product ID with 10K+ products) cause (other) row issues

---

### ga4/fundamentals/measurement-protocol.mdx
**Difficulty**: Advanced
**Purpose**: Complete guide to the GA4 Measurement Protocol

**Must cover**:
- What it is: server-to-server event sending to GA4
- Endpoint: `POST https://www.google-analytics.com/mp/collect`
- Required parameters: `measurement_id`, `api_secret`, `client_id`
- Session stitching: `session_id` and `engagement_time_msec` parameters
- The 25-event batch limit per request
- The 72-hour backdating window for historical events
- The critical gotcha: endpoint returns 2xx even for malformed payloads
- Validation endpoint: `POST /mp/collect?api_secret=X` with `validationBehavior=ENFORCE_RECOMMENDATIONS`
- Use cases: offline conversions, CRM events, server-side event supplement, IoT tracking
- Limitations: no session creation, no page_view events, limited attribution

**Code examples**:
- Basic MP event in JavaScript/Node.js
- Python script for batch event sending
- Refund event via MP
- Validation request example

---

### ga4/fundamentals/measurement-protocol-debugging.mdx
**Difficulty**: Advanced
**Purpose**: Debugging Measurement Protocol events

**Must cover**:
- The `debug_mode: true` parameter for DebugView visibility
- The caveat: `client_id` must have prior data in the property for events to appear
- Validation endpoint response format: interpreting error messages
- Common failures: wrong `api_secret` scope, missing required parameters, incorrect `client_id` format
- Session attribution: why MP events often show as "(direct)" and how to fix it
- Using the Event Builder tool (Google's official testing UI)
- BigQuery verification: checking that MP events appear in the export

**Code examples**:
- Debug mode Measurement Protocol request
- Validation endpoint usage
- Session-stitched MP event

---

### ga4/configuration/calculated-metrics.mdx
**Difficulty**: Intermediate
**Purpose**: Creating calculated metrics in GA4

**Must cover**:
- What calculated metrics are: custom formulas using existing metrics
- Creating calculated metrics in GA4 Admin
- Available operations: addition, subtraction, multiplication, division
- Use cases: revenue per user, conversion rate as a metric, average order value, engagement score
- Limitations: only available in Explorations and API, not standard reports
- Calculated metrics vs. custom metrics: when to use which
- The formula syntax and available metric references

---

### Added to: ga4/bigquery/

---

### ga4/bigquery/unnesting-patterns.mdx
**Difficulty**: Intermediate
**Purpose**: The essential UNNEST patterns for GA4 BigQuery data

**Must cover**:
- Why UNNEST is needed: GA4's event_params are stored as repeated RECORD fields
- Extracting a single parameter: the subquery pattern vs. UNNEST + WHERE
- Extracting multiple parameters efficiently: single UNNEST with conditional aggregation
- Unnesting `user_properties` (same pattern, different field)
- Unnesting `items` array for ecommerce analysis
- The `event_params.key` and `event_params.value.string_value` / `.int_value` / `.double_value` / `.float_value` pattern
- Performance: UNNEST cost and how to minimize it
- Common mistakes: forgetting that values have different type fields, cross-joining unintentionally

**Code examples**:
- Single parameter extraction (page_location)
- Multi-parameter extraction in one query
- Items array unnesting for product analysis
- Conditional parameter extraction with CASE

---

### ga4/bigquery/custom-channel-grouping.mdx
**Difficulty**: Advanced
**Purpose**: Building custom channel groupings in BigQuery

**Must cover**:
- Why you'd build custom channels: GA4's defaults don't match your business (e.g., branded vs. non-branded paid search, affiliate channels, custom referral sources)
- Using `session_traffic_source_last_click` record for session-level source/medium
- Building a UDF (User-Defined Function) for channel classification
- Matching logic: source/medium pairs, campaign name patterns, UTM parameters
- Replicating GA4's default channel rules as a starting point
- Handling edge cases: (direct)/(none), cross-domain self-referrals, social network detection
- Performance: UDFs vs. CASE statements

**Code examples**:
- Complete channel grouping UDF
- Channel grouping with branded vs. non-branded paid search
- Integration into session-level reporting queries

---

### ga4/bigquery/attribution-queries.mdx
**Difficulty**: Advanced
**Purpose**: Building attribution models in BigQuery

**Must cover**:
- Last-click attribution: using `session_traffic_source_last_click`
- First-click attribution: querying the first session for each user
- Linear attribution: distributing conversion credit equally across touchpoints
- Position-based attribution: weighted first/last touch
- Data-driven attribution: why you can't replicate GA4's ML model but can approximate it
- Multi-touch attribution reporting: path analysis, touchpoint frequency
- Comparing attribution models: side-by-side query for the same conversions
- The `gclid` join: matching Google Ads click data with GA4 conversion data

**Code examples**:
- Last-click attribution query
- First-click attribution with user-level session ordering
- Multi-touch path analysis
- Conversion credit distribution across touchpoints

---

### ga4/bigquery/dataform-workflows.mdx
**Difficulty**: Advanced
**Purpose**: Automated data transformation with Dataform for GA4

**Must cover**:
- What Dataform is: SQL-based data transformation orchestrated in BigQuery
- Setting up a Dataform project for GA4 data
- Scheduled transformations: daily session table, user table, conversion table
- Incremental models: processing only new data each day
- Dependency management: sessions depend on events, conversions depend on sessions
- Testing assertions: data quality checks built into the pipeline
- Cost management: scheduling queries during off-peak hours
- Alternative: dbt (data build tool) for teams already using it

**Code examples**:
- Dataform session aggregation model
- Incremental daily processing pattern
- Data quality assertion for conversion counts

---

### ga4/bigquery/looker-studio-patterns.mdx
**Difficulty**: Intermediate
**Purpose**: Connecting GA4 BigQuery data to Looker Studio effectively

**Must cover**:
- Why direct GA4 → Looker Studio connection hits quota limits
- The BigQuery intermediate pattern: materialize views, then connect Looker Studio to those views
- Creating materialized views for common dashboard queries
- Scheduled queries that pre-aggregate data for dashboard consumption
- The Google Sheets bridge: for simple dashboards without BigQuery
- Blending GA4 data with ad platform data (Google Ads, Meta Ads)
- Performance: partitioning and date parameters in Looker Studio
- Cost management: caching, extract data sources, controlling query frequency

---

### Added to: ga4/troubleshooting/

---

### ga4/troubleshooting/internal-traffic-filtering.mdx
**Difficulty**: Beginner
**Purpose**: Every method for excluding internal traffic from GA4

**Must cover**:
- GA4 built-in: defining internal traffic by IP range
- Developer traffic filter: `debug_mode` and `debug_event` identification
- Data filter states: Testing → Active (and why you should test first)
- The custom approach: secret URL parameter that sets a cookie, used as custom dimension for filtering
- VPN and remote work: why IP filtering alone doesn't work anymore
- Dynamic IP handling: using ISP-level filtering or cookie-based approaches
- Excluding internal traffic from ad platforms (separate from GA4 filtering)
- The staging domain approach: separate GA4 property for non-production environments

---

### Added to: consent/

---

### consent/consent-initialization-timing.mdx
**Difficulty**: Intermediate
**Purpose**: The most common Consent Mode error and how to fix it

**Must cover**:
- The error: "A tag read consent state before a default was set"
- Root cause: `setDefaultConsentState` must fire on `Consent Initialization - All Pages` trigger, BEFORE `Initialization - All Pages`
- The three trigger initialization groups: Consent Initialization → Initialization → All Pages
- Correct configuration: consent default tag on Consent Initialization
- CMP timing: wait_for_update and what happens when the CMP loads slowly
- Verification: checking timing in Preview mode's consent tab
- What happens when consent defaults are set too late: tags fire with assumed consent state

**Code examples**:
- Correct consent default tag configuration
- Before-GTM-snippet consent default (the safest approach)
- CMP callback timing verification

---

### consent/consent-cross-domain.mdx
**Difficulty**: Advanced
**Purpose**: Consent mode conflicts in cross-domain tracking

**Must cover**:
- The problem: different consent states on domain A vs. domain B
- How inconsistent consent prevents `_gl` linker parameter generation
- The solution: ensuring consent state is passed across domains
- Using the dataLayer to communicate consent state to the destination domain
- Server-side consent state forwarding via sGTM
- The edge case: user grants consent on domain A, navigates to domain B where consent isn't granted

---

### consent/consent-non-google-tags.mdx
**Difficulty**: Intermediate
**Purpose**: Managing consent for tags that don't support Consent Mode natively

**Must cover**:
- The problem: Meta Pixel, TikTok Pixel, LinkedIn Tag, etc. don't natively respect Consent Mode
- Approach 1: Trigger-based blocking — add consent state as a trigger condition
- Approach 2: Tag sequencing — require a consent-check setup tag
- Approach 3: Custom JavaScript variable that reads consent state and blocks tag execution
- How to read the current consent state from within GTM
- The `gtagConsentState` variable approach
- Building a reusable consent gate for any non-Google tag

**Code examples**:
- Custom JS variable that reads consent state
- Trigger condition using consent variable
- Consent gate Custom HTML tag

---

### Added to: recipes/

---

### recipes/track-exit-intent.mdx
**Difficulty**: Intermediate — Detect when a user is about to leave the page (mouse exit on desktop, tab switch on mobile). Cover: mouseout + clientY detection, Page Visibility API fallback, sendBeacon for reliable delivery, GA4 event with engagement context.

### recipes/track-element-visibility.mdx
**Difficulty**: Intermediate — Track when specific elements become visible (product impressions, ad viewability, content sections). Cover: Element Visibility trigger setup, IAB viewability thresholds, batch impression tracking, the beforeunload safety net.

### recipes/track-rage-clicks.mdx
**Difficulty**: Intermediate — Detect frustrated user behavior by identifying rapid repeated clicks on the same element. Cover: click counter with timestamp window, Custom HTML implementation, GA4 error event.

### recipes/track-print-actions.mdx
**Difficulty**: Beginner — Track when users print a page. Cover: `window.onbeforeprint` / `matchMedia('print')` event, GA4 event with page context.

### recipes/track-clipboard-content.mdx
**Difficulty**: Intermediate — Track what content users copy from your pages. Cover: Clipboard API `copy` event, selected text extraction, content identification (which article, which section), privacy considerations.

### recipes/track-anchor-clicks.mdx
**Difficulty**: Beginner — Track clicks on same-page anchor links (table of contents, jump links). Cover: `href^="#"` CSS selector, anchor destination identification, scroll-to behavior.

### recipes/track-infinite-scroll.mdx
**Difficulty**: Intermediate — Track content consumption in infinite scroll/feed layouts. Cover: IntersectionObserver for content blocks, impression deduplication, batch event sending, "content consumed" metric.

### recipes/track-accordion-tabs.mdx
**Difficulty**: Beginner — Track clicks on accordion/tab components. Cover: Element Visibility trigger for expanded content, click trigger for toggle buttons, data-attribute approach for content identification.

### recipes/duplicate-transaction-prevention.mdx
**Difficulty**: Intermediate — Prevent duplicate purchase events when users refresh or revisit the thank-you page. Cover: cookie-based transaction ID dedup, localStorage approach, server-side dedup via sGTM.

### recipes/pii-detection-removal.mdx
**Difficulty**: Intermediate — Detect and remove PII from tracking data before it leaves the browser. Cover: regex patterns for email, phone, SSN detection, Custom HTML scrubbing function, URL parameter PII stripping.

### recipes/fetch-external-data-gtm.mdx
**Difficulty**: Advanced — Call external APIs from GTM to enrich events. Cover: fetch() in Custom HTML, geolocation API, weather data, CRM lookups, async dataLayer push after API response.

### recipes/ab-testing-without-tools.mdx
**Difficulty**: Intermediate — Implement simple A/B tests purely through GTM. Cover: cookie-based variant assignment, DOM manipulation for visual changes, anti-flicker snippet, GA4 custom dimension for test group, result analysis.

### recipes/track-web-vitals.mdx
**Difficulty**: Intermediate — Send Core Web Vitals (LCP, INP, CLS) to GA4 via GTM. Cover: web-vitals library loading, custom template approach, GA4 event parameters, BigQuery analysis query.

### recipes/google-consent-mode-cookiebot.mdx
**Difficulty**: Intermediate — Step-by-step Consent Mode v2 integration with Cookiebot CMP. Cover: Cookiebot GTM template, default consent state, consent update callback, verification in Preview mode.

### recipes/google-consent-mode-cookieyes.mdx
**Difficulty**: Intermediate — Step-by-step Consent Mode v2 integration with CookieYes CMP. Cover: CookieYes GTM template, consent mapping, category-to-consent-type mapping, testing.

### recipes/enhanced-conversions-setup.mdx
**Difficulty**: Intermediate — Complete Google Ads Enhanced Conversions setup via GTM. Cover: user-provided data variables (email, phone, address), automatic vs. manual configuration, SHA-256 hashing, tag configuration, testing with Tag Assistant.

### recipes/server-side-shopify-tracking.mdx
**Difficulty**: Advanced — End-to-end server-side tracking for Shopify via Stape. Cover: Stape setup, GTM web container configuration, sGTM container setup, GA4 + Meta CAPI + Google Ads configuration, verification.

---

### Added to: resources/

---

### resources/ga4-audit-checklist.mdx
**Difficulty**: Intermediate
**Purpose**: Systematic GA4 configuration audit

**Must cover** (as an interactive checklist):
- Data retention: set to 14 months? ✓/✗
- Google Signals: enabled? Understood privacy implications?
- Reporting identity: blended/observed/device-based configured correctly?
- Internal traffic filter: configured and active (not just testing)?
- Cross-domain: configured if multiple domains?
- Enhanced Measurement: reviewed and unnecessary events disabled?
- Custom dimensions: all needed parameters registered?
- Key events (conversions): correctly configured with right counting method?
- BigQuery: export linked and running?
- Google Ads: property linked?
- Search Console: linked?
- Data streams: correct configuration, no duplicates?
- Audiences: predictive audiences enabled if enough data?
- Attribution: model and lookback window reviewed?
- User ID: implemented if authenticated users exist?
- Data filters: developer traffic excluded?

---

### resources/gtm-api-automation.mdx
**Difficulty**: Advanced
**Purpose**: Practical GTM API v2 automation guide

**Must cover**:
- Authentication: OAuth 2.0 setup, service account creation
- API scopes: the seven OAuth scopes and when to use each
- Common operations: list containers, get container versions, create tags/triggers/variables
- Bulk operations: updating multiple tags programmatically
- Container export and import via API
- Building a CLI tool for GTM management
- Automated Slack notifications for container publishes
- The `owntag/gtm-cli` tool
- Rate limiting and error handling

**Code examples**:
- Python: authenticate and list containers
- Node.js: create a tag programmatically
- GitHub Actions: auto-export container JSON on publish
- Slack webhook notification script

---

### resources/measurement-strategy-template.mdx
**Difficulty**: Beginner
**Purpose**: Template for planning a measurement strategy before implementation

**Must cover** (as a downloadable template):
- Business objectives → KPIs → metrics → events mapping
- Event taxonomy planning worksheet
- Custom dimension/metric allocation tracker
- DataLayer specification template
- Stakeholder sign-off section
- Implementation priority matrix
- QA testing checklist
- Launch readiness review

---

## NEW SECTION: Ad Platform Integrations

> These articles go in a new directory: `src/content/docs/integrations/`
> Sidebar section: 📡 **Ad Platforms** — Pixel and conversion tracking for ad platforms

---

### integrations/index.mdx
**Section landing page.** Overview of ad platform tracking through GTM. Frame as: "Setting up conversion tracking correctly for every major ad platform."

---

### integrations/meta-pixel-client-side.mdx
**Difficulty**: Intermediate
**Purpose**: Complete Meta Pixel setup via client-side GTM

**Must cover**:
- Community template approach (recommended)
- Base pixel: PageView event on all pages
- Standard events: ViewContent, AddToCart, Purchase, Lead, CompleteRegistration, Search, AddPaymentInfo, InitiateCheckout
- Custom events with custom parameters
- Advanced Matching: hashed email, phone, name, city, state, zip, country
- Dynamic product ads: content_ids and content_type parameters
- Consent integration: `fbq('consent', 'grant'/'revoke')`
- Verification: Meta Events Manager, Test Events tool

---

### integrations/meta-capi-server-side.mdx
**Difficulty**: Advanced
**Purpose**: Meta Conversions API via server-side GTM

**Must cover**:
- Why CAPI: browser blocking, data completeness, better match rates
- Setup: Access Token, Pixel ID, Test Event Code
- Event mapping: GA4 events → Meta standard events
- User data: hashed email, phone, `fbp`, `fbc` cookies
- Event deduplication: `event_id` matching between pixel and CAPI
- Event Match Quality score: how to improve it
- Gateway API vs. full CAPI implementation
- Verification: Events Manager server events tab

---

### integrations/pinterest-tag.mdx
**Difficulty**: Intermediate
**Purpose**: Pinterest Tag setup via GTM (client-side and server-side)

**Must cover**: Base tag, standard events (Checkout, AddToCart, PageVisit, Search, ViewCategory, WatchVideo, Lead, Signup), Enhanced Match, deduplication with Pinterest Conversions API.

### integrations/tiktok-pixel-and-api.mdx
**Difficulty**: Intermediate
**Purpose**: TikTok Pixel and Events API setup via GTM

**Must cover**: Client-side pixel via community template, standard events, Advanced Matching, server-side Events API setup via sGTM, event deduplication between pixel and API.

### integrations/linkedin-insight-tag.mdx
**Difficulty**: Beginner
**Purpose**: LinkedIn Insight Tag and conversion tracking via GTM

**Must cover**: Insight Tag installation, conversion tracking for lead gen, event-specific conversions, LinkedIn CAPI overview.

### integrations/microsoft-ads-uet.mdx
**Difficulty**: Beginner
**Purpose**: Microsoft Ads UET tag setup via GTM

**Must cover**: UET tag installation, conversion goals, revenue tracking, remarketing audiences.

### integrations/snapchat-pixel.mdx
**Difficulty**: Intermediate
**Purpose**: Snapchat Pixel and Conversions API setup via GTM

**Must cover**: Client-side pixel, standard events, server-side CAPI, deduplication.

---

## NEW SECTION: GA4 APIs

> These articles go in a new directory: `src/content/docs/ga4/apis/`
> Added to the GA4 sidebar section

---

### ga4/apis/data-api.mdx
**Difficulty**: Advanced
**Purpose**: GA4 Data API for extracting reports programmatically

**Must cover**:
- API overview: `runReport`, `batchRunReports`, `runPivotReport`, `runRealtimeReport`
- Authentication: service account setup, OAuth 2.0
- Request structure: dimensions, metrics, date ranges, dimension filters, metric filters
- Response structure: rows, totals, metadata
- Pagination: handling 100K+ row results with `offset` and `limit`
- Sampling detection: checking `metadata.samplingMetadatas`
- Quotas and rate limits
- Client libraries: Python, Node.js, PHP

**Code examples**:
- Python: basic report with filtering
- Node.js: real-time report
- Batch report for multiple date ranges

---

### ga4/apis/admin-api.mdx
**Difficulty**: Advanced
**Purpose**: GA4 Admin API for property management

**Must cover**:
- Creating and updating data streams
- Managing custom dimensions and custom metrics
- Configuring key events (conversions)
- Managing Google Ads links and BigQuery links
- Creating audiences programmatically
- User management
- Use cases: automated property setup for new clients, bulk custom dimension registration

---

### ga4/apis/user-deletion-api.mdx
**Difficulty**: Advanced
**Purpose**: GDPR-compliant automated user data deletion

**Must cover**:
- The User Deletion API: endpoint, authentication, request format
- Deleting by user ID, client ID, or app instance ID
- Batch deletion workflows
- Integration with consent management systems
- Legal requirements: response time, confirmation, record-keeping
- Limitations: doesn't affect BigQuery exports (separate deletion needed)

---

## Summary: New Articles by Section

| Section | New Articles | Total with Original |
|---------|-------------|-------------------|
| GTM Internals (NEW) | 8 | 8 |
| Custom Templates (NEW) | 8 | 8 |
| Security & Governance (NEW) | 5 | 5 |
| Browser & Privacy (NEW) | 5 | 5 |
| Ad Platform Integrations (NEW) | 8 | 8 |
| Foundations | 1 | 10 |
| Client-Side GTM | 14 | 54 |
| Server-Side GTM | 7 | 32 |
| DataLayer | 6 | 30 |
| GA4 | 12 | 36 |
| Consent | 3 | 12 |
| Recipes | 17 | 36 |
| Resources | 3 | 9 |
| **Total New** | **97** | |
| **Grand Total** | | **~253 articles** |

## Content Production Priority for Volume 2

**Phase 1 — Highest search volume / practitioner pain points**
1. `recipes/` — new recipe articles (practitioners search for these when stuck)
2. `client-side/tags/google-ads-troubleshooting.mdx` (massive search volume)
3. `client-side/debugging/why-tag-not-firing.mdx` (universal question)
4. `ga4/configuration/enhanced-measurement-pitfalls.mdx` (everyone hits this)

**Phase 2 — Differentiated deep content (what makes TaggingDocs unique)**
5. `internals/` — all articles (the "Simo Ahava-depth" content)
6. `templates/` — all articles (underserved in existing docs)
7. `security/` — all articles (completely missing from other docs sites)

**Phase 3 — Platform-specific guides (high traffic potential)**
8. `datalayer/platforms/shopify-*` — all Shopify articles
9. `datalayer/platforms/woocommerce-advanced.mdx`
10. `integrations/` — all ad platform articles

**Phase 4 — Advanced operations**
11. `server-side/advanced/` — new articles
12. `privacy/` — all articles
13. `ga4/bigquery/` — new articles
14. `ga4/apis/` — all articles
15. `consent/` — new articles
