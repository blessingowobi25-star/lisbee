import { db } from "@/lib/db";
import { notifyAdminOfEnquiry, baseUrlFrom } from "@/lib/email";
import { requireAdmin } from "@/lib/auth/session";
import type { CorporateEnquiry } from "@/lib/types";
import {
  clientKey,
  clean,
  cleanMultiline,
  isEmail,
  jsonError,
  normalisePhone,
  rateLimit,
} from "@/lib/validation";

export const runtime = "nodejs";

/** Corporate enquiry intake — used by the /corporate form. */
export async function POST(request: Request): Promise<Response> {
  if (!rateLimit(clientKey(request, "enquiry"), 5, 10 * 60_000)) {
    return jsonError("Too many enquiries from this connection. Please try again later.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const name = clean(body.name, 120);
  const company = clean(body.company, 160);
  const work_email = clean(body.work_email, 254).toLowerCase();
  const phoneRaw = clean(body.phone, 40);
  const message = cleanMultiline(body.message, 4000);
  const requirements = cleanMultiline(body.requirements, 2000);
  const occasion = clean(body.occasion, 80);
  const city = clean(body.city, 80);
  const budget_per_recipient = clean(body.budget_per_recipient, 60);
  const recipients_count = clean(body.recipients_count, 40);
  const preferred_delivery_date = clean(body.preferred_delivery_date, 20);

  if (name.length < 2) return jsonError("Please enter your full name.", 422);
  if (company.length < 2) return jsonError("Please enter your company name.", 422);
  if (!isEmail(work_email)) return jsonError("Please enter a valid work email address.", 422);
  const phone = normalisePhone(phoneRaw);
  if (!phone) return jsonError("Please enter a valid Nigerian phone number.", 422);
  if (message.length < 10) return jsonError("Tell us a little more about what you need.", 422);

  const settings = await db().getSettings();
  const allowedCities = settings.delivery_cities.map((c) => c.toLowerCase());
  if (city && !allowedCities.includes(city.toLowerCase())) {
    return jsonError(`We currently deliver in ${settings.delivery_cities.join(" and ")} only.`, 422);
  }

  const enquiry: CorporateEnquiry = {
    id: crypto.randomUUID(),
    name,
    company,
    work_email,
    phone,
    recipients_count,
    occasion,
    city,
    budget_per_recipient,
    preferred_delivery_date,
    message,
    requirements: requirements || undefined,
    status: "new",
    created_at: new Date().toISOString(),
  };

  await db().createEnquiry(enquiry);
  await notifyAdminOfEnquiry(enquiry, baseUrlFrom(request.headers));

  return Response.json({ ok: true, id: enquiry.id }, { status: 201 });
}

/** Admin listing (protected). */
export async function GET(): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error ?? "Not authorised", error?.includes("Not signed in") ? 401 : 403);
  const enquiries = await db().listEnquiries();
  return Response.json({ enquiries });
}
