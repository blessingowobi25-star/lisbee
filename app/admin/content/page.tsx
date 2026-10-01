import { db } from "@/lib/db";
import { DeliveryZones } from "@/components/admin/delivery-zones";
import { FaqManager, TaxonomyManager } from "@/components/admin/content-lists";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const [zones, faqs, categories, occasions, recipients] = await Promise.all([
    db().listZones(),
    db().listFaqs(),
    db().listTaxonomies("category"),
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Content & delivery</h2>
        <p className="mt-1 text-sm text-muted">
          Everything the storefront reads at runtime, except products and orders.
        </p>
      </div>
      <DeliveryZones zones={zones} />
      <TaxonomyManager taxonomies={[...categories, ...occasions, ...recipients]} />
      <FaqManager faqs={faqs} />
    </div>
  );
}
