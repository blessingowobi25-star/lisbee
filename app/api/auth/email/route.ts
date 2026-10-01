import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { clean, clientKey, isEmail, jsonError, rateLimit, safeEqual } from "@/lib/validation";

export const runtime = "nodejs";

function safeNext(value: unknown): string {
  const next = clean(value, 200);
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

/**
 * Guards the admin area.
 *
 * Email sign-in has no password, so on a public deployment anyone could type an
 * admin's address and be let in. Staff accounts therefore require a shared
 * access code from the environment, compared in constant time.
 *
 * In production the code is MANDATORY: without ADMIN_ACCESS_CODE set, no one
 * can obtain an admin session at all. Locally it is optional so the seeded
 * admin account works out of the box for development.
 */
function checkAdminAccess(provided: string): { ok: true } | { ok: false; error: string; status: number } {
  const expected = process.env.ADMIN_ACCESS_CODE;

  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        status: 503,
        error:
          "Staff sign-in is disabled: the server has no ADMIN_ACCESS_CODE configured. " +
          "Set it in your hosting environment to enable the admin area.",
      };
    }
    return { ok: true };
  }

  if (!safeEqual(provided.trim(), expected)) {
    return {
      ok: false,
      status: 403,
      error: "That staff access code is not correct.",
    };
  }
  return { ok: true };
}

/**
 * Passwordless email sign-in.
 *
 * Customer accounts are open (the account area only ever exposes the visitor's
 * own orders). Staff accounts are gated by the access code above.
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
    const access = checkAdminAccess(typeof body.admin_code === "string" ? body.admin_code : "");
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

  await createSession(user.id);
  return Response.json({ ok: true, redirect: safeNext(body.next) });
}
