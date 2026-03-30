# TaggingDocs — Complete Content Plan

> Every article listed below should be generated as a complete MDX file. Each brief describes what the article must cover, the target audience, key sections, required code examples, and important opinions to express. Articles should be 1,500–4,000 words depending on topic complexity.

---

## Global Content Guidelines

### Voice & Tone
- Write as an experienced practitioner sharing knowledge, not as a manual
- Be opinionated: recommend the best approach, not every approach
- Use "you" and "we" — direct and conversational
- Acknowledge complexity honestly — don't oversimplify
- Include real-world context: "In practice, you'll find that..." / "The docs say X but what actually works is Y"

### Structure for Every Article
1. **Frontmatter**: title, description, difficulty level
2. **Opening**: 2-3 sentences explaining what this page covers and why it matters (no filler intros)
3. **Core content**: Organized with clear H2/H3 hierarchy
4. **Code examples**: Real, copy-pasteable, tested patterns
5. **Common Mistakes**: Where relevant, a section on what people get wrong
6. **Related Articles**: Cross-links at the bottom

### Code Example Standards
- All dataLayer examples must be valid JavaScript
- All JSON must be valid and properly formatted
- Show both the dataLayer.push() call AND the GTM configuration needed to use it
- Include TypeScript type definitions for dataLayer events where relevant
- For ecommerce events, always show the full item array structure, not abbreviated

---

## PART 1: FOUNDATIONS

### foundations/index.mdx
**Section landing page.** Brief overview of what the Foundations section covers. Cards linking to each article. Frame it as: "Before you configure a single tag, understand these concepts — they'll save you hundreds of hours of debugging."

---

### foundations/how-gtm-works.mdx
**Difficulty**: Beginner
**Purpose**: Demystify what GTM actually does at a technical level

**Must cover**:
- What the GTM container snippet actually does when it loads (the iframe, the script injection, the container JS)
- The GTM execution model: how it listens for events, evaluates triggers, fires tags
- The container lifecycle: page load → container download → dataLayer replay → event listeners active
- How the dataLayer queue works before GTM loads (the Array → object transformation)
- What "blocking" means in GTM and why tag execution order matters
- The difference between what happens on page load vs. what happens on events
- How GTM handles errors (spoiler: silently, which is a problem)

**Key opinions to express**:
- GTM is NOT just "a tag manager" — it's an event-driven execution engine in the browser
- Understanding the execution model is what separates people who debug for hours from people who debug for minutes

**Code examples**:
- The raw GTM snippet annotated line by line
- The dataLayer as an array before GTM loads vs. after
- A timeline diagram of a typical page load showing when GTM does what

---

### foundations/tags-triggers-variables.mdx
**Difficulty**: Beginner
**Purpose**: Build the correct mental model of GTM's core abstraction

