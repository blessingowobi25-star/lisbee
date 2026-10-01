import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatNaira } from "@/lib/format";
import { QuickAdd } from "@/components/add-to-cart-button";

function badgesFor(product: Product): { label: string; tone: string }[] {
  const badges: { label: string; tone: string }[] = [];
  if (product.coming_soon) badges.push({ label: "Coming Soon", tone: "bg-sand text-cocoa" });
  if (product.is_new && !product.coming_soon) badges.push({ label: "New", tone: "bg-olive text-cream" });
  if (product.bestseller) badges.push({ label: "Bestseller", tone: "bg-honey text-espresso" });
  if (product.stock_status === "out_of_stock" && !product.coming_soon) {
    badges.push({ label: "Sold out", tone: "bg-espresso text-cream" });
  }
  return badges;
}

export function ProductCard({ product }: { product: Product }) {
  const href = `/products/${product.slug}`;
  const badges = badgesFor(product);
  const soldOut = product.stock_status === "out_of_stock";

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-sand">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Image coming soon
          </div>
        )}
        {badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span key={b.label} className={`pill ${b.tone}`}>
                {b.label}
              </span>
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4 md:p-5">
        <Link href={href}>
          <h3 className="font-display text-lg leading-snug text-espresso md:text-xl">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{product.tagline}</p>
        <div className="mt-3 flex items-center justify-between gap-3 pt-1">
          <span className="text-base font-semibold text-espresso">
            {formatNaira(product.price)}
          </span>
          {!product.coming_soon && !soldOut ? (
            <QuickAdd
              product={{
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.images[0] ?? null,
              }}
            />
          ) : (
            <Link href={href} className="btn btn-sm btn-outline">
              {product.coming_soon ? "Details" : "View"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
