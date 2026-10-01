import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatNaira, whatsappLink } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const [users, orders] = await Promise.all([db().listUsers(), db().listOrders({})]);

  const statsFor = (email: string) => {
    const own = orders.filter((o) => o.customer_email.toLowerCase() === email.toLowerCase());
    return {
      count: own.length,
      spend: own.filter((o) => o.payment_status === "paid").reduce((s, o) => s + o.total, 0),
      last: own[0]?.created_at,
    };
  };

  return (
    <div>
      <h2 className="text-2xl">Customers</h2>
      <p className="mt-1 text-sm text-muted">
        Accounts created through sign-in. Guest orders appear under orders, not here.
      </p>

      {users.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center text-sm text-muted">
          No customer accounts yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Paid</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => {
                const stats = statsFor(user.email);
                return (
                  <tr key={user.id} className="hover:bg-ivory/60">
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted">{user.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`pill text-[11px] ${
                          user.role === "admin" ? "bg-espresso text-cream" : "bg-sand text-cocoa"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{stats.count}</td>
                    <td className="px-5 py-3.5 font-medium">{formatNaira(stats.spend)}</td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {user.phone ? (
                        <a
                          href={whatsappLink(user.phone, `Hi ${user.name}, from LisBee.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-honey-deep hover:underline"
                        >
                          WhatsApp
                        </a>
                      ) : (
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(user.email)}`}
                          className="text-xs text-honey-deep hover:underline"
                        >
                          View orders
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
