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
