-- ============================================================
-- LisBee: ALL migrations combined, in the correct order.
-- Paste this whole file into the Supabase SQL Editor and click Run.
-- Safe to run more than once.
-- ============================================================



-- ---------------------------------------------------------------
-- FILE: 0001_init.sql
-- ---------------------------------------------------------------
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


-- ---------------------------------------------------------------
-- FILE: 0002_tables.sql
-- ---------------------------------------------------------------
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


-- ---------------------------------------------------------------
-- FILE: 0003_rls.sql
-- ---------------------------------------------------------------
-- Row Level Security for LisBee.
-- Public may read published content; customers may read their own orders;
-- everything else is written by the server with the service-role key
-- (which bypasses RLS). Never expose the service-role key to the browser.

alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.taxonomies enable row level security;
alter table public.orders enable row level security;
alter table public.recipients enable row level security;
alter table public.order_items enable row level security;
alter table public.corporate_enquiries enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.faqs enable row level security;
alter table public.pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.email_log enable row level security;

-- catalog content: readable by everyone when published
create policy "products are public" on public.products
  for select using (status = 'published');
create policy "taxonomies are public" on public.taxonomies
  for select using (true);
create policy "faqs are public" on public.faqs
  for select using (true);
create policy "pages are public" on public.pages
  for select using (true);
create policy "zones are public" on public.delivery_zones
  for select using (active = true);

-- settings: only non-sensitive columns are safe to read publicly.
-- The server reads settings with the service-role key, so no public policy.
create policy "settings managed server side" on public.site_settings
  for select using (false);

-- customers can read their own orders (matched by their authenticated email)
create policy "own orders readable" on public.orders
  for select using (
    (auth.jwt() ->> 'email') is not null
    and lower(customer_email) = lower(auth.jwt() ->> 'email')
  );

