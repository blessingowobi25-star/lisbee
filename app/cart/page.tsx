import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { ViewTracker } from "@/components/view-tracker";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the gifts in your cart before checkout.",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <section className="shell py-12 md:py-16">
      <ViewTracker event="view_cart" />
      <div className="mb-8">
        <span className="eyebrow">Your cart</span>
        <h1 className="mt-3 text-3xl md:text-5xl">Review your gift</h1>
      </div>
      <CartView />
    </section>
  );
}

