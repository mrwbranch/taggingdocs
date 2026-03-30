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

// Helper: build _TABLE_SUFFIX BETWEEN clause from date range
function tableSuffix(startDate: string, endDate: string): string {
  const start = startDate.replace(/-/g, '');
  const end = endDate.replace(/-/g, '');
  return `_TABLE_SUFFIX BETWEEN '${start}' AND '${end}'`;
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // BASIC (6)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'pageviews_by_page',
    name: 'Pageviews by Page',
    category: 'basic',
    description: 'Count pageviews grouped by page path and hostname.',
    explanation:
      'Extracts the page_location and page_title event parameters from page_view events, then counts sessions and pageviews per page. Optionally filter by a specific hostname.',
    config: [
      {
        name: 'limit',
        label: 'Row Limit',
        type: 'number',
        required: false,
        defaultValue: '20',
        helpText: 'Maximum number of rows to return',
      },
      {
        name: 'hostname',
        label: 'Hostname Filter',
        type: 'text',
        required: false,
        placeholder: 'example.com',
        helpText: 'Optional: filter results to a specific hostname',
      },
    ],
    generateSQL: (cfg) => {
      const limit = cfg.limit || '20';
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');
      const hostnameFilter = cfg.hostname
        ? `\n  AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') LIKE '%${cfg.hostname}%'`
        : '';

      return `-- Pageviews by Page
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title')    AS page_title,
  COUNT(DISTINCT CONCAT(user_pseudo_id, ga_session_id.value))                       AS sessions,
  COUNT(*)                                                                           AS pageviews
FROM ${'`'}${dataset}.${tableName}${'`'},
  UNNEST(event_params) AS ga_session_id
WHERE ${suffix}
  AND event_name = 'page_view'
  AND ga_session_id.key = 'ga_session_id'${hostnameFilter}
GROUP BY
  page_location,
  page_title
ORDER BY
  pageviews DESC
LIMIT ${limit};`;
    },
  },

  {
    id: 'users_sessions_daily',
    name: 'Users & Sessions Daily',
    category: 'basic',
    description: 'Daily trend of users and sessions over the selected date range.',
    explanation:
      'Counts distinct users and sessions per day using the event_date field and the ga_session_id parameter. Useful for spotting traffic trends and anomalies.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Users & Sessions Daily
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  event_date,
  COUNT(DISTINCT user_pseudo_id)                                                   AS users,
  COUNT(DISTINCT CONCAT(user_pseudo_id, (
    SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'
  )))                                                                              AS sessions
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix}
GROUP BY
  event_date
ORDER BY
  event_date ASC;`;
    },
  },

  {
    id: 'events_by_name',
    name: 'Events by Name',
    category: 'basic',
    description: 'Count how many times each event name was fired.',
    explanation:
      'Groups all events by their event_name and counts occurrences. Optionally filter to a single event name. Helpful for understanding overall event volume and debugging missing events.',
    config: [
      {
        name: 'eventFilter',
        label: 'Event Name Filter',
        type: 'text',
        required: false,
        placeholder: 'page_view',
        helpText: 'Optional: filter to a specific event name',
      },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');
      const eventFilter = cfg.eventFilter
        ? `\n  AND event_name = '${cfg.eventFilter}'`
        : '';

      return `-- Events by Name
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  event_name,
  COUNT(*)                       AS event_count,
  COUNT(DISTINCT user_pseudo_id) AS unique_users
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix}${eventFilter}
GROUP BY
  event_name