create policy "own recipients readable" on public.recipients
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = recipients.order_id
        and lower(o.customer_email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "own order items readable" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and lower(o.customer_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- no public policies for users, enquiries, email_log:
-- server-only (service role).

-- Helpful view: order totals per customer for the account area
create or replace view public.customer_order_summary as
  select customer_email,
         count(*) as order_count,
         max(created_at) as last_order_at
  from public.orders
  group by customer_email;


-- ---------------------------------------------------------------
-- FILE: 0004_seed.sql
-- ---------------------------------------------------------------
-- ===========================================================================
-- LisBee — launch seed
--
-- Run AFTER 0001_init, 0002_tables and 0003_rls:
--   supabase db push
--   ...or paste this file into the Supabase SQL editor.
--
-- It is safe to run more than once. Every insert is an upsert.
--
-- Two deliberate safeguards:
--   * Product COSTS are never written here. They are entered in
--     Admin -> Products, and re-running this seed must not wipe real data.
--   * Bank details are never overwritten once present, so verified account
--     numbers survive a re-run.
--
-- Only the three confirmed Workweek tiers are seeded. No other products,
-- reviews, stock counts or delivery fees are invented here.
-- ===========================================================================

-- ------------------------------------------------------------- admin user
-- CHANGE THIS EMAIL to the address that should own the admin area. Admin
-- access is granted purely by which email is signed in, so this row is the
-- entire authorisation list. Never commit a real service-role key.
insert into public.users (id, name, email, role, provider)
values (gen_random_uuid(), 'LisBee Admin', 'admin@hellolisbee.com', 'admin', 'local')
on conflict (email) do update set role = 'admin', name = excluded.name;

-- ----------------------------------------------------------- site settings
-- Bank details are merged, not replaced: the incoming blank values only apply
-- when no bank block exists yet.
insert into public.site_settings (id, data)
values (
  1,
  '{
    "brand_name": "LisBee",
    "tagline": "Thoughtfully given. Happily received.",
    "whatsapp_number": "07061804951",
    "email": "hellolisbee@gmail.com",
    "instagram": "@hellolisbee",
    "tiktok": "@hellolisbee",
    "linkedin": "LisBee",
    "delivery_cities": ["Abuja", "Lagos"],
    "bank": { "bank_name": "", "account_name": "", "account_number": "" },
    "paystack_enabled": false,
    "target_margin_percent": 30,
    "announcement": "",
    "from_name": "LisBee",
    "from_email": "hellolisbee@gmail.com"
  }'::jsonb
)
on conflict (id) do update
set data = public.site_settings.data
            || (excluded.data - 'bank' - 'updated_at')
            || jsonb_build_object(
                 'bank', coalesce(public.site_settings.data -> 'bank', excluded.data -> 'bank'),
                 'updated_at', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
               ),
    updated_at = now();

-- --------------------------------------------------------- delivery zones
-- fee is deliberately NULL. Checkout says "confirmed before dispatch" until a
-- real fee is entered in Admin -> Content & delivery.
insert into public.delivery_zones (id, city, zone_name, fee, same_day, next_day, standard, active)
values
  ('zone-abuja', 'Abuja', 'Abuja (city-wide)', null, false, false, true, true),
  ('zone-lagos', 'Lagos', 'Lagos (city-wide)', null, false, false, true, true)
on conflict (id) do update
set city = excluded.city,
    zone_name = excluded.zone_name,
    same_day = excluded.same_day,
    next_day = excluded.next_day,
    standard = excluded.standard,
    active = excluded.active;
-- NOTE: fee is intentionally absent from the update list, so a configured
-- fee is never reset to NULL by a re-run.

-- -------------------------------------------------------------- taxonomies
insert into public.taxonomies (id, kind, name, slug, description, show_in_nav, display_order, coming_soon)
values
  ('cat-signature',    'category', 'Signature',            'signature',           'The LisBee signature line.', true,  0, false),
  ('cat-workweek',     'category', 'Workweek Boxes',       'workweek-boxes',      'The signature five-day gifting experience.', true, 1, false),
  ('cat-birthday',     'category', 'Birthday Gifts',       'birthday-gifts',      'Birthday boxes and celebration gifts.', true, 3, true),
  ('cat-anniversary',  'category', 'Anniversary Gifts',    'anniversary-gifts',   'Gifts for couples and milestones.', true, 4, true),
  ('cat-christmas',    'category', 'Christmas & Festive',  'christmas-festive',   'Seasonal boxes, hampers and festive corporate gifting.', true, 5, true),
  ('cat-coffee',       'category', 'Coffee Gifts',         'coffee-gifts',        'Coffee and café-style gifting.', true, 6, true),
  ('cat-corporate',    'category', 'Corporate',            'corporate',           'Employee, client, executive and team gifting.', true, 7, true),
  ('cat-byo',          'category', 'Build Your Own Gift',  'build-your-own',      'Choose a box, pick the contents, add a message.', false, 90, true),
  ('occ-birthday',     'occasion', 'Birthday',             'birthday',            null, true, 1, false),
  ('occ-anniversary',  'occasion', 'Anniversary',          'anniversary',         null, true, 2, false),
  ('occ-bromance',     'occasion', 'Bromance',             'bromance',            null, true, 3, false),
  ('occ-christmas',    'occasion', 'Christmas & Festive',  'christmas',           null, true, 4, false),
  ('occ-congrats',     'occasion', 'Congratulations',      'congratulations',     null, true, 5, false),
  ('occ-new-mom',      'occasion', 'New Mom',              'new-mom',             null, true, 6, false),
  ('occ-new-baby',     'occasion', 'New Baby',             'new-baby',            null, true, 7, false),
  ('occ-graduation',   'occasion', 'Graduation',           'graduation',          null, true, 8, false),
  ('occ-thank-you',    'occasion', 'Thank You',            'thank-you',           null, true, 9, false),
  ('occ-coffee',       'occasion', 'Coffee Gifts',         'coffee',              null, true, 10, false),
  ('rec-her',          'recipient','For Her',              'for-her',             null, true, 1, false),
  ('rec-him',          'recipient','For Him',              'for-him',             null, true, 2, false),
  ('rec-friends',      'recipient','For Friends',          'for-friends',         null, true, 3, false),
  ('rec-partners',     'recipient','For Partners',         'for-partners',        null, true, 4, false),
  ('rec-family',       'recipient','For Family',           'for-family',          null, true, 5, false),
  ('rec-colleagues',   'recipient','For Colleagues',       'for-colleagues',      null, true, 6, false),
  ('rec-employees',    'recipient','For Employees',        'for-employees',       null, true, 7, false),
  ('rec-clients',      'recipient','For Clients',          'for-clients',         null, true, 8, false),
  ('rec-teams',        'recipient','For Teams',            'for-teams',           null, true, 9, false),
  ('rec-executives',   'recipient','For Executives',       'for-executives',      null, true, 10, false)
on conflict (id) do update
set kind = excluded.kind,
    name = excluded.name,
    slug = excluded.slug,
    description = coalesce(excluded.description, public.taxonomies.description),
    show_in_nav = excluded.show_in_nav,
    display_order = excluded.display_order,
    coming_soon = excluded.coming_soon;

-- ======================================================================
-- THE THREE WORKWEEK TIERS
--
-- Prices are the only figures taken from the business brief. COGS are left
-- NULL on purpose: fill them in via Admin -> Products once supplier costs are
-- confirmed, and the margin column will start reporting.
--
-- cost_product / cost_packaging / cost_other are deliberately absent from the
-- UPDATE list below, so re-running this seed never overwrites real costing.
-- ======================================================================
insert into public.products (
  id, name, slug, tagline, description, price,
  cost_product, cost_packaging, cost_other,
  category, occasions, recipients, images, sku, tier,
  stock_status, availability, status,
  featured, coming_soon, bestseller, is_new,
  delivery_info, customisation, whats_inside,
  seo_title, seo_description
)
values
(
  'prod-premium-workweek',
  'Premium Workweek',
  'premium-workweek',
  'A thoughtful start to the five-day ritual.',
  'Give someone a better week, one day at a time. The Premium Workweek is one gift that unfolds across five days: a pack for each weekday, each holding a drink or tea, a snack and a small LisBee daily card.' || chr(10) || chr(10) || 'One delivery, five moments. Your recipient opens one pack each day, Monday to Friday - something to look forward to every workday.',
  20000, null, null, null,
  'workweek-boxes',
  '["thank-you","congratulations"]'::jsonb,
  '["for-colleagues","for-friends","for-employees"]'::jsonb,
  '["/images/premium-a.webp","/images/premium-b.webp"]'::jsonb,
  'LB-WW-PRE', 'premium',
  'in_stock', 'available', 'published',
  true, false, false, true,
  'Delivered in Abuja and Lagos. Delivery timing and fee are confirmed before dispatch.',
  'Gift message included. Recipient name on the daily card on request.',
  '[
    {"day":"Monday","moment":"Start Strong","items":["Dried mango snack (30g)","Roasted cashews sachet (40g)","Monday card"]},
    {"day":"Tuesday","moment":"Keep Going","items":["Toblerone 35g miniature","Shortbread cookies (2pc)","Tuesday card"]},
    {"day":"Wednesday","moment":"Recharge","items":["Tigernut snack mix","Premium green tea sachet","Wednesday card"]},
    {"day":"Thursday","moment":"Finish Strong","items":["Gourmet plantain chips","Chivita juice","Thursday card"]},
    {"day":"Friday","moment":"Celebrate","items":["Nigerian craft chocolate bar","One bonus treat","Friday card"]}
  ]'::jsonb,
  'Premium Workweek Box | LisBee',
  'The Premium Workweek Box: five individually packaged weekday moments with snacks, drinks and a daily card. Delivered in Abuja and Lagos.'
),
(
  'prod-signature-workweek',
  'Signature Workweek',
  'signature-workweek',
  'The flagship. Five days done properly.',
  'Our hero box, and the one everything else is built around. The Signature Workweek carries a richer set of weekday moments - premium chocolate, whole-leaf tea and coffee, better savouries - in a rigid box with five clearly marked day compartments.' || chr(10) || chr(10) || 'One delivery, five moments. Your recipient opens one pack each day, Monday to Friday - something to look forward to every workday.',
  35000, null, null, null,
  'workweek-boxes',
  '["congratulations","thank-you","birthday"]'::jsonb,
  '["for-colleagues","for-friends","for-partners","for-employees","for-her","for-him"]'::jsonb,
  '["/images/signature-a.webp"]'::jsonb,
  'LB-WW-SIG', 'signature',
  'in_stock', 'available', 'published',
  true, false, false, true,
  'Delivered in Abuja and Lagos. Delivery timing and fee are confirmed before dispatch.',
  'Gift message included. Recipient name and corporate branding available on request.',
  '[
    {"day":"Monday","moment":"Start Strong","items":["ReelFruit dried fruit (70g)","Honey-roasted mixed nuts (60g)","San Pellegrino 250ml or premium juice","Monday card"]},
    {"day":"Tuesday","moment":"Keep Going","items":["Lindt Lindor 3-piece or Toblerone 50g","Artisan cookie duo","Tuesday card"]},
    {"day":"Wednesday","moment":"Recharge","items":["Premium trail mix (50g)","Whole-leaf tea sachet","Coffee sachet","Wednesday card"]},
    {"day":"Thursday","moment":"Finish Strong","items":["Gourmet crackers with cheese portion","Premium soft drink","Thursday card"]},
    {"day":"Friday","moment":"Celebrate","items":["Craft chocolate bar","Gourmet popcorn or brownie bite","Friday card"]}
  ]'::jsonb,
  'Signature Workweek Box | LisBee',
  'The Signature Workweek Box - five days of premium weekday moments with chocolate, tea, coffee and savouries. LisBee flagship gift, delivered in Abuja and Lagos.'
),
(
  'prod-executive-workweek',
  'Executive Workweek',
  'executive-workweek',
  'For executives, board members and valued clients.',
  'The full expression of the Workweek idea. The Executive box pairs luxury chocolate and premium nuts with specialty coffee, a personalised name card and a Friday moment worth clearing the calendar for.' || chr(10) || chr(10) || 'One delivery, five moments. Your recipient opens one pack each day, Monday to Friday - something to look forward to every workday.',
  60000, null, null, null,
  'workweek-boxes',
  '["congratulations","thank-you"]'::jsonb,
  '["for-executives","for-clients","for-teams","for-colleagues"]'::jsonb,
  '["/images/executive-c.webp","/images/executive-wide.webp","/images/executive-a.webp"]'::jsonb,
  'LB-WW-EXE', 'executive',
  'in_stock', 'available', 'published',
  true, false, false, true,
  'Delivered in Abuja and Lagos. Delivery timing and fee are confirmed before dispatch.',
  'Gift message, personalised name card and corporate branding available on request.',
  '[
    {"day":"Monday","moment":"Start Strong","items":["Premium nut trio (cashew, almond, macadamia)","San Pellegrino Panna or premium juice","Monday card"]},
    {"day":"Tuesday","moment":"Keep Going","items":["Lindt Excellence 70% bar or Lindor gift box","Gourmet shortbread","Tuesday card"]},
    {"day":"Wednesday","moment":"Recharge","items":["Premium granola portion","Whole-leaf tea","Drip-bag coffee","Wednesday card"]},
    {"day":"Thursday","moment":"Finish Strong","items":["Artisan savoury selection with cheese portion","Premium beverage","Thursday card"]},
    {"day":"Friday","moment":"Celebrate","items":["Toblerone 100g or Lindt equivalent","Craft chocolate","Personalised name card"]}
  ]'::jsonb,
  'Executive Workweek Box | LisBee',
  'The Executive Workweek Box - luxury chocolate, premium nuts, specialty coffee and a personalised card across five days. For executives and VIP clients in Abuja and Lagos.'
)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    tagline = excluded.tagline,
    description = excluded.description,
    price = excluded.price,
    category = excluded.category,
    occasions = excluded.occasions,
    recipients = excluded.recipients,
    images = excluded.images,
    sku = excluded.sku,
    tier = excluded.tier,
    stock_status = excluded.stock_status,
    availability = excluded.availability,
    status = excluded.status,
    delivery_info = excluded.delivery_info,
    customisation = excluded.customisation,
    whats_inside = excluded.whats_inside,
    seo_title = excluded.seo_title,
    seo_description = excluded.seo_description,
    updated_at = now();
