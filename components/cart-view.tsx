"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/components/cart-context";
import { formatNaira } from "@/lib/format";
import { track } from "@/lib/analytics";

export function CartView() {
  const { lines, ready, subtotal, count, setQuantity, remove } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (ready && lines.length > 0) track("begin_checkout", { items: lines.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) {
    return (
      <div className="rounded-3xl border border-line bg-ivory p-10 text-center text-sm text-muted">
        Loading your cart…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-ivory px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl">Your cart is empty</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Start with the Workweek Box — five days, five moments, one thoughtful gift.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/workweek" className="btn btn-primary">
            Shop the Workweek Box
          </Link>
          <Link href="/shop" className="btn btn-outline">
            Browse all gifts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        {lines.map((line) => (
          <div
            key={line.slug}
            className="flex flex-col gap-4 rounded-3xl border border-line bg-ivory p-4 sm:flex-row sm:items-center"
          >
            <Link
              href={`/products/${line.slug}`}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sand"
            >
              {line.image && (
                <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" />
              )}
            </Link>

            <div className="flex-1">
              <Link href={`/products/${line.slug}`} className="font-medium text-espresso hover:underline">
                {line.name}
              </Link>
              <div className="mt-1 text-sm text-muted">{formatNaira(line.price)} each</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(line.slug, line.quantity - 1)}
                  className="flex h-9 w-9 items-center justify-center text-muted hover:text-espresso"
                  aria-label={`Decrease quantity of ${line.name}`}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(line.slug, line.quantity + 1)}
                  className="flex h-9 w-9 items-center justify-center text-muted hover:text-espresso"
                  aria-label={`Increase quantity of ${line.name}`}
                >
                  +
                </button>
              </div>
              <span className="w-24 text-right text-sm font-semibold text-espresso">
                {formatNaira(line.price * line.quantity)}
              </span>
              <button
                type="button"
                onClick={() => remove(line.slug)}
                className="text-xs text-muted underline hover:text-espresso"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-3xl border border-line bg-white p-6 lg:sticky lg:top-28">
        <h2 className="text-xl">Order summary</h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Items</dt>
            <dd className="font-medium text-ink">{count}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold text-espresso">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2.5">
            <dt className="text-muted">Delivery</dt>
            <dd className="text-right text-xs text-muted">Confirmed at checkout</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => router.push("/checkout")}
          className="btn btn-primary mt-6 w-full"
        >
          Proceed to checkout
        </button>
        <Link href="/shop" className="btn btn-outline mt-3 w-full">
          Continue shopping
        </Link>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Payment is by bank transfer at launch. You will get the account details and your payment
          reference on the next screen.
        </p>
      </aside>
    </div>
  );
}

