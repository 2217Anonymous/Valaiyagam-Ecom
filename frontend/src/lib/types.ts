export type Role = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type User = {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  roles: Role[];
  created_at: string;
  updated_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type CreateUserInput = {
  email: string;
  full_name: string;
  password: string;
  role_ids: number[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[];
};

export type CategoryInput = {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  is_active?: boolean;
  sort_order?: number;
};

export type ProductMedia = {
  id: number;
  product_id: number;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type ProductAttribute = {
  id: number;
  product_id: number;
  name: string;
  values: string[];
  sort_order: number;
  created_at: string;
};

export type ProductVariant = {
  id: number;
  product_id: number;
  sku: string;
  price: string | number | null;
  stock: number;
  options: Record<string, string>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AttributeDefinition = {
  id: number;
  name: string;
  values: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AttributeDefinitionInput = {
  name: string;
  values: string[];
  sort_order?: number;
  is_active?: boolean;
};

export type ProductAttributeInput = {
  name: string;
  values: string[];
  sort_order?: number;
};

export type ProductVariantInput = {
  sku: string;
  price?: number | null;
  stock?: number;
  options?: Record<string, string>;
  is_active?: boolean;
  sort_order?: number;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: string | number;
  compare_at_price: string | number | null;
  discount_percent: string | number | null;
  sku: string | null;
  manufacturer_name: string | null;
  manufacturer_brand: string | null;
  stock: number;
  tags: string | null;
  visibility: string;
  published_at: string | null;
  category_id: number | null;
  category_name: string | null;
  is_published: boolean;
  is_active: boolean;
  exchangeable: boolean;
  refundable: boolean;
  sort_order: number;
  primary_image_url: string | null;
  media: ProductMedia[];
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string | null;
  price: number;
  compare_at_price?: number | null;
  discount_percent?: number | null;
  sku?: string | null;
  manufacturer_name?: string | null;
  manufacturer_brand?: string | null;
  stock?: number;
  tags?: string | null;
  visibility?: string;
  published_at?: string | null;
  category_id?: number | null;
  is_published?: boolean;
  is_active?: boolean;
  exchangeable?: boolean;
  refundable?: boolean;
  sort_order?: number;
  attributes?: ProductAttributeInput[];
  variants?: ProductVariantInput[];
};

export type StoreSettings = {
  id: number;
  store_name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type StoreSettingsInput = {
  store_name: string;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  currency?: string;
  timezone?: string;
};

export type TaxRule = {
  id: number;
  name: string;
  code: string;
  rate_percent: string | number;
  is_inclusive: boolean;
  country: string | null;
  state: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type TaxRuleInput = {
  name: string;
  code: string;
  rate_percent: number;
  is_inclusive?: boolean;
  country?: string | null;
  state?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type Coupon = {
  id: number;
  code: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: string | number;
  min_order_amount: string | number | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CouponInput = {
  code: string;
  name: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount?: number | null;
  max_uses?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
};
