import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import type { DeliveryZone, Faq, Taxonomy, TaxonomyKind } from "@/lib/types";
import { clean, cleanMultiline, jsonError, toInt } from "@/lib/validation";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";

const KINDS: TaxonomyKind[] = ["category", "occasion", "recipient"];

/** Upsert a FAQ, taxonomy entry or delivery zone. */
export async function POST(request: Request): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error ?? "Not authorised", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request", 400);
  }

  const kind = clean(body.kind, 20);
  const id = clean(body.id, 60) || crypto.randomUUID();

  if (kind === "faq") {
    const question = clean(body.question, 300);
    const answer = cleanMultiline(body.answer, 3000);
    if (question.length < 5 || answer.length < 5) {
      return jsonError("A FAQ needs both a question and an answer", 422);
    }
    const faq: Faq = {
      id,
      question,
      answer,
      category: clean(body.category, 80) || "General",
      display_order: toInt(body.display_order, 0, 9999) ?? 0,
    };
    await db().saveFaq(faq);
    return Response.json({ ok: true, faq });
  }

  if (kind === "taxonomy") {
    const taxonomyKind = clean(body.taxonomy_kind, 20) as TaxonomyKind;
    if (!KINDS.includes(taxonomyKind)) return jsonError("Unknown taxonomy kind", 422);
    const name = clean(body.name, 120);
    if (name.length < 2) return jsonError("Name is required", 422);
    const taxonomy: Taxonomy = {
      id,
      kind: taxonomyKind,
      name,
      slug: slugify(clean(body.slug, 140) || name),
      description: cleanMultiline(body.description, 600) || undefined,
      image: clean(body.image, 300) || undefined,
      show_in_nav: body.show_in_nav === true,
      display_order: toInt(body.display_order, 0, 9999) ?? 0,
      coming_soon: body.coming_soon === true,
    };
    if (!taxonomy.slug) return jsonError("Could not derive a slug", 422);
    await db().saveTaxonomy(taxonomy);
    return Response.json({ ok: true, taxonomy });
  }

  if (kind === "zone") {
    const city = clean(body.city, 80);
    if (city.length < 2) return jsonError("City is required", 422);
    const zone: DeliveryZone = {
      id,
      city,
      zone_name: clean(body.zone_name, 120) || city,
      fee: body.fee === "" || body.fee == null ? null : toInt(body.fee, 0, 2_000_000),
      same_day: body.same_day === true,
      next_day: body.next_day === true,
      standard: body.standard !== false,
      active: body.active !== false,
    };
    if (body.fee !== "" && body.fee != null && zone.fee === null) {
      return jsonError("Delivery fee must be a number in Naira", 422);
    }
    await db().saveZone(zone);
    return Response.json({ ok: true, zone });
  }

  return jsonError("Unknown content type", 422);
}

/** Delete a FAQ, taxonomy entry or delivery zone. */
export async function DELETE(request: Request): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error ?? "Not authorised", 401);

  const url = new URL(request.url);
  const kind = clean(url.searchParams.get("kind"), 20);
  const id = clean(url.searchParams.get("id"), 60);
  if (!id) return jsonError("Missing id", 422);

  if (kind === "faq") await db().deleteFaq(id);
  else if (kind === "taxonomy") await db().deleteTaxonomy(id);
  else if (kind === "zone") await db().deleteZone(id);
  else return jsonError("Unknown content type", 422);

  return Response.json({ ok: true });
}
