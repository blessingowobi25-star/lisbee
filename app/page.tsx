import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LisBee — Thoughtfully given. Happily received.",
  description:
    "Give someone a better week, one day at a time. The Workweek Box: five days, five moments, one thoughtful gift. Premium gifting delivered in Abuja and Lagos.",
  alternates: { canonical: "/" },
};

const STEPS = [
  { n: "01", title: "Choose your box", body: "Premium, Signature or Executive — pick the tier that fits the person and the moment." },
  { n: "02", title: "Add the details", body: "Recipient name, delivery address, occasion and a gift message at checkout." },
  { n: "03", title: "We deliver once", body: "The complete box arrives before the workweek, delivered in Abuja or Lagos." },
  { n: "04", title: "They open one day at a time", body: "Monday to Friday — a drink, a treat and a small card, every workday." },
];

const WHY = [
  { title: "Five days, not one moment", body: "Most gifts are opened once. The Workweek Box stretches the feeling across a full work week." },
  { title: "Presentation is the product", body: "Rigid boxes, weekday compartments, ribbon and a card with your message. It looks like what it costs." },
  { title: "Abuja and Lagos delivery", body: "We deliver where we can do it properly, and we confirm timing with you before dispatch." },
  { title: "A real person on WhatsApp", body: "Questions about a gift, a deadline or a bulk order? Message 07061804951 and talk to us directly." },
];

