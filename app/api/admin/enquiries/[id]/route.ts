import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import type { CorporateEnquiry } from "@/lib/types";
import { clean, cleanMultiline, jsonError } from "@/lib/validation";

export const runtime = "nodejs";

const STATUSES: CorporateEnquiry["status"][] = [
  "new",
  "in_review",
  "contacted",
  "converted",
  "closed",
];

/** Update a corporate enquiry's status and internal notes. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error ?? "Not authorised", 401);

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request", 400);
  }

  const patch: Partial<CorporateEnquiry> = {};
  if (body.status !== undefined) {
    const status = clean(body.status, 20) as CorporateEnquiry["status"];
    if (!STATUSES.includes(status)) return jsonError("Unknown status", 422);
    patch.status = status;
  }
  if (body.notes !== undefined) patch.notes = cleanMultiline(body.notes, 2000);

  if (Object.keys(patch).length === 0) return jsonError("Nothing to update", 422);

  const updated = await db().updateEnquiry(id, patch);
  if (!updated) return jsonError("Enquiry not found", 404);
  return Response.json({ ok: true, enquiry: updated });
}
