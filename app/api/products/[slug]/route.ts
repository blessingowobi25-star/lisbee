import { db } from "@/lib/db";
import { jsonError } from "@/lib/validation";
import { toPublicProduct } from "@/lib/catalog/public";

export const runtime = "nodejs";

/** A single product for the mobile product screen. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;
  try {
    const product = await db().getProductBySlug((slug ?? "").trim().toLowerCase());
    if (!product || product.status !== "published") {
      return jsonError("That product is not available.", 404);
    }
    return Response.json({ product: toPublicProduct(product) });
  } catch (error) {
    console.error("[products] read failed:", error);
    return jsonError("We could not load that product.", 500);
  }
}
