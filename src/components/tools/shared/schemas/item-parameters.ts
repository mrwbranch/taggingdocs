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
  { name: 'item_id', displayName: 'Item ID', type: 'string', required: true, placeholder: 'SKU-12345', description: 'Product SKU or ID' },
  { name: 'item_name', displayName: 'Item Name', type: 'string', required: true, placeholder: 'Blue T-Shirt', description: 'Product name' },
  { name: 'price', displayName: 'Price', type: 'number', required: true, placeholder: '29.99', description: 'Unit price' },
  { name: 'quantity', displayName: 'Quantity', type: 'number', required: true, placeholder: '1', description: 'Quantity' },
  { name: 'item_brand', displayName: 'Brand', type: 'string', required: false, placeholder: 'Nike', description: 'Brand name' },
  { name: 'item_category', displayName: 'Category', type: 'string', required: false, placeholder: 'Apparel', description: 'Primary category' },
  { name: 'item_category2', displayName: 'Category 2', type: 'string', required: false, placeholder: 'T-Shirts', description: 'Sub-category level 2' },
  { name: 'item_category3', displayName: 'Category 3', type: 'string', required: false, placeholder: 'Short Sleeve', description: 'Sub-category level 3' },
  { name: 'item_category4', displayName: 'Category 4', type: 'string', required: false, placeholder: '', description: 'Sub-category level 4' },
  { name: 'item_category5', displayName: 'Category 5', type: 'string', required: false, placeholder: '', description: 'Sub-category level 5' },
  { name: 'item_variant', displayName: 'Variant', type: 'string', required: false, placeholder: 'Blue / Large', description: 'Color, size, etc.' },
  { name: 'item_list_id', displayName: 'List ID', type: 'string', required: false, placeholder: 'related_products', description: 'List identifier' },
  { name: 'item_list_name', displayName: 'List Name', type: 'string', required: false, placeholder: 'Related Products', description: 'List display name' },
  { name: 'index', displayName: 'Index', type: 'number', required: false, placeholder: '0', description: 'Position in list' },
  { name: 'coupon', displayName: 'Coupon', type: 'string', required: false, placeholder: 'SUMMER20', description: 'Item-level coupon' },
  { name: 'discount', displayName: 'Discount', type: 'number', required: false, placeholder: '5.00', description: 'Item-level discount amount' },
  { name: 'affiliation', displayName: 'Affiliation', type: 'string', required: false, placeholder: 'Partner Store', description: 'Store or partner name' },
];
