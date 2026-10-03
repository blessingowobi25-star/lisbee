import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateTime, formatNaira, statusTone, whatsappLink } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { OrderActions } from "@/components/admin/order-actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db().getOrderById(id);
  if (!order) notFound();
  const items = await db().listOrderItems(order.id);

  return (
    <div>
      <Link href="/admin/orders" className="text-xs text-muted hover:text-espresso">
        ← All orders
      </Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">{order.order_number}</h2>
        <span className={`pill ${statusTone(order.order_status)}`}>
          {ORDER_STATUS_LABELS[order.order_status]}
        </span>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-white p-6">
            <h3 className="text-lg">Items</h3>
            <ul className="mt-4 divide-y divide-line text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3">
                  <span>
                    {item.name}
                    <span className="block text-xs text-muted">
                      {item.sku} · {formatNaira(item.unit_price)} × {item.quantity}
                    </span>
                  </span>
                  <span className="font-medium">{formatNaira(item.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatNaira(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd>
                  {order.delivery_fee === null ? "To be confirmed" : formatNaira(order.delivery_fee)}
                </dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatNaira(order.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted">
                <dt>Payment reference</dt>
                <dd>{order.payment_reference}</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-3xl border border-line bg-white p-6">
            <h3 className="text-lg">Customer & recipient</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="text-sm">
                <h4 className="text-xs uppercase tracking-[0.14em] text-muted">Sender</h4>
                <p className="mt-2 leading-relaxed text-muted">
                  {order.customer_name}
                  <br />
                  {order.customer_email}
                  <br />
                  {order.customer_phone}
                </p>
              </div>
              <div className="text-sm">
                <h4 className="text-xs uppercase tracking-[0.14em] text-muted">Recipient</h4>
                <p className="mt-2 leading-relaxed text-muted">
                  {order.recipient.name}
                  <br />
                  {order.recipient.phone}
                  <br />
                  {order.recipient.delivery_address}
                  <br />
                  {order.recipient.city}
                  {order.recipient.delivery_area && (
                    <>
                      <br />
                      <span className="text-xs">Area: {order.recipient.delivery_area}</span>
                    </>
                  )}
                  {order.recipient.delivery_instructions && (
                    <>
                      <br />
                      <span className="text-xs">“{order.recipient.delivery_instructions}”</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <a
                href={whatsappLink(
                  order.customer_phone,
                  `Hi ${order.customer_name}, about your LisBee order ${order.order_number}.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-honey-deep hover:underline"
              >
                WhatsApp the customer
              </a>
              <a
                href={whatsappLink(
                  order.recipient.phone,
                  `Hi ${order.recipient.name}, a LisBee gift is on its way to you.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-honey-deep hover:underline"
              >
                WhatsApp the recipient
              </a>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-white p-6">
            <h3 className="text-lg">Personalisation</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">Occasion</dt>
                <dd className="mt-1">{order.occasion ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">Gift message</dt>
                <dd className="mt-1 italic leading-relaxed text-muted">
                  {order.gift_message ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                  Requested delivery date
                </dt>
                <dd className="mt-1">{order.delivery_date ?? "Any"}</dd>
              </div>
              {order.notes && (
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted">Notes</dt>
                  <dd className="mt-1 leading-relaxed text-muted">{order.notes}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
        <aside className="space-y-6">
          <OrderActions
            orderId={order.id}
            orderStatus={order.order_status}
            paymentStatus={order.payment_status}
            deliveryFee={order.delivery_fee}
            subtotal={order.subtotal}
          />
          <div className="rounded-3xl border border-line bg-white p-6 text-sm">
            <h3 className="text-lg">Timeline</h3>
            <p className="mt-3 text-muted">Created {formatDateTime(order.created_at)}</p>
            <p className="mt-1 text-muted">Updated {formatDateTime(order.updated_at)}</p>
            <p className="mt-4 text-xs text-muted">
              Changing the status emails the customer automatically. Marking a payment as paid
              sends a payment confirmation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
