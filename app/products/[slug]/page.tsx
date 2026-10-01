import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, getSettings } from "@/lib/db";
import { ProductGallery } from "@/components/product-gallery";
import { PurchaseControls } from "@/components/add-to-cart-button";
import { ProductCard } from "@/components/product-card";
import { formatNaira, whatsappLink } from "@/lib/format";
import { ViewTracker } from "@/components/view-tracker";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await db().getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.tagline,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.seo_title || product.name,
      description: product.seo_description || product.tagline,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await db().getProductBySlug(slug);
  if (!product || product.status !== "published") notFound();

  const [settings, related, occasions, recipients] = await Promise.all([
    getSettings(),
    db().listProducts({ category: product.category }),
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
  ]);

  const relatedProducts = related.filter((p) => p.id !== product.id).slice(0, 3);
  const productOccasions = occasions.filter((o) => product.occasions.includes(o.slug));
  const productRecipients = recipients.filter((r) => product.recipients.includes(r.slug));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.seo_description || product.tagline,
    image: product.images,
    brand: { "@type": "Brand", name: "LisBee" },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: product.price,
      availability: product.coming_soon
        ? "https://schema.org/PreOrder"
        : product.stock_status === "in_stock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `/products/${product.slug}`,
    },
  };

  const paragraphs = product.description.split(/\n\n+/).filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker
        params={{ item_id: product.sku, item_name: product.name, price: product.price }}
      />

      <div className="shell py-8 md:py-12">
        <nav className="mb-7 text-xs text-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-espresso">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-espresso">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.images} alt={product.name} />

          <div>
            <div className="flex flex-wrap gap-2">
              {product.coming_soon && <span className="pill bg-sand text-cocoa">Coming Soon</span>}
              {product.is_new && !product.coming_soon && (
                <span className="pill bg-olive text-cream">New</span>
              )}
              {product.bestseller && <span className="pill bg-honey text-espresso">Bestseller</span>}
              {product.tier && (
                <span className="pill border border-line bg-white text-cocoa">
                  {product.tier} tier
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl">{product.name}</h1>
            <p className="mt-3 text-base text-muted">{product.tagline}</p>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="font-display text-4xl text-espresso">
                {formatNaira(product.price)}
              </span>
              <span className="text-xs uppercase tracking-[0.14em] text-honey-deep">
                {product.stock_status === "in_stock" && !product.coming_soon
                  ? "Available"
                  : product.coming_soon
                    ? "Coming soon"
                    : "Sold out"}
              </span>
            </div>

            <div className="mt-7">
              <PurchaseControls
                comingSoon={product.coming_soon || product.stock_status === "out_of_stock"}
                product={{
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] ?? null,
                }}
              />
            </div>

            <a
              href={whatsappLink(
                settings.whatsapp_number,
                `Hi LisBee, I'd like to ask about the ${product.name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline mt-4 w-full"
            >
              Ask about this gift on WhatsApp
            </a>

            <div className="mt-8 space-y-5">
              {paragraphs.map((text) => (
                <p key={text.slice(0, 24)} className="text-sm leading-relaxed text-muted">
                  {text}
                </p>
              ))}
            </div>

            <dl className="mt-8 divide-y divide-line rounded-3xl border border-line bg-white text-sm">
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <dt className="text-muted">Delivery</dt>
                <dd className="text-right text-ink">{product.delivery_info ?? "Abuja & Lagos"}</dd>
              </div>
              {product.customisation && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="text-muted">Personalisation</dt>
                  <dd className="text-right text-ink">{product.customisation}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <dt className="text-muted">SKU</dt>
                <dd className="text-right text-ink">{product.sku}</dd>
              </div>
              {product.weight && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <dt className="text-muted">Weight</dt>
                  <dd className="text-right text-ink">{product.weight}</dd>
                </div>
              )}
            </dl>

            {(productOccasions.length > 0 || productRecipients.length > 0) && (
              <div className="mt-7 flex flex-wrap gap-2">
                {productOccasions.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/occasions/${o.slug}`}
                    className="pill border border-line bg-linen text-cocoa transition hover:border-honey"
                  >
                    {o.name}
                  </Link>
                ))}
                {productRecipients.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/recipients/${r.slug}`}
                    className="pill border border-line bg-linen text-cocoa transition hover:border-honey"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------------- What's inside ---------------- */}
        {product.whats_inside && product.whats_inside.length > 0 && (
          <section className="mt-16">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="eyebrow">What&apos;s inside</span>
                <h2 className="mt-3 text-3xl md:text-4xl">Five days, unpacked</h2>
              </div>
              <p className="max-w-sm text-sm text-muted">
                Each day is packaged separately with a drink or tea, something to eat and a LisBee
                daily card. Contents may rotate slightly by season.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {product.whats_inside.map((day, i) => (
                <div
                  key={day.day}
                  className="h-full rounded-3xl border border-line bg-ivory p-5"
                  style={{ order: i }}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-honey-deep">
                    {day.day}
                  </div>
                  <div className="mt-1.5 font-display text-xl text-espresso">{day.moment}</div>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted">
                    {day.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-honey">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Related ---------------- */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="mb-7 flex items-end justify-between gap-4">
              <h2 className="text-2xl md:text-3xl">You may also like</h2>
              <Link href="/shop" className="btn btn-sm btn-outline">
                Shop all
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
