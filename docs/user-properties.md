# GA4 User Properties Reference

## Automatically Collected User Properties

These are collected automatically by GA4:

| Property | Type | Description |
|----------|------|-------------|
| `first_open_time` | int | First app open timestamp |
| `first_visit_time` | int | First website visit timestamp |
| `first_open_after_install` | int | First open after install |

## Common Custom User Properties

Typical user properties set via gtag:

| Property | Type | Description |
|----------|------|-------------|
| `user_type` | string | e.g., "registered", "guest" |
| `membership_tier` | string | e.g., "gold", "silver" |
| `customer_segment` | string | e.g., "high_value" |
| `subscription_status` | string | e.g., "active", "churned" |
| `account_created` | string | Account creation date |

## Setting User Properties

### JavaScript (gtag.js)
```javascript
gtag('set', 'user_properties', {
  'user_type': 'registered',
  'membership_tier': 'gold'
});
```

### Google Tag Manager
Use the "Google Analytics: GA4 Configuration" tag with User Properties section.

## Querying User Properties

### Extract Latest Value
```sql
(SELECT value.string_value
 FROM UNNEST(user_properties)
 WHERE key = 'user_type'
) as user_type
```

### Extract with Timestamp
```sql
SELECT
  user_pseudo_id,
  up.key as property_name,
  COALESCE(up.value.string_value, CAST(up.value.int_value AS STRING)) as property_value,
  TIMESTAMP_MICROS(up.value.set_timestamp_micros) as set_time
FROM `project.dataset.events_*`,
  UNNEST(user_properties) as up
WHERE _TABLE_SUFFIX = '20250101'
```

## User Property Limits

- Maximum 25 user properties per GA4 property
- Property names: Up to 24 characters
- Property values: Up to 36 characters

## User Properties vs. User-Scoped Custom Dimensions

In GA4 BigQuery exports:
- User properties appear in the `user_properties` array on every event
- The value shown is the value at the time of the event
- Historical changes are preserved (each event has the value at that time)

## Users Table vs. Events Table

The `users_*` and `pseudonymous_users_*` tables contain aggregated user data:

| Field | Description |
|-------|-------------|
| `user_id` | User ID (if set) |
| `user_pseudo_id` | Device/Client ID |
| `user_info` | User-level aggregates |
| `audiences` | Audience memberships |
| `user_properties` | All user properties |
| `device` | Device info |
| `geo` | Location info |
| `user_ltv` | Lifetime value |
| `predictions` | ML predictions |

### Querying Users Table
```sql
SELECT
  user_pseudo_id,
  user_info.last_active_timestamp_micros,
  user_info.user_first_touch_timestamp_micros,
  user_info.first_purchase_date,
  user_ltv.revenue_in_usd as lifetime_revenue
FROM `{{project_id}}.{{dataset_id}}.users_*`
WHERE _TABLE_SUFFIX = '{{target_date}}'
```