ORDER BY
  event_count DESC;`;
    },
  },

  {
    id: 'traffic_sources',
    name: 'Traffic Sources',
    category: 'basic',
    description: 'Sessions and users broken down by traffic source and medium.',
    explanation:
      'Uses collected_traffic_source.manual_source and manual_medium (set by GTM / sGTM) to attribute sessions. Falls back gracefully when source/medium are null.',
    config: [
      {
        name: 'limit',
        label: 'Row Limit',
        type: 'number',
        required: false,
        defaultValue: '20',
        helpText: 'Maximum number of rows to return',
      },
    ],
    generateSQL: (cfg) => {
      const limit = cfg.limit || '20';
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Traffic Sources
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  IFNULL(collected_traffic_source.manual_source, '(direct)')   AS source,
  IFNULL(collected_traffic_source.manual_medium, '(none)')     AS medium,
  collected_traffic_source.manual_campaign_name                AS campaign,
  COUNT(DISTINCT user_pseudo_id)                               AS users,
  COUNT(DISTINCT CONCAT(user_pseudo_id, (
    SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'
  )))                                                          AS sessions
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix}
  AND event_name = 'session_start'
GROUP BY
  source,
  medium,
  campaign
ORDER BY
  sessions DESC
LIMIT ${limit};`;
    },
  },

  {
    id: 'landing_pages',
    name: 'Landing Pages',
    category: 'basic',
    description: 'Top landing pages by session count.',
    explanation:
      'Identifies the first page_view in each session using the entrances parameter (value = 1), then counts sessions per landing page URL.',
    config: [
      {
        name: 'limit',
        label: 'Row Limit',
        type: 'number',
        required: false,
        defaultValue: '20',
        helpText: 'Maximum number of rows to return',
      },
    ],
    generateSQL: (cfg) => {
      const limit = cfg.limit || '20';
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Landing Pages
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS landing_page,
  COUNT(DISTINCT CONCAT(user_pseudo_id, (
    SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'
  )))                                                                               AS sessions
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix}
  AND event_name = 'page_view'
  AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'entrances') = 1
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
    description: 'Top exit pages — the last page viewed in each session.',
    explanation:
      'Uses ROW_NUMBER() partitioned by user + session, ordered by event_timestamp DESC, to find the final page_view event per session. Then counts how often each page is the exit page.',
    config: [
      {
        name: 'limit',
        label: 'Row Limit',
        type: 'number',
        required: false,
        defaultValue: '20',
        helpText: 'Maximum number of rows to return',
      },
    ],
    generateSQL: (cfg) => {
      const limit = cfg.limit || '20';
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Exit Pages
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
WITH ranked_pageviews AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')     AS session_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location')  AS page_location,
    event_timestamp,
    ROW_NUMBER() OVER (
      PARTITION BY
        user_pseudo_id,
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')
      ORDER BY event_timestamp DESC
    ) AS rn
  FROM ${'`'}${dataset}.${tableName}${'`'}
  WHERE ${suffix}
    AND event_name = 'page_view'
)
SELECT
  page_location                                                       AS exit_page,
  COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(session_id AS STRING))) AS exit_sessions
FROM ranked_pageviews
WHERE rn = 1
GROUP BY
  exit_page
ORDER BY
  exit_sessions DESC
