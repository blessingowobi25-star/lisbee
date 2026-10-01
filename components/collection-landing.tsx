import Link from "next/link";
import type { Product, Taxonomy } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

/**
 * Shared layout for occasion / recipient / category landing pages.
 * Empty collections show an honest "coming soon" state instead of fake products.
 */
export function CollectionLanding({
  eyebrow,
  taxonomy,
  products,
  allHref,
  allLabel,
  breadcrumb,
}: {
  eyebrow: string;
  taxonomy: Taxonomy;
  products: Product[];
  allHref: string;
  allLabel: string;
  breadcrumb: { label: string; href?: string }[];
}) {
  const isEmpty = products.length === 0;

  return (
    <div className="shell py-10 md:py-14">
      <nav className="mb-6 text-xs text-muted" aria-label="Breadcrumb">
        {breadcrumb.map((crumb, i) => (
          <span key={crumb.label}>
            {i > 0 && <span className="mx-2">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-espresso">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ink">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-3 text-4xl md:text-6xl">{taxonomy.name}</h1>
          {taxonomy.description && (
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              {taxonomy.description}
            </p>
          )}
        </div>
        <Link href={allHref} className="btn btn-sm btn-outline">
          {allLabel}
        </Link>
      </div>

      {!isEmpty ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-line bg-ivory px-6 py-16 text-center">
          <span className="pill bg-sand text-cocoa">Coming soon</span>
          <h2 className="mt-4 text-2xl md:text-3xl">
            {taxonomy.name} gifts are being curated
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            We only publish a gift once the contents, pricing and presentation are right. In the
            meantime, the Workweek Box works for {taxonomy.name.toLowerCase()} too — or message us
            and we will let you know when this collection opens.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/workweek" className="btn btn-primary btn-sm">
              See the Workweek Box
            </Link>
            <Link href={allHref} className="btn btn-outline btn-sm">
              {allLabel}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