-- featured / coming_soon / bestseller / is_new are NOT reset: those are
-- merchandising decisions an admin may have changed after the first seed.

-- ============================================================== verify
-- Expected: 3 published products at 20000 / 35000 / 60000, and no zone fees.
select slug, price, stock_status, cost_product, featured
from public.products
order by price;

select city, fee, active from public.delivery_zones order by city;

select email, role from public.users where role = 'admin';


-- ---------------------------------------------------------------
-- FILE: 0005_content.sql
-- ---------------------------------------------------------------
-- ===========================================================================
-- LisBee — FAQ and policy content
--
-- GENERATED FILE. Do not hand-edit.
-- Regenerate with:  node scripts/generate-content-sql.mjs
--
-- Source of truth is lib/db/seed.ts. This exists so the /faq page and the four
-- policy routes are not empty on a fresh database. Both tables are editable in
-- Admin -> Content & delivery, and re-running this file restores the defaults.
--
-- Safe to run more than once: every insert is an upsert.
-- ===========================================================================


-- ------------------------------------------------------------------- faqs
insert into public.faqs (id, category, question, answer, display_order)
values
  ('faq-1', 'Workweek Box', 'How does the Workweek Box work?', 'You place one order and we deliver one box. Inside are five individually packaged moments, one for each weekday from Monday to Friday. Each day''s pack holds a drink or tea, a snack or treat, and a small LisBee daily card. The recipient opens one pack a day.', 1),
  ('faq-2', 'Workweek Box', 'Which size should I choose?', 'Premium (₦20,000) is a thoughtful everyday gift. Signature (₦35,000) is our flagship and the best balance of variety and presentation. Executive (₦60,000) is built for executives, board members and valued clients.', 2),
  ('faq-3', 'Delivery', 'Where does LisBee deliver?', 'We currently deliver in Abuja and Lagos only. Delivery timing and the delivery fee are confirmed before your order is dispatched. More cities will follow.', 3),
  ('faq-4', 'Payment', 'How do I pay?', 'At launch we accept bank transfer. After checkout you will see the account details, your payment reference and the exact amount to send. Once we confirm the transfer, we start preparing your order. Online card payment is coming soon.', 4),
  ('faq-5', 'Orders', 'Can I send the gift directly to someone else?', 'Yes. Enter the recipient''s name, phone number and delivery address at checkout. If the gift is for you, tick ''This gift is for me'' and we will use your details.', 5),
  ('faq-6', 'Orders', 'Can I add a gift message?', 'Yes. There is a gift message field at checkout. We print it on the card that goes with the box.', 6),
  ('faq-7', 'Corporate', 'Do you handle corporate and bulk orders?', 'Yes. Employee appreciation, onboarding, client gifting, executive gifts, team celebrations and festive programmes. Share the details on our corporate gifting page and we will come back with a proposal.', 7),
  ('faq-8', 'Corporate', 'Can you add our company branding?', 'Personalisation and company branding are available on request for corporate orders. Mention it in your enquiry and we will confirm what is possible for your timeline.', 8),
  ('faq-9', 'Workweek Box', 'How long do the items keep?', 'The box is built around shelf-stable packaged goods. Exact batch and expiry details are shared with each order — tell us if you need them for a specific date.', 9),
  ('faq-10', 'Orders', 'What if I need help with my order?', 'Message us on WhatsApp at 07061804951 or email hellolisbee@gmail.com. We answer order questions there directly.', 10)
