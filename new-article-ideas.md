# New Article Ideas & Enhancement Proposals

Generated: March 30, 2026
Based on research from: simoahava.com, analyticsmania.com, measureschool.com, GA4BigQuery.com, Tanelytics.com, GA4SQL.com, DumbData.co, Optimize Smart, Bounteous.com, InfoTrust.com, Owntag, Stape Academy, aliasoblomov GitHub repo

---

## HIGH PRIORITY — New Articles

### 1. GTM-as-Code: Version Control with GTM CLI

**Gap:** No coverage of infrastructure-as-code approach to GTM management.
**Source:** Owntag (gtm-cli), InfoTrust GTM API articles
**Suggested section:** `resources/` or `security/`
**Why it matters:** The Owntag GTM CLI tool enables CI/CD pipelines for GTM containers — GitHub Actions workflows, service account authentication, diff-based deployments. This is a paradigm shift for enterprise teams managing GTM.
**Content scope:** CLI installation, authentication, export/import workflows, GitHub Actions integration, managing multiple environments, review workflows.

### 2. GA4 Key Events (formerly Conversions) Migration Guide

**Gap:** The "conversions" to "key events" rename (March 2024) is not addressed as a standalone topic.
**Source:** Google Analytics Help, analyticsmania.com, measureschool.com
**Suggested section:** `ga4/configuration/`
**Why it matters:** This terminology change affects every article that references conversions in a GA4 context. A dedicated article explaining the change, what it means for reporting, and the distinction between GA4 key events and Google Ads conversions would be valuable.
**Content scope:** What changed and why, key events vs. conversions distinction, impact on reporting, how to update existing implementations.

### 3. GA4 BigQuery: Multi-Touch Attribution Modeling in SQL

**Gap:** The existing `attribution-queries.mdx` covers basic models but doesn't provide production-ready multi-touch attribution SQL.
**Source:** GA4BigQuery.com, Adswerve, aliasoblomov GitHub repo
**Suggested section:** `ga4/bigquery/`
**Why it matters:** With Google removing 4 of 6 attribution models from the GA4 UI, teams need to build their own in BigQuery. Multiple sources provide detailed SQL implementations.
**Content scope:** Position-based, time-decay, and data-driven attribution SQL implementations, comparison tool in Looker Studio, handling direct traffic, cross-device considerations.

### 4. Dataform Best Practices for GA4 BigQuery Pipelines

**Gap:** Existing `dataform-workflows.mdx` covers basics but lacks advanced patterns.
**Source:** Tanelytics.com, GA4BigQuery.com, GA4Dataform.com
**Suggested section:** `ga4/bigquery/`
**Why it matters:** Tanelytics documents "Smart Incremental GA4 Tables in Dataform" with 90%+ cost reduction patterns. GA4Dataform.com offers pre-built templates. This is where the industry is heading for GA4 data modeling.
**Content scope:** Incremental refresh techniques, cost optimization patterns, session/user table materialization, testing and scheduling, pre-built template references.

### 5. GA4 Data Quality Validation & Automated Audit Checks

**Gap:** No dedicated data quality validation article for GA4 properties.
**Source:** DumbData.co (19+ automated checks), Optimize Smart
**Suggested section:** `resources/` or `ga4/troubleshooting/`
**Why it matters:** DumbData.co catalogs "19 Key Data Checks You Might Miss" with automated tooling. This is a common pain point — teams implement GA4 but don't systematically validate data quality.
**Content scope:** Automated check categories, BigQuery validation queries, data freshness monitoring, duplicate detection, schema drift detection, sampling detection, referencing DumbData tool.

### 6. sGTM Auto-Loading Google Tag Behavior

**Gap:** No coverage of the 2024-2025 changes to how sGTM handles Google Tag/gtag.js loading.
**Source:** simoahava.com (Feb 2025 and June 2025 posts)
**Suggested section:** `server-side/advanced/` or `internals/`
**Why it matters:** Simo Ahava documented a significant change where sGTM auto-fetches GA4 configurations and consolidates script loading. This can cause unexpected behavior if not understood.
**Content scope:** How auto-loading works, when it triggers, configuration options, debugging, potential conflicts.

### 7. iOS Privacy & SKAdNetwork for GA4

**Gap:** No coverage of iOS-specific measurement challenges.
**Source:** Google Developers (SKAdNetwork setup), E-CENS (SKAN 4.0 handbook)
**Suggested section:** `privacy/` or new `mobile/` section
**Why it matters:** App Tracking Transparency, SKAdNetwork postback windows, and conversion value schemas are critical for anyone tracking iOS users through GA4.
**Content scope:** ATT implementation, SKAdNetwork 4.0 overview, postback windows, conversion value mapping, privacy-preserving measurement, gbraid parameter handling.

### 8. GA4 Predictive Audiences & Machine Learning Features

**Gap:** No dedicated article on GA4's predictive capabilities.
**Source:** InfoTrust, Napkyn, measureschool.com
**Suggested section:** `ga4/configuration/` or `ga4/reporting/`
**Why it matters:** Purchase probability, churn prediction, and revenue forecasting are powerful GA4 features with specific prerequisites (1,000+ returning users in 28 days) that are poorly understood.
**Content scope:** Prerequisites and thresholds, available predictive metrics, building predictive audiences, use cases for Google Ads targeting, limitations and accuracy.

---

## MEDIUM PRIORITY — New Articles

### 9. No-Code BigQuery Query Tools for GA4

