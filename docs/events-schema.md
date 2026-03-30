# GA4 Events Table Schema

## Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `event_date` | STRING | Date (YYYYMMDD) |
| `event_timestamp` | INTEGER | Microseconds since epoch |
| `event_name` | STRING | Event name |
| `event_params` | RECORD (REPEATED) | Event parameters array |
| `event_previous_timestamp` | INTEGER | Previous event timestamp |
| `event_value_in_usd` | FLOAT | Event value in USD |
| `event_bundle_sequence_id` | INTEGER | Bundle sequence ID |
| `event_server_timestamp_offset` | INTEGER | Server timestamp offset |
| `user_id` | STRING | User ID (if set) |
| `user_pseudo_id` | STRING | Client ID / Device ID |
| `privacy_info` | RECORD | Privacy settings |
| `user_properties` | RECORD (REPEATED) | User properties array |
| `user_first_touch_timestamp` | INTEGER | First touch timestamp |
| `user_ltv` | RECORD | Lifetime value info |
| `device` | RECORD | Device information |
| `geo` | RECORD | Geographic information |
| `app_info` | RECORD | App information (mobile) |
| `traffic_source` | RECORD | First-touch traffic source |
| `stream_id` | STRING | Data stream ID |
| `platform` | STRING | WEB, IOS, or ANDROID |
| `event_dimensions` | RECORD | Event dimensions |
| `ecommerce` | RECORD | Ecommerce data |
| `items` | RECORD (REPEATED) | Ecommerce items array |
| `collected_traffic_source` | RECORD | Session traffic source |
| `is_active_user` | BOOLEAN | Active in period |
| `batch_event_index` | INTEGER | Index in batch |
| `batch_page_id` | INTEGER | Page ID in batch |
| `batch_ordering_id` | INTEGER | Ordering within batch |
| `session_traffic_source_last_click` | RECORD | Last-click attribution |

## event_params Structure

```sql
event_params ARRAY<STRUCT<
  key STRING,
  value STRUCT<
    string_value STRING,
    int_value INT64,
    float_value FLOAT64,
    double_value FLOAT64
  >
>>
```

## user_properties Structure

```sql
user_properties ARRAY<STRUCT<
  key STRING,
  value STRUCT<
    string_value STRING,
    int_value INT64,
    float_value FLOAT64,
    double_value FLOAT64,
    set_timestamp_micros INT64
  >
>>
```

## device Record

| Field | Type |
|-------|------|
| `device.category` | STRING |
| `device.mobile_brand_name` | STRING |
| `device.mobile_model_name` | STRING |
| `device.mobile_marketing_name` | STRING |
| `device.mobile_os_hardware_model` | STRING |
| `device.operating_system` | STRING |
| `device.operating_system_version` | STRING |
| `device.vendor_id` | STRING |
| `device.advertising_id` | STRING |
| `device.language` | STRING |
| `device.is_limited_ad_tracking` | STRING |
| `device.time_zone_offset_seconds` | INTEGER |
| `device.browser` | STRING |
| `device.browser_version` | STRING |
| `device.web_info.browser` | STRING |
| `device.web_info.browser_version` | STRING |
| `device.web_info.hostname` | STRING |

## geo Record

| Field | Type |
|-------|------|
| `geo.continent` | STRING |
| `geo.country` | STRING |
| `geo.region` | STRING |
| `geo.city` | STRING |
| `geo.sub_continent` | STRING |
| `geo.metro` | STRING |

## traffic_source Record (First Touch)

| Field | Type |
|-------|------|
| `traffic_source.name` | STRING |
| `traffic_source.medium` | STRING |
| `traffic_source.source` | STRING |

## collected_traffic_source Record (Session)

| Field | Type |
|-------|------|
| `collected_traffic_source.manual_campaign_id` | STRING |
| `collected_traffic_source.manual_campaign_name` | STRING |
| `collected_traffic_source.manual_source` | STRING |
| `collected_traffic_source.manual_medium` | STRING |
| `collected_traffic_source.manual_term` | STRING |
| `collected_traffic_source.manual_content` | STRING |
| `collected_traffic_source.gclid` | STRING |
| `collected_traffic_source.dclid` | STRING |
| `collected_traffic_source.srsltid` | STRING |

## ecommerce Record

| Field | Type |
|-------|------|
| `ecommerce.total_item_quantity` | INTEGER |
| `ecommerce.purchase_revenue_in_usd` | FLOAT |
| `ecommerce.purchase_revenue` | FLOAT |
| `ecommerce.refund_value_in_usd` | FLOAT |
| `ecommerce.refund_value` | FLOAT |
| `ecommerce.shipping_value_in_usd` | FLOAT |
| `ecommerce.shipping_value` | FLOAT |
| `ecommerce.tax_value_in_usd` | FLOAT |
| `ecommerce.tax_value` | FLOAT |
| `ecommerce.unique_items` | INTEGER |
| `ecommerce.transaction_id` | STRING |

## items Array

| Field | Type |
|-------|------|
| `items.item_id` | STRING |
| `items.item_name` | STRING |
| `items.item_brand` | STRING |
| `items.item_variant` | STRING |
| `items.item_category` | STRING |
| `items.item_category2` | STRING |
| `items.item_category3` | STRING |
| `items.item_category4` | STRING |
| `items.item_category5` | STRING |
| `items.price_in_usd` | FLOAT |
| `items.price` | FLOAT |
| `items.quantity` | INTEGER |
| `items.item_revenue_in_usd` | FLOAT |
| `items.item_revenue` | FLOAT |
| `items.item_refund_in_usd` | FLOAT |
| `items.item_refund` | FLOAT |
| `items.coupon` | STRING |
| `items.affiliation` | STRING |
| `items.location_id` | STRING |
| `items.item_list_id` | STRING |
| `items.item_list_name` | STRING |
| `items.item_list_index` | STRING |
| `items.promotion_id` | STRING |
| `items.promotion_name` | STRING |
| `items.creative_name` | STRING |
| `items.creative_slot` | STRING |
