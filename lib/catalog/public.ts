import type { Product, Taxonomy } from "@/lib/types";

/**
 * The public shape of a product.
 *
 * Shared by the list and detail endpoints. Cost and margin fields are stripped:
 * they are internal and have no business being in a payload shipped to a phone.
 */
export function toPublicProduct(product: Product) {
  return {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    price: product.price,
    image: product.images?.[0] ?? null,
    images: product.images ?? [],
    tier: product.tier,
    stock_status: product.stock_status,
    availability: product.availability,
    category: product.category,
    occasions: product.occasions,
    recipients: product.recipients,
    featured: product.featured,
    bestseller: product.bestseller,
    is_new: product.is_new,
    sku: product.sku,
  };
}

export function toPublicTaxonomy(t: Taxonomy) {
  return { slug: t.slug, name: t.name };
}
