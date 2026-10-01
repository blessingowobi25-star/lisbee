-- LisBee — Supabase schema (PostgreSQL)
-- Run this in the Supabase SQL editor, or with the supabase CLI:
--   supabase db push
--
-- Notes:
--  * Prices are integers in Naira.
--  * Row Level Security: customers can only read their own orders;
--    all writes go through the server using the service-role key.

create extension if not exists "pgcrypto";

-- --------------------------------------------------------------- users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  provider text not null default 'local' check (provider in ('local','google')),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------- taxonomies
create table if not exists public.taxonomies (
  id text primary key,
  kind text not null check (kind in ('category','occasion','recipient')),
  name text not null,
  slug text not null,
  description text,
  image text,
  show_in_nav boolean not null default true,
  display_order integer not null default 0,
  coming_soon boolean not null default false,
  unique (kind, slug)
);

-- ----------------------------------------------------------- products
create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text not null unique,
  tagline text not null default '',
  description text not null default '',
  price integer not null check (price >= 0),
  cost_product integer,
  cost_packaging integer,
  cost_other integer,
  category text not null default '',
  occasions jsonb not null default '[]'::jsonb,
  recipients jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  sku text not null default '',
  tier text check (tier in ('premium','signature','executive')),
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock','out_of_stock')),
  availability text not null default 'available' check (availability in ('available','pre_order')),
  status text not null default 'published' check (status in ('published','draft')),
  featured boolean not null default false,
  coming_soon boolean not null default false,
  bestseller boolean not null default false,
  is_new boolean not null default false,
  weight text,
  delivery_info text,
  customisation text,
  whats_inside jsonb,
  seo_title text,
  seo_description text,
  requires_supplier_confirmation boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------------- orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  payment_reference text not null,
  customer_id uuid references public.users(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  subtotal integer not null,
  delivery_fee integer,
  delivery_fee_status text not null default 'pending_confirmation'
    check (delivery_fee_status in ('quoted','pending_confirmation')),
  total integer not null,
  payment_method text not null default 'bank_transfer'
    check (payment_method in ('bank_transfer','paystack')),
  payment_status text not null default 'awaiting_confirmation'
    check (payment_status in ('awaiting_confirmation','paid','refunded','cancelled')),
  order_status text not null default 'awaiting_payment_confirmation'
    check (order_status in ('awaiting_payment_confirmation','payment_received','preparing','ready','dispatched','delivered','cancelled')),
  sender_name text not null default '',
  same_as_recipient boolean not null default false,
  occasion text,
  gift_message text,
  delivery_date text,
  is_corporate boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  name text not null,
  phone text not null,
  delivery_address text not null,
  city text not null,
  state text not null,
  delivery_instructions text
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  slug text not null,
  sku text not null default '',
  image text,
  quantity integer not null check (quantity > 0),
  unit_price integer not null,
  total integer not null
);

create index if not exists orders_customer_email_idx on public.orders (customer_email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);
