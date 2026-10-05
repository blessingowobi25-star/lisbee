import { db } from "@/lib/db";
import { buildSessionToken } from "@/lib/auth/session";
import { checkStaffAccess } from "@/lib/auth/staff-gate";
import { clean, clientKey, isEmail, jsonError, rateLimit } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Signs a mobile client in and returns a bearer token.
 *
 * This is the SAME account as the website: it looks the user up by the same
 * email and issues a token signed with the same secret, so /api/cart resolves
 * the same owner key on the phone as on the laptop.
 *
 * It deliberately does NOT set a cookie — React Native cannot use one, and
 * issuing both would leave two sessions to invalidate independently.
 */
export async function POST(request: Request): Promise<Response> {
  if (!rateLimit(clientKey(request, "auth-token"), 10, 10 * 60_000)) {
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

  try {
    const existing = await db().getUserByEmail(email);

    // Identical protection to the web form: no admin session without the code.
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

    const { token, expiresAt } = buildSessionToken(user.id);
    return Response.json({
      ok: true,
      token,
      expires_at: expiresAt,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("[auth] token issue failed:", error);
    return jsonError("We could not sign you in.", 500);
  }
}
