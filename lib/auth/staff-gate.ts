import { safeEqual } from "@/lib/validation";

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
 *
 * This lives in its own module because BOTH the web sign-in route and the
 * mobile token route must apply it. Duplicating the rule would be how one
 * client quietly ends up less protected than the other.
 */
export function checkStaffAccess(provided: string): {
  ok: true;
} | { ok: false; error: string; status: number } {
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
