import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatDate, formatNaira, whatsappLink } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment instructions",
  description: "Your LisBee order is confirmed — here are the bank transfer details.",
  robots: { index: false },
};

const ORDER_COOKIE = "lisbee_orders";

export default async function PaymentInstructionsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = (params.order ?? "").trim().toUpperCase();
  const [store, user] = await Promise.all([cookies(), getSessionUser()]);

  const order = orderNumber ? await db().getOrderByNumber(orderNumber) : null;

  // Guests may only open orders created in this browser.
  const known = (store.get(ORDER_COOKIE)?.value ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const allowed = Boolean(
    order && (known.includes(order.order_number) || user?.email === order.customer_email),
  );

  if (!order || !allowed) {
    return (
      <section className="shell py-20 text-center">
        <h1 className="text-3xl md:text-4xl">We could not find that order</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          For your security, order details are only shown in the browser the order was placed in,
          or when you are signed in with the same email address.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn btn-primary">
            Contact us
          </Link>
          <Link href="/shop" className="btn btn-outline">
            Back to shop
          </Link>
        </div>
      </section>
    );
  }

  const settings = await db().getSettings();
  const items = await db().listOrderItems(order.id);
  const feePending = order.delivery_fee === null;
  const bankReady = settings.bank.account_number.trim().length >= 10;

  return (
    <section className="shell py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <span className="pill bg-olive text-cream">Order received</span>
        <h1 className="mt-5 text-3xl md:text-5xl">Thank you — we have your order</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          A confirmation has been emailed to {order.customer_email}. Complete the bank transfer
          below and we will start preparing your gift.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { label: "Order number", value: order.order_number },
            { label: "Payment reference", value: order.payment_reference },
            { label: "Placed on", value: formatDate(order.created_at) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-line bg-ivory px-5 py-4">
              <div className="text-xs uppercase tracking-[0.14em] text-muted">{item.label}</div>
              <div className="mt-1.5 font-medium text-espresso">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-honey/40 bg-honey/10 p-6 md:p-8">
          <h2 className="text-2xl">Bank transfer details</h2>
          {bankReady ? (
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-6 border-b border-line pb-3">
                <dt className="text-muted">Bank</dt>
                <dd className="font-medium text-espresso">{settings.bank.bank_name}</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-line pb-3">
                <dt className="text-muted">Account name</dt>
                <dd className="font-medium text-espresso">{settings.bank.account_name}</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-line pb-3">
                <dt className="text-muted">Account number</dt>
                <dd className="font-medium text-espresso">{settings.bank.account_number}</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-line pb-3">
                <dt className="text-muted">Amount to send</dt>
                <dd className="font-semibold text-espresso">{formatNaira(order.total)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Reference to use</dt>
                <dd className="font-semibold text-honey-deep">{order.payment_reference}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Our account details are being finalised. We will send them to{" "}
              {order.customer_email} and on WhatsApp shortly — your order is already reserved.
            </p>
          )}
          <p className="mt-5 text-xs leading-relaxed text-muted">
            Please use <strong className="text-espresso">{order.payment_reference}</strong> as the
            transfer narration so we can match your payment quickly. We confirm transfers manually,
            so preparation begins as soon as the funds land.
          </p>
        </div>
        <div className="mt-6 rounded-3xl border border-line bg-white p-6 md:p-8">
          <h2 className="text-2xl">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.name} <span className="text-muted">× {item.quantity}</span>
                </span>
                <span className="font-medium">{formatNaira(item.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatNaira(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="text-right text-xs text-muted">
                {feePending
                  ? "To be confirmed before dispatch"
                  : formatNaira(order.delivery_fee ?? 0)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatNaira(order.total)}</dd>
            </div>
          </dl>
          {feePending && (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Delivery cost for {order.recipient.city} is confirmed with you before dispatch. Any
              fee agreed is deducted from the balance you send.
            </p>
          )}
        </div>

        <div className="mt-6 rounded-3xl border border-line bg-ivory p-6 md:p-8">
          <h2 className="text-2xl">Delivering to</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {order.recipient.name}
            <br />
            {order.recipient.delivery_address}
            <br />
            {order.recipient.city}
            {order.recipient.delivery_area && ` — ${order.recipient.delivery_area}`}
            <br />
            {order.recipient.phone}
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">
            Status: {ORDER_STATUS_LABELS[order.order_status]}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={whatsappLink(
              settings.whatsapp_number,
              `Hi LisBee, I have just paid for order ${order.order_number} (reference ${order.payment_reference}).`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            I have paid — notify us
          </a>
          <Link href="/account/orders" className="btn btn-outline">
            View my orders
          </Link>
        </div>
      </div>
    </section>
  );
}
