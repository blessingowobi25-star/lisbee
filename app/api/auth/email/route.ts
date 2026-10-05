import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { mergeGuestCartIntoUser } from "@/lib/cart/owner";
import { checkStaffAccess } from "@/lib/auth/staff-gate";
import { clean, clientKey, isEmail, jsonError, rateLimit } from "@/lib/validation";

export const runtime = "nodejs";

function safeNext(value: unknown): string {
  const next = clean(value, 200);
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

/**
 * Passwordless email sign-in.
 *
 * Customer accounts are open (the account area only ever exposes the visitor's
 * own orders). Staff accounts are gated by a shared access code from the
 * environment, compared in constant time.
 */
export async function POST(request: Request): Promise<Response> {
  if (!rateLimit(clientKey(request, "auth-email"), 10, 10 * 60_000)) {
    return jsonError("Too many attempts. Please try again in a few minutes.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 254).toLowerCase();
  if (!isEmail(email)) return jsonError("Please enter a valid email address.", 422);
  if (name.length < 2) return jsonError("Please enter your name.", 422);

  const existing = await db().getUserByEmail(email);

  // Existing staff account: require the access code before issuing a session.
  if (existing?.role === "admin") {
    const access = checkStaffAccess(typeof body.admin_code === "string" ? body.admin_code : "");
    if (!access.ok) return jsonError(access.error, access.status);
  }

  const user = existing
    ? await db().updateUser(existing.id, { name: name || existing.name })
    : await db().createUser({
        name,
        email,
        phone: undefined,
        role: "customer",
        provider: "local",
        avatar_url: undefined,
      });

  if (!user) return jsonError("We could not create your account.", 500);

  // Carry anything the visitor picked before signing in into their account, so
  // the cart they were building does not vanish at the moment they log in.
  const guestKey = request.headers.get("cookie")?.match(/lisbee_cart=(guest:[a-f0-9]{48})/)?.[1];
  if (guestKey) await mergeGuestCartIntoUser(guestKey, user);

  await createSession(user.id);
  return Response.json({ ok: true, redirect: safeNext(body.next) });
}
