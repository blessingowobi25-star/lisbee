import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db, getSettings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { formatDate, formatNaira, statusTone, whatsappLink } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My account",
  description: "Your LisBee orders, profile and delivery history.",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=/account");
  if (user.role === "admin") redirect("/admin");

  const [orders, settings] = await Promise.all([
    db().listOrders({ email: user.email }),
    getSettings(),
  ]);

  const spend = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const active = orders.filter((o) =>
    ["payment_received", "preparing", "ready", "dispatched"].includes(o.order_status),
  ).length;
  const awaiting = orders.filter(
    (o) => o.order_status === "awaiting_payment_confirmation",
  ).length;

  const stats = [
    { label: "Total orders", value: String(orders.length) },
    { label: "In progress", value: String(active) },
    { label: "Awaiting payment", value: String(awaiting) },
    { label: "Lifetime value", value: formatNaira(spend) },
  ];

  return (
    <section className="shell py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">My account</span>
          <h1 className="mt-3 text-3xl md:text-5xl">Hello, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/account/orders" className="btn btn-outline btn-sm">
            All orders
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-line bg-ivory px-5 py-5">
            <div className="text-xs uppercase tracking-[0.14em] text-muted">{stat.label}</div>
            <div className="mt-2 font-display text-3xl text-espresso">{stat.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="text-2xl">Recent orders</h2>
          {orders.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-line bg-ivory px-6 py-14 text-center">
              <p className="text-sm text-muted">You have not placed an order yet.</p>
              <Link href="/workweek" className="btn btn-primary mt-6">
                Shop the Workweek Box
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {orders.slice(0, 5).map((order) => (
                <li key={order.id} className="rounded-3xl border border-line bg-white px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-espresso">{order.order_number}</div>
                      <div className="mt-0.5 text-xs text-muted">
                        {formatDate(order.created_at)} · {order.recipient.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`pill ${statusTone(order.order_status)} text-[11px]`}>
                        {ORDER_STATUS_LABELS[order.order_status]}
                      </span>
                      <span className="font-semibold">{formatNaira(order.total)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs">
                    <Link
                      href={`/checkout/payment-instructions?order=${order.order_number}`}
                      className="text-honey-deep hover:underline"
                    >
                      {order.order_status === "awaiting_payment_confirmation"
                        ? "Payment instructions"
                        : "View details"}
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
                      Ask about this order
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="h-fit space-y-5 rounded-3xl border border-line bg-ivory p-6">
          <h2 className="text-xl">Quick actions</h2>
          <div className="space-y-2.5 text-sm">
            {[
              { href: "/account/orders", label: "Order history" },
              { href: "/shop", label: "Shop all gifts" },
              { href: "/build-your-own", label: "Build your own gift (soon)" },
              { href: "/corporate", label: "Corporate gifting enquiry" },
              { href: "/faq", label: "FAQs" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl bg-white px-4 py-3 transition hover:bg-sand"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Need to change an order? Message us on WhatsApp with your order number — we will sort it
            out before dispatch.
          </p>
        </aside>
      </div>
    </section>
  );
}
