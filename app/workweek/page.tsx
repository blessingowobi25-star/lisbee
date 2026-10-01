import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Workweek Box — five days, five moments",
  description:
    "The Workweek Box by LisBee: one gift, five individually packaged moments from Monday to Friday. Premium, Signature and Executive tiers delivered in Abuja and Lagos.",
  alternates: { canonical: "/workweek" },
};

const WEEKDAYS = [
  { day: "Monday", moment: "Start Strong", note: "A good beginning — nuts or dried fruit and a drink." },
  { day: "Tuesday", moment: "Keep Going", note: "Chocolate and a proper biscuit for the second push." },
  { day: "Wednesday", moment: "Recharge", note: "Midweek reset — tea or coffee with something to nibble." },
  { day: "Thursday", moment: "Finish Strong", note: "A savoury moment to carry you to the end." },
  { day: "Friday", moment: "Celebrate", note: "The reward. Chocolate, a treat and a card that says so." },
];

function tierBadge(product: Product): string {
  return product.tier === "premium"
    ? "Cream packaging"
    : product.tier === "signature"
      ? "Deep green packaging"
      : "Deep chocolate packaging";
}

export default async function WorkweekPage() {
  const products = await db().listProducts({ category: "workweek-boxes" });
  const tiers = ["premium", "signature", "executive"] as const;
  const ordered = tiers
    .map((t) => products.find((p) => p.tier === t))
    .filter((p): p is Product => Boolean(p));
  const heroImage = ordered.find((p) => p.tier === "signature")?.images[0] ?? "/images/hero-brown-boxes.webp";

  return (
    <>
      <section className="relative overflow-hidden bg-espresso text-cream">
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/images/backdrop.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="shell relative grid items-center gap-10 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="eyebrow text-honey">Signature product</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-4 text-4xl leading-tight text-cream md:text-6xl">
                The Workweek Box
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 font-display text-2xl italic text-honey md:text-3xl">
                Five days. Five moments. One thoughtful gift.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/80 md:text-base">
                Give someone a better week, one day at a time. The box arrives once, before the
                workweek starts. Inside are five individually packaged moments — a drink, a snack
                and a small LisBee daily card for each day from Monday to Friday.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#tiers" className="btn btn-honey">
                  Choose your tier
                </Link>
                <Link href="/how-it-works" className="btn btn-light">
                  How it works
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={160}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-cream/15">
              <Image
                src={heroImage}
                alt="The Workweek Box, open"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- The week ---------------- */}
      <section className="shell py-16 md:py-24">
        <Reveal className="mb-10 max-w-2xl">
          <span className="eyebrow">Monday to Friday</span>
          <h2 className="mt-3 text-3xl md:text-5xl">Something to look forward to every workday</h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-5">
          {WEEKDAYS.map((item, i) => (
            <Reveal key={item.day} delay={i * 70}>
              <div className="flex h-full flex-col rounded-3xl border border-line bg-ivory p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-honey-deep">
                  {item.day}
                </div>
                <div className="mt-2 font-display text-2xl text-espresso">{item.moment}</div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Tiers ---------------- */}
      <section id="tiers" className="bg-cream/70 py-16 md:py-24">
        <div className="shell">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Three tiers</span>
              <h2 className="mt-3 text-3xl md:text-5xl">Pick the one that fits</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              Every tier follows the same five-day format. What changes is the quality of what
              goes inside and how it is presented.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {ordered.map((product, i) => (
              <Reveal key={product.id} delay={i * 90}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>

          {ordered.length > 0 && (
            <Reveal className="mt-10 overflow-hidden rounded-3xl border border-line bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-[0.14em] text-cocoa">
                    <th className="px-5 py-4 font-semibold">Tier</th>
                    <th className="px-5 py-4 font-semibold">Price</th>
                    <th className="hidden px-5 py-4 font-semibold sm:table-cell">Packaging</th>
                    <th className="hidden px-5 py-4 font-semibold md:table-cell">Best for</th>
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((product) => (
                    <tr key={product.id} className="border-b border-line/60 last:border-0">
                      <td className="px-5 py-4 font-medium text-espresso">{product.name}</td>
                      <td className="px-5 py-4 font-semibold text-espresso">
                        {formatNaira(product.price)}
                      </td>
                      <td className="hidden px-5 py-4 text-muted sm:table-cell">
                        {tierBadge(product)}
                      </td>
                      <td className="hidden px-5 py-4 text-muted md:table-cell">
                        {product.tier === "premium"
                          ? "Thoughtful everyday gifting"
                          : product.tier === "signature"
                            ? "The flagship — best balance"
                            : "Executives, board members, VIP clients"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/products/${product.slug}`} className="btn btn-sm btn-outline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          )}
        </div>
      </section>

      {/* ---------------- Gallery ---------------- */}
      <section className="shell py-16 md:py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { src: "/images/packaging-square.webp", alt: "LisBee packaging detail" },
            { src: "/images/lifestyle-warm-wide.webp", alt: "A LisBee gifting moment" },
            { src: "/images/packaging-portrait.webp", alt: "LisBee gift bag" },
          ].map((img, i) => (
            <Reveal key={img.src} delay={i * 80}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-sand md:aspect-[4/5]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 rounded-[2rem] border border-line bg-ivory px-7 py-10 text-center md:px-16">
          <h2 className="text-3xl md:text-4xl">Ready to give someone a better week?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
            One order, one delivery, five moments. Add a gift message at checkout and we will
            confirm delivery in Abuja or Lagos before your box is dispatched.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {ordered[0] && (
              <Link href={`/products/${ordered[0].slug}`} className="btn btn-primary">
                Shop the Workweek Box
              </Link>
            )}
            <Link href="/corporate" className="btn btn-outline">
              Order for a team
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
