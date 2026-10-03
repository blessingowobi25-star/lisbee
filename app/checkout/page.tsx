import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { db, getSettings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your LisBee order and pay by bank transfer.",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const [settings, user, zones] = await Promise.all([
    getSettings(),
    getSessionUser(),
    db().listZones(),
  ]);

  return (
    <section className="shell py-12 md:py-16">
      <div className="mb-9 max-w-2xl">
        <span className="eyebrow">Checkout</span>
        <h1 className="mt-3 text-3xl md:text-5xl">Almost yours</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {settings.delivery_cities.length > 0
            ? `We deliver to ${settings.delivery_cities.join(" and ")} at the moment. Payment is by bank transfer — you will get the details on the next screen.`
            : "Payment is by bank transfer — you will get the details on the next screen."}
        </p>
      </div>

      <CheckoutForm
        deliveryCities={settings.delivery_cities}
        whatsapp={settings.whatsapp_number}
        zones={zones}
        user={user ? { name: user.name, email: user.email } : null}
      />
    </section>
  );
}
