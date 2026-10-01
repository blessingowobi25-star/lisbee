import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { getSessionUser } from "@/lib/auth/session";
import { supabaseAuthConfigured } from "@/lib/auth/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your LisBee account to see your orders and track deliveries.",
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  "google-unavailable": "Google sign-in is being set up. Please use your email address for now.",
  "google-failed": "We could not complete Google sign-in. Please try again or use your email.",
  "no-email": "Your Google account did not share an email address, so we could not sign you in.",
  "signed-out": "You have been signed out.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/account");

  const next = params.next?.startsWith("/") ? params.next : "/account";

  return (
    <section className="shell py-12 md:py-20">
      <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2 md:items-center">
        <div>
          <span className="eyebrow">Your account</span>
          <h1 className="mt-3 text-3xl md:text-5xl">Welcome back</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Sign in to see your orders, track a delivery and reorder in seconds. Your gift
            details and address stay with you — and only you.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-muted">
            {[
              "Order history and payment instructions",
              "Delivery status for every order",
              "Faster checkout next time",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-honey">—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <SignInForm
          googleEnabled={supabaseAuthConfigured()}
          next={next}
          error={params.error ? ERRORS[params.error] : undefined}
        />
      </div>
      <p className="mt-12 text-center text-xs text-muted">
        Just browsing?{" "}
        <Link href="/shop" className="underline">
          Shop without an account
        </Link>{" "}
        — guest checkout is always available.
      </p>
    </section>
  );
}
