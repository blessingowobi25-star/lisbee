import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StaffSignInPanel } from "@/components/sign-in-form";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff sign in",
  description: "LisBee staff access.",
  robots: { index: false, follow: false },
};

/**
 * Staff entry point. Intentionally not linked from anywhere on the public site
 * and excluded from the sitemap and robots, so nothing advertises it.
 * The page still needs the access code to get in.
 */
export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getSessionUser();
  if (user?.role === "admin") redirect("/admin");

  const { error } = await searchParams;

  return (
    <section className="shell py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <span className="eyebrow">Staff</span>
        <h1 className="mt-3 text-3xl md:text-4xl">Sign in to manage orders</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          This page is for LisBee staff only. Customers sign in from the main sign-in page.
        </p>
        <div className="mt-8">
          <StaffSignInPanel
            error={
              error === "google-failed"
                ? "Google sign-in failed. Try again, or use your access code."
                : undefined
            }
          />
        </div>
      </div>
    </section>
  );
}