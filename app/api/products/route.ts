import { db } from "@/lib/db";
import { toPublicProduct, toPublicTaxonomy } from "@/lib/catalog/public";
import { jsonError } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Public catalogue for the mobile app.
 *
 * The website renders products with Server Components that read the database
 * directly, which a native client cannot do. This exposes the same published
 * products over HTTP so both clients show identical data.
 *
 * Cost and margin fields are stripped: they are internal and have no business
 * being in a payload shipped to a phone.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const filter = {
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    occasion: url.searchParams.get("occasion") ?? undefined,
    recipient: url.searchParams.get("recipient") ?? undefined,
    sort: (url.searchParams.get("sort") as "featured" | undefined) ?? undefined,
    limit: Number.parseInt(url.searchParams.get("limit") ?? "50", 10),
  };

  if (!Number.isFinite(filter.limit) || filter.limit < 1 || filter.limit > 100) {
    filter.limit = 50;
  }

  try {
    const [products, categories, occasions, recipients] = await Promise.all([
      db().listProducts(filter),
      db().listTaxonomies("category"),
      db().listTaxonomies("occasion"),
      db().listTaxonomies("recipient"),
    ]);

    return Response.json({
      products: products.slice(0, filter.limit).map(toPublicProduct),
      taxonomies: {
        categories: categories.map(toPublicTaxonomy),
        occasions: occasions.map(toPublicTaxonomy),
        recipients: recipients.map(toPublicTaxonomy),
      },
    });
  } catch (error) {
    console.error("[products] list failed:", error);
    return jsonError("We could not load the products.", 500);
  }
}
