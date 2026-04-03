export interface ParameterDef {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  placeholder?: string;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: string[];
  };
  defaultValue?: string;
}

export interface EventSchema {
  name: string;
  description: string;
  category: 'ecommerce' | 'engagement' | 'custom';
  isEcommerce: boolean;
  parameters: ParameterDef[];
  hasItems: boolean;
  itemParameters?: ParameterDef[];
}

export const ITEM_PARAMETERS: ParameterDef[] = [
  { name: 'item_id', displayName: 'Item ID', type: 'string', required: true, placeholder: 'SKU-12345', description: 'Your product SKU or ID from your catalog. Use the same ID across all events (view_item → add_to_cart → purchase) for funnel analysis.' },
  { name: 'item_name', displayName: 'Item Name', type: 'string', required: true, placeholder: 'Blue T-Shirt', description: 'Product name as shown to the user. GA4 uses this for reporting if item_id isn\'t set.' },
  { name: 'price', displayName: 'Price', type: 'number', required: true, placeholder: '29.99', description: 'Unit price of this item. Must be a number — \'29.99\' (string) won\'t work, use 29.99 (number).' },
  { name: 'quantity', displayName: 'Quantity', type: 'number', required: true, placeholder: '1', description: 'Number of this item. Defaults to 1 if omitted, but always include it explicitly.' },
  { name: 'item_brand', displayName: 'Brand', type: 'string', required: false, placeholder: 'Nike', description: 'Brand or manufacturer. Useful for brand performance reports in GA4.' },
  { name: 'item_category', displayName: 'Category', type: 'string', required: false, placeholder: 'Apparel', description: 'Primary product category (e.g., \'Apparel\'). Use category2-5 for sub-categories — don\'t put the full path here.' },
  { name: 'item_category2', displayName: 'Category 2', type: 'string', required: false, placeholder: 'T-Shirts', description: 'Second-level category (e.g., \'T-Shirts\'). Build your hierarchy: Apparel > T-Shirts > Short Sleeve.' },
  { name: 'item_category3', displayName: 'Category 3', type: 'string', required: false, placeholder: 'Short Sleeve', description: 'Third-level category. Don\'t skip levels — if you use category3, set category2 too.' },
  { name: 'item_category4', displayName: 'Category 4', type: 'string', required: false, placeholder: '', description: 'Fourth-level category. Most implementations only need 2-3 levels.' },
  { name: 'item_category5', displayName: 'Category 5', type: 'string', required: false, placeholder: '', description: 'Fifth-level category. GA4 supports up to 5 levels.' },
  { name: 'item_variant', displayName: 'Variant', type: 'string', required: false, placeholder: 'Blue / Large', description: 'Product variant like color or size. Use a consistent format (e.g., \'Blue / Large\').' },
  { name: 'item_list_id', displayName: 'List ID', type: 'string', required: false, placeholder: 'related_products', description: 'ID of the list this item appeared in (e.g., \'search_results\', \'related_products\').' },
  { name: 'item_list_name', displayName: 'List Name', type: 'string', required: false, placeholder: 'Related Products', description: 'Display name of the list (e.g., \'Related Products\', \'Search Results\').' },
  { name: 'index', displayName: 'Index', type: 'number', required: false, placeholder: '0', description: 'Position of the item in the list (0-based). Useful for tracking which position gets the most clicks.' },
  { name: 'coupon', displayName: 'Coupon', type: 'string', required: false, placeholder: 'SUMMER20', description: 'Item-level coupon code, if different from the order-level coupon.' },
  { name: 'discount', displayName: 'Discount', type: 'number', required: false, placeholder: '5.00', description: 'Discount amount applied to this item (as a positive number, e.g., 5.00).' },
  { name: 'affiliation', displayName: 'Affiliation', type: 'string', required: false, placeholder: 'Partner Store', description: 'Store or partner that fulfilled this item (e.g., \'Google Store\', \'Amazon Marketplace\').' },
];
