import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import type { Product, StockStatus, WorkweekDay } from "@/lib/types";
import { clean, cleanMultiline, jsonError, toInt } from "@/lib/validation";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";

/** Create or update a product. Costs are optional and drive the margin view. */
export async function POST(request: Request): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error ?? "Not authorised", 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request", 400);
  }

  const name = clean(body.name, 140);
  if (name.length < 2) return jsonError("Product name is required", 422);

  const id = clean(body.id, 60) || crypto.randomUUID();
  const existing = await db().getProductById(id);

  const slug = clean(body.slug, 160) || existing?.slug || slugify(name);
  if (!slug) return jsonError("Could not derive a slug for this product", 422);

  const price = toInt(body.price, 0, 100_000_000);
  if (price === null) return jsonError("Price must be a number in Naira", 422);

  const stock_status = clean(body.stock_status, 20) as StockStatus;
  if (stock_status !== "in_stock" && stock_status !== "out_of_stock") {
    return jsonError("Unknown stock status", 422);
  }

  const images = Array.isArray(body.images)
    ? body.images.map((v) => clean(v, 300)).filter(Boolean).slice(0, 12)
    : existing?.images ?? [];

  const list = (value: unknown, max = 24): string[] =>
    Array.isArray(value) ? value.map((v) => clean(v, 80)).filter(Boolean).slice(0, max) : [];

  const whats_inside: WorkweekDay[] = Array.isArray(body.whats_inside)
    ? (body.whats_inside as Record<string, unknown>[])
        .map((day) => ({
          day: clean(day?.day, 30),
          moment: clean(day?.moment, 60),
          items: list(day?.items, 12),
        }))
        .filter((day) => day.day)
        .slice(0, 7)
    : existing?.whats_inside ?? [];

  const now = new Date().toISOString();
  const product: Product = {
    id,
    name,
    slug,
    tagline: clean(body.tagline, 200) || existing?.tagline || "",
    description: cleanMultiline(body.description, 4000) || existing?.description || "",
    price,
    cost_product: body.cost_product === "" || body.cost_product == null
      ? null
      : toInt(body.cost_product, 0, 100_000_000),
    cost_packaging: body.cost_packaging === "" || body.cost_packaging == null
      ? null
      : toInt(body.cost_packaging, 0, 100_000_000),
    cost_other: body.cost_other === "" || body.cost_other == null
      ? null
      : toInt(body.cost_other, 0, 100_000_000),
    category: clean(body.category, 80) || existing?.category || "workweek-boxes",
    occasions: list(body.occasions),
    recipients: list(body.recipients),
    images,
    sku: clean(body.sku, 60) || existing?.sku || `LISB-${slug.slice(0, 8).toUpperCase()}`,
    tier: (clean(body.tier, 20) as Product["tier"]) || existing?.tier || null,
    stock_status,
    availability: clean(body.availability, 20) === "pre_order" ? "pre_order" : "available",
    status: clean(body.status, 20) === "draft" ? "draft" : "published",
    featured: body.featured === true,
    coming_soon: body.coming_soon === true,
    bestseller: body.bestseller === true,
    is_new: body.is_new === true,
    weight: clean(body.weight, 60) || existing?.weight,
    delivery_info: clean(body.delivery_info, 200) || existing?.delivery_info,
    customisation: clean(body.customisation, 200) || existing?.customisation,
    whats_inside,
    seo_title: clean(body.seo_title, 160) || existing?.seo_title,
    seo_description: clean(body.seo_description, 300) || existing?.seo_description,
    requires_supplier_confirmation: body.requires_supplier_confirmation === true,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  const saved = await db().saveProduct(product);
  return Response.json({ ok: true, product: saved }, { status: existing ? 200 : 201 });
}
