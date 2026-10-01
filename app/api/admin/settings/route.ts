import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import type { SiteSettings } from "@/lib/types";
import { clean, isEmail, jsonError, toInt } from "@/lib/validation";

export const runtime = "nodejs";

/** Update site settings, including the bank details shown at checkout. */
export async function PATCH(request: Request): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error ?? "Not authorised", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request", 400);
  }

  const current = await db().getSettings();
  const patch: Partial<SiteSettings> = {};

  for (const key of [
    "brand_name",
    "tagline",
    "whatsapp_number",
    "email",
    "instagram",
    "tiktok",
    "linkedin",
    "announcement",
    "from_name",
    "from_email",
  ] as const) {
    if (body[key] !== undefined) {
      const value = clean(body[key], 300);
      if ((key === "email" || key === "from_email") && value && !isEmail(value)) {
        return jsonError(`${key} must be a valid email address`, 422);
      }
      (patch as Record<string, unknown>)[key] = value;
    }
  }

  if (body.delivery_cities !== undefined) {
    const cities = Array.isArray(body.delivery_cities)
      ? body.delivery_cities.map((c) => clean(c, 60)).filter(Boolean)
      : [];
    if (cities.length === 0) return jsonError("At least one delivery city is required", 422);
    patch.delivery_cities = cities;
  }

  if (body.target_margin_percent !== undefined) {
    const margin = toInt(body.target_margin_percent, 0, 90);
    if (margin === null) return jsonError("Target margin must be between 0 and 90", 422);
    patch.target_margin_percent = margin;
  }

  if (body.paystack_enabled !== undefined) {
    patch.paystack_enabled = body.paystack_enabled === true;
  }

  if (body.bank !== undefined && body.bank && typeof body.bank === "object") {
    const bank = body.bank as Record<string, unknown>;
    patch.bank = {
      bank_name: clean(bank.bank_name, 120) || current.bank.bank_name,
      account_name: clean(bank.account_name, 120) || current.bank.account_name,
      account_number: clean(bank.account_number, 40) || current.bank.account_number,
    };
  }

  const saved = await db().updateSettings(patch);
  return Response.json({ ok: true, settings: saved });
}