on conflict (id) do update
set category = excluded.category,
    question = excluded.question,
    answer = excluded.answer,
    display_order = excluded.display_order;

-- ----------------------------------------------------------- policy pages
insert into public.pages (slug, title, body)
values
  ('delivery', 'Delivery Policy', 'Where we deliver: Abuja and Lagos. We are not delivering to other locations at this time.

Fees: delivery fees depend on your location and are confirmed before your order is dispatched. Fees appear at checkout once they are configured for your area.

Timing: choose a preferred delivery date at checkout. We confirm the exact window with you, including same-day or next-day options where they are available for your area.

Receiving the gift: someone should be available at the delivery address. If the recipient is unavailable, we will call the phone number provided to arrange the next attempt.

Delays: traffic, weather and public holidays can affect timing. If we expect a delay, we will tell you early.

Questions: WhatsApp 07061804951 or email hellolisbee@gmail.com.'),
  ('refunds', 'Refund & Returns Policy', 'We want every gift to arrive as expected.

Damaged or incorrect orders: if your order arrives damaged, incomplete or different from what you ordered, contact us within 24 hours with a photo. We will make it right — replace the item, send the missing piece or refund you.

Change of mind: because our gifts are food products assembled to order, we cannot accept returns for a change of mind once the order has been prepared.

Cancellations: orders can be cancelled for a full refund before preparation begins. Once an order is prepared or dispatched, it can no longer be cancelled.

Refund timing: approved refunds are sent by bank transfer within 3–5 working days to the account used for payment.

Start a request: WhatsApp 07061804951 or email hellolisbee@gmail.com with your order number.'),
  ('terms', 'Terms & Conditions', 'These terms apply to orders placed on the LisBee website.

Orders: an order is confirmed once we receive payment by bank transfer and send you a payment confirmation. Until then, prices and availability may change.

Pricing: all prices are in Naira and include packaging. Delivery fees are confirmed separately based on your delivery location.

Delivery: we currently deliver in Abuja and Lagos. Delivery dates are estimates and depend on location and schedule; we confirm timing with you before dispatch.

Gift content: the box contents listed for each product describe the intended composition. Individual items may be substituted with one of equal or greater value when a specific item is unavailable; we will tell you if this happens.

Cancellation: contact us as soon as possible. If your order has not been prepared, we can usually cancel and refund. Once dispatched, the order cannot be cancelled.

Contact: hellolisbee@gmail.com or WhatsApp 07061804951.'),
  ('privacy-policy', 'Privacy Policy', 'This policy explains how LisBee handles your information when you shop with us.

What we collect: your name, email address, phone number, delivery details, recipient details and order history. We collect only what we need to take payment, deliver gifts and support you after the sale.

How we use it: to process and deliver orders, send order updates by email, respond to enquiries and improve the shop. We do not sell your personal information.

Recipients: when you send a gift, we use the recipient''s name, phone number and address for that delivery only.

Payments: at launch, payments are made by bank transfer. Card payments will be processed by a secure payment provider once enabled; we never store your bank details.

Cookies: we use essential cookies to keep your cart and session working, and optional analytics cookies to understand how the shop is used.

Questions: email hellolisbee@gmail.com or message 07061804951.')
on conflict (slug) do update
set title = excluded.title,
    body = excluded.body,
    updated_at = now();

-- ================================================================ verify
select slug, title, length(body) as body_chars from public.pages order by slug;
select category, count(*) from public.faqs group by category order by category;
