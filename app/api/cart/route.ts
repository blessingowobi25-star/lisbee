import { db } from "@/lib/db";
import { resolveOwnerKey } from "@/lib/cart/owner";
import { buildCartResponse } from "@/lib/cart/resolve";
import { MAX_QTY_PER_LINE, readBody } from "@/lib/cart/mutations";
import { clientKey, jsonError, rateLimit, toInt } from "@/lib/validation";

export const runtime = "nodejs";

function guard(request: Request, scope: string, limit = 240): boolean {
  return rateLimit(clientKey(request, scope), limit, 60_000);
}

/**
 * The shared cart.
 *
 * Signed in, this is the SAME cart the website uses — that is the whole point,
 * and it works because both clients resolve to the same owner key. Guests get a
 * cart tied to an httpOnly cookie.
 *
 * The response is always authoritative: only slugs are stored, and price, name
 * and image are re-read from the products table here. A client can add a slug
 * but can never decide what it costs.
 */
export async function GET(request: Request): Promise<Response> {
  if (!guard(request, "cart-get")) return jsonError("Too many requests.", 429);
  try {
    const { key } = await resolveOwnerKey(request);
    return Response.json(await buildCartResponse(key));
  } catch (error) {
    console.error("[cart] read failed:", error);
    return jsonError("We could not load your cart.", 500);
  }
}

/** Add a product, or set an exact quantity. */
export async function POST(request: Request): Promise<Response> {
  if (!guard(request, "cart-write", 120)) return jsonError("Too many requests.", 429);
  const body = await readBody(request);
  if (!body) return jsonError("Invalid request.", 400);

  const slug = String(body.slug ?? "").trim().toLowerCase();
  const quantity = toInt(body.quantity ?? 1, 1, MAX_QTY_PER_LINE);
  if (!slug) return jsonError("Missing product.", 422);
  if (!quantity) return jsonError("Please choose a quantity of 1 or more.", 422);

  try {
    const { key } = await resolveOwnerKey(request);
    const product = await db().getProductBySlug(slug);
    // Unpublished products are rejected so a stale app cannot resurrect them.
    if (!product || product.status !== "published" || product.coming_soon) {
      return jsonError("That product is not available.", 404);
    }
    if (product.stock_status === "out_of_stock") {
      return jsonError("That product is out of stock.", 409);
    }
    await db().upsertCartItem(key, slug, quantity);
    return Response.json(await buildCartResponse(key));
  } catch (error) {
    console.error("[cart] add failed:", error);
    return jsonError("We could not update your cart.", 500);
  }
}

/**
 * Replaces the whole cart.
 *
 * The website pushes its full line list here. Doing a blind overwrite would let
 * a second device delete items added a moment earlier on another device, so the
 * incoming list is MERGED by slug: quantities are summed (capped) and anything
 * absent is left alone. The explicit DELETE endpoint is the only way to empty a
 * cart, so a stale client cannot wipe a cart by sending an empty list.
 */
export async function PUT(request: Request): Promise<Response> {
  if (!guard(request, "cart-write", 120)) return jsonError("Too many requests.", 429);
  const body = await readBody(request);
  if (!body) return jsonError("Invalid request.", 400);

  const incoming = Array.isArray(body.lines) ? body.lines.slice(0, 50) : [];
  try {
    const { key } = await resolveOwnerKey(request);
    for (const raw of incoming) {
      const item = raw as Record<string, unknown>;
      const slug = String(item?.slug ?? "").trim().toLowerCase();
      const quantity = toInt(item?.quantity, 1, MAX_QTY_PER_LINE);
      if (!slug || !quantity) continue;

      const product = await db().getProductBySlug(slug);
      if (!product || product.status !== "published") continue;

      const existing = await db().getCartItem(key, slug);
      await db().upsertCartItem(key, slug, Math.min(MAX_QTY_PER_LINE, quantity + (existing?.quantity ?? 0)));
    }
    return Response.json(await buildCartResponse(key));
  } catch (error) {
    console.error("[cart] sync failed:", error);
    return jsonError("We could not update your cart.", 500);
  }
}

/** Set an exact quantity; 0 removes the line. */
export async function PATCH(request: Request): Promise<Response> {
  if (!guard(request, "cart-write", 120)) return jsonError("Too many requests.", 429);
  const body = await readBody(request);
  if (!body) return jsonError("Invalid request.", 400);

  const slug = String(body.slug ?? "").trim().toLowerCase();
  const quantity = toInt(body.quantity, 0, MAX_QTY_PER_LINE);
  if (!slug) return jsonError("Missing product.", 422);
  if (quantity === null) return jsonError("Invalid quantity.", 422);

  try {
    const { key } = await resolveOwnerKey(request);
    if (quantity === 0) await db().removeCartItem(key, slug);
    else await db().upsertCartItem(key, slug, quantity);
    return Response.json(await buildCartResponse(key));
  } catch (error) {
    console.error("[cart] update failed:", error);
    return jsonError("We could not update your cart.", 500);
  }
}

/** Remove one line, or clear everything when no slug is given. */
export async function DELETE(request: Request): Promise<Response> {
  if (!guard(request, "cart-write", 120)) return jsonError("Too many requests.", 429);

  const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase() ?? "";
  try {
    const { key } = await resolveOwnerKey(request);
    if (slug) await db().removeCartItem(key, slug);
    else await db().clearCart(key);
    return Response.json(await buildCartResponse(key));
  } catch (error) {
    console.error("[cart] remove failed:", error);
    return jsonError("We could not update your cart.", 500);
  }
}
