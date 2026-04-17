import type { PermissionKey, PermissionMap } from "@/lib/auth/permissions";

export type RoleSlug = "admin" | "manager" | "worker";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: RoleSlug;
  role_label: string;
  can_record_stock_entries: boolean;
  can_adjust_stock: boolean;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email?: string;
}

export interface UserContext {
  user: AuthUser;
  profile: Profile;
  permissions: PermissionMap;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at?: string;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string | null;
  main_photo_path: string | null;
  is_active: boolean;
  slug: string;
  category_id: string | null;
  category_name: string | null;
  variant_count: number;
  total_stock: number;
  low_stock_variants: number;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  reference: string;
  barcode: string | null;
  color: string | null;
  size: string | null;
  type: string | null;
  quantity_in_stock: number;
  selling_price: number;
  purchase_price: number;
  minimum_stock: number;
  photo_path: string | null;
  is_active: boolean;
  attributes?: Record<string, string>;
}

export interface ProductDetail extends Omit<ProductListItem, "variant_count" | "total_stock" | "low_stock_variants"> {
  category_description: string | null;
  variants: ProductVariant[];
}

export interface VariantCatalogItem {
  variant_id: string;
  product_id: string;
  product_name: string;
  category_name: string | null;
  description: string | null;
  main_photo_path: string | null;
  photo_path: string | null;
  display_photo_path: string | null;
  reference: string;
  barcode: string | null;
  color: string | null;
  size: string | null;
  type: string | null;
  quantity_in_stock: number;
  selling_price: number;
  purchase_price: number;
  minimum_stock: number;
  is_low_stock: boolean;
}

export interface StockMovement {
  id: string;
  variant_id: string;
  reference: string;
  product_name: string;
  movement_type: "in" | "out" | "adjustment";
  source_type: string | null;
  quantity: number;
  quantity_delta: number;
  previous_quantity: number;
  new_quantity: number;
  note: string | null;
  movement_date: string;
  created_by_name: string | null;
}

export interface SaleListItem {
  id: string;
  sale_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  estimated_profit: number;
  sold_at: string;
  created_by_name: string | null;
}

export interface SaleItemDetail {
  id: string;
  variant_id: string | null;
  reference_snapshot: string;
  product_name_snapshot: string;
  variant_label_snapshot: string;
  quantity: number;
  unit_price: number;
  purchase_price_snapshot: number;
  line_total: number;
  profit_amount: number;
}

export interface SaleDetail extends SaleListItem {
  note: string | null;
  items: SaleItemDetail[];
}

export interface PurchaseEntrySummary {
  id: string;
  supplier_name_snapshot: string | null;
  note: string | null;
  total_cost: number;
  received_at: string;
  created_by_name: string | null;
}

export interface DashboardData {
  totalProducts: number;
  totalVariants: number;
  lowStockCount: number;
  todaysSalesAmount: number;
  weekSalesAmount: number;
  recentSales: SaleListItem[];
  recentEntries: PurchaseEntrySummary[];
}

export interface ShopSettings {
  id: string;
  shop_name: string;
  phone: string | null;
  address: string | null;
  currency: string;
  low_stock_global_threshold: number;
  allow_worker_price_visibility: boolean;
  invoice_footer: string | null;
}

export interface ManagedUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: RoleSlug;
  role_label: string;
  can_record_stock_entries: boolean;
  can_adjust_stock: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface PermissionDescriptor {
  key: PermissionKey;
  label: string;
}
