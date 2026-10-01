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
