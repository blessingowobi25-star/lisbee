import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db, getSettings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatDateTime, formatNaira, statusTone, whatsappLink } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My orders",
  description: "Every LisBee order you have placed, with status and totals.",
  robots: { index: false },
};

export default async function AccountOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=/account/orders");

  const [orders, settings] = await Promise.all([
    db().listOrders({ email: user.email }),
    getSettings(),
  ]);
  const itemsByOrder = await Promise.all(
    orders.map((order) => db().listOrderItems(order.id)),
  );

  return (
    <section className="shell py-12 md:py-16">
      <Link href="/account" className="text-xs text-muted hover:text-espresso">
        ← Back to account
      </Link>
      <h1 className="mt-4 text-3xl md:text-5xl">Order history</h1>
      <p className="mt-3 text-sm text-muted">
        Every order placed with {user.email}. Guest orders made from this browser stay on their
        payment screen.
      </p>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-line bg-ivory px-6 py-16 text-center">
          <h2 className="text-2xl">No orders yet</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
            When you place an order it will appear here with its status and payment details.
          </p>
          <Link href="/workweek" className="btn btn-primary mt-7">
            Shop the Workweek Box
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {orders.map((order, index) => (
            <li key={order.id} className="rounded-3xl border border-line bg-white p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-display text-2xl text-espresso">{order.order_number}</div>
                  <div className="mt-1 text-xs text-muted">
                    Placed {formatDateTime(order.created_at)} · {order.payment_reference}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`pill ${statusTone(order.order_status)} text-[11px]`}>
                    {ORDER_STATUS_LABELS[order.order_status]}
                  </span>
                  <div className="mt-2 font-semibold text-espresso">{formatNaira(order.total)}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-3">
                <div>
                  <h3 className="text-xs uppercase tracking-[0.14em] text-muted">Delivering to</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {order.recipient.name}
                    <br />
                    {order.recipient.delivery_address}
                    <br />
                    {order.recipient.city}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-[0.14em] text-muted">Payment</h3>
                  <p className="mt-2 text-sm text-muted">
                    {order.payment_method === "bank_transfer" ? "Bank transfer" : "Card"}
                    <br />
                    {order.payment_status === "paid" ? "Paid" : "Awaiting confirmation"}
                    {order.delivery_fee === null && (
                      <>
                        <br />
                        <span className="text-xs">Delivery fee to be confirmed</span>
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-[0.14em] text-muted">Gift message</h3>
                  <p className="mt-2 text-sm italic leading-relaxed text-muted">
                    {order.gift_message || "No message added"}
                  </p>
                </div>
              </div>
              <details className="group mt-5 border-t border-line pt-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-honey-deep">
                  View items <span className="group-open:hidden">→</span>
                </summary>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {(itemsByOrder[index] ?? []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-4">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatNaira(item.total)}</span>
                    </li>
                  ))}
                </ul>
              </details>

              <div className="mt-5 flex flex-wrap gap-4 text-sm">
                <Link
                  href={`/checkout/payment-instructions?order=${order.order_number}`}
                  className="text-honey-deep hover:underline"
                >
                  {order.order_status === "awaiting_payment_confirmation"
                    ? "Payment instructions"
                    : "Order details"}
                </Link>
                <a
                  href={whatsappLink(
                    settings.whatsapp_number,
                    `Hi LisBee, I have a question about order ${order.order_number}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-honey-deep hover:underline"
                >
                  Get help
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
