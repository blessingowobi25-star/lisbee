import Link from "next/link";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

async function taxonomies() {
  const [categories, occasions, recipients] = await Promise.all([
    db().listTaxonomies("category"),
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
  ]);
  return { categories, occasions, recipients };
}

export default async function NewProductPage() {
  const [tax, settings] = await Promise.all([taxonomies(), db().getSettings()]);

  return (
    <div>
      <Link href="/admin/products" className="text-xs text-muted hover:text-espresso">
        ← All products
      </Link>
      <h2 className="mt-4 text-2xl">New product</h2>
      <p className="mt-1 text-sm text-muted">
        New products start as drafts. Nothing appears in the storefront until you publish it.
      </p>
      <div className="mt-7">
        <ProductForm
          product={null}
          taxonomies={tax}
          targetMargin={settings.target_margin_percent}
        />
      </div>
    </div>
  );
}
