/**
 * LisBee domain types.
 * These mirror the Supabase schema in lib/db/schema.sql and are shared by the
 * local (file-based) data layer used when Supabase is not configured.
 */

export type Role = "customer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  provider: "local" | "google";
  avatar_url?: string;
  created_at: string;
}

export type ProductStatus = "published" | "draft";
export type StockStatus = "in_stock" | "out_of_stock";

export interface WorkweekDay {
  day: string; // Monday
  moment: string; // Start Strong
  items: string[]; // what is inside
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string; // short descriptor on cards
  description: string; // full description
  price: number; // NGN, integer
  cost_product: number | null;
  cost_packaging: number | null;
  cost_other: number | null;
  category: string; // category slug
  occasions: string[]; // occasion slugs
  recipients: string[]; // recipient slugs
  images: string[]; // public paths
  sku: string;
  tier: "premium" | "signature" | "executive" | null;
  stock_status: StockStatus;
  availability: "available" | "pre_order";
  status: ProductStatus;
  featured: boolean;
  coming_soon: boolean;
  bestseller: boolean; // only when the admin marks it
  is_new: boolean;
  weight?: string;
  delivery_info?: string;
  customisation?: string;
  whats_inside?: WorkweekDay[];
  seo_title?: string;
  seo_description?: string;
  requires_supplier_confirmation?: boolean;
  created_at: string;
  updated_at: string;
}

export type TaxonomyKind = "category" | "occasion" | "recipient";

export interface Taxonomy {
  id: string;
  kind: TaxonomyKind;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  show_in_nav: boolean;
  display_order: number;
  coming_soon?: boolean;
}

export type OrderStatus =
  | "awaiting_payment_confirmation"
  | "payment_received"
  | "preparing"
  | "ready"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "awaiting_confirmation" | "paid" | "refunded" | "cancelled";
export type PaymentMethod = "bank_transfer" | "paystack";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment_confirmation: "Awaiting Payment Confirmation",
  payment_received: "Payment Received",
  preparing: "Preparing",
  ready: "Ready",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export interface OrderRecipient {
  name: string;
  phone: string;
  delivery_address: string;
  city: string;
  state: string;
  /** Which delivery zone within the city, when a city has more than one. */
  delivery_area?: string;
  delivery_instructions?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name: string;
  slug: string;
  sku: string;
  image: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  payment_reference: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  delivery_fee: number | null; // null = not yet configured / to be confirmed
  delivery_fee_status: "quoted" | "pending_confirmation";
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  sender_name: string;
  same_as_recipient: boolean;
  occasion?: string;
  gift_message?: string;
  delivery_date?: string;
  is_corporate?: boolean;
  recipient: OrderRecipient;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface CorporateEnquiry {
  id: string;
  name: string;
  company: string;
  work_email: string;
  phone: string;
  recipients_count: string;
  occasion: string;
  city: string;
  budget_per_recipient: string;
  preferred_delivery_date: string;
  message: string;
  requirements?: string;
  status: "new" | "in_review" | "contacted" | "converted" | "closed";
  notes?: string;
  created_at: string;
}

export interface DeliveryZone {
  id: string;
  city: string;
  zone_name: string;
  fee: number | null; // null until the admin configures it
  same_day: boolean;
  next_day: boolean;
  standard: boolean;
  active: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  display_order: number;
}

export interface PageContent {
  slug: string;
  title: string;
  body: string; // simple markdown-ish paragraphs separated by \n\n
  updated_at: string;
}

export interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
}

export interface SiteSettings {
  brand_name: string;
  tagline: string;
  whatsapp_number: string; // local format
  email: string;
  instagram: string;
  tiktok: string;
  linkedin: string;
  delivery_cities: string[];
  bank: BankDetails;
  paystack_enabled: boolean; // stays false until real keys exist
  target_margin_percent: number;
  announcement: string;
  from_name: string;
  from_email: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string;
  provider: "mailgun" | "outbox";
  status: "sent" | "failed" | "logged";
  created_at: string;
}

/**
 * A cart line as STORED on the server.
 *
 * The browser used to own the whole cart in localStorage, which made a shared
 * cart across devices impossible. Only the slug and quantity are persisted:
 * price, name and image are always re-read from the products table so a stale
 * or tampered client can never dictate what is charged.
 */
export interface StoredCartItem {
  id: string;
  owner_key: string;
  slug: string;
  quantity: number;
  updated_at: string;
}

/**
 * A cart line resolved against the live catalogue, ready to send to any client.
 * Prices come from the database, never from the request.
 */
export interface ResolvedCartLine {
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

/** Full cart response. `updated_at` is the newest line's timestamp. */
export interface CartResponse {
  items: ResolvedCartLine[];
  count: number;
  subtotal: number;
  updated_at: string | null;
}

export interface ProductFilter {
  q?: string;
  category?: string;
  occasion?: string;
  recipient?: string;
  price?: "under-25" | "25-50" | "50-100" | "100-plus";
  sort?: "featured" | "price-asc" | "price-desc" | "newest" | "name";
  include_unpublished?: boolean;
  coming_soon?: boolean;
}
