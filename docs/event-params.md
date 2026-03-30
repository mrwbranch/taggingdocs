# GA4 Event Parameters Reference

## Automatically Collected Parameters

These parameters are collected for all events:

| Parameter | Type | Description |
|-----------|------|-------------|
| `ga_session_id` | int | Session identifier |
| `ga_session_number` | int | Session count for user |
| `page_location` | string | Full URL |
| `page_title` | string | Page title |
| `page_referrer` | string | Previous page URL |
| `engagement_time_msec` | int | Engaged time in milliseconds |
| `entrances` | int | 1 if session start |
| `session_engaged` | int | 1 if session had engagement |
| `engaged_session_event` | int | 1 if engaged session |
| `debug_mode` | int | 1 if debug mode enabled |
| `ignore_referrer` | string | Whether to ignore referrer |

## Page View Parameters (page_view event)

| Parameter | Type | Description |
|-----------|------|-------------|
| `page_location` | string | Full page URL |
| `page_title` | string | Page title |
| `page_referrer` | string | Referrer URL |

## Scroll Parameters (scroll event)

| Parameter | Type | Description |
|-----------|------|-------------|
| `percent_scrolled` | int | Scroll depth (90 = 90%) |

## Click Parameters (click event)

| Parameter | Type | Description |
|-----------|------|-------------|
| `link_classes` | string | Link CSS classes |
| `link_domain` | string | Link destination domain |
| `link_id` | string | Link element ID |
| `link_text` | string | Link text |
| `link_url` | string | Full link URL |
| `outbound` | string | "true" if external link |

## File Download Parameters (file_download event)

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_extension` | string | File extension |
| `file_name` | string | File name |
| `link_text` | string | Link text |
| `link_url` | string | Download URL |

## Video Parameters (video_* events)

| Parameter | Type | Description |
|-----------|------|-------------|
| `video_current_time` | int | Current time in seconds |
| `video_duration` | int | Total duration |
| `video_percent` | int | Percent watched |
| `video_provider` | string | e.g., "youtube" |
| `video_title` | string | Video title |
| `video_url` | string | Video URL |
| `visible` | string | If video visible |

## Form Parameters (form_start, form_submit)

| Parameter | Type | Description |
|-----------|------|-------------|
| `form_id` | string | Form element ID |
| `form_name` | string | Form name attribute |
| `form_destination` | string | Form action URL |
| `form_submit_text` | string | Submit button text |

## Search Parameters (view_search_results)

| Parameter | Type | Description |
|-----------|------|-------------|
| `search_term` | string | Search query |

## Ecommerce Parameters

### view_item, add_to_cart, purchase, etc.

| Parameter | Type | Description |
|-----------|------|-------------|
| `currency` | string | Currency code (USD) |
| `value` | float | Transaction value |
| `transaction_id` | string | Order ID |
| `coupon` | string | Coupon code |
| `shipping` | float | Shipping cost |
| `tax` | float | Tax amount |
| `items` | array | Product items |

### Item-Level Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `item_id` | string | Product SKU |
| `item_name` | string | Product name |
| `item_brand` | string | Brand |
| `item_category` | string | Category |
| `item_variant` | string | Variant |
| `price` | float | Unit price |
| `quantity` | int | Quantity |
| `index` | int | Position in list |
| `item_list_name` | string | List name |

## Custom Parameters

Custom parameters are any additional key-value pairs you send with events:

```javascript
gtag('event', 'custom_event', {
  'custom_param': 'value',
  'numeric_param': 123
});
```

Extracted in BigQuery:
```sql
(SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'custom_param') as custom_param,
(SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'numeric_param') as numeric_param
```
