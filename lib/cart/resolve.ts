import { db } from "@/lib/db";
import type { CartResponse, ResolvedCartLine } from "@/lib/types";

/**
 * Turns stored cart rows into the authoritative cart a client should render.
 *
 * Prices, names and images are ALWAYS re-read from the products table. This is
 * the same rule checkout already follows, so a tampered or outdated client can
 * never influence what is charged — it can only choose a slug.
 *
 * Lines whose product has since been unpublished are dropped rather than sent
 * back, which is what stops a stale mobile build from showing deleted products.
 */
export async function buildCartResponse(ownerKey: string): Promise<CartResponse> {
  const stored = await db().listCartItems(ownerKey);
  const items: ResolvedCartLine[] = [];
  let newest: string | null = null;

  for (const row of stored) {
    const product = await db().getProductBySlug(row.slug);
    if (!product || product.status !== "published") continue;

    if (!newest || row.updated_at > newest) newest = row.updated_at;

    items.push({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images?.[0] ?? null,
      quantity: row.quantity,
    });
  }

  return {
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    updated_at: newest,
  };
}