**Must cover**:
- Tags: what fires (the action — sending data to GA4, Meta, etc.)
- Triggers: when it fires (the condition — page view, click, custom event, etc.)
- Variables: what data is available (the dynamic values — page URL, click text, dataLayer values, etc.)
- How these three connect: a trigger evaluates conditions using variables, and when true, fires its associated tags
- The evaluation flow: Event occurs → GTM checks all triggers → Matching triggers fire their tags → Tags execute using variable values
- Built-in vs. user-defined for each type
- Why this abstraction exists (separation of concerns, non-developer access)
- Limitations of this model (what you can't do, when you need custom HTML)

**Key opinions**:
- Think of triggers as event listeners with filter conditions, not as "buttons"
- The most common mistake is creating too many tags when you should restructure your triggers
- Variables are underused — investing in a good variable strategy saves enormous time

**Code examples**:
- Visual diagram of Tag ↔ Trigger ↔ Variable relationships
- A practical walkthrough: tracking a button click from event → trigger → tag → GA4

---

### foundations/when-not-to-use-gtm.mdx
**Difficulty**: Intermediate
**Purpose**: Honest assessment of when GTM is the wrong tool

**Must cover**:
- Performance-critical sites where every millisecond matters (GTM adds overhead)
- Simple single-tag setups where hardcoding is simpler
- When you need synchronous execution (GTM is async by design)
- Privacy-first architectures where you want zero client-side third-party code
- Server-to-server integrations that don't need a browser at all
- React/SPA applications where a tracking library might be more appropriate than GTM
- When the team lacks GTM expertise and hardcoded tracking is more maintainable
- The "GTM tax": container size, execution overhead, additional network requests

**Key opinions**:
- GTM is not always the answer — it's a great tool for the right problem
- If you have fewer than 3 tags and a developer team, hardcoding might be better
- The real value of GTM is organizational: marketing independence from dev cycles
- sGTM changes the calculation significantly (more cases where GTM makes sense)

---

### foundations/datalayer-deep-dive.mdx
**Difficulty**: Intermediate
**Purpose**: Complete technical understanding of the dataLayer

**Must cover**:
- What the dataLayer actually is: a JavaScript array used as a message bus
- The `dataLayer.push()` mechanism and why push, not assignment
- How GTM processes the dataLayer: the Abstract Data Model and recursive merge
- Object persistence: once pushed, properties persist until overwritten (the "sticky" behavior)
- The `event` key: why it's special and how it triggers GTM events
- DataLayer before GTM loads: the queue pattern and replay
- Nested objects and the merge behavior (and gotchas with arrays inside objects)
- The `gtm.js`, `gtm.dom`, `gtm.load` built-in events and when they fire
- How to properly clear ecommerce data between pushes (the `ecommerce: null` pattern)
- DataLayer vs. DOM scraping: why dataLayer is always better
- Performance implications of large dataLayer pushes

**Key opinions**:
- The dataLayer is a contract between your website and your analytics — treat it like an API
- ALWAYS clear ecommerce before pushing new ecommerce data
- Never rely on DOM scraping when you can push to the dataLayer
- The sticky merge behavior is both powerful and dangerous — document your expectations

**Code examples**:
- Basic push with event
- Ecommerce push with proper clearing
- Demonstrating the merge/persistence behavior
- Reading dataLayer state at any point
- TypeScript interface for a typed dataLayer
- Common gotcha: pushing nested arrays vs. objects

---

### foundations/gtm-for-developers.mdx
**Difficulty**: Beginner
**Purpose**: Entry point specifically for developers who need to implement dataLayer and support GTM

**Must cover**:
- "Your job as a developer" — implement the dataLayer, not the tags
- The handoff model: developers provide data via dataLayer, marketers/analysts configure tags in GTM
- How to implement dataLayer.push() in different frameworks (React, Next.js, Vue, vanilla JS)
- SPAs: the history change problem and how to handle virtual pageviews
- TypeScript typing for the dataLayer
- Testing your dataLayer implementation (console, GTM preview, automated tests)
- Performance considerations: when to push, what to push, batch vs. individual pushes
- Working with the analytics team: what documentation to ask for/provide
- Security: what NOT to push to the dataLayer (PII, tokens, sensitive data)

**Key opinions**:
- Developers should own the dataLayer, not GTM
- Push structured data, not UI state
- Never push PII to the dataLayer without explicit consent architecture

**Code examples**:
- React hook for dataLayer pushes
- Next.js App Router dataLayer setup
- Vue composable for tracking
- TypeScript dataLayer types
- Unit test for dataLayer events

---

### foundations/gtm-for-marketers.mdx
**Difficulty**: Beginner
**Purpose**: Entry point for non-technical users who work in GTM

**Must cover**:
- What you can do in GTM without developer help
- What requires developer involvement (dataLayer implementation)
- Reading the GTM interface: containers, workspaces, versions
- The publish workflow: workspace → preview → publish
- How to request dataLayer changes from developers (what to ask for)
- How to verify your tags are working
- Understanding tag firing rules without code
- Common self-service tasks: adding GA4 events, setting up conversion tracking, adding marketing pixels

**Key opinions**:
- You don't need to code to use GTM effectively, but you need to understand the dataLayer concept
- Always preview before publishing. Always.
- Build a naming convention on day one — your future self will thank you

---

### foundations/gtm-account-structure.mdx
**Difficulty**: Beginner
**Purpose**: How to organize GTM accounts, containers, and workspaces

**Must cover**:
- Account → Container hierarchy and when to use multiple of each
- One container per domain vs. shared containers (pros/cons)
- Container types: Web, AMP, iOS, Android, Server
- Workspaces: what they are, how to use them for parallel work
- Environments: default (Live, Latest, Now Editing) and custom environments
- User permissions: publish, approve, edit, read
- Naming your accounts and containers consistently
- Multi-brand / multi-site strategies

**Key opinions**:
- One web container per domain is the default. Shared containers are an anti-pattern for most teams.
- Use workspaces for any change that takes more than 10 minutes
- Set up at least a staging environment from day one

---

### foundations/glossary.mdx
**Difficulty**: Beginner
**Purpose**: Quick-reference glossary of GTM/GA4 terms

**Must cover**: Alphabetical glossary with concise definitions for every major term used across the docs. Include: Container, DataLayer, Tag, Trigger, Variable, Custom Event, Built-in Variable, Lookup Table, Regex Table, Workspace, Version, Environment, Client (sGTM), Claim (sGTM), Event Parameter, User Property, Custom Dimension, Custom Metric, Measurement ID, Data Stream, Consent Mode, Tag Sequencing, Trigger Group, Blocking Trigger, Exception Trigger, Preview Mode, Debug View, Container Snippet, GTM ID, Event Model (sGTM), and more.

Each entry: 1-3 sentences max. Link to the relevant deep-dive article.

---

## PART 2: CLIENT-SIDE GTM

### client-side/index.mdx
**Section landing page.** Overview of client-side GTM capabilities. Quick links to setup, triggers, variables, tags, tracking implementations, debugging, and management. Frame as: "Everything that happens in the browser."

---

### client-side/setup/container-installation.mdx
**Difficulty**: Beginner
**Purpose**: The definitive guide to installing GTM correctly

**Must cover**:
- The two-part snippet: `<head>` script and `<body>` noscript fallback
- Why placement matters (head for early loading, noscript for no-JS environments)
- Installing on static HTML sites
- Installing on WordPress (with and without plugins — recommend without)
- Installing on Shopify (theme.liquid placement)
- Installing on React/Next.js applications
- Common installation mistakes: wrong placement, duplicate containers, async/defer modifications
- Verifying installation: Tag Assistant, browser console, network tab
- The `dataLayer` initialization: when and why to declare it before the GTM snippet

**Code examples**:
- Standard GTM snippet with annotations
- Next.js Script component approach
- Verification commands for browser console

---

### client-side/setup/spa-setup.mdx
**Difficulty**: Intermediate
**Purpose**: Handling GTM in single-page applications

**Must cover**:
- The core problem: SPAs don't have traditional page loads after the initial one
- History Change trigger vs. custom virtual pageview events
- React Router, Next.js App Router, Vue Router integration patterns
- When to use History Change trigger (simple cases) vs. custom events (complex cases)
- Handling the "double pageview" problem (initial page load + SPA navigation)
- DataLayer cleanup between virtual pageviews
- Route change timing: pushing before vs. after component mount
- Title and URL tracking in SPAs (document.title may be stale)

**Key opinions**:
- Custom `page_view` events via dataLayer are more reliable than History Change triggers
- Always wait for the page component to mount before pushing the pageview event
- SPAs require more coordination between developers and analytics teams

**Code examples**:
- React Router v6 tracking hook
- Next.js App Router route change tracking
- Vue Router afterEach guard
- Custom page_view dataLayer push with all required parameters

---

### client-side/setup/google-consent-mode.mdx
**Difficulty**: Intermediate
**Purpose**: Implementing Google Consent Mode v2 via GTM

**Must cover**:
- What Consent Mode is and why it exists (EU regulations, Google's response)
- Consent Mode v2: `ad_storage`, `analytics_storage`, `ad_user_data`, `ad_personalization`, `functionality_storage`, `personalization_storage`, `security_storage`
- Default consent state: setting denied before GTM loads
- Updating consent state via `gtag('consent', 'update', {...})`
- How to connect your CMP (Consent Management Platform) to Consent Mode
- The `wait_for_update` parameter and timeout handling
- How Consent Mode affects GA4 data collection (pings still sent, but cookieless)
- Behavioral modeling in GA4: what it is, when it's available
- Advanced vs. Basic Consent Mode: differences and when to use each
- Testing consent mode: preview mode, console verification

**Key opinions**:
- Advanced Consent Mode is the recommended default — it gives you modeling data
- Set default consent state BEFORE GTM loads, not inside a GTM tag
- Test consent mode thoroughly — broken consent = legal liability

**Code examples**:
- Default consent state snippet (before GTM)
- Consent update push from CMP callback
- GTM tag configuration with consent settings
- Full integration example with Cookiebot/CookieYes

---

### client-side/setup/container-loading-strategies.mdx
**Difficulty**: Advanced
**Purpose**: Optimizing how and when GTM loads

**Must cover**:
- Default loading behavior and its performance impact
- Async vs. defer: what the GTM snippet already does
- Lazy-loading GTM: loading the container only after user interaction or scroll
- Performance metrics impact: CLS, LCP, TBT effects from GTM
- Container size optimization: removing unused tags, templates, variables
- Tag firing priority: which tags are truly needed on page load vs. after interaction
- Custom loader patterns: loading GTM only after consent is granted
- Measuring GTM's performance impact with Web Vitals

**Key opinions**:
- Most sites don't need to lazy-load GTM, but if you have a 500KB container, you have a problem
- The biggest performance killer isn't GTM itself — it's what you put inside it
- Audit container size quarterly

**Code examples**:
- Lazy-load GTM on first user interaction
- GTM loading after consent granted
- Performance measurement with Web Vitals API

---

### client-side/triggers/trigger-types-overview.mdx
**Difficulty**: Beginner
**Purpose**: Complete overview of every trigger type and when to use each

**Must cover**:
- Quick reference table: every trigger type, what it fires on, common use cases
- Categorization: Page-based (Page View, DOM Ready, Window Loaded), User interaction (Click, Form, Scroll), Time-based (Timer), Navigation (History Change), Custom (Custom Event, Trigger Groups)
- Trigger conditions and filters: how to narrow when a trigger fires
- Blocking triggers (exceptions): how to prevent a tag from firing in specific cases
- Trigger evaluation order: what happens when multiple triggers match

**This is a reference/overview page** that links to detailed pages for each trigger type.

---

### client-side/triggers/page-view-triggers.mdx
**Difficulty**: Beginner
**Purpose**: Page View, DOM Ready, and Window Loaded triggers explained

**Must cover**:
- Three page view trigger types and when each fires in the page lifecycle
- Page View (gtm.js): fires immediately when GTM processes, before DOM is ready
- DOM Ready (gtm.dom): fires when the HTML is fully parsed (DOMContentLoaded equivalent)
- Window Loaded (gtm.load): fires when all resources including images are loaded
- When to use which: GA4 config on Page View, DOM-dependent tags on DOM Ready, lazy tags on Window Loaded
- Filtering page view triggers by URL, path, hostname
- The "Some Page Views" option: URL matching (contains, equals, regex, starts with)

**Key opinions**:
- GA4 configuration tag should fire on Page View (earliest possible)
- Custom HTML tags that read the DOM should fire on DOM Ready minimum
- Window Loaded is rarely needed — don't use it as a default

---

### client-side/triggers/click-triggers.mdx
**Difficulty**: Beginner
**Purpose**: All Click and Link Click triggers

**Must cover**:
- All Clicks vs. Just Links: the fundamental difference
- How GTM listens for clicks (event delegation on the document)
- Click variables: Click Element, Click Classes, Click ID, Click Target, Click URL, Click Text
- CSS selector matching for precise click targeting
- The `gtm.click` and `gtm.linkClick` events
- Link Click trigger specifics: Check Validation (wait for tags), outbound links
- Bubbling and how clicks on child elements propagate
- Common problem: clicking an icon inside a button (Click Element vs. Click Target)
- Debugging clicks in Preview mode

**Key opinions**:
- Use CSS selectors over Click Classes when possible — they're more specific
- Always test click triggers with Preview mode — what you think the user clicks isn't always what GTM sees
- Check Validation should be ON for outbound link tracking

**Code examples**:
- CSS selector examples for common patterns
- DataLayer push approach as alternative to click triggers

---

### client-side/triggers/form-triggers.mdx
**Difficulty**: Intermediate
**Purpose**: Form submission trigger

**Must cover**:
- How the Form Submission trigger works (listens for HTML form submit events)
- Check Validation option: waits for form validation before firing
- Wait for Tags: ensures tags fire before the browser navigates to the form action URL
- Form variables: Form Element, Form Classes, Form ID, Form Target, Form URL, Form Text
- Limitations: doesn't work with AJAX forms, doesn't catch JavaScript-triggered submissions
- Workaround for AJAX forms: Custom Event triggers with dataLayer
- Multi-step forms: tracking step completion
- Form abandonment tracking approach

**Key opinions**:
- The built-in Form trigger is unreliable for modern web apps — use dataLayer events instead
- For any AJAX form or React/Vue form, always use Custom Event triggers
- Wait for Tags should be ON if the form navigates to a new page

**Code examples**:
- Basic form trigger setup
- AJAX form tracking via dataLayer
- React form submission tracking

---

### client-side/triggers/scroll-triggers.mdx
**Difficulty**: Beginner
**Purpose**: Scroll depth trigger

**Must cover**:
- Vertical and horizontal scroll depth options
- Percentage-based vs. pixel-based thresholds
- Setting multiple thresholds (25%, 50%, 75%, 90%, 100%)
- How the trigger fires: once per threshold per page load
- Variables available: Scroll Depth Threshold, Scroll Depth Units, Scroll Direction
- Filtering by page (not every page needs scroll tracking)
- Performance: the trigger uses `requestAnimationFrame`, not scroll events (efficient)
- Why 90% is often better than 100% as a "bottom" threshold (footer height varies)

**Key opinions**:
- Track scroll on content pages, not on every page
- 25/50/75/90 is the standard set — don't overcomplicate it
- Scroll depth is a soft engagement signal, not a hard metric

---

### client-side/triggers/timer-triggers.mdx
**Difficulty**: Intermediate
**Purpose**: Timer trigger for time-based events

**Must cover**:
- How the timer trigger works: interval in milliseconds, optional limit
- Use cases: engagement time tracking, session keepalive, delayed tag firing
- Setting a limit (fire once vs. repeating)
- Enabling conditions: fire only on specific pages or after specific events
- Combining with other data for engagement scoring
- Performance considerations: many timers = many evaluations

**Key opinions**:
- Timer triggers are niche — don't use them for engagement tracking when GA4 already tracks engaged time
- The main legitimate use case is firing a tag after a delay (e.g., pop-up survey trigger)

---

### client-side/triggers/custom-event-triggers.mdx
**Difficulty**: Intermediate
**Purpose**: The most powerful and flexible trigger type

**Must cover**:
- How Custom Event triggers work: listening for `event` keys in dataLayer.push()
- Event name matching: exact, contains, starts with, regex, does not equal
- Why Custom Events are the backbone of a well-implemented GTM setup
- Naming convention for custom events (snake_case recommended to align with GA4)
- Combining Custom Event triggers with trigger conditions
- The relationship between dataLayer events and GTM Custom Events
- Regex matching for event name patterns

**Key opinions**:
- Custom Event triggers should be your primary trigger type for anything beyond basic pageviews and clicks
- Establish a naming convention before your first push — changing later is painful
- Prefer custom events over DOM-based triggers (click, form, scroll) whenever you have developer access

**Code examples**:
- Basic custom event push and matching trigger
- Event naming convention examples
- Regex pattern for matching event families

---

### client-side/triggers/trigger-groups.mdx
**Difficulty**: Advanced
**Purpose**: Trigger Groups for complex firing conditions

**Must cover**:
- What trigger groups are: fire a tag only after multiple triggers have ALL fired
- Use cases: tag that fires only after both page load AND specific user action, ensuring dependencies are met
- How to configure: select multiple triggers, all must fire on the same page
- Limitations: all triggers must fire on the same page/session
- Practical example: fire a survey tag only after user has scrolled 50% AND spent 30 seconds

**Key opinions**:
- Trigger groups are underused — they solve the "fire after multiple conditions" problem elegantly
- If you're using Custom HTML to chain conditions, a Trigger Group might be simpler

---

### client-side/triggers/history-change-triggers.mdx
**Difficulty**: Intermediate
**Purpose**: History Change trigger for SPA navigation

**Must cover**:
- What it detects: `pushState`, `replaceState`, and `popstate` events
- Variables available: New History Fragment, Old History Fragment, New History State, Old History State, History Source
- When it fires vs. when it doesn't (hash changes vs. pushState)
- SPA frameworks and how they interact with History API
- The double-fire problem and how to handle it
- Limitations: doesn't fire on initial page load, may not capture all SPA navigations
- When to use History Change vs. custom dataLayer events

**Key opinions**:
- For simple SPAs, History Change is fine. For complex SPAs, use custom dataLayer events.
- Always verify with Preview mode that it fires when you expect and only when you expect

---

### client-side/variables/built-in-variables.mdx
**Difficulty**: Beginner
**Purpose**: Complete reference of all built-in GTM variables

**Must cover**:
- Full list of every built-in variable, organized by category
- Page variables: Page URL, Page Hostname, Page Path, Referrer
- Utility variables: Event, Container ID, Container Version, Random Number, HTML ID
- Error variables: Error Message, Error URL, Error Line, Debug Mode
- Click variables: Click Element, Click Classes, Click ID, Click Target, Click URL, Click Text
- Form variables: Form Element, Form Classes, Form ID, Form Target, Form URL, Form Text
- History variables: New/Old History Fragment, New/Old History State, History Source
- Video variables: Video Provider, Video Status, Video URL, Video Title, Video Duration, Video Current Time, Video Percent, Video Visible
- Scroll variables: Scroll Depth Threshold, Scroll Depth Units, Scroll Direction
- Visibility variables: Percent Visible, On-Screen Duration
- How to enable built-in variables (they're not all enabled by default)
- Which built-in variables to always enable

**Key opinions**:
- Enable all Click and Form built-in variables from day one — you'll need them for debugging even if you don't use them in triggers yet

---

### client-side/variables/datalayer-variables.mdx
**Difficulty**: Intermediate
**Purpose**: Reading data from the dataLayer

**Must cover**:
- How Data Layer Variables extract values from the dataLayer
- The dot notation for nested values (e.g., `ecommerce.items.0.item_name`)
- Data Layer Version: Version 1 vs Version 2 (always use Version 2)
- Default values: what to set and when
- The persistence model: dataLayer variables read the latest merged state
- Array access in dataLayer variables
- Formatting: how to transform values (no built-in formatting, use custom JS or lookup tables)

**Key opinions**:
- DataLayer variables are the cleanest way to get data — prefer them over DOM scraping always
- Always set a meaningful default value to prevent "undefined" from reaching your tags

**Code examples**:
- Various dot-notation paths for common dataLayer structures
- Ecommerce item access patterns

---

### client-side/variables/dom-element-variables.mdx
**Difficulty**: Intermediate
**Purpose**: Extracting data from the page DOM

**Must cover**:
- DOM Element variable: selecting by ID and reading an attribute
- Auto-Event Variable: accessing properties of the element that triggered the event
- When DOM elements are acceptable (legacy systems without dataLayer)
- Why DOM scraping is fragile (redesigns break tracking)
- CSS selectors for DOM variables
- Reading data attributes (`data-*`)
- Performance: DOM lookups on every event evaluation

**Key opinions**:
- DOM Element variables are a last resort — always prefer dataLayer
- If you must use DOM, prefer `data-*` attributes — they're more stable than class names
- Auto-Event Variables are useful for quick debugging but shouldn't be your production strategy

---

### client-side/variables/javascript-variables.mdx
**Difficulty**: Advanced
**Purpose**: Custom JavaScript variables

**Must cover**:
- How Custom JavaScript variables work: a function that returns a value
- The execution context: `this` refers to the dataLayer model
- Common use cases: combining variables, conditional logic, data transformation
- Performance: these run on every event evaluation, so keep them light
- Accessing other GTM variables inside Custom JavaScript variables
- Error handling: what happens when your JS throws an error
- Returning different types: strings, numbers, arrays, objects

**Key opinions**:
- Custom JS variables are powerful but can become a maintenance nightmare
- If your Custom JS variable is more than 10 lines, consider a Custom HTML tag or a dataLayer redesign instead
- Always wrap in try/catch for production safety

**Code examples**:
- Simple value transformation (format currency)
- Combining multiple variables
- Conditional variable based on URL
- Reading cookies
- Extracting UTM parameters

---

### client-side/variables/lookup-tables.mdx
**Difficulty**: Beginner
**Purpose**: Lookup Table variables for value mapping

**Must cover**:
- How Lookup Tables work: input variable → mapped output
- Setting up input/output pairs
- Default value for unmatched inputs
- Use cases: mapping page paths to page names, mapping event names to GA4 parameters
- Lookup Tables vs. Regex Tables: when to use which
- Ordering: first match wins

**Key opinions**:
- Lookup Tables are underappreciated — use them instead of complex Custom JavaScript
- They're the cleanest way to map internal values to analytics-friendly names

---

### client-side/variables/regex-tables.mdx
**Difficulty**: Intermediate
**Purpose**: Regex Table variables for pattern matching

**Must cover**:
- How Regex Tables differ from Lookup Tables: pattern matching instead of exact match
- Full Match Only vs. partial match
- Capture groups and replacement patterns ($1, $2, etc.)
- Advanced match options: Case Sensitive, Full Match
- Use cases: extracting product IDs from URLs, categorizing pages by URL patterns
- Performance: regex evaluation cost

**Key opinions**:
- Regex Tables are extremely useful for URL-based categorization
- Keep patterns simple — complex regex is hard to debug in GTM
- Always test with Preview mode using edge cases

**Code examples**:
- URL pattern to category mapping
- Extracting numeric IDs from URL paths
- Content type classification by URL

---

### client-side/variables/constant-variables.mdx
**Difficulty**: Beginner
**Purpose**: Constant and Google Analytics Settings variables

**Must cover**:
- Constant string variable: why and when to use it
- GA4 Measurement ID as a constant variable (the right pattern)
- Environment-specific constants
- Keeping configuration values in one place instead of hardcoding in tags

**Key opinions**:
- Always use a Constant variable for your GA4 Measurement ID — never hardcode it in tags
- Constants make environment switching trivial

---

### client-side/variables/user-defined-variables.mdx
**Difficulty**: Beginner
**Purpose**: Overview of all user-defined variable types

**Must cover**:
- Quick reference of all available variable types in GTM
- When to use which type (decision guide)
- 1st Party Cookie variable
- Custom JavaScript variable
- Data Layer variable
- JavaScript Variable (global JS variable reference)
- DOM Element
- HTTP Referrer
- URL variable (component extraction)
- Undefined Value
- Container Version Number / Environment Name

**This is a reference/overview page** linking to the detailed pages for each major type.

---

### client-side/tags/ga4-configuration-tag.mdx
**Difficulty**: Beginner
**Purpose**: Setting up the GA4 configuration tag correctly

**Must cover**:
- The Google Tag (replacement for GA4 Configuration Tag): what it does
- Measurement ID configuration
- Setting via constant variable (recommended) vs. hardcoding
- Fields to Set: common parameters to send on every event
- User Properties: how to set them via the tag
- Server Container URL (for sGTM routing)
- Consent settings on the tag
- Firing trigger: All Pages (Page View) — and why
- Send Page View: yes or no (and why yes is usually correct)
- Interaction with Consent Mode

**Key opinions**:
- One Google Tag per container. Period.
- Always use a constant variable for the Measurement ID
- Set user-scoped properties here, not in event tags

---

### client-side/tags/ga4-event-tag.mdx
**Difficulty**: Beginner
**Purpose**: Sending custom events to GA4

**Must cover**:
- GA4 Event tag setup: linked to Google Tag
- Event Name: hardcoded vs. variable-driven
- Event Parameters: key-value pairs
- User Properties: setting on specific events
- When to use hardcoded event names vs. using a variable for the event name
- Custom parameters: limits (25 per event, 50 custom dimensions per property)
- Parameter value length limits
- Send Ecommerce Data: checkbox for ecommerce events (reads from dataLayer automatically)

**Key opinions**:
- Use snake_case for all event names (matches GA4 convention and avoids issues)
- Keep parameter names short and consistent
- Don't create a separate GA4 Event tag for every event — use variables to make tags reusable

**Code examples**:
- Single reusable event tag with variable event name and parameters
- Ecommerce event tag configuration

---

### client-side/tags/custom-html-tags.mdx
**Difficulty**: Advanced
**Purpose**: Power user guide for Custom HTML tags

**Must cover**:
- What Custom HTML tags can do (anything: inject scripts, modify DOM, call APIs, push to dataLayer)
- Security implications: Custom HTML runs arbitrary JavaScript in the user's browser
- The execution context: access to `document`, `window`, `dataLayer`
- Accessing GTM variables inside Custom HTML: `{{Variable Name}}` syntax
- Tag sequencing with Custom HTML: setup tags and cleanup tags
- Common use cases: third-party pixel injection, custom tracking logic, A/B test integration
- Error handling: wrapping in try/catch
- Performance: blocking behavior, async patterns
- When to use Custom HTML vs. Community Gallery Templates

**Key opinions**:
- Custom HTML is the escape hatch — use it only when no other tag type works
- Always wrap in try/catch. Always.
- If your Custom HTML is injecting a script, consider whether it should be a tag template instead
- Community Gallery Templates are preferred over Custom HTML for common vendors

**Code examples**:
- Safe Custom HTML template with error handling
- Pushing computed data to the dataLayer from Custom HTML
- Conditional script injection based on consent

---

### client-side/tags/custom-image-tags.mdx
**Difficulty**: Intermediate
**Purpose**: Custom Image tags for pixel tracking

**Must cover**:
- How Custom Image tags work: load an image URL (tracking pixel)
- When to use: legacy tracking pixels, simple server-side logging
- Cache busting: the `gtmcb` parameter
- Enable Cache Busting option
- Modern alternatives: Custom HTML with `sendBeacon`, server-side endpoints
- Why Custom Image tags are increasingly rare

---

### client-side/tags/tag-sequencing.mdx
**Difficulty**: Intermediate
**Purpose**: Controlling tag execution order

**Must cover**:
- What tag sequencing is: setup tags (fire before) and cleanup tags (fire after)
- When you need it: consent check before tag fires, dataLayer enrichment before GA4 event
- Configuration: Setup Tag and Cleanup Tag options in Advanced Settings
- "Don't fire [tag] if [setup/cleanup] tag fails" option
- How sequencing interacts with async tags
- Alternatives: trigger ordering, dataLayer event chaining

**Key opinions**:
- Tag sequencing is essential for consent-dependent marketing pixels
- Don't use tag sequencing for complex orchestration — simplify your dataLayer instead
- If you have more than 2 levels of sequencing, you're overcomplicating things

---

### client-side/tags/tag-firing-priority.mdx
**Difficulty**: Advanced
**Purpose**: Tag firing priority and execution order

**Must cover**:
- Tag firing priority: numeric value that controls order (higher = fires first)
- Default priority: 0 for all tags
- How priority interacts with tag sequencing
- When priority matters: multiple tags on the same trigger
- Tag firing options: Once per event, Once per page, Unlimited
- Rate limiting and how it works
- Pausing tags: what it does and when to use it

---

### client-side/tracking/ecommerce-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Complete GA4 ecommerce tracking implementation

**Must cover**:
- The full GA4 ecommerce event lifecycle: view_item_list → select_item → view_item → add_to_cart → view_cart → begin_checkout → add_shipping_info → add_payment_info → purchase
- DataLayer structure for each event (full item arrays, not abbreviated)
- The items array: item_id, item_name, item_brand, item_category (4 levels), item_variant, price, quantity, index, affiliation, coupon, discount, item_list_id, item_list_name
- Currency handling: always pass `currency` and `value`
- The ecommerce null clearing pattern before each push
- GA4 Event tag configuration with "Send Ecommerce Data" checkbox
- Custom parameters beyond the standard set
- Common pitfalls: mismatched currencies, missing item_id, wrong data types (string "10" vs number 10)
- Verifying ecommerce data in GA4 DebugView and Realtime

**Key opinions**:
- `item_id` and `item_name` are non-negotiable. Every item needs both.
- Always clear ecommerce before pushing: `dataLayer.push({ ecommerce: null })`
- Use consistent `item_list_name` values — they power the Shopping Behavior report
- Don't abbreviate the items array in production — always send the full object

**Code examples**:
- Full dataLayer.push() for every ecommerce event
- GTM tag configuration for ecommerce
- TypeScript types for the ecommerce dataLayer
- Complete purchase event with all parameters

---

### client-side/tracking/form-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: All approaches to tracking form submissions

**Must cover**:
- Built-in Form Submission trigger (and its limitations)
- DataLayer approach: pushing a custom event on form submit
- AJAX form detection: mutation observers, network request monitoring
- Multi-step form tracking: tracking each step as a separate event
- Form field tracking (what they entered — with privacy considerations)
- Form abandonment tracking: detecting started-but-not-submitted forms
- Framework-specific: React forms, Vue forms, server actions
- Validation error tracking

**Code examples**:
- DataLayer push on form submit
- AJAX form tracking with custom event
- Multi-step form progress tracking
- Form abandonment detection script

---

### client-side/tracking/video-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Video engagement tracking

**Must cover**:
- Built-in YouTube Video trigger: how it works, what it captures
- YouTube trigger options: Start, Complete, Pause/Seek/Buffer, Progress (percentage thresholds)
- YouTube video variables: Video Provider, Status, URL, Title, Duration, Current Time, Percent, Visible
- Custom video tracking for non-YouTube players (Vimeo, HTML5 `<video>`, Wistia)
- DataLayer approach for custom video players
- Video engagement metrics: play rate, average watch time, completion rate
- GA4 event structure for video events

**Code examples**:
- YouTube trigger configuration
- Vimeo tracking via postMessage API
- HTML5 video tracking with custom events
- GA4 video event parameters

---

### client-side/tracking/file-download-tracking.mdx
**Difficulty**: Beginner
**Purpose**: Tracking file downloads

**Must cover**:
- Click trigger with URL matching for file extensions (.pdf, .xlsx, .docx, .zip, etc.)
- GA4 enhanced measurement: file_download (what it catches automatically vs. what it misses)
- Regex matching for file extensions in trigger conditions
- DataLayer approach for downloads behind authentication
- Download tracking for dynamically generated files (blob URLs)
- Event parameters: file name, file extension, link URL

**Code examples**:
- Click trigger with regex for file extensions
- DataLayer push for authenticated downloads
- GA4 event structure for file_download

---

### client-side/tracking/outbound-link-tracking.mdx
**Difficulty**: Beginner
**Purpose**: Tracking clicks to external sites

**Must cover**:
- Link Click trigger with hostname filtering
- GA4 enhanced measurement: outbound links (what it does automatically)
- Custom outbound link tracking: when enhanced measurement isn't enough
- Wait for Tags + Check Validation: ensuring the tag fires before navigation
- Excluding specific domains (partner sites, payment gateways)
- Tracking specific outbound links (social media, referral links)

---

### client-side/tracking/scroll-depth-tracking.mdx
**Difficulty**: Beginner
**Purpose**: Implementing scroll depth tracking

**Must cover**:
- Built-in Scroll trigger configuration
- GA4 enhanced measurement scroll tracking (only fires at 90% — not enough)
- Custom scroll milestones: 25%, 50%, 75%, 90%
- Page-specific scroll tracking: enabling only on content pages
- Scroll depth as an engagement signal
- Combining scroll depth with time on page for engagement scoring
- GA4 event parameters for scroll events

---

### client-side/tracking/error-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Tracking JavaScript errors and application errors

**Must cover**:
- The JavaScript Error trigger in GTM
- Built-in error variables: Error Message, Error URL, Error Line
- Catching unhandled promise rejections
- Application error tracking via dataLayer (API failures, validation errors, 404 pages)
- Sending errors to GA4: event structure and parameters
- Filtering noise: which errors matter and which to ignore
- Error grouping strategies for GA4 reporting

**Code examples**:
- GTM error trigger setup
- DataLayer push for application errors
- 404 page tracking
- API error tracking in fetch/axios interceptors

---

### client-side/tracking/user-id-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Implementing User-ID for cross-device tracking

**Must cover**:
- What User-ID is in GA4 and how it affects reporting
- Setting user_id via the Google Tag (Config tag)
- When to set it: on login, not on every page
- Hashing considerations: raw email vs. hashed ID vs. internal ID
- PII concerns: never send raw email as user_id
- DataLayer implementation: pushing user identity after authentication
- Clearing user_id on logout
- GA4 User-ID reporting and identity spaces

**Key opinions**:
- Use an internal, opaque user ID — never use email or PII
- Set user_id in the dataLayer on every page if the user is logged in, not just on the login event
- User-ID dramatically improves GA4 cross-device reporting — implement it if you have authenticated users

---

### client-side/tracking/cross-domain-tracking.mdx
**Difficulty**: Intermediate
**Purpose**: Cross-domain tracking setup

**Must cover**:
- What cross-domain tracking solves: maintaining user identity across domains
- How it works: the `_gl` parameter, linker decorating, automatic cookie reading
- Configuration via the Google Tag: adding domains to Cross Domain section
- How to verify it's working: checking the `_gl` parameter in URLs
- Multiple domains: comma-separated domain list
- Subdomains: do you need cross-domain? (usually no — cookies apply to parent domain)
- Common pitfalls: redirects stripping `_gl`, link decorating on forms, iframes
- Excluding referrals: the unwanted referral list in GA4
- Troubleshooting: the referral exclusion list, checking cookie values

**Key opinions**:
- Most "cross-domain" issues are actually subdomain issues that don't need cross-domain tracking
- Always test with real navigation, not just Preview mode
- The `_gl` parameter is ugly but necessary — don't strip it in your app

---

### client-side/debugging/preview-mode.mdx
**Difficulty**: Beginner
**Purpose**: Complete guide to GTM Preview mode

**Must cover**:
- How to enter Preview mode: the Preview button and Tag Assistant window
- The Tag Assistant interface: Summary, Variables, Data Layer, Errors tabs
- Reading the event timeline: what each event means
- Checking which tags fired and which didn't (and why)
- Inspecting variable values at each event
- Viewing dataLayer state at each event
- Sharing Preview mode with colleagues (the Preview link)
- Debug mode in GA4 DebugView: how Preview mode activates it
- Common Preview mode issues: loading the wrong container version, caching

**Key opinions**:
- Preview mode is your primary debugging tool — learn it deeply
- Always check the Variables tab, not just the Tags tab
- If a tag didn't fire, check the trigger conditions in detail — one unmet condition blocks everything

---

### client-side/debugging/tag-assistant.mdx
**Difficulty**: Beginner
**Purpose**: Using Google Tag Assistant for debugging

**Must cover**:
- Tag Assistant Chrome extension vs. embedded Tag Assistant
- What it shows: tag status, errors, recommendations
- Tag health indicators: green/blue/yellow/red
- Using Tag Assistant alongside Preview mode
- Limitations: what it can't tell you
- Tag Assistant for GA4: verifying event and parameter collection

---

### client-side/debugging/console-debugging.mdx
**Difficulty**: Intermediate
**Purpose**: Browser console techniques for GTM debugging

**Must cover**:
- Inspecting the dataLayer: `window.dataLayer` and `JSON.stringify(dataLayer, null, 2)`
- Listening for dataLayer pushes: overriding `dataLayer.push`
- Monitoring GTM events: `google_tag_manager["GTM-XXXX"].dataLayer.get("event")`
- Network tab: filtering for GA4 collection requests (`/collect?`)
- Decoding GA4 Measurement Protocol payloads
- Setting breakpoints in Custom HTML tags
- Console commands for quick debugging

**Code examples**:
- DataLayer inspection one-liners
- DataLayer push monitor snippet
- GA4 payload decoder function
- Quick container ID lookup

---

### client-side/debugging/datalayer-debugging.mdx
**Difficulty**: Intermediate
**Purpose**: Debugging dataLayer-specific issues

**Must cover**:
- Common dataLayer problems: wrong data types, missing properties, stale data
- The merge behavior: how old values persist and cause unexpected results
- Debugging ecommerce data: verifying item arrays
- Timing issues: pushing before GTM loads vs. after
- DataLayer not defined errors and how to fix them
- Tools: DataLayer Inspector Chrome extension, GTM/GA Debug extension
- Creating a custom dataLayer validation function

**Code examples**:
- DataLayer state inspector function
- Type checking for ecommerce data
- Validation function for required parameters

---

### client-side/debugging/common-errors.mdx
**Difficulty**: Beginner
**Purpose**: Solutions to the most common GTM problems

**Must cover** (problem → solution format):
- Tags not firing: missing trigger conditions, consent blocking, tag paused
- Double-firing tags: SPA page views, multiple trigger matches, duplicate containers
- Missing dataLayer data: timing, variable name mismatch, wrong version setting
- Cross-domain not working: _gl parameter stripping, redirect issues, missing domains
- Consent Mode blocking everything: wrong default state, update not firing
- Preview mode not loading: browser extensions, ad blockers, wrong container
- Container not publishing: permission issues, workspace conflicts
- Ecommerce data missing: no ecommerce clearing, checkbox not enabled, wrong item structure
- GA4 events not appearing: processing delay (24-48h), parameter limits exceeded, filters

---

### client-side/management/naming-conventions.mdx
**Difficulty**: Beginner
**Purpose**: Definitive naming convention guide for GTM

**Must cover**:
- Why naming conventions matter: 50+ tags becomes unmanageable without them
- Recommended tag naming: `[Platform] - [Type] - [Description]` (e.g., `GA4 - Event - Purchase`, `Meta - Pixel - PageView`)
- Recommended trigger naming: `[Type] - [Condition]` (e.g., `CE - purchase`, `Click - CTA Button`)
- Recommended variable naming: `[Type] - [Description]` (e.g., `DLV - page_type`, `Const - GA4 Measurement ID`)
- Folder naming: by platform, by function, or by team
- DataLayer event naming: snake_case aligned with GA4
- What to avoid: abbreviations nobody understands, inconsistent casing, "test" or "copy of" names in production

**Key opinions**:
- Pick a convention on day one and enforce it ruthlessly
- Prefix with platform/type — you'll thank yourself when you have 100 tags
- Delete or rename "Copy of" tags immediately — they cause confusion

---

### client-side/management/folder-organization.mdx
**Difficulty**: Beginner
**Purpose**: Organizing GTM containers with folders

**Must cover**:
- Folder structure strategies: by platform (GA4, Meta, LinkedIn, etc.), by function (Tracking, Marketing, Consent), or by page section
- Recommended approach: organize by platform at top level
- Moving tags, triggers, variables into folders
- Folder naming conventions
- When a container needs reorganization (warning signs)
- Bulk operations: moving multiple items

---

### client-side/management/version-control.mdx
**Difficulty**: Beginner
**Purpose**: Version management and publishing workflow

**Must cover**:
- Version history: what's stored, how to access it
- Version naming: descriptive names for every publish (not "Version 47")
- Version notes: what to include (what changed, why, who requested it)
- Rolling back: how to restore a previous version
- Comparing versions: the built-in diff view
- Publishing workflow: workspace → Preview → test → publish
- Approval workflows: when to use Approve permission level
- Container export/import for backup

**Key opinions**:
- Never publish without a version name and description
- Screenshot your Preview mode test results before publishing
- Export your container weekly as a JSON backup

---

### client-side/management/workspaces.mdx
**Difficulty**: Intermediate
**Purpose**: Using workspaces for collaborative GTM management

**Must cover**:
- What workspaces are: parallel editing environments within a container
- Default workspace vs. additional workspaces
- When to create a workspace: concurrent projects, testing branches, agency work
- Workspace conflicts: what happens when two workspaces edit the same item
- Resolving conflicts: the merge process
- Workspace limits (varies by GTM tier)
- Best practices: one workspace per project, clear naming, regular syncing

---

### client-side/management/environments.mdx
**Difficulty**: Intermediate
**Purpose**: GTM environments for staging, dev, production

**Must cover**:
- Built-in environments: Live, Latest, Now Editing
- Custom environments: creating staging, dev, QA environments
- Environment snippets: different container code per environment
- Use case: testing container changes on staging before publishing to production
- Environment authorization codes and security
- Combining environments with workspaces

---

### client-side/management/permissions.mdx
**Difficulty**: Beginner
**Purpose**: GTM user permissions and access control

**Must cover**:
- Permission levels: Read, Edit, Approve, Publish (container level) and Admin, User (account level)
- Recommended permission structure for different team sizes
- Agency access: how to grant and revoke
- Two-factor authentication requirements
- Audit trail: who changed what and when
- Permission management for compliance

---

## PART 3: SERVER-SIDE GTM

### server-side/index.mdx
**Section landing page.** Overview of server-side GTM: what it is, why it exists, who needs it. Quick cards to subsections. Frame as: "Everything that happens on the server."

---

### server-side/fundamentals/why-server-side.mdx
**Difficulty**: Beginner
**Purpose**: Honest explanation of why sGTM exists and when it matters

**Must cover**:
- The problem: browsers blocking third-party requests, ITP/ETP cookie restrictions, ad blockers
- The solution: move tag execution from browser to server
- Real benefits: first-party data collection, longer cookie lifetimes, reduced client payload, data enrichment before sending to vendors, PII redaction
- Overhyped benefits: "better performance" (only if you remove client-side tags), "bypass ad blockers" (ethically questionable framing)
- The cost: hosting, complexity, maintenance, debugging difficulty
- Who actually needs sGTM: ecommerce sites spending significant ad budget, sites in regulated industries, sites with heavy third-party tag load

**Key opinions**:
- sGTM is not for everyone. If you have 3 tags and low traffic, it's unnecessary overhead.
- The killer feature is data enrichment and PII redaction, not "bypassing ad blockers"
- The real value is data quality and control, not performance

---

### server-side/fundamentals/architecture-overview.mdx
**Difficulty**: Intermediate
**Purpose**: How sGTM works architecturally

**Must cover**:
- The full request flow: Browser → GTM Client-Side (sends to first-party endpoint) → sGTM Server (receives, processes) → Vendor endpoints (GA4, Meta, etc.)
- Components: Clients (receive incoming requests), Tags (send outgoing requests), Variables, Triggers
- The Event Model: how incoming data is mapped to a standard format
- How sGTM differs from a regular proxy (it's not just forwarding — it's transforming and routing)
- Infrastructure: Cloud Run/App Engine on GCP, or custom hosting
- The relationship between client-side GTM container and server-side GTM container
- Network topology diagram

**Include**: Architecture diagram showing the full data flow

---

### server-side/fundamentals/client-vs-server-comparison.mdx
**Difficulty**: Beginner
**Purpose**: Clear comparison of client-side vs. server-side GTM

**Must cover**:
- Side-by-side comparison table: execution environment, data access, cookie control, debugging, cost, complexity
- What moves to server vs. what stays on client
- Hybrid approach: most implementations use BOTH (client-side sends to server-side)
- Migration considerations: what changes in your client-side setup when adding sGTM
- Performance comparison: real numbers (network requests, payload size, page load impact)

---

### server-side/fundamentals/when-to-use-sgtm.mdx
**Difficulty**: Intermediate
**Purpose**: Decision framework for adopting sGTM

**Must cover**:
- Decision criteria: traffic volume, ad spend, number of vendor tags, data privacy requirements, team capability
- ROI calculation: hosting costs vs. benefits (better attribution, longer cookies, reduced tag load)
- Prerequisites: technical team capable of managing cloud infrastructure
- Starting small: phasing sGTM for GA4 first, then adding vendor tags
- Warning signs you need sGTM: declining conversion attribution, short cookie lifetimes, ad blocker impact

---

### server-side/setup/gcp-setup.mdx
**Difficulty**: Advanced
**Purpose**: Step-by-step sGTM setup on Google Cloud Platform

**Must cover**:
- GCP project creation and billing setup
- Cloud Run deployment (recommended over App Engine for cost control)
- Environment variables and container configuration
- Custom domain mapping to Cloud Run
- SSL/TLS certificate setup
- Health checks and auto-scaling configuration
- Cost estimation: requests, compute, network egress
- Monitoring with Cloud Logging and Cloud Monitoring
- Production hardening: minimum instances, request timeout, memory allocation

**Step-by-step with screenshots/config** for each step.

---

### server-side/setup/aws-setup.mdx
**Difficulty**: Advanced
**Purpose**: sGTM on AWS (alternative to GCP)

**Must cover**:
- Why AWS: cost, existing infrastructure, team expertise
- Architecture: ECS Fargate or EC2 with Docker container
- GTM server-side Docker image configuration
- Load balancer and custom domain setup
- SSL certificate via ACM
- Auto-scaling configuration
- CloudWatch monitoring
- Cost comparison with GCP

---

### server-side/setup/stape-setup.mdx
**Difficulty**: Beginner
**Purpose**: sGTM via Stape.io (managed hosting)

**Must cover**:
- What Stape is: managed sGTM hosting that removes GCP/AWS complexity
- Setup walkthrough: account creation, container linking, domain configuration
- Pricing model and cost comparison with self-hosting
- Stape-specific features: power-ups, monitoring dashboard
- Limitations vs. self-hosting
- When Stape makes sense: small-medium teams, limited DevOps, quick start

---

### server-side/setup/custom-domain-setup.mdx
**Difficulty**: Intermediate
**Purpose**: Setting up a first-party subdomain for sGTM

**Must cover**:
- Why a custom domain matters: first-party context, cookie access, trusted domain
- Subdomain choice: `sgtm.example.com`, `collect.example.com`, `metrics.example.com`
- DNS configuration: CNAME or A record to your sGTM server
- SSL certificate setup and renewal
- Updating client-side GTM to send to the custom domain (transport_url / server_container_url)
- Verifying the setup: network tab, cookie inspection
- CDN considerations (don't CDN your sGTM endpoint)

---

### server-side/setup/first-party-domain-config.mdx
**Difficulty**: Intermediate
**Purpose**: First-party cookie and data collection setup

**Must cover**:
- How first-party context works with sGTM: same-site cookies, no third-party blocking
- Cookie settings: domain, path, Secure, HttpOnly, SameSite
- Setting cookies from the server container (via HTTP response headers)
- Cookie lifetime extension: how sGTM can refresh first-party cookies
- The `_ga` cookie: how GA4 client-ID works in a first-party sGTM context
- Privacy implications: first-party ≠ unrestricted

---

### server-side/setup/cloud-run-scaling.mdx
**Difficulty**: Advanced
**Purpose**: Scaling and optimizing Cloud Run for sGTM

**Must cover**:
- Request-based vs. CPU-based autoscaling
- Minimum instances to avoid cold starts
- Maximum instances and cost caps
- Concurrency settings (requests per instance)
- CPU allocation: always-on vs. request-only
- Memory sizing for different container loads
- Traffic patterns and scaling behavior
- Cost optimization strategies

---

### server-side/clients/what-are-clients.mdx
**Difficulty**: Intermediate
**Purpose**: The Client concept in sGTM

**Must cover**:
- What a Client is: the component that receives incoming HTTP requests
- How Clients work: they "claim" requests, parse them, and create an Event Model
- The Event Model: a standardized data object that tags read from
- Client priority: when multiple clients exist, the first to claim wins
- Built-in vs. custom clients
- Client output: what data the Event Model contains

---

### server-side/clients/ga4-web-client.mdx
**Difficulty**: Intermediate
**Purpose**: The GA4 web client (default)

**Must cover**:
- How the GA4 web client works: receives Measurement Protocol requests from the browser
- Default settings and configuration options
- What the client parses: event name, parameters, user properties, client ID
- The Event Model mapping: how MP parameters become Event Model properties
- Default endpoint path: `/g/collect` and customization
- Debugging client claim behavior

---

### server-side/clients/custom-clients.mdx
**Difficulty**: Advanced
**Purpose**: Building custom clients for non-GA4 data sources

**Must cover**:
- When to build a custom client: receiving webhooks, non-GA4 tracking endpoints, custom data pipelines
- Client template structure: `claimRequest`, `runContainer`, response handling
- The Sandboxed JavaScript API for clients
- Reading request headers, body, path, query parameters
- Creating the Event Model from arbitrary data
- Setting response headers and cookies
- Testing custom clients

**Code examples**:
- Simple webhook receiver client
- Custom client for a specific data format

---

### server-side/clients/client-claiming.mdx
**Difficulty**: Advanced
**Purpose**: Deep dive on how client claiming works

**Must cover**:
- The claim mechanism: clients are evaluated in priority order
- When a client claims a request vs. passes it
- Priority configuration: how to set which client gets first dibs
- Multiple clients for different endpoints
- Debugging: which client claimed which request
- The default client (catches unclaimed requests)

---

### server-side/tags/ga4-server-tag.mdx
**Difficulty**: Intermediate
**Purpose**: The GA4 tag in sGTM

**Must cover**:
- What it does: sends data to GA4 from the server
- Configuration: Measurement ID, API Secret (for server-to-server)
- Default behavior: forwards the Event Model to GA4 collection endpoint
- Overriding event parameters in the tag
- Adding/removing parameters before sending
- The relationship between client-side GA4 → sGTM → GA4 servers
- Deduplication: avoiding double-counting when transitioning from client-side to sGTM

---

### server-side/tags/facebook-capi.mdx
**Difficulty**: Intermediate
**Purpose**: Facebook Conversions API via sGTM

**Must cover**:
- What CAPI is and why Facebook requires/recommends it
- The Facebook CAPI tag in sGTM Community Gallery
- Configuration: Access Token, Pixel ID, Test Event Code
- Event mapping: GA4 events to Facebook events
- Deduplication with browser pixel (event_id matching)
- User data parameters: hashed email, phone, etc.
- Match quality score and how to improve it
- Testing with Facebook Events Manager

**Code examples**:
- Tag configuration walkthrough
- Event mapping table (GA4 → Facebook standard events)
- Deduplication setup

---

### server-side/tags/tiktok-events-api.mdx
**Difficulty**: Intermediate
**Purpose**: TikTok Events API via sGTM

**Must cover**:
- TikTok Events API overview
- sGTM tag setup: Access Token, Pixel ID
- Event mapping: GA4 events to TikTok events
- User identity parameters
- Deduplication with browser pixel
- Testing and verification

---

### server-side/tags/google-ads-conversions.mdx
**Difficulty**: Intermediate
**Purpose**: Google Ads conversion tracking via sGTM

**Must cover**:
- Google Ads Conversion Tracking tag in sGTM
- Configuration: Conversion ID, Conversion Label
- Enhanced conversions setup: hashed user data
- Consent Mode interaction in sGTM
- Click ID (`gclid`) handling and forwarding
- Conversion value and currency

---

### server-side/tags/custom-http-requests.mdx
**Difficulty**: Advanced
**Purpose**: Making arbitrary HTTP requests from sGTM

**Must cover**:
- The HTTP Request tag: sending data to any endpoint
- Configuration: URL, method, headers, body
- Building request bodies from Event Model data
- Authentication: API keys, Bearer tokens, OAuth
- Error handling and retry logic
- Use cases: sending to data warehouses, custom analytics, CRM systems
- Rate limiting considerations

**Code examples**:
- POST to a webhook endpoint
- Sending ecommerce data to a custom API
- BigQuery Streaming Insert from sGTM

---

### server-side/tags/firestore-writer.mdx
**Difficulty**: Advanced
**Purpose**: Writing data to Firestore from sGTM

**Must cover**:
- The Firestore tag: writing events directly to a database
- Use cases: real-time event log, user activity store, conversion backup
- Configuration: project ID, collection, document structure
- Document field mapping from Event Model
- Cost considerations: Firestore pricing per write
- Alternatives: BigQuery, Cloud Storage

---

### server-side/advanced/event-enrichment.mdx
**Difficulty**: Advanced
**Purpose**: Enriching event data on the server

**Must cover**:
- What enrichment means: adding data to events that isn't available on the client
- Use cases: user segments from CRM, product metadata from catalog, geo-enrichment, currency conversion
- Enrichment via Firestore Lookup variable
- Enrichment via custom HTTP requests to internal APIs
- Adding computed fields to the Event Model
- The timing consideration: enrichment adds latency to the request pipeline
- Cache strategies for frequently accessed enrichment data

**Code examples**:
- Firestore lookup for user segment
- Custom variable that calls an internal API
- Adding product category from a product catalog

---

### server-side/advanced/server-side-cookies.mdx
**Difficulty**: Advanced
**Purpose**: Cookie management from sGTM

**Must cover**:
- How sGTM sets cookies via HTTP response headers
- First-party cookie advantages: longer lifetimes, HttpOnly, Secure
- Setting the `_ga` cookie from sGTM vs. browser JavaScript
- Cookie duration: server-set cookies can have longer expiry (not capped by browser)
- ITP/ETP context: how server-set cookies avoid some browser restrictions
- Custom cookie strategies: server-generated client IDs
- Cookie consent: still need consent, just because it's server-side doesn't exempt you

---

### server-side/advanced/user-stitching.mdx
**Difficulty**: Advanced
**Purpose**: Connecting anonymous users to known users

**Must cover**:
- The stitching challenge: anonymous browsing → login → associating history
- Server-side stitching approaches: matching client_id to user_id
- Using Firestore or an external database for identity mapping
- When to stitch: on login event, on form submission
- Privacy considerations: explicit consent, data minimization
- Sending stitched data to GA4, Facebook, Google Ads

---

### server-side/advanced/data-redaction-pii.mdx
**Difficulty**: Advanced
**Purpose**: Removing PII before data reaches vendors

**Must cover**:
- The PII problem: user data accidentally reaching analytics/advertising vendors
- Server-side redaction: removing or hashing PII before forwarding
- Common PII sources: URL parameters (email in query strings), form data, user agents
- Automatic redaction patterns: regex-based email stripping, phone number removal
- Selective forwarding: sending full data to GA4 but redacted data to third-party vendors
- Compliance benefits: sGTM as a data processing gateway
- Logging and auditing redactions

**Code examples**:
- URL parameter PII redaction
- Email hashing before forwarding
- Custom transformation variable for PII stripping

---

### server-side/advanced/custom-templates.mdx
**Difficulty**: Advanced
**Purpose**: Building custom tag and client templates

**Must cover**:
- Template editor: the sandboxed JavaScript environment
- APIs available: sendHttpRequest, getCookieValues, getRequestHeader, setResponseHeader, etc.
- Template types: Tag templates, Client templates, Variable templates
- Community Gallery: publishing and sharing templates
- Testing templates: the Test tab
- Permissions model: what APIs the template can access
- Real-world example: building a custom analytics endpoint tag

**Code examples**:
- Simple tag template that sends data to a webhook
- Client template that receives and parses custom data
- Variable template that transforms data

---

### server-side/advanced/monitoring-logging.mdx
**Difficulty**: Advanced
**Purpose**: Monitoring sGTM in production

**Must cover**:
- Cloud Logging: what sGTM logs, how to access it
- Custom logging from tags and clients (logToConsole)
- Cloud Monitoring: setting up dashboards for sGTM
- Key metrics: request count, response time, error rate, container CPU/memory
- Alerting: setting up alerts for errors, latency spikes, cost overruns
- Health check endpoint configuration
- Request tracing for debugging

---

### server-side/operations/cost-management.mdx
**Difficulty**: Intermediate
**Purpose**: Managing sGTM hosting costs

**Must cover**:
- Cost breakdown: compute (Cloud Run instances), network (egress), storage (logs)
- Cost estimation formulas based on request volume
- Optimization strategies: right-sizing instances, minimizing cold starts, request batching
- Scaling policies that balance cost and performance
- Free tier limits and when you exceed them
- Monthly cost examples: 100K, 1M, 10M, 100M requests
- Stape vs. GCP vs. AWS cost comparison at different scales

---

### server-side/operations/scaling-strategies.mdx
**Difficulty**: Advanced
**Purpose**: Scaling sGTM for high-traffic sites

**Must cover**:
- Traffic patterns: steady load vs. spike-based (sales events, campaigns)
- Auto-scaling configuration for different providers
- Multi-region deployment for global sites
- Load testing your sGTM setup
- Graceful degradation: what happens when sGTM is overloaded
- CDN integration: when and how (hint: rarely for sGTM endpoints)

---

### server-side/operations/uptime-monitoring.mdx
**Difficulty**: Intermediate
**Purpose**: Ensuring sGTM stays up

**Must cover**:
- Uptime monitoring services: UptimeRobot, Pingdom, GCP Uptime Checks
- Health check endpoints
- Alert configuration: who gets notified, how fast
- Failover strategies: what happens if sGTM goes down
- Client-side fallback: configuring GTM to fall back to direct collection
- SLA considerations for your analytics pipeline

---

### server-side/operations/debugging-sgtm.mdx
**Difficulty**: Intermediate
**Purpose**: Debugging sGTM issues

**Must cover**:
- Preview mode for sGTM: how to access it
- Reading the sGTM Preview interface: Clients, Tags, Variables, Console
- Connecting client-side Preview to server-side Preview
- Network tab debugging: checking what reaches your sGTM endpoint
- Cloud Logging for production debugging
- Common issues: client not claiming, tag failing silently, incorrect Event Model mapping
- Testing with Postman/curl: sending manual requests to your sGTM endpoint

---

## PART 4: DATALAYER

### datalayer/index.mdx
**Section landing page.** Frame the dataLayer as a contract/API between the website and analytics tools. Link to specification, ecommerce events, custom events, platform guides, and validation.

---

### datalayer/specification/naming-conventions.mdx
**Difficulty**: Intermediate
**Purpose**: Definitive naming convention for dataLayer events and parameters

**Must cover**:
- Event naming: snake_case, matching GA4 convention
- Parameter naming: snake_case, short but descriptive
- Reserved prefixes: `gtm.` (reserved by GTM), `ga_` (reserved by GA4)
- Namespace strategy: `app_`, `shop_`, `content_` prefixes for custom events
- Boolean naming: `is_logged_in`, `has_cart_items` pattern
- Array naming: plural nouns (`items`, `products`, `categories`)
- Consistency rules: once named, never rename without versioning

**Include**: A complete naming convention reference table.

---

### datalayer/specification/event-naming-rules.mdx
**Difficulty**: Intermediate
**Purpose**: How to name events correctly

**Must cover**:
- GA4 recommended events: use them when they fit, don't force them
- Custom event naming: when to create your own vs. use recommended
- The 40-character limit for event names
- 500 distinct event names per GA4 property limit
- Event hierarchy: grouping related events with prefixes
- Events vs. parameters: when something should be an event vs. a parameter on an existing event
- Anti-patterns: creating events for every click, using event names as data

---

### datalayer/specification/parameter-naming-rules.mdx
**Difficulty**: Intermediate
**Purpose**: How to name event parameters

**Must cover**:
- GA4 auto-collected parameters: `page_location`, `page_title`, `page_referrer`, etc.
- Custom parameter naming conventions
- The 25 custom parameter limit per event (and 50 custom dimension limit per property)
- Parameter length limits: 100 characters for name, 500 for value
- Data type considerations: string vs. number vs. boolean
- Parameter reuse: using consistent parameter names across events
- Reserved parameter names

---

### datalayer/specification/data-types.mdx
**Difficulty**: Intermediate
**Purpose**: Data type standards for dataLayer values

**Must cover**:
- String: when and how (always for IDs, names, categories)
- Number: when and how (always for prices, quantities, scores)
- Boolean: when and how (always for flags and toggles)
- Array: when and how (items, lists)
- Object: when and how (nested data)
- Common mistakes: "10.99" (string) vs 10.99 (number) for prices
- Currency handling: number for value, string for currency code
- Date/time handling: ISO 8601 strings
- Null and undefined: when to explicitly pass vs. omit

---

### datalayer/specification/versioning-strategy.mdx
**Difficulty**: Advanced
**Purpose**: How to version your dataLayer specification

**Must cover**:
- Why versioning matters: multiple teams, API consumers, breaking changes
- Semantic versioning for dataLayer specs
- Version indicator in the dataLayer: `dataLayer.push({ spec_version: "2.1" })`
- Breaking vs. non-breaking changes
- Migration path: supporting old and new formats simultaneously
- Documentation as code: keep the spec in git alongside the implementation
- Change management process for teams

---

### datalayer/ecommerce/ecommerce-overview.mdx
**Difficulty**: Intermediate
**Purpose**: Overview of the full GA4 ecommerce dataLayer

**Must cover**:
- The GA4 ecommerce event flow (funnel order)
- The items array: the core data structure shared across all events
- Required vs. optional parameters for each event
- Cross-references to individual event pages
- The ecommerce clearing pattern
- Currency and value handling across events
- A complete diagram of the ecommerce funnel with events

---

### datalayer/ecommerce/view-item-list.mdx
**Difficulty**: Intermediate
**Purpose**: Complete view_item_list event specification

**Must cover**:
- When to fire: product listing pages, category pages, search results
- Full dataLayer.push() with all parameters
- Items array for list context: `item_list_id`, `item_list_name`, `index`
- Handling large lists: pagination and lazy loading considerations
- Multiple lists on one page: promotions sidebar + main results
- GTM configuration for this event

**Code examples**: Full dataLayer.push(), GTM tag config, TypeScript type

---

### datalayer/ecommerce/select-item.mdx
**Difficulty**: Intermediate
**Purpose**: Complete select_item event specification

**Must cover**:
- When to fire: user clicks a product in a list
- Linking to the list context: `item_list_id`, `item_list_name` from the list
- DataLayer structure with single item
- GTM trigger and tag configuration

**Code examples**: Full dataLayer.push(), context preservation pattern

---

### datalayer/ecommerce/view-item.mdx
**Difficulty**: Intermediate
**Purpose**: Complete view_item event specification

**Must cover**:
- When to fire: product detail page view
- Full item details: all item parameters
- Value and currency (the product price)
- Multiple variants: handling color/size selection
- GTM configuration

**Code examples**: Full dataLayer.push() with all parameters

---

### datalayer/ecommerce/add-to-cart.mdx
**Difficulty**: Intermediate
**Purpose**: Complete add_to_cart event specification

**Must cover**:
- When to fire: user adds product to cart (button click, quantity update)
- Handling quantity: adding 3 items at once
- Value calculation: price × quantity
- Quick-add vs. detail-page add: same event, different contexts
- GTM configuration

**Code examples**: Full dataLayer.push(), quantity handling

---

### datalayer/ecommerce/remove-from-cart.mdx
**Difficulty**: Intermediate
**Purpose**: Complete remove_from_cart event specification

**Must cover**:
- When to fire: user removes product from cart
- Handling partial removal (reduce quantity by 1 vs. remove entirely)
- DataLayer structure
- GTM configuration

---

### datalayer/ecommerce/view-cart.mdx
**Difficulty**: Intermediate
**Purpose**: Complete view_cart event specification

**Must cover**:
- When to fire: cart page view
- Full cart contents in items array
- Cart value calculation: sum of all items
- Currency handling
- GTM configuration

---

### datalayer/ecommerce/begin-checkout.mdx
**Difficulty**: Intermediate
**Purpose**: Complete begin_checkout event specification

**Must cover**:
- When to fire: user initiates checkout (clicks "Checkout" button)
- Full cart contents
- Coupon code at event level
- Value and currency
- GTM configuration

---

### datalayer/ecommerce/add-shipping-info.mdx
**Difficulty**: Intermediate
**Purpose**: Complete add_shipping_info event specification

**Must cover**:
- When to fire: user completes shipping step in checkout
- Shipping tier parameter
- Full item details
- Coupon at item and event level
- GTM configuration

---

### datalayer/ecommerce/add-payment-info.mdx
**Difficulty**: Intermediate
**Purpose**: Complete add_payment_info event specification

**Must cover**:
- When to fire: user completes payment step
- Payment type parameter (credit_card, paypal, klarna, etc.)
- Full item details
- GTM configuration

---

### datalayer/ecommerce/purchase.mdx
**Difficulty**: Intermediate
**Purpose**: Complete purchase event specification

**Must cover**:
- When to fire: order confirmation page (and only once per transaction)
- Transaction parameters: transaction_id, value, tax, shipping, currency
- Deduplication: preventing duplicate purchase events (using transaction_id)
- Full item details with quantity and price
- Affiliation parameter for marketplace scenarios
- GTM configuration
- Verifying purchase data in GA4

**Code examples**: Full purchase dataLayer.push() with all parameters, deduplication logic

---

### datalayer/ecommerce/refund.mdx
**Difficulty**: Intermediate
**Purpose**: Complete refund event specification

**Must cover**:
- When to fire: order is refunded (full or partial)
- Full refund vs. partial refund handling
- Transaction ID reference
- Items being refunded (for partial refunds)
- Server-side implementation (refunds often happen server-side)
- Measurement Protocol for server-side refunds

---

### datalayer/ecommerce/view-promotion.mdx
**Difficulty**: Intermediate
**Purpose**: Promotion tracking events

**Must cover**:
- `view_promotion` and `select_promotion` events
- Promotion parameters: promotion_id, promotion_name, creative_name, creative_slot
- When to use: banner ads, special offers, internal promotions
- Linking promotions to products
- GTM configuration

---

### datalayer/custom-events/login-signup.mdx
**Difficulty**: Beginner
**Purpose**: Login and sign_up event specifications

**Must cover**:
- GA4 recommended events: `login` and `sign_up`
- Method parameter: google, email, facebook, etc.
- When to fire: after successful authentication
- Setting user_id and user properties alongside login
- Privacy: never push the actual credentials

**Code examples**: login and sign_up dataLayer pushes

---

### datalayer/custom-events/search.mdx
**Difficulty**: Beginner
**Purpose**: Site search event specification

**Must cover**:
- GA4 recommended event: `search`
- Search_term parameter
- Additional parameters: results_count, search_category, search_filters
- When to fire: on search results page load, or on search submit
- Tracking zero-result searches

---

### datalayer/custom-events/form-submission.mdx
**Difficulty**: Intermediate
**Purpose**: Custom form event specifications

**Must cover**:
- Event design for different form types: contact, lead gen, newsletter, application
- Recommended parameters: form_name, form_id, form_type, form_location
- What NOT to push: form field values with PII
- Multi-step form events: form_start, form_step, form_complete
- Error events: form_error with error details

**Code examples**: Form events for various types

---

### datalayer/custom-events/content-engagement.mdx
**Difficulty**: Intermediate
**Purpose**: Content engagement event specifications

**Must cover**:
- Content-specific events: article_read, video_play, content_share, content_save
- Parameters: content_type, content_id, content_title, content_author, content_category
- Reading depth events (distinct from scroll depth)
- Time-on-content events
- Social sharing events

---

### datalayer/custom-events/error-events.mdx
**Difficulty**: Intermediate
**Purpose**: Error event specifications

**Must cover**:
- Application error events: error type, message, severity, source
- 404 page events
- API failure events
- Form validation error events
- JavaScript error events
- Event design: enough detail to debug, not so much it's overwhelming

**Code examples**: Error event dataLayer pushes for each type

---

### datalayer/custom-events/custom-event-design.mdx
**Difficulty**: Advanced
**Purpose**: How to design new custom events from scratch

**Must cover**:
- The decision framework: does this need to be an event or a parameter?
- Event naming checklist
- Required vs. optional parameters
- Documentation template for new events
- Review process: who approves new events
- Testing new events before production deployment
- Impact assessment: custom dimension slots, processing volume

---

### datalayer/platforms/shopify.mdx
**Difficulty**: Intermediate
**Purpose**: DataLayer implementation for Shopify

**Must cover**:
- Shopify's built-in analytics vs. custom implementation
- theme.liquid: GTM installation
- Shopify Customer Events (the newer approach) vs. theme-based tracking
- DataLayer pushes for: page view, product view, add to cart, checkout steps, purchase
- Accessing Shopify Liquid variables for product data
- Shopify AJAX cart: tracking add-to-cart without page reload
- Checkout extensibility limitations
- Shopify Plus vs. standard: what's available where

**Code examples**: Complete Shopify dataLayer implementation with Liquid code

---

### datalayer/platforms/woocommerce.mdx
**Difficulty**: Intermediate
**Purpose**: DataLayer implementation for WooCommerce

**Must cover**:
- Plugin options vs. custom implementation
- wp_enqueue_script approach for dataLayer
- WooCommerce hooks for ecommerce events
- Product data access via PHP
- AJAX add-to-cart handling
- Checkout page events
- Thank you page purchase event (with deduplication)

**Code examples**: PHP code for WooCommerce dataLayer implementation

---

### datalayer/platforms/magento.mdx
**Difficulty**: Intermediate
**Purpose**: DataLayer implementation for Magento/Adobe Commerce

**Must cover**:
- Magento 2 frontend architecture and event system
- Layout XML for GTM installation
- JavaScript mixins for tracking events
- Customer data and product data access
- Checkout step tracking
- Full page cache considerations

---

### datalayer/platforms/nextjs.mdx
**Difficulty**: Intermediate
**Purpose**: DataLayer implementation for Next.js applications

**Must cover**:
- App Router vs. Pages Router differences
- GTM installation with next/script
- Route change tracking: the usePathname approach
- DataLayer push from React components
- Server Components vs. Client Components: where to push
- TypeScript dataLayer typing
- Ecommerce implementation in a headless architecture

**Code examples**: Complete Next.js tracking setup with App Router, custom hook, typed dataLayer

---

### datalayer/platforms/nuxtjs.mdx
**Difficulty**: Intermediate
**Purpose**: DataLayer implementation for Nuxt.js

**Must cover**:
- Nuxt 3 plugin for GTM
- Route middleware for page tracking
- Composable for dataLayer pushes
- Head management for GTM snippet
- TypeScript support

**Code examples**: Nuxt 3 GTM plugin and tracking composable

---

### datalayer/platforms/wordpress.mdx
**Difficulty**: Beginner
**Purpose**: DataLayer implementation for WordPress

**Must cover**:
- Plugin options: Google Site Kit, GTM4WP, manual implementation
- Manual implementation via functions.php / custom plugin
- wp_enqueue_script for dataLayer
- WordPress hooks for page-level data
- Archive, single post, category, author page data
- User login tracking
- Contact Form 7 / Gravity Forms integration

---

### datalayer/validation/validation-approaches.mdx
**Difficulty**: Intermediate
**Purpose**: Overview of dataLayer validation strategies

**Must cover**:
- Why validation matters: bad data in = bad insights out
- Browser-side validation: real-time checking during development
- Automated testing: CI/CD integration
- Runtime monitoring: catching issues in production
- Schema-based validation: defining expectations formally
- The validation pyramid: development → staging → production

---

### datalayer/validation/typescript-schemas.mdx
**Difficulty**: Advanced
**Purpose**: TypeScript types for dataLayer validation

**Must cover**:
- TypeScript interfaces for all ecommerce events
- Generic dataLayer push type
- Discriminated unions for event types
- Type-safe dataLayer.push wrapper function
- Integrating with your build pipeline (compile-time validation)
- Generating TypeScript types from a JSON Schema

**Code examples**: Full TypeScript type definitions for the complete ecommerce dataLayer

---

### datalayer/validation/runtime-validation.mdx
**Difficulty**: Advanced
**Purpose**: Validating dataLayer pushes at runtime

**Must cover**:
- Zod schemas for runtime validation
- DataLayer push interceptor pattern
- Logging invalid pushes without blocking them
- Error reporting for invalid data
- Development vs. production validation modes
- Performance considerations

**Code examples**: Zod schema for ecommerce events, interceptor pattern, error reporting

---

### datalayer/validation/automated-testing.mdx
**Difficulty**: Advanced
**Purpose**: E2E and integration testing for dataLayer

**Must cover**:
- Playwright/Cypress tests for dataLayer events
- Testing the complete flow: page load → interaction → dataLayer push verification
- Intercepting dataLayer.push in test context
- Snapshot testing for dataLayer state
- CI/CD integration: running dataLayer tests on every deploy
- Testing ecommerce flows end-to-end
- Mock data strategies

**Code examples**: Playwright test for ecommerce funnel, Cypress dataLayer assertions, CI config

---

## PART 5: GA4

### ga4/index.mdx
**Section landing page.** Overview of GA4 configuration and analysis topics. Frame as: "GTM gets data into GA4 — this section helps you make the most of it."

---

### ga4/fundamentals/data-model.mdx
**Difficulty**: Beginner
**Purpose**: Understanding GA4's event-based data model

**Must cover**:
- How GA4 differs from Universal Analytics (sessions → events)
- Everything is an event: page_views, clicks, conversions — all events
- Event structure: event name + parameters
- Event types: automatically collected, enhanced measurement, recommended, custom
- User properties: persistent attributes attached to users
- Sessions in GA4: how they're constructed from events (session_start event)
- The flat vs. nested data model (why BigQuery export looks different from the UI)

---

### ga4/fundamentals/events-parameters-properties.mdx
**Difficulty**: Beginner
**Purpose**: Deep dive on events, parameters, and user properties

**Must cover**:
- Event parameters: event-scoped data (sent with each event)
- User properties: user-scoped data (persists across events)
- Custom dimensions: how event parameters become reportable dimensions
- Custom metrics: how numeric parameters become reportable metrics
- Limits: 25 parameters per event, 25 user properties, 50 custom dimensions, 50 custom metrics
- Automatically collected parameters: engagement_time_msec, page_location, page_title, etc.
- Reserved event names and parameter names

---

### ga4/fundamentals/sessions-and-attribution.mdx
**Difficulty**: Intermediate
**Purpose**: How GA4 handles sessions, sources, and attribution

**Must cover**:
- Session definition: starts with session_start, 30-minute inactivity timeout
- Session source/medium: how it's determined (first interaction of the session)
- Traffic sources: how GA4 categorizes sources (UTM parameters, referrer, direct)
- Attribution models: data-driven, last click, first click
- Default channel groupings and how to customize them
- Cross-channel attribution: how GA4 credits conversions to touchpoints
- Why session counts differ from UA

---

### ga4/fundamentals/data-streams.mdx
**Difficulty**: Beginner
**Purpose**: Data stream configuration

**Must cover**:
- What data streams are: web, iOS, Android
- Web data stream configuration
- Measurement ID (G-XXXXXXXX) and where to find it
- Enhanced Measurement: what it auto-tracks and how to configure it
- Multiple data streams: when to use (rarely) and when to avoid
- Data stream settings and filters

---

### ga4/configuration/property-setup.mdx
**Difficulty**: Beginner
**Purpose**: Optimal GA4 property configuration

**Must cover**:
- Property creation best practices
- Industry category and business size settings
- Timezone and currency configuration (affects reporting)
- Data retention settings: 2 months vs. 14 months (always choose 14)
- Google Signals: what it enables and privacy implications
- Reporting Identity: blended, observed, device-based
- Data collection settings
- Linking to Google Ads, Search Console, BigQuery

**Key opinions**:
- Always set 14-month data retention
- Enable Google Signals only if you understand the privacy implications
- Link to BigQuery from day one — it's free and you'll want the historical data later

---

### ga4/configuration/custom-dimensions.mdx
**Difficulty**: Intermediate
**Purpose**: Setting up custom dimensions correctly

**Must cover**:
- Event-scoped vs. user-scoped custom dimensions
- Registration: mapping event parameters to custom dimensions in GA4 admin
- The 50 event-scoped and 25 user-scoped custom dimension limit
- Naming: keep it readable in reports
- Planning ahead: dimension audit before registration
- What happens when you don't register: data is collected but not reportable
- Changing or deleting custom dimensions

---

### ga4/configuration/custom-metrics.mdx
**Difficulty**: Intermediate
**Purpose**: Setting up custom metrics

**Must cover**:
- When to use custom metrics vs. event count
- Numeric parameter to custom metric mapping
- Unit of measurement: standard, currency, time
- The 50 custom metric limit
- Use cases: revenue by custom calculation, engagement scores, custom counters

---

### ga4/configuration/audiences.mdx
**Difficulty**: Intermediate
**Purpose**: Building audiences in GA4

**Must cover**:
- Audience types: conditions, sequences, exclusions
- Audience triggers: firing events when users enter/exit audiences
- Membership duration settings
- Using audiences in Google Ads for remarketing
- Predictive audiences: likely purchasers, likely churners
- Audience limits and management

---

### ga4/configuration/conversions.mdx
**Difficulty**: Beginner
**Purpose**: Setting up conversion tracking in GA4

**Must cover**:
- Marking events as conversions (now called "Key Events" in GA4)
- Default conversions: purchase, first_open
- Custom conversions from custom events
- Conversion counting: once per event vs. once per session
- Conversion value assignment
- Google Ads conversion import from GA4
- Testing conversions in DebugView

---

### ga4/configuration/data-filters.mdx
**Difficulty**: Intermediate
**Purpose**: Filtering data in GA4

**Must cover**:
- Internal traffic filter: setting up by IP
- Developer traffic filter: filtering debug mode traffic
- Filter states: testing, active, inactive
- Bot filtering (automatic in GA4)
- Why GA4 doesn't have views like UA (and what to use instead)
- Data filter limitations

---

### ga4/configuration/channel-groupings.mdx
**Difficulty**: Intermediate
**Purpose**: Customizing channel groupings

**Must cover**:
- Default channel groupings in GA4 and what rules define each
- Creating custom channel groupings
- Use cases: separating branded vs. non-branded paid search, custom affiliate channel
- Channel grouping rules and priority
- Impact on reporting: where channel groupings appear

---

### ga4/configuration/attribution-settings.mdx
**Difficulty**: Advanced
**Purpose**: Attribution model configuration

**Must cover**:
- Reporting attribution model: data-driven vs. last click
- Attribution windows: conversion and engagement lookback
- Google paid channels vs. all channels
- How attribution model changes affect historical data (retroactive)
- Understanding data-driven attribution: the machine learning model
- When to change from defaults

---

### ga4/reporting/standard-reports.mdx
**Difficulty**: Beginner
**Purpose**: Navigating GA4's standard reports

**Must cover**:
- Report navigation structure: Life cycle, User, App developer, Library
- Acquisition reports: overview, user acquisition, traffic acquisition
- Engagement reports: events, conversions, pages and screens
- Monetization reports: ecommerce purchases, in-app purchases
- Retention reports: cohort analysis
- Customizing standard reports: adding/removing dimensions, filters
- Report library: creating custom report collections
- Comparisons: applying segments to standard reports

---

### ga4/reporting/explore-reports.mdx
**Difficulty**: Intermediate
**Purpose**: Building Exploration reports

**Must cover**:
- Exploration types: Free-form, Funnel, Path, Segment overlap, Cohort, User lifetime
- Building a free-form exploration: dimensions, metrics, filters, segments
- Segments: how to create and apply
- Sharing explorations with team members
- Date ranges and comparison periods
- Exporting data from explorations
- Exploration limits and sampling

---

### ga4/reporting/funnel-exploration.mdx
**Difficulty**: Intermediate
**Purpose**: Funnel analysis in GA4

**Must cover**:
- Building funnels: step definition by event, page, or dimension
- Open vs. closed funnels
- Funnel visualization: trended and standard
- Breakdowns: seeing funnel performance by dimension
- Elapsed time between steps
- Funnel segment creation: targeting users who dropped off
- Comparing funnels with different segments

---

### ga4/reporting/path-exploration.mdx
**Difficulty**: Intermediate
**Purpose**: Path analysis in GA4

**Must cover**:
- Starting vs. ending point analysis
- Node types: event name, page title, page path
- Expanding and collapsing nodes
- Filtering paths by segment
- Use cases: finding common navigation patterns, identifying drop-off paths

---

### ga4/reporting/segment-overlap.mdx
**Difficulty**: Intermediate
**Purpose**: Segment overlap analysis

**Must cover**:
- What segment overlap shows: commonality between user groups
- Creating segments for overlap analysis
- Use cases: overlap between converters and specific behaviors
- Up to 3 segments for comparison
- Actionable insights from overlap data

---

### ga4/bigquery/export-setup.mdx
**Difficulty**: Intermediate
**Purpose**: Setting up BigQuery export

**Must cover**:
- Why BigQuery: unlimited data retention, SQL access, no sampling, raw event data
- Enabling the link in GA4 admin
- GCP project and dataset configuration
- Daily export vs. streaming export (and cost implications)
- Export types: daily tables, intraday tables
- Verifying export is working
- Cost estimation: storage and query costs
- BigQuery sandbox: free tier limitations

**Key opinions**:
- Enable BigQuery export on day one. The data is free to store (within limits) and you can't backfill.
- Daily export is sufficient for most use cases. Streaming export is expensive.

---

### ga4/bigquery/schema-reference.mdx
**Difficulty**: Advanced
**Purpose**: Complete reference of the GA4 BigQuery export schema

**Must cover**:
- Table structure: `events_YYYYMMDD` daily tables, `events_intraday_YYYYMMDD` for streaming
- Top-level fields: event_date, event_timestamp, event_name, event_params, user_properties, etc.
- The RECORD type: event_params and user_properties as repeated key-value records
- Unnesting event_params: the fundamental query pattern
- User pseudo ID and user ID
- Device, geo, traffic source fields
- Ecommerce fields and items array
- Privacy-related fields: privacy_info

**Code examples**: Schema diagram, basic select queries for each major field

---

### ga4/bigquery/common-queries.mdx
**Difficulty**: Intermediate
**Purpose**: Copy-paste SQL queries for common GA4 analysis

**Must cover** (each as a ready-to-use query):
- Page views by page path
- Users and sessions per day
- Events by event name
- Custom event parameter extraction
- Ecommerce revenue by product
- Conversion rate calculation
- User acquisition source/medium
- Landing page performance
- Average session duration
- Event sequence analysis (user journey)
- Top exit pages

**Code examples**: Complete, tested SQL for each query

---

### ga4/bigquery/session-reconstruction.mdx
**Difficulty**: Advanced
**Purpose**: Building sessions from raw event data

**Must cover**:
- Why session reconstruction is necessary (GA4 BQ export is event-level, not session-level)
- Session ID: `ga_session_id` from event_params
- Session start and end timestamps
- Session-level aggregations: duration, event count, page count
- Landing page and exit page per session
- Traffic source per session
- Session-scoped metrics: bounce rate alternative, engagement rate
- The complete session reconstruction query

**Code examples**: Full session reconstruction SQL, session-level aggregation patterns

---

### ga4/bigquery/funnel-analysis-sql.mdx
**Difficulty**: Advanced
**Purpose**: Building funnels in BigQuery

**Must cover**:
- Step-based funnel construction in SQL
- Sequential event matching (user did A then B then C)
- Time-constrained funnels (within X minutes)
- Drop-off analysis at each step
- Funnel by dimension (device, source, campaign)
- Comparison with GA4 UI funnel exploration
- When to use BigQuery vs. GA4 UI for funnels

**Code examples**: Complete funnel query, time-constrained funnel, dimensional funnel

---

### ga4/bigquery/cost-optimization.mdx
**Difficulty**: Intermediate
**Purpose**: Reducing BigQuery costs for GA4 analysis

**Must cover**:
- Query cost basics: bytes processed = cost
- Partitioning: always filter by `_TABLE_SUFFIX` or `event_date`
- Column selection: never use `SELECT *` on GA4 tables
- Materialized views for common queries
- Scheduled queries for dashboards (query once, cache result)
- Clustering strategies for GA4 tables
- Cost monitoring: setting up budgets and alerts
- BI Engine: when it makes sense for GA4 data
- Approximate functions: `APPROX_COUNT_DISTINCT` vs. `COUNT(DISTINCT)`

---

### ga4/troubleshooting/data-discrepancies.mdx
**Difficulty**: Intermediate
**Purpose**: Why GA4 numbers don't match other tools

**Must cover**:
- GA4 vs. Google Ads: attribution model differences, conversion counting
- GA4 vs. backend data: timing, sampling, threshold application
- GA4 UI vs. BigQuery: sampling, data freshness, processing time
- GA4 vs. UA: methodology changes, session definition, bounce rate vs. engagement rate
- Consent Mode impact on numbers
- Ad blocker impact
- Timezone differences between tools
- Threshold application: when GA4 hides data (low counts)

---

### ga4/troubleshooting/missing-data.mdx
**Difficulty**: Intermediate
**Purpose**: Diagnosing missing data in GA4

**Must cover**:
- Events not appearing: processing delay (24-48h standard), DebugView as real-time check
- Ecommerce data missing: misconfigured tags, missing parameters
- Users/sessions lower than expected: consent mode, ad blockers, bot filtering
- Custom dimensions showing "(not set)": unregistered parameters, timing issues
- BigQuery export missing data: streaming vs. daily, intraday table behavior
- Systematic debugging approach: browser → GTM → GA4 DebugView → reports

---

### ga4/troubleshooting/debugview.mdx
**Difficulty**: Beginner
**Purpose**: Using GA4 DebugView effectively

**Must cover**:
- What DebugView shows: real-time event stream per user
- Activating debug mode: GTM Preview, `debug_mode` parameter, Chrome extension
- Reading the DebugView timeline: events, parameters, user properties
- Filtering by event name
- Checking parameter values and custom dimensions
- DebugView vs. Realtime report: different purposes
- How long debug data appears

---

### ga4/troubleshooting/realtime-validation.mdx
**Difficulty**: Beginner
**Purpose**: Using GA4 Realtime report for validation

**Must cover**:
- What Realtime shows: users, events, conversions in the last 30 minutes
- Event count by name: quick validation that events are arriving
- Comparison with DebugView: Realtime is aggregated, DebugView is per-user
- Limitations: not all dimensions available, delayed by a few minutes
- When to use Realtime vs. DebugView vs. BigQuery for validation

---

### ga4/troubleshooting/common-mistakes.mdx
**Difficulty**: Beginner
**Purpose**: The most common GA4 configuration mistakes

**Must cover** (problem → fix format):
- Not registering custom dimensions (data collected but not reportable)
- Wrong data retention setting (2 months loses exploration data)
- Duplicate events from enhanced measurement + manual tracking
- Not excluding internal traffic
- Missing BigQuery link (can't backfill)
- Wrong conversion counting (once per event vs. once per session)
- Not setting up Google Ads link
- Ignoring consent mode (behavioral modeling disabled)
- Too many custom event names (approaching 500 limit)
- Not using user_id when available

---

## PART 6: CONSENT & PRIVACY

### consent/index.mdx
**Section landing page.** Overview of consent and privacy topics. Frame as: "Getting tracking right legally and ethically."

---

### consent/consent-mode-v2.mdx
**Difficulty**: Intermediate
**Purpose**: Complete guide to Google Consent Mode v2

**Must cover**:
- What Consent Mode v2 is and why Google introduced it
- The consent types: ad_storage, analytics_storage, ad_user_data, ad_personalization, functionality_storage, personalization_storage, security_storage
- How it works: default state → user choice → update state
- Impact on data collection: what happens when consent is denied (pings still sent, but cookieless and limited)
- Behavioral modeling: how GA4 fills in the gaps
- EU regulatory context: GDPR, ePrivacy Directive
- Google Ads requirements: why Consent Mode is now mandatory for EU user data

---

### consent/consent-mode-gtm-setup.mdx
**Difficulty**: Intermediate
**Purpose**: Step-by-step Consent Mode setup in GTM

**Must cover**:
- Setting default consent state (before GTM loads)
- The gtag-based approach vs. dataLayer-based approach
- Configuring default state per region
- Updating consent state on user interaction
- Consent settings on individual tags
- Built-in consent checks: which tags respect which consent types
- Verification: checking consent state in Preview mode
- The `wait_for_update` parameter

**Code examples**: Full implementation from default state to update

---

### consent/cmp-integration.mdx
**Difficulty**: Intermediate
**Purpose**: Connecting CMP platforms to Consent Mode

**Must cover**:
- What a CMP does and why you need one
- Popular CMPs: Cookiebot, CookieYes, OneTrust, Usercentrics, Iubenda
- Integration patterns: CMP callback → gtag consent update
- GTM Community Gallery templates for CMPs
- CMP-specific configuration walkthroughs
- Verifying CMP → GTM → GA4 consent flow
- Handling CMP errors: what happens when CMP fails to load

**Code examples**: Integration snippets for major CMPs

---

### consent/consent-state-datalayer.mdx
**Difficulty**: Advanced
**Purpose**: Managing consent state via dataLayer

**Must cover**:
- Pushing consent state to the dataLayer
- Reading consent state in GTM triggers (conditional firing based on consent)
- Custom consent signals: enterprise-specific consent categories
- Consent state persistence: how to maintain consent across pages
- Consent change events: tracking when users change preferences
- Integrating with non-Google tags that don't support Consent Mode natively

---

### consent/advanced-consent-mode.mdx
**Difficulty**: Intermediate
**Purpose**: Advanced Consent Mode explained

**Must cover**:
- What "Advanced" means: sends cookieless pings even without consent
- How pings work without cookies: no unique identifiers, limited data
- What Google uses the pings for: behavioral modeling in GA4, conversion modeling in Ads
- When to use Advanced vs. Basic
- Privacy implications: some regulators have opinions on pings without consent
- Configuration for Advanced mode

---

### consent/basic-consent-mode.mdx
**Difficulty**: Intermediate
**Purpose**: Basic Consent Mode explained

**Must cover**:
- What "Basic" means: no data sent until consent is granted
- Zero data collection before consent
- Impact: no behavioral modeling, significant data gap
- When Basic is required: strict interpretations of GDPR, certain DPAs
- Configuration for Basic mode
- Comparing data loss: Advanced vs. Basic

---

### consent/server-side-consent.mdx
**Difficulty**: Advanced
**Purpose**: Consent handling in sGTM

**Must cover**:
- How consent signals reach sGTM
- The consent state in the Event Model
- Conditional tag firing based on consent in sGTM
- Blocking vendor tags without consent
- PII handling: redacting data when consent changes
- The compliance advantage of sGTM: central control point

---

### consent/testing-consent.mdx
**Difficulty**: Intermediate
**Purpose**: How to test your consent implementation

**Must cover**:
- Testing default denied state: verifying no cookies are set
- Testing consent grant: verifying tags fire and cookies appear
- Testing consent withdrawal: verifying behavior
- Browser tools: Application tab for cookies, Network tab for requests
- GTM Preview mode: checking consent signals
- GA4 DebugView: verifying consent-dependent events
- Automated testing approaches for consent flows
- Checklist: complete consent testing protocol

---

## PART 7: RECIPES

### recipes/index.mdx
**Section landing page.** Searchable quick-reference page. Each recipe is a self-contained problem → solution pair. Frame as: "Skip the theory. Find your answer."

---

> **Note for all recipe articles**: Each recipe should follow a consistent format:
> 1. **The Problem** (1-2 sentences)
> 2. **The Solution** (step-by-step implementation)
> 3. **The Code** (copy-paste ready)
> 4. **Verification** (how to confirm it's working)
> 5. **Common Gotchas** (what might go wrong)

### recipes/track-button-clicks.mdx
**Difficulty**: Beginner — Track specific button clicks and send them to GA4. Cover: CSS selector approach, data-attribute approach, dataLayer approach. Include GTM trigger and tag configuration.

### recipes/track-form-submissions.mdx
**Difficulty**: Beginner — Track form submissions for lead gen. Cover: native forms, AJAX forms, multi-step forms. Recommend the dataLayer approach over GTM's built-in form trigger.

### recipes/track-pdf-downloads.mdx
**Difficulty**: Beginner — Track PDF and document downloads. Cover: link click trigger with file extension regex, GA4 enhanced measurement comparison, custom event approach.

### recipes/track-video-engagement.mdx
**Difficulty**: Intermediate — Track YouTube and custom video player engagement. Cover: built-in YouTube trigger, Vimeo integration, HTML5 video tracking.

### recipes/track-scroll-milestones.mdx
**Difficulty**: Beginner — Implement scroll depth tracking at 25/50/75/90%. Cover: GTM scroll trigger, GA4 event structure, page filtering.

### recipes/track-404-errors.mdx
**Difficulty**: Beginner — Track 404 page visits. Cover: dataLayer approach on 404 template, GTM trigger and GA4 event, including the requested URL.

### recipes/track-internal-search.mdx
**Difficulty**: Beginner — Track site search queries. Cover: URL parameter reading, dataLayer approach, zero-results tracking.

### recipes/track-tab-visibility.mdx
**Difficulty**: Intermediate — Track when users switch tabs or minimize the browser. Cover: Page Visibility API, dataLayer event, use cases (engagement measurement).

### recipes/track-copy-paste.mdx
**Difficulty**: Intermediate — Track text copy events on content pages. Cover: clipboard API, dataLayer event, content identification.

### recipes/dynamic-remarketing.mdx
**Difficulty**: Intermediate — Set up dynamic remarketing with GA4 and Google Ads. Cover: ecommerce dataLayer requirements, Google Ads tag configuration, custom parameters for non-ecommerce.

### recipes/enhanced-conversions.mdx
**Difficulty**: Intermediate — Implement Google Ads Enhanced Conversions via GTM. Cover: user-provided data variables, hashing, tag configuration, testing.

### recipes/offline-conversion-import.mdx
**Difficulty**: Advanced — Import offline conversions into Google Ads via GA4. Cover: GCLID capture, backend storage, Measurement Protocol upload, conversion import setup.

### recipes/cross-domain-setup.mdx
**Difficulty**: Intermediate — Complete cross-domain tracking setup. Cover: Google Tag configuration, domain list, referral exclusion, verification steps.

### recipes/subdomain-tracking.mdx
**Difficulty**: Beginner — Tracking across subdomains. Cover: why cross-domain isn't needed for subdomains, cookie domain configuration, session handling.

### recipes/iframe-tracking.mdx
**Difficulty**: Advanced — Track events inside iframes. Cover: postMessage approach, same-origin vs. cross-origin iframes, dataLayer forwarding.

### recipes/single-page-app-tracking.mdx
**Difficulty**: Intermediate — Complete SPA tracking checklist. Cover: virtual pageview setup, dataLayer management, clean-up between navigations, framework-specific code.

### recipes/ab-test-tracking.mdx
**Difficulty**: Intermediate — Track A/B test variants in GA4. Cover: pushing variant assignment to dataLayer, GA4 custom dimension, user-scoped property for test group.

### recipes/user-id-implementation.mdx
**Difficulty**: Intermediate — Complete User-ID implementation guide. Cover: server-side ID generation, dataLayer push, GTM configuration, GA4 user_id setting, cross-device benefits.

### recipes/regex-cheatsheet.mdx
**Difficulty**: Beginner — Regex patterns commonly needed in GTM. Cover: URL matching patterns, file extension matching, email detection (for PII filtering), parameter extraction, hostname matching. Include a reference table of 20+ useful patterns.

---

## PART 8: RESOURCES

### resources/index.mdx
**Section landing page.** Links to all resource articles. Frame as: "Templates, checklists, and tools to make your work easier."

---

### resources/audit-checklist.mdx
**Difficulty**: Intermediate
**Purpose**: Complete GTM/GA4 audit checklist

**Must cover**: A comprehensive, actionable checklist organized by area:
- Container health: naming conventions, unused tags, container size
- Data quality: event validation, parameter types, ecommerce completeness
- GA4 configuration: custom dimensions registered, data retention, data filters
- Consent: proper implementation, testing verification
- Performance: tag load impact, container optimization
- sGTM (if applicable): health checks, cost review, monitoring
- Documentation: up-to-date spec, team access, change log

Format as an interactive checklist the reader can use.

---

### resources/migration-ua-to-ga4.mdx
**Difficulty**: Intermediate
**Purpose**: Guide for teams still transitioning from Universal Analytics patterns

**Must cover**:
- Mental model shift: sessions → events, goals → conversions/key events
- Event mapping: UA events (Category/Action/Label) → GA4 events (event_name + parameters)
- Ecommerce migration: Enhanced Ecommerce → GA4 ecommerce events
- Custom dimensions: hits/sessions/products/user → event-scoped/user-scoped
- Reporting differences: what reports changed, what's new, what's gone
- BigQuery: new schema vs. old schema
- Common migration mistakes

---

### resources/documentation-template.mdx
**Difficulty**: Beginner
**Purpose**: A template for documenting your own tracking implementation

**Must cover**: A complete, ready-to-use documentation template including:
- DataLayer specification template (event name, parameters, types, example)
- GTM container inventory template (tags, triggers, variables, purpose)
- GA4 configuration document template
- Testing protocol template
- Change log template
- Stakeholder communication template

Provide as downloadable Markdown and structured content the reader can copy.

---

### resources/testing-framework.mdx
**Difficulty**: Advanced
**Purpose**: Building a testing framework for your tracking

**Must cover**:
- Testing pyramid for analytics: manual → automated → monitoring
- Test types: unit (dataLayer push validation), integration (GTM trigger firing), e2e (data in GA4)
- Tool recommendations: Playwright, Cypress, GA4 DebugView API
- Sample test suite structure
- CI/CD integration patterns
- Regression testing after GTM changes
- Canary testing for container publishes

**Code examples**: Sample test suite with Playwright

---

### resources/performance-optimization.mdx
**Difficulty**: Advanced
**Purpose**: Making your GTM implementation fast

**Must cover**:
- Measuring the impact: Web Vitals before and after GTM changes
- Container size audit and reduction
- Tag firing optimization: reducing unnecessary tag fires
- Third-party script management: async loading, tag sequencing
- Lazy-loading non-critical tags
- Image pixel optimization
- The performance budget approach for analytics
- Tools for measurement: Lighthouse, WebPageTest, CrUX

---

### resources/community-tools.mdx
**Difficulty**: Beginner
**Purpose**: Curated list of useful GTM/GA4 tools and resources

**Must cover**:
- Browser extensions: GTM/GA Debug, dataLayer Inspector, Omnibug, WASP, Adswerve dataLayer Inspector
- Chrome DevTools techniques
- GTM Community Gallery: best templates
- Online tools: GA4 query parameter builder, Measurement Protocol tester
- Learning resources: blogs, YouTube channels, communities
- Open-source tools for GTM/GA4

---

## Content Production Notes

### Article Generation Order (Recommended)

**Phase 1 — Foundation + Structure** (build the site, fill in structural content)
1. All `index.mdx` section landing pages
2. `foundations/` — all articles (the conceptual base everything else references)
3. `foundations/glossary.mdx` (reference that all other articles link to)

**Phase 2 — Core Client-Side** (the most-visited content)
4. `client-side/setup/` — all articles
5. `client-side/triggers/` — all articles
6. `client-side/variables/` — all articles
7. `client-side/tags/` — all articles

**Phase 3 — Tracking Implementation** (what people come looking for)
8. `client-side/tracking/` — all articles (ecommerce first)
9. `datalayer/ecommerce/` — all articles
10. `datalayer/specification/` — all articles

**Phase 4 — GA4 + Consent** (configuration and compliance)
11. `ga4/fundamentals/` — all articles
12. `ga4/configuration/` — all articles
13. `consent/` — all articles

**Phase 5 — Advanced + Server-Side** (power user content)
14. `server-side/` — all articles
15. `datalayer/platforms/` — all articles
16. `datalayer/validation/` — all articles
17. `datalayer/custom-events/` — all articles
18. `ga4/bigquery/` — all articles
19. `ga4/reporting/` — all articles
20. `ga4/troubleshooting/` — all articles

**Phase 6 — Recipes + Resources** (quick reference content)
21. `recipes/` — all articles
22. `resources/` — all articles
23. `client-side/debugging/` — all articles
24. `client-side/management/` — all articles

### Total Article Count

- Foundations: 9
- Client-Side GTM: 40
- Server-Side GTM: 25
- DataLayer: 24
- GA4: 24
- Consent: 9
- Recipes: 19
- Resources: 6

**Total: ~156 articles**
