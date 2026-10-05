import { cookies } from "next/headers";
import crypto from "node:crypto";
import { getRequestUser, getSessionUser } from "@/lib/auth/session";
import type { User } from "@/lib/types";

/**
 * Which cart a request is talking about.
 *
 * A signed-in customer always resolves to the SAME key on every device, which
 * is what makes the web cart and the phone cart one cart. Guests fall back to a
 * random token in an httpOnly cookie so a guest keeps a cart without an account.
 */
const GUEST_COOKIE = "lisbee_cart";

/** Stable per-account key. */
export function ownerKeyForUser(user: User): string {
  return `user:${user.id}`;
}

export function isGuestKey(key: string): boolean {
  return key.startsWith("guest:");
}

/** A fresh, unguessable guest key. */
export function newGuestKey(): string {
  return `guest:${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Resolves the owner key for the current request.
 *
 * A signed-in user is never switched to a guest cart even if a stale guest
 * cookie is present — otherwise signing in would silently orphan the items the
 * visitor had already picked.
 */
export async function resolveOwnerKey(request?: Request): Promise<{ key: string; user: User | null }> {
  // A native client authenticates with a bearer token and has no cookie jar,
  // so the token must be checked first or the app would silently get a guest
  // cart and never share the signed-in customer's cart.
  const user = request ? await getRequestUser(request) : await getSessionUser();
  if (user) return { key: ownerKeyForUser(user), user };

  const store = await cookies();
  const existing = store.get(GUEST_COOKIE)?.value ?? "";
  const key = /^guest:[a-f0-9]{48}$/.test(existing) ? existing : newGuestKey();

  if (key !== existing) {
    try {
      store.set(GUEST_COOKIE, key, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production" && !process.env.INSECURE_HTTP,
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
      });
    } catch {
      /* cookies unavailable — the cart still works for this request */
    }
  }
  return { key, user: null };
}

/**
 * Merges a guest cart into the signed-in user's cart at sign-in.
 *
 * Without this, signing in on the phone would show an empty cart even though
 * the same person had items on the website as a guest. Quantities are summed so
 * nothing is silently lost.
 */
export async function mergeGuestCartIntoUser(guestKey: string, user: User): Promise<void> {
  if (!isGuestKey(guestKey)) return;
  const target = ownerKeyForUser(user);
  try {
    const { db } = await import("@/lib/db");
    const store = db();
    const guestItems = await store.listCartItems(guestKey);
    for (const item of guestItems) {
      const existing = await store.getCartItem(target, item.slug);
      const merged = Math.min(
        20,
        item.quantity + (existing?.quantity ?? 0),
      );
      if (merged > 0) await store.upsertCartItem(target, item.slug, merged);
    }
    await store.clearCart(guestKey);
  } catch {
    /* a failed merge must never block sign-in */
  }
}
