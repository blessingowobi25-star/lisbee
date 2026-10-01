import Link from "next/link";
import { db, supabaseConfigured } from "@/lib/db";
import { formatDateTime, formatNaira, statusTone } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "awaiting_payment_confirmation",
  "payment_received",
  "preparing",
  "ready",
  "dispatched",
  "delivered",
  "cancelled",
];

export default async function AdminDashboard() {
  const [orders, enquiries, products, zones, emails] = await Promise.all([
    db().listOrders({}),
    db().listEnquiries(),
    db().listProducts({ include_unpublished: true }),
    db().listZones(),
    db().listEmails(6),
  ]);

  const onLocalStore = !supabaseConfigured();

  const paid = orders.filter((o) => o.payment_status === "paid");
  const revenue = paid.reduce((sum, o) => sum + o.total, 0);
  const awaitingPayment = orders.filter(
    (o) => o.order_status === "awaiting_payment_confirmation",
  );
  const openEnquiries = enquiries.filter((e) => e.status === "new");
  const unpricedZones = zones.filter((z) => z.fee === null);
  const unfeatured = products.filter((p) => !p.featured);

  const cards = [
    { label: "Orders", value: String(orders.length), href: "/admin/orders" },
    { label: "Paid revenue", value: formatNaira(revenue), href: "/admin/orders" },
    { label: "Awaiting payment", value: String(awaitingPayment.length), href: "/admin/orders" },
    { label: "New enquiries", value: String(openEnquiries.length), href: "/admin/enquiries" },
  ];

  const counts = STATUSES.map((status) => ({
    status,
    count: orders.filter((o) => o.order_status === status).length,
  }));

  return (
    <div className="space-y-8">
      {onLocalStore && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <div className="font-semibold">Running on the local file store</div>
          <p className="mt-1 leading-relaxed">
            Supabase is not configured, so orders and catalogue edits are being written to
            <code className="mx-1">.data/db.json</code> on this machine. That is fine for local
            development, but on serverless hosting the file is ephemeral and{" "}
            <strong>orders will disappear</strong>. Set the Supabase environment variables before
            taking real orders — see <code>docs/LAUNCH.md</code>.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-3xl border border-line bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="text-xs uppercase tracking-[0.14em] text-muted">{card.label}</div>
            <div className="mt-2 font-display text-3xl text-espresso">{card.value}</div>
          </Link>
        ))}
      </div>

      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl">Order pipeline</h2>
        <ul className="mt-4 space-y-2.5">
          {counts.map(({ status, count }) => (
            <li key={status} className="flex items-center gap-4 text-sm">
              <span className={`pill ${statusTone(status)} w-56 justify-center text-[11px]`}>
                {ORDER_STATUS_LABELS[status]}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                <span
                  className="block h-full rounded-full bg-honey"
                  style={{ width: `${orders.length ? (count / orders.length) * 100 : 0}%` }}
                />
              </span>
              <span className="w-6 text-right tabular-nums text-muted">{count}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-3xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm text-honey-deep hover:underline">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No orders yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {orders.slice(0, 6).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                  {order.order_number}
                </Link>
                <span className="text-xs text-muted">
                  {order.customer_name} · {order.recipient.city}
                </span>
                <span className={`pill ${statusTone(order.order_status)} text-[11px]`}>
                  {ORDER_STATUS_LABELS[order.order_status]}
                </span>
                <span className="text-sm font-semibold">{formatNaira(order.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Latest enquiries</h2>
            <Link href="/admin/enquiries" className="text-sm text-honey-deep hover:underline">
              View all
            </Link>
          </div>
          {enquiries.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No corporate enquiries yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {enquiries.slice(0, 5).map((enquiry) => (
                <li key={enquiry.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{enquiry.company}</span>
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {enquiry.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {enquiry.name} · {enquiry.recipients_count || "?"} recipients ·{" "}
                    {enquiry.city || "city TBC"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-line bg-white p-6">
          <h2 className="text-xl">Setup checklist</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              {
                done: unpricedZones.length === 0,
                text: `Delivery fees configured (${unpricedZones.length} zone(s) still pending)`,
                href: "/admin/content",
              },
              {
                done: unfeatured.length === 0,
                text: `Products featured (${unfeatured.length} not featured)`,
                href: "/admin/products",
              },
              {
                done: products.every((p) => p.cost_product !== null),
                text: "COGS entered for every product",
                href: "/admin/products",
              },
              { done: emails.length > 0, text: "Transactional emails flowing", href: "/admin/settings" },
            ].map((item) => (
              <li key={item.text}>
                <Link href={item.href} className="flex items-start gap-3 hover:underline">
                  <span className={item.done ? "text-olive" : "text-honey-deep"}>
                    {item.done ? "✓" : "○"}
                  </span>
                  <span className="text-muted">{item.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl">Email log</h2>
        {emails.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No emails sent yet. Without Mailgun credentials, messages are written to
            <code className="mx-1">.data/outbox</code> instead.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line text-sm">
            {emails.map((email) => (
              <li
                key={email.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5"
              >
                <span className="font-mono text-xs text-espresso">{email.template}</span>
                <span className="text-xs text-muted">to {email.to}</span>
                <span className="text-xs text-muted">{formatDateTime(email.created_at)}</span>
                <span
                  className={`pill text-[11px] ${
                    email.status === "failed"
                      ? "bg-red-50 text-red-700"
                      : email.status === "sent"
                        ? "bg-olive text-cream"
                        : "bg-sand text-cocoa"
                  }`}
                >
                  {email.provider} · {email.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
