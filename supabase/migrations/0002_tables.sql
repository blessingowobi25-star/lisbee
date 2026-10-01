create index if not exists orders_customer_email_idx on public.orders (customer_email);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- -------------------------------------------------- corporate enquiries
create table if not exists public.corporate_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  work_email text not null,
  phone text not null,
  recipients_count text not null default '',
  occasion text not null default '',
  city text not null default '',
  budget_per_recipient text not null default '',
  preferred_delivery_date text not null default '',
  message text not null default '',
  requirements text,
  status text not null default 'new'
    check (status in ('new','in_review','contacted','converted','closed')),
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------- delivery zones
create table if not exists public.delivery_zones (
  id text primary key,
  city text not null,
  zone_name text not null,
  fee integer,                      -- null = not configured yet
  same_day boolean not null default false,
  next_day boolean not null default false,
  standard boolean not null default true,
  active boolean not null default true
);

-- ----------------------------------------------------------------- faqs
create table if not exists public.faqs (
  id text primary key,
  question text not null,
  answer text not null,
  category text not null default 'General',
  display_order integer not null default 0
);

-- --------------------------------------------------------- page content
create table if not exists public.pages (
  slug text primary key,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

-- -------------------------------------------------------- site settings
create table if not exists public.site_settings (
  id integer primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------ email log
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  template text not null,
  provider text not null default 'outbox',
  status text not null default 'logged',
  created_at timestamptz not null default now()
);
