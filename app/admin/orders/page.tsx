import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTime, formatNaira, statusTone, whatsappLink } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const all = await db().listOrders({});
  const orders = status
    ? all.filter((o) => o.order_status === status || o.payment_status === status)
    : all;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Orders</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/admin/orders"
            className={`pill ${!status ? "bg-espresso text-cream" : "bg-white text-ink/70 border border-line"}`}
          >
            All ({all.length})
          </Link>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => {
            const count = all.filter((o) => o.order_status === key).length;
            return (
              <Link
                key={key}
                href={`/admin/orders?status=${key}`}
                className={`pill ${
                  status === key
                    ? "bg-espresso text-cream"
                    : "bg-white text-ink/70 border border-line"
                }`}
              >
                {label} ({count})
              </Link>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center text-sm text-muted">
          No orders match this filter.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Recipient</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-ivory/60">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                      {order.order_number}
                    </Link>
                    <div className="text-xs text-muted">{formatDateTime(order.created_at)}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>{order.customer_name}</div>
                    <a
                      href={whatsappLink(
                        order.customer_phone,
                        `Hi ${order.customer_name}, about your LisBee order ${order.order_number}.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-honey-deep hover:underline"
                    >
                      {order.customer_phone}
                    </a>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>{order.recipient.name}</div>
                    <div className="text-xs text-muted">{order.recipient.city}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`pill ${statusTone(order.order_status)} text-[11px]`}>
                      {ORDER_STATUS_LABELS[order.order_status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">
                    {order.payment_status.replace(/_/g, " ")}
                  </td>
                  <td className="px-5 py-3.5 font-semibold">{formatNaira(order.total)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-honey-deep hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
