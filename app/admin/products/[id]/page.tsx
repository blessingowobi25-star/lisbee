import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, occasions, recipients, settings] = await Promise.all([
    db().getProductById(id),
    db().listTaxonomies("category"),
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
    db().getSettings(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/products" className="text-xs text-muted hover:text-espresso">
        ← All products
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">{product.name}</h2>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          className="text-xs text-honey-deep hover:underline"
        >
          View on storefront →
        </Link>
      </div>
      <div className="mt-7">
        <ProductForm
          product={product}
          taxonomies={{ categories, occasions, recipients }}
          targetMargin={settings.target_margin_percent}
        />
      </div>
    </div>
  );
}