**Section:** `resources/`
**Source:** GA4SQL.com, GA4BQ.com
**Description:** Reference guide to UI-based query generators for non-SQL analysts. These tools lower the barrier to BigQuery adoption significantly.

### 10. Enterprise GTM Governance & Multi-Brand Container Management

**Section:** `security/` or `client-side/management/`
**Source:** InfoTrust (Tag Inspector Governance Module), Bounteous (GTM 360 zones)
**Description:** Governance workflows for organizations managing 50+ GTM containers. Includes Container Zones (GTM 360), audit logging, compliance automation, DPO workflows.

### 11. Comprehensive GA4+GTM Naming Conventions Checklist

**Section:** `resources/`
**Source:** Optimize Smart (definitive naming conventions checklist)
**Description:** Unified checklist covering event names, parameter names, custom dimensions, GTM tags/triggers/variables, and sGTM naming. The Optimize Smart checklist is the industry benchmark.

### 12. Client ID Retrieval, Storage & CRM Integration Patterns

**Section:** `client-side/tracking/` or `server-side/advanced/`
**Source:** OWOX, Analytics Mania, Bounteous
**Description:** Patterns for storing client_id in CRMs/databases, linking offline conversions, webhook-based server-side tracking (Stripe, form completions).

### 13. Cross-Domain Tracking with Server-Side GTM

**Section:** `server-side/advanced/`
**Source:** simoahava.com (GTMTips series)
**Description:** Server-side implementation patterns for cross-domain scenarios, especially form-based redirects requiring client_id/session_id capture.

### 14. Server-Side GTM for Shopify (Comprehensive Guide)

**Section:** `recipes/` or `datalayer/platforms/`
**Source:** InfoTrust, Stape blog
**Description:** End-to-end guide combining Shopify Custom Pixels, checkout extensibility, and sGTM. The existing `recipes/server-side-shopify-tracking.mdx` may not cover the full picture.

### 15. GA4 BigQuery Ecommerce Table with Item List Attribution

**Section:** `ga4/bigquery/`
**Source:** Tanelytics.com
**Description:** Building ecommerce reporting tables in BigQuery with proper item list attribution — a specific SQL challenge that's poorly documented elsewhere.

---

## LOWER PRIORITY — Enhancements to Existing Articles

### 16. Enhance: BigQuery Common Queries
**File:** `ga4/bigquery/common-queries.mdx`
**Source:** aliasoblomov GitHub repo (65+ queries), GA4BigQuery.com
**Enhancement:** Add more query recipes from the community repository. Categories to add: user lifetime value, cohort analysis, content grouping, marketing channel performance.

### 17. Enhance: Cost Optimization (BigQuery)
**File:** `ga4/bigquery/cost-optimization.mdx`
**Enhancement:** Update pricing to $6.25/TB. Add Dataform-based cost optimization patterns. Reference slot-based pricing as alternative to on-demand.

### 18. Enhance: CMP Integration
**File:** `consent/cmp-integration.mdx`
**Source:** Google CMP Partner Program
**Enhancement:** Verify and update CMP API references (OneTrust, Usercentrics, CookieYes, Iubenda). Add Termly and Osano if popular enough. Reference CMP Partner Program.

### 19. Enhance: Community Tools
**File:** `resources/community-tools.mdx`
**Source:** All external sources
**Enhancement:** Add references to: GTM CLI (Owntag), GA4SQL.com, GA4BQ.com, GA4Dataform.com, DumbData audit tool, aliasoblomov SQL repo, Stape Academy.

### 20. Enhance: GTM API Automation
**File:** `resources/gtm-api-automation.mdx`
**Source:** InfoTrust, Owntag
**Enhancement:** Add GTM CLI as modern alternative to direct API scripting. Cover Terraform patterns, CloudBuild integration, scheduled deployments.

### 21. Enhance: Attribution Settings
**File:** `ga4/configuration/attribution-settings.mdx`
**Enhancement:** Remove deprecated models, add guidance on when data-driven falls back to last-click, explain why Google removed the other models.

### 22. Enhance: Measurement Strategy Template
**File:** `resources/measurement-strategy-template.mdx`
**Source:** Optimize Smart, Bounteous
**Enhancement:** Add naming convention standards, data quality KPIs, governance roles matrix.

### 23. Enhance: Iframe Tracking
**File:** `recipes/iframe-tracking.mdx`
**Source:** Bounteous (iframe Analytics: A GA4 and GTM Guide)
**Enhancement:** Expand with parent/child domain tracking patterns, cross-origin messaging, and GA4-specific iframe considerations.

---

## CONTENT MONITORING RECOMMENDATIONS

These sources should be monitored regularly for new content that could inform updates:

| Source | Focus Area | Update Frequency |
|--------|-----------|-----------------|
| simoahava.com | GTM/sGTM deep dives, breaking changes | Monthly |
| GA4BigQuery.com | SQL recipes, Dataform patterns | Monthly |
| Tanelytics.com | BigQuery optimization | Quarterly |
| DumbData.co | Audit tools, data quality | Quarterly |
| Owntag blog | GTM-as-Code, CLI updates | Quarterly |
| Stape blog/academy | sGTM hosting, new templates | Monthly |
| Google Analytics blog | Product changes, deprecations | Weekly |
| analyticsmania.com | Tutorials, GTM updates | Monthly |
| measureschool.com | Educational content, trends | Monthly |
| InfoTrust blog | Enterprise governance | Quarterly |
| Bounteous insights | Enterprise patterns | Quarterly |
| WebKit blog | Safari ITP changes | On release |
| Chrome blog | Cookie policy changes | On release |
