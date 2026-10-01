"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-context";

export interface AddableProduct {
  slug: string;
  name: string;
  price: number;
  image: string | null;
}

/** Small "Add" control used on product cards. */
export function QuickAdd({ product }: { product: AddableProduct }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        add(product, 1);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
      className={`btn btn-sm ${added ? "btn-honey" : "btn-outline"}`}
      aria-label={`Add ${product.name} to cart`}
    >
      {added ? "Added ✓" : "Add"}
    </button>
  );
}

/** Quantity stepper + add to cart + buy now, used on the product page. */
export function PurchaseControls({
  product,
  comingSoon,
}: {
  product: AddableProduct;
  comingSoon?: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const step = (delta: number) => setQty((q) => Math.min(20, Math.max(1, q + delta)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="field-label mb-0">Quantity</span>
        <div className="flex items-center rounded-full border border-line bg-white">
          <button
            type="button"
            onClick={() => step(-1)}
            className="flex h-10 w-10 items-center justify-center text-lg text-muted hover:text-espresso"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => step(1)}
            className="flex h-10 w-10 items-center justify-center text-lg text-muted hover:text-espresso"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={comingSoon}
          onClick={() => {
            add(product, qty);
            setAdded(true);
            window.setTimeout(() => setAdded(false), 1800);
          }}
          className="btn btn-primary flex-1"
        >
          {comingSoon ? "Coming soon" : added ? "Added to cart ✓" : "Add to cart"}
        </button>
        <button
          type="button"
          disabled={comingSoon}
          onClick={() => {
            add(product, qty);
            router.push("/checkout");
          }}
          className="btn btn-outline flex-1"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}
