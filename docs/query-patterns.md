# Common GA4 BigQuery Query Patterns

## Session Calculation

GA4 doesn't have a session table - calculate sessions from events:

```sql
-- Session ID = user_pseudo_id + ga_session_id
SELECT
  CONCAT(user_pseudo_id, '-',
    CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
  ) as session_id,
  user_pseudo_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') as ga_session_id,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_number') as session_number,
  MIN(TIMESTAMP_MICROS(event_timestamp)) as session_start,
  MAX(TIMESTAMP_MICROS(event_timestamp)) as session_end,
  COUNT(*) as event_count,
  SUM((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec')) / 1000 as engagement_seconds
FROM `{{project_id}}.{{dataset_id}}.events_*`
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY 1, 2, 3, 4
```

## User Identification

```sql
-- Users with both client ID and user ID
SELECT
  user_pseudo_id,  -- Always present (device/browser ID)
  user_id,         -- Only if you set it (logged-in user ID)
  COUNT(DISTINCT
    CONCAT(user_pseudo_id, '-',
      CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
    )
  ) as sessions
FROM `{{project_id}}.{{dataset_id}}.events_*`
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY 1, 2
```

## Traffic Source Attribution

### Session-Level (Last Click)
```sql
SELECT
  collected_traffic_source.manual_source as source,
  collected_traffic_source.manual_medium as medium,
  collected_traffic_source.manual_campaign_name as campaign,
  collected_traffic_source.gclid,
  COUNT(DISTINCT session_id) as sessions
FROM (
  SELECT
    CONCAT(user_pseudo_id, '-',
      CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
    ) as session_id,
    collected_traffic_source
  FROM `{{project_id}}.{{dataset_id}}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
    AND (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'entrances') = 1
)
GROUP BY 1, 2, 3, 4
```

### First-Touch Attribution
```sql
SELECT
  traffic_source.source,
  traffic_source.medium,
  traffic_source.name as campaign,
  COUNT(DISTINCT user_pseudo_id) as users
FROM `{{project_id}}.{{dataset_id}}.events_*`
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY 1, 2, 3
```

## Page Analytics

```sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_title') as title,
  COUNT(*) as pageviews,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(DISTINCT
    CONCAT(user_pseudo_id, '-',
      CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
    )
  ) as sessions,
  -- Entrances = session starts on this page
  COUNTIF((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'entrances') = 1) as entrances,
  -- Average engagement time
  AVG((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec')) / 1000 as avg_engagement_sec
FROM `{{project_id}}.{{dataset_id}}.events_*`
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  AND event_name = 'page_view'
GROUP BY 1, 2
ORDER BY pageviews DESC
```

## Ecommerce Funnel

```sql
WITH funnel AS (
  SELECT
    user_pseudo_id,
    CONCAT(user_pseudo_id, '-',
      CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
    ) as session_id,
    MAX(IF(event_name = 'view_item', 1, 0)) as viewed_product,
    MAX(IF(event_name = 'add_to_cart', 1, 0)) as added_to_cart,
    MAX(IF(event_name = 'begin_checkout', 1, 0)) as began_checkout,
    MAX(IF(event_name = 'purchase', 1, 0)) as purchased
  FROM `{{project_id}}.{{dataset_id}}.events_*`
  WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  GROUP BY 1, 2
)
SELECT
  COUNT(DISTINCT session_id) as total_sessions,
  SUM(viewed_product) as viewed_product,
  SUM(added_to_cart) as added_to_cart,
  SUM(began_checkout) as began_checkout,
  SUM(purchased) as purchased,
  -- Conversion rates
  SAFE_DIVIDE(SUM(added_to_cart), SUM(viewed_product)) as view_to_cart_rate,
  SAFE_DIVIDE(SUM(began_checkout), SUM(added_to_cart)) as cart_to_checkout_rate,
  SAFE_DIVIDE(SUM(purchased), SUM(began_checkout)) as checkout_to_purchase_rate
FROM funnel
```

## Revenue Analysis

```sql
SELECT
  DATE(TIMESTAMP_MICROS(event_timestamp), '{{timezone}}') as date,
  COUNT(DISTINCT ecommerce.transaction_id) as transactions,
  SUM(ecommerce.purchase_revenue) as revenue,
  SUM(ecommerce.purchase_revenue_in_usd) as revenue_usd,
  AVG(ecommerce.purchase_revenue) as avg_order_value,
  SUM(ecommerce.total_item_quantity) as items_sold
FROM `{{project_id}}.{{dataset_id}}.events_*`
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  AND event_name = 'purchase'
GROUP BY 1
ORDER BY 1
```

## Product Performance

```sql
SELECT
  items.item_id,
  items.item_name,
  items.item_category,
  items.item_brand,
  COUNT(*) as views,
  SUM(IF(event_name = 'add_to_cart', 1, 0)) as add_to_carts,
  SUM(IF(event_name = 'purchase', items.quantity, 0)) as units_sold,
  SUM(IF(event_name = 'purchase', items.item_revenue, 0)) as revenue
FROM `{{project_id}}.{{dataset_id}}.events_*`,
  UNNEST(items) as items
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  AND event_name IN ('view_item', 'add_to_cart', 'purchase')
GROUP BY 1, 2, 3, 4
ORDER BY revenue DESC
```

## Custom Event Analysis

```sql
-- Example: Analyze a custom 'signup_complete' event
SELECT
  DATE(TIMESTAMP_MICROS(event_timestamp), '{{timezone}}') as date,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'signup_method') as signup_method,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'plan_type') as plan_type,
  COUNT(*) as signups,
  COUNT(DISTINCT user_pseudo_id) as unique_users
FROM `{{project_id}}.{{dataset_id}}.events_*`
WHERE _TABLE_SUFFIX BETWEEN '{{start_date}}' AND '{{end_date}}'
  AND event_name = 'signup_complete'
GROUP BY 1, 2, 3
ORDER BY 1, signups DESC
```

## Incremental Load Pattern

```sql
-- For scheduled/incremental queries
MERGE `{{project_id}}.{{output_dataset}}.sessions` T
USING (
  SELECT
    session_id,
    user_pseudo_id,
    session_start,
    session_end,
    event_count,
    engaged
  FROM (
    SELECT
      CONCAT(user_pseudo_id, '-',
        CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
      ) as session_id,
      user_pseudo_id,
      MIN(TIMESTAMP_MICROS(event_timestamp)) as session_start,
      MAX(TIMESTAMP_MICROS(event_timestamp)) as session_end,
      COUNT(*) as event_count,
      MAX((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_engaged')) as engaged
    FROM `{{project_id}}.{{dataset_id}}.events_{{target_date}}`
    GROUP BY 1, 2
  )
) S
ON T.session_id = S.session_id
WHEN MATCHED THEN UPDATE SET
  session_end = S.session_end,
  event_count = S.event_count,
  engaged = S.engaged
WHEN NOT MATCHED THEN INSERT ROW
```
