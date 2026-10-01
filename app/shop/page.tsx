import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { ShopToolbar } from "@/components/shop-toolbar";
import type { ProductFilter } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop premium gift boxes",
  description:
    "Browse LisBee gifts — the Workweek Box and more. Shop by occasion, recipient or price. Delivered in Abuja and Lagos.",
  alternates: { canonical: "/shop" },
};

type Search = { [key: string]: string | string[] | undefined };

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filter: ProductFilter = {
    q: one(sp.q),
    category: one(sp.category),
    occasion: one(sp.occasion),
    recipient: one(sp.recipient),
    price: one(sp.price) as ProductFilter["price"],
    sort: (one(sp.sort) as ProductFilter["sort"]) ?? "featured",
  };

  const [products, occasions, recipients, categories] = await Promise.all([
    db().listProducts(filter),
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
    db().listTaxonomies("category"),
  ]);

  const activeCategory = filter.category
    ? categories.find((c) => c.slug === filter.category)
    : undefined;
  const activeOccasion = filter.occasion
    ? occasions.find((o) => o.slug === filter.occasion)
    : undefined;
  const activeRecipient = filter.recipient
    ? recipients.find((r) => r.slug === filter.recipient)
    : undefined;

  const heading = activeOccasion
    ? `${activeOccasion.name} gifts`
    : activeRecipient
      ? `Gifts ${activeRecipient.name.toLowerCase()}`
      : activeCategory
        ? activeCategory.name
        : "Shop all gifts";

  return (
    <div className="shell py-10 md:py-14">
      <nav className="mb-6 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-espresso">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Shop</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">The LisBee shop</span>
          <h1 className="mt-3 text-4xl md:text-6xl">{heading}</h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Premium gifts, thoughtfully presented and delivered in Abuja and Lagos. Filter by
          occasion, recipient or price.
        </p>
      </div>

      <div className="mb-8">
        <ShopToolbar
          occasions={occasions.map((o) => ({ name: o.name, slug: o.slug }))}
          recipients={recipients.map((r) => ({ name: r.name, slug: r.slug }))}
          categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
          sort={filter.sort ?? "featured"}
          q={filter.q ?? ""}
        />
      </div>

      {products.length > 0 ? (
        <>
          <p className="mb-5 text-sm text-muted">
            {products.length} {products.length === 1 ? "gift" : "gifts"}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-ivory px-6 py-16 text-center">
          <h2 className="text-2xl">Nothing here yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            {activeCategory?.coming_soon
              ? `${activeCategory.name} is on the way. We are building this collection properly before it goes live.`
              : "This collection has no products yet. Try another filter, or message us — we may have something that fits."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn btn-primary btn-sm">
              Browse all gifts
            </Link>
            <Link href="/workweek" className="btn btn-outline btn-sm">
              See the Workweek Box
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