LIMIT ${limit};`;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ECOMMERCE (5)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'revenue_by_product',
    name: 'Revenue by Product',
    category: 'ecommerce',
    description: 'Total revenue, quantity sold, and purchase count per product.',
    explanation:
      'UNNESTs the items array from purchase events to get per-item revenue (price × quantity) and aggregates by item_id and item_name.',
    config: [
      {
        name: 'limit',
        label: 'Row Limit',
        type: 'number',
        required: false,
        defaultValue: '20',
        helpText: 'Maximum number of rows to return',
      },
    ],
    generateSQL: (cfg) => {
      const limit = cfg.limit || '20';
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Revenue by Product
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  item.item_id,
  item.item_name,
  item.item_brand,
  item.item_category,
  SUM(item.quantity)             AS total_quantity,
  SUM(item.item_revenue)         AS total_revenue,
  COUNT(DISTINCT event_bundle_sequence_id) AS purchase_count
FROM ${'`'}${dataset}.${tableName}${'`'},
  UNNEST(items) AS item
WHERE ${suffix}
  AND event_name = 'purchase'
  AND item.item_id IS NOT NULL
GROUP BY
  item.item_id,
  item.item_name,
  item.item_brand,
  item.item_category
ORDER BY
  total_revenue DESC
LIMIT ${limit};`;
    },
  },

  {
    id: 'purchase_conversion_rate',
    name: 'Purchase Conversion Rate',
    category: 'ecommerce',
    description: 'Overall conversion rate from session to purchase.',
    explanation:
      'Counts total sessions and sessions containing a purchase event, then uses SAFE_DIVIDE to compute the conversion rate. Broken down by date.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Purchase Conversion Rate
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  event_date,
  COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING
  )))                                                                               AS total_sessions,
  COUNT(DISTINCT IF(
    event_name = 'purchase',
    CONCAT(user_pseudo_id, CAST(
      (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING
    )),
    NULL
  ))                                                                               AS purchasing_sessions,
  ROUND(
    SAFE_DIVIDE(
      COUNT(DISTINCT IF(
        event_name = 'purchase',
        CONCAT(user_pseudo_id, CAST(
          (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING
        )),
        NULL
      )),
      COUNT(DISTINCT CONCAT(user_pseudo_id, CAST(
        (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING
      )))
    ) * 100, 2
  )                                                                                AS conversion_rate_pct
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix}
GROUP BY
  event_date
ORDER BY
  event_date ASC;`;
    },
  },

  {
    id: 'average_order_value',
    name: 'Average Order Value',
    category: 'ecommerce',
    description: 'Average, min, max, and total purchase revenue.',
    explanation:
      'Uses the ecommerce.purchase_revenue field (automatically populated by GA4 on purchase events) to calculate order value metrics.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Average Order Value
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  event_date,
  COUNT(*)                                  AS purchases,
  ROUND(SUM(ecommerce.purchase_revenue), 2) AS total_revenue,
  ROUND(AVG(ecommerce.purchase_revenue), 2) AS avg_order_value,
  ROUND(MIN(ecommerce.purchase_revenue), 2) AS min_order_value,
  ROUND(MAX(ecommerce.purchase_revenue), 2) AS max_order_value
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix}
  AND event_name = 'purchase'
  AND ecommerce.purchase_revenue IS NOT NULL
GROUP BY
  event_date
ORDER BY
  event_date ASC;`;
    },
  },

  {
    id: 'cart_abandonment',
    name: 'Cart Abandonment',
    category: 'ecommerce',
    description: 'Sessions that added to cart but did not complete a purchase.',
    explanation:
      'Uses COUNTIF within a CTE to flag sessions that fired add_to_cart and/or purchase, then computes abandonment rate with SAFE_DIVIDE.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Cart Abandonment
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
WITH session_events AS (
  SELECT
    event_date,
    CONCAT(user_pseudo_id, CAST(
      (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING
    )) AS session_key,
    COUNTIF(event_name = 'add_to_cart') AS added_to_cart,
    COUNTIF(event_name = 'purchase')    AS purchased
  FROM ${'`'}${dataset}.${tableName}${'`'}
  WHERE ${suffix}
  GROUP BY
    event_date,
    session_key
)
SELECT
  event_date,
  COUNTIF(added_to_cart > 0)                                           AS sessions_with_add_to_cart,
  COUNTIF(added_to_cart > 0 AND purchased = 0)                         AS abandoned_cart_sessions,
  COUNTIF(added_to_cart > 0 AND purchased > 0)                         AS converted_sessions,
  ROUND(
    SAFE_DIVIDE(
      COUNTIF(added_to_cart > 0 AND purchased = 0),
      COUNTIF(added_to_cart > 0)
    ) * 100, 2
  )                                                                    AS abandonment_rate_pct
FROM session_events
GROUP BY
  event_date
ORDER BY
  event_date ASC;`;
    },
  },

  {
    id: 'product_performance',
    name: 'Product Performance',
    category: 'ecommerce',
    description: 'Views, add-to-cart, and purchases per product in a single report.',
    explanation:
      'Creates one CTE per funnel stage (view_item, add_to_cart, purchase) by UNNESTing items, then JOINs them on item_id and item_name to produce a combined funnel table.',
    config: [
      {
        name: 'limit',
        label: 'Row Limit',
        type: 'number',
        required: false,
        defaultValue: '20',
        helpText: 'Maximum number of rows to return',
      },
    ],
    generateSQL: (cfg) => {
      const limit = cfg.limit || '20';
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Product Performance Funnel
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
WITH item_views AS (
  SELECT
    item.item_id,
    item.item_name,
    COUNT(*) AS views
  FROM ${'`'}${dataset}.${tableName}${'`'},
    UNNEST(items) AS item
  WHERE ${suffix}
    AND event_name = 'view_item'
    AND item.item_id IS NOT NULL
  GROUP BY item.item_id, item.item_name
),
item_atc AS (
  SELECT
    item.item_id,
    item.item_name,
    COUNT(*) AS add_to_carts
  FROM ${'`'}${dataset}.${tableName}${'`'},
    UNNEST(items) AS item
  WHERE ${suffix}
    AND event_name = 'add_to_cart'
    AND item.item_id IS NOT NULL
  GROUP BY item.item_id, item.item_name
),
item_purchases AS (
  SELECT
    item.item_id,
    item.item_name,
    COUNT(*)           AS purchases,
    SUM(item.quantity) AS units_sold,
    SUM(item.item_revenue) AS revenue
  FROM ${'`'}${dataset}.${tableName}${'`'},
    UNNEST(items) AS item
  WHERE ${suffix}
    AND event_name = 'purchase'
    AND item.item_id IS NOT NULL
  GROUP BY item.item_id, item.item_name
)
SELECT
  COALESCE(v.item_id, a.item_id, p.item_id)       AS item_id,
  COALESCE(v.item_name, a.item_name, p.item_name) AS item_name,
  IFNULL(v.views, 0)                              AS views,
  IFNULL(a.add_to_carts, 0)                       AS add_to_carts,
  IFNULL(p.purchases, 0)                          AS purchases,
  IFNULL(p.units_sold, 0)                         AS units_sold,
  ROUND(IFNULL(p.revenue, 0), 2)                  AS revenue,
  ROUND(SAFE_DIVIDE(a.add_to_carts, v.views) * 100, 2) AS atc_rate_pct,
  ROUND(SAFE_DIVIDE(p.purchases, a.add_to_carts) * 100, 2) AS purchase_rate_pct
FROM item_views v
FULL OUTER JOIN item_atc a USING (item_id, item_name)
FULL OUTER JOIN item_purchases p USING (item_id, item_name)
ORDER BY revenue DESC
LIMIT ${limit};`;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // ADVANCED (3)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'session_reconstruction',
    name: 'Session Reconstruction',
    category: 'advanced',
    description: 'Reconstruct full event sequences per session using ARRAY_AGG.',
    explanation:
      'Groups all events by user and session, then uses ARRAY_AGG ordered by event_timestamp to build an ordered array of event names. Provides session-level metrics alongside the event trail.',
    config: [
      {
        name: 'limit',
        label: 'Row Limit',
        type: 'number',
        required: false,
        defaultValue: '100',
        helpText: 'Maximum number of sessions to return',
      },
    ],
    generateSQL: (cfg) => {
      const limit = cfg.limit || '100';
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Session Reconstruction
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
WITH session_data AS (
  SELECT
    user_pseudo_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    event_name,
    event_timestamp,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location
  FROM ${'`'}${dataset}.${tableName}${'`'}
  WHERE ${suffix}
)
SELECT
  user_pseudo_id,
  session_id,
  MIN(event_timestamp)  AS session_start_ts,
  MAX(event_timestamp)  AS session_end_ts,
  ROUND((MAX(event_timestamp) - MIN(event_timestamp)) / 1000000, 0) AS session_duration_secs,
  COUNT(*)              AS total_events,
  ARRAY_AGG(
    STRUCT(event_name, page_location, event_timestamp)
    ORDER BY event_timestamp ASC
  )                     AS event_sequence
FROM session_data
GROUP BY
  user_pseudo_id,
  session_id
ORDER BY
  session_start_ts DESC
LIMIT ${limit};`;
    },
  },

  {
    id: 'funnel_analysis',
    name: 'Funnel Analysis',
    category: 'advanced',
    description: 'Sequential funnel from up to 4 events showing drop-off at each step.',
    explanation:
      'Counts users who reached each step of a sequential funnel. Steps are counted cumulatively — a user is counted at step N only if they also fired all previous steps within the date range. Step 4 is optional.',
    config: [
      {
        name: 'step1',
        label: 'Step 1 Event',
        type: 'text',
        required: true,
        placeholder: 'page_view',
        helpText: 'First event in the funnel',
      },
      {
        name: 'step2',
        label: 'Step 2 Event',
        type: 'text',
        required: true,
        placeholder: 'view_item',
        helpText: 'Second event in the funnel',
      },
      {
        name: 'step3',
        label: 'Step 3 Event',
        type: 'text',
        required: true,
        placeholder: 'add_to_cart',
        helpText: 'Third event in the funnel',
      },
      {
        name: 'step4',
        label: 'Step 4 Event (optional)',
        type: 'text',
        required: false,
        placeholder: 'purchase',
        helpText: 'Optional fourth event in the funnel',
      },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');
      const step1 = cfg.step1 || 'page_view';
      const step2 = cfg.step2 || 'view_item';
      const step3 = cfg.step3 || 'add_to_cart';
      const step4 = cfg.step4 || '';

      const step4CTE = step4
        ? `,
step4 AS (
  SELECT DISTINCT user_pseudo_id
  FROM ${'`'}${dataset}.${tableName}${'`'}
  WHERE ${suffix}
    AND event_name = '${step4}'
)`
        : '';

      const step4Select = step4
        ? `,
  (SELECT COUNT(*) FROM step4 WHERE user_pseudo_id IN (SELECT user_pseudo_id FROM step3)) AS step4_${step4.replace(/\W/g, '_')}`
        : '';

      return `-- Funnel Analysis
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
-- Funnel: ${step1} → ${step2} → ${step3}${step4 ? ' → ' + step4 : ''}
WITH step1 AS (
  SELECT DISTINCT user_pseudo_id
  FROM ${'`'}${dataset}.${tableName}${'`'}
  WHERE ${suffix}
    AND event_name = '${step1}'
),
step2 AS (
  SELECT DISTINCT user_pseudo_id
  FROM ${'`'}${dataset}.${tableName}${'`'}
  WHERE ${suffix}
    AND event_name = '${step2}'
),
step3 AS (
  SELECT DISTINCT user_pseudo_id
  FROM ${'`'}${dataset}.${tableName}${'`'}
  WHERE ${suffix}
    AND event_name = '${step3}'
)${step4CTE}
SELECT
  (SELECT COUNT(*) FROM step1)                                                     AS step1_${step1.replace(/\W/g, '_')},
  (SELECT COUNT(*) FROM step2 WHERE user_pseudo_id IN (SELECT user_pseudo_id FROM step1)) AS step2_${step2.replace(/\W/g, '_')},
  (SELECT COUNT(*) FROM step3 WHERE user_pseudo_id IN (SELECT user_pseudo_id FROM step2)
     AND user_pseudo_id IN (SELECT user_pseudo_id FROM step1))                     AS step3_${step3.replace(/\W/g, '_')}${step4Select},
  ROUND(SAFE_DIVIDE(
    (SELECT COUNT(*) FROM step2 WHERE user_pseudo_id IN (SELECT user_pseudo_id FROM step1)),
    (SELECT COUNT(*) FROM step1)
  ) * 100, 2)                                                                     AS step1_to_step2_pct,
  ROUND(SAFE_DIVIDE(
    (SELECT COUNT(*) FROM step3
     WHERE user_pseudo_id IN (SELECT user_pseudo_id FROM step2)
       AND user_pseudo_id IN (SELECT user_pseudo_id FROM step1)),
    (SELECT COUNT(*) FROM step2 WHERE user_pseudo_id IN (SELECT user_pseudo_id FROM step1))
  ) * 100, 2)                                                                     AS step2_to_step3_pct;`;
    },
  },

  {
    id: 'custom_event_params',
    name: 'Custom Event Parameters',
    category: 'advanced',
    description: 'Explore the values of a specific event parameter for any event.',
    explanation:
      'UNNESTs event_params and extracts the selected value type (string_value, int_value, or double_value) for a given event and parameter key. Groups and counts by parameter value.',
    config: [
      {
        name: 'eventName',
        label: 'Event Name',
        type: 'text',
        required: true,
        placeholder: 'page_view',
        helpText: 'The GA4 event name to analyse',
      },
      {
        name: 'paramName',
        label: 'Parameter Key',
        type: 'text',
        required: true,
        placeholder: 'page_location',
        helpText: 'The event_params key to extract',
      },
      {
        name: 'paramType',
        label: 'Value Type',
        type: 'select',
        required: true,
        defaultValue: 'string_value',
        helpText: 'BigQuery value column to read from',
        options: [
          { label: 'String', value: 'string_value' },
          { label: 'Integer', value: 'int_value' },
          { label: 'Float / Double', value: 'double_value' },
        ],
      },
    ],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');
      const eventName = cfg.eventName || 'page_view';
      const paramName = cfg.paramName || 'page_location';
      const paramType = cfg.paramType || 'string_value';

      return `-- Custom Event Parameters
-- Event: ${eventName} | Param: ${paramName} (${paramType})
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  ep.value.${paramType}             AS param_value,
  COUNT(*)                          AS occurrences,
  COUNT(DISTINCT user_pseudo_id)    AS unique_users
FROM ${'`'}${dataset}.${tableName}${'`'},
  UNNEST(event_params) AS ep
WHERE ${suffix}
  AND event_name = '${eventName}'
  AND ep.key = '${paramName}'
  AND ep.value.${paramType} IS NOT NULL
GROUP BY
  param_value
ORDER BY
  occurrences DESC
LIMIT 50;`;
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY (3)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'schema_explorer',
    name: 'Schema Explorer',
    category: 'utility',
    description: 'List all distinct event_params keys present in the data.',
    explanation:
      'UNNESTs event_params across all events and uses ARRAY_AGG(DISTINCT ...) to collect the unique parameter keys. Useful for discovering what custom parameters have been sent.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Schema Explorer: distinct event_params keys
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  event_name,
  ARRAY_AGG(DISTINCT ep.key ORDER BY ep.key) AS param_keys,
  COUNT(*)                                   AS event_count
FROM ${'`'}${dataset}.${tableName}${'`'},
  UNNEST(event_params) AS ep
WHERE ${suffix}
GROUP BY
  event_name
ORDER BY
  event_count DESC;`;
    },
  },

  {
    id: 'data_freshness',
    name: 'Data Freshness',
    category: 'utility',
    description: 'Check the latest event timestamp in the table.',
    explanation:
      'Returns the maximum event_timestamp (converted to a readable datetime) and the latest event_date shard available. Useful for verifying that data is up to date.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Data Freshness
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  MAX(event_date)                                               AS latest_event_date,
  TIMESTAMP_MICROS(MAX(event_timestamp))                        AS latest_event_timestamp_utc,
  MIN(event_date)                                               AS earliest_event_date,
  TIMESTAMP_MICROS(MIN(event_timestamp))                        AS earliest_event_timestamp_utc,
  COUNT(DISTINCT event_date)                                    AS days_with_data
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix};`;
    },
  },

  {
    id: 'estimated_row_count',
    name: 'Estimated Row Count',
    category: 'utility',
    description: 'Quick summary of total events, unique users, and dates in the table.',
    explanation:
      'Counts total event rows, distinct users (user_pseudo_id), and distinct event_date values. No filtering on event_name so it covers the full dataset.',
    config: [],
    generateSQL: (cfg) => {
      const dataset = cfg.dataset || 'your_project.analytics_XXXXXXXXX';
      const tableName = cfg.tableName || 'events_*';
      const suffix = tableSuffix(cfg.startDate || '', cfg.endDate || '');

      return `-- Estimated Row Count
-- Date range: ${cfg.startDate || 'YYYYMMDD'} to ${cfg.endDate || 'YYYYMMDD'}
SELECT
  COUNT(*)                       AS total_events,
  COUNT(DISTINCT user_pseudo_id) AS unique_users,
  COUNT(DISTINCT event_date)     AS unique_dates,
  COUNT(DISTINCT event_name)     AS unique_event_names,
  MIN(event_date)                AS first_date,
  MAX(event_date)                AS last_date
FROM ${'`'}${dataset}.${tableName}${'`'}
WHERE ${suffix};`;
    },
  },
];
