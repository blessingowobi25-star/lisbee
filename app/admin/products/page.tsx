import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await db().listProducts({ include_unpublished: true, sort: "name" });
  const target = (await db().getSettings()).target_margin_percent;

  const marginOf = (price: number, costs: (number | null)[]) => {
    if (costs.some((c) => c === null)) return null;
    const cost = costs.reduce<number>((sum, c) => sum + (c ?? 0), 0);
    if (price <= 0) return null;
    return ((price - cost) / price) * 100;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">Products</h2>
          <p className="mt-1 text-sm text-muted">
            Target margin {target}%. Leave costs blank until they are known — nothing is estimated
            for you.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm">
          New product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Cost</th>
              <th className="px-5 py-3 font-medium">Margin</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((product) => {
              const cost =
                product.cost_product === null
                  ? null
                  : product.cost_product + (product.cost_packaging ?? 0) + (product.cost_other ?? 0);
              const margin = marginOf(product.price, [
                product.cost_product,
                product.cost_packaging ?? 0,
                product.cost_other ?? 0,
              ]);
              const healthy = margin !== null && margin >= target;
              return (
                <tr key={product.id} className="hover:bg-ivory/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-sand">
                        {product.images[0] && (
                          <Image
                            src={product.images[0]}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span>
                        <span className="block font-medium">{product.name}</span>
                        <span className="block text-xs text-muted">{product.sku}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold">{formatNaira(product.price)}</td>
                  <td className="px-5 py-3.5 text-muted">
                    {cost === null ? "—" : formatNaira(cost)}
                  </td>
                  <td className="px-5 py-3.5">
                    {margin === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className={healthy ? "text-olive" : "text-red-700"}>
                        {margin.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span
                        className={`pill ${
                          product.status === "published"
                            ? "bg-olive text-cream"
                            : "bg-sand text-cocoa"
                        }`}
                      >
                        {product.status}
                      </span>
                      {product.featured && <span className="pill bg-honey/20 text-honey-deep">featured</span>}
                      {product.coming_soon && <span className="pill bg-sand text-cocoa">soon</span>}
                      {product.stock_status === "out_of_stock" && (
                        <span className="pill bg-red-50 text-red-700">out of stock</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-3 text-xs">
                      <Link
                        href={`/products/${product.slug}`}
                        target="_blank"
                        className="text-muted hover:text-espresso"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-honey-deep hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