export default async function HomePage() {
  const [products, occasions, recipients] = await Promise.all([
    db().listProducts({}),
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
  ]);

  const signature = products.find((p) => p.slug === "signature-workweek") ?? products[0];
  const hero = signature?.images[0] ?? "/images/hero-brown-boxes.webp";

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-ivory">
        <div className="shell grid items-center gap-10 pb-16 pt-12 md:pb-24 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <Reveal>
              <span className="eyebrow">Premium gifting · Abuja &amp; Lagos</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 text-[2.6rem] leading-[1.05] tracking-tight text-espresso sm:text-6xl lg:text-[4.2rem]">
                Give someone a better week,{" "}
                <span className="italic text-cocoa">one day at a time.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted md:text-lg">
                Thoughtfully curated gifts designed to make ordinary moments feel a little more
                special. Five days. Five moments. One thoughtful gift.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/workweek" className="btn btn-primary">
                  Shop the Workweek Box
                </Link>
                <Link href="/shop" className="btn btn-outline">
                  Explore gifts
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-[0.14em] text-cocoa/80">
                <li>One delivery, five days</li>
                <li>Gift message included</li>
                <li>Bank transfer at checkout</li>
              </ul>
            </Reveal>
          </div>

          <Reveal delay={140} className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-sand shadow-[var(--shadow-pop)]">
              <Image
                src={hero}
                alt="The LisBee Workweek Box"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {signature && (
              <Link
                href={`/products/${signature.slug}`}
                className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition hover:-translate-y-0.5 md:left-8"
              >
                <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-sand">
                  {signature.images[0] && (
                    <Image
                      src={signature.images[0]}
                      alt={signature.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-honey-deep">
                    Signature
                  </div>
                  <div className="text-sm font-semibold text-espresso">
                    {signature.name} · {formatNaira(signature.price)}
                  </div>
                </div>
              </Link>
            )}
          </Reveal>
        </div>
      </section>

      {/* ---------------- Workweek tiers ---------------- */}
      <section className="shell py-16 md:py-24">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">The signature product</span>
            <h2 className="mt-3 text-3xl md:text-5xl">The Workweek Box</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            One box. Five individually packaged moments — a drink, a treat and a LisBee card for
            every day from Monday to Friday. Something to look forward to every workday.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {products.slice(0, 3).map((product, i) => (
            <Reveal key={product.id} delay={i * 90}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-9 text-center">
          <Link href="/workweek" className="btn btn-outline">
            Compare the three tiers
          </Link>
        </Reveal>
      </section>

      {/* ---------------- Shop by occasion ---------------- */}
      <section className="bg-cream/70 py-16 md:py-24">
        <div className="shell">
          <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Shop by occasion</span>
              <h2 className="mt-3 text-3xl md:text-5xl">Find the right gift, faster</h2>
            </div>
            <Link href="/occasions" className="btn btn-sm btn-outline">
              All occasions
            </Link>
          </Reveal>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {occasions.slice(0, 10).map((occ, i) => (
              <Reveal key={occ.id} delay={i * 40}>
                <Link
                  href={`/occasions/${occ.slug}`}
                  className="group flex h-28 flex-col justify-between rounded-2xl border border-line bg-ivory p-4 transition hover:-translate-y-1 hover:border-honey hover:bg-white md:h-32"
                >
                  <span className="text-base font-medium leading-snug text-espresso md:text-lg">
                    {occ.name}
                  </span>
                  <span className="text-xs text-muted transition group-hover:text-honey-deep">
                    Explore →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Shop by recipient ---------------- */}
      <section className="shell py-16 md:py-24">
        <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Shop by recipient</span>
            <h2 className="mt-3 text-3xl md:text-5xl">Who is it for?</h2>
          </div>
          <Link href="/recipients" className="btn btn-sm btn-outline">
            All recipients
          </Link>
        </Reveal>

        <div className="flex flex-wrap gap-3">
          {recipients.map((rec, i) => (
            <Reveal key={rec.id} delay={i * 30}>
              <Link
                href={`/recipients/${rec.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-medium text-espresso transition hover:-translate-y-0.5 hover:border-honey hover:shadow-card"
              >
                {rec.name}
                <span className="text-honey-deep">→</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- How LisBee works ---------------- */}
      <section className="bg-cream/70 py-16 md:py-24">
        <div className="shell">
          <Reveal className="mb-10 max-w-2xl">
            <span className="eyebrow">How LisBee works</span>
            <h2 className="mt-3 text-3xl md:text-5xl">Four steps, one delivery</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <div className="h-full rounded-3xl border border-line bg-ivory p-6">
                  <div className="font-display text-4xl text-honey">{step.n}</div>
                  <h3 className="mt-4 text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Corporate band ---------------- */}
      <section className="relative overflow-hidden bg-espresso py-16 text-cream md:py-24">
        <div className="shell grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Corporate gifting</span>
            <h2 className="mt-3 text-3xl text-cream md:text-5xl">
              A better way to appreciate your team.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/75 md:text-base">
              Employee appreciation, onboarding, work anniversaries, promotions, client gifts,
              executive gifting, conferences and festive programmes — one delivery, five moments,
              for every recipient on your list.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/corporate" className="btn btn-honey">
                Plan a corporate gift
              </Link>
              <Link href="/corporate#enquiry" className="btn btn-light">
                Request a proposal
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                "Employee appreciation",
                "New hire onboarding",
                "Work anniversaries",
                "Client gifting",
                "Executive gifts",
                "Team celebrations",
                "Conferences & events",
                "Christmas programmes",
              ].map((use) => (
                <div
                  key={use}
                  className="rounded-2xl border border-cream/15 bg-cream/5 px-4 py-3.5 text-cream/85"
                >
                  {use}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Seasonal + Build your own ---------------- */}
      <section className="shell grid gap-6 py-16 md:py-24 lg:grid-cols-2">
        <Reveal>
          <div className="relative h-full overflow-hidden rounded-[2rem] border border-line bg-sand">
            <div className="relative aspect-[16/10]">
              <Image
                src="/images/backdrop.webp"
                alt="LisBee festive gifting"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-transparent" />
              <div className="absolute bottom-0 p-6 text-cream md:p-8">
                <span className="pill bg-honey text-espresso">Coming soon</span>
                <h3 className="mt-3 text-2xl text-cream md:text-3xl">Christmas &amp; Festive</h3>
                <p className="mt-2 max-w-sm text-sm text-cream/80">
                  Festive boxes, hampers and corporate Christmas gifting. Message us on WhatsApp
                  to be told when the collection lands.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex h-full flex-col justify-between rounded-[2rem] border border-line bg-ivory p-7 md:p-9">
            <div>
              <span className="pill bg-sand text-cocoa">Coming soon</span>
              <h3 className="mt-4 text-2xl md:text-3xl">Build your own gift</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Choose a box, pick the contents, add a message and preview it before it ships. We
                are building it properly rather than rushing it — it will switch on without
                anything else on the site changing.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-ink/75">
                <li>1. Choose your box</li>
                <li>2. Select the products</li>
                <li>3. Add a message and occasion</li>
                <li>4. Preview, add to cart, checkout</li>
              </ul>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/build-your-own" className="btn btn-outline">
                See what is coming
              </Link>
              <Link href="/contact" className="btn btn-sm btn-primary">
                Ask about a custom gift
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Featured products ---------------- */}
      <section className="bg-cream/70 py-16 md:py-24">
        <div className="shell">
          <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Featured</span>
              <h2 className="mt-3 text-3xl md:text-5xl">Gifts worth giving</h2>
            </div>
            <Link href="/shop" className="btn btn-sm btn-outline">
              Shop all gifts
            </Link>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 6).map((product, i) => (
              <Reveal key={product.id} delay={i * 70}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Why LisBee ---------------- */}
      <section className="shell py-16 md:py-24">
        <Reveal className="mb-10 max-w-2xl">
          <span className="eyebrow">Why LisBee</span>
          <h2 className="mt-3 text-3xl md:text-5xl">Thoughtfully given. Happily received.</h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2">
          {WHY.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <div className="h-full rounded-3xl border border-line bg-white p-6 md:p-7">
                <div className="mb-4 h-1 w-10 rounded-full bg-honey" />
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="shell pb-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-olive px-7 py-12 text-center text-cream md:px-16 md:py-16">
            <span className="eyebrow text-honey">Ready when you are</span>
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl text-cream md:text-5xl">
              Give someone a better week, one day at a time.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/workweek" className="btn btn-honey">
                Shop the Workweek Box
              </Link>
              <Link href="/shop" className="btn btn-light">
                Explore all gifts
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
