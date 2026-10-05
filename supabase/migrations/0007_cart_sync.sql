-- ===========================================================================
-- LisBee — server-side cart
--
-- The cart used to live only in the browser's localStorage, which meant a
-- customer could not see the same cart on their phone and laptop. This table
-- makes the cart a server resource so every signed-in device shares one cart.
--
-- Guests keep a cart too, keyed by a random token the browser holds in a
-- cookie. owner_key holds either 'user:<uuid>' or 'guest:<token>' so a single
-- table covers both without a second code path.
--
-- Safe to run more than once.
-- ===========================================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  slug text not null,
  quantity integer not null default 1 check (quantity > 0 and quantity <= 20),
  updated_at timestamptz not null default now(),
  unique (owner_key, slug)
);

-- The cart is read as a whole, so the lookup index is the important one.
create index if not exists cart_items_owner_idx on public.cart_items (owner_key);

alter table public.cart_items enable row level security;

-- No public policies: carts are only ever touched by the server (service role).

-- ---------------------------------------------------------------------
-- Keep updated_at honest. The clients poll this column to detect a change
-- made on another device, so it must advance on every write.
-- ---------------------------------------------------------------------
create or replace function public.touch_cart_item_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cart_items_touch_updated_at on public.cart_items;
create trigger cart_items_touch_updated_at
  before update on public.cart_items
  for each row execute function public.touch_cart_item_updated_at();

select owner_key, slug, quantity, updated_at from public.cart_items
order by updated_at desc;
