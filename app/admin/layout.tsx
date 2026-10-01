import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/nav";
import { SignOutButton } from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (user.role !== "admin") redirect("/account");

  return (
    <div className="bg-cream/60">
      <div className="shell py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="eyebrow">LisBee admin</span>
            <h1 className="mt-2 text-2xl md:text-3xl">Operations</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="btn btn-outline btn-sm">
              View storefront
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <AdminNav />
            <div className="mt-6 rounded-2xl border border-line bg-ivory p-4">
              <p className="text-xs text-muted">Signed in as</p>
              <p className="mt-1 text-sm font-medium text-espresso">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
