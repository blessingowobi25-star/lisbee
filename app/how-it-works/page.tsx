import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Choose a gift, add the recipient details, pay by bank transfer and we deliver in Abuja or Lagos. Your recipient opens one pack each day, Monday to Friday.",
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    n: "01",
    title: "Choose your gift",
    body: "Start with the Workweek Box — Premium, Signature or Executive — or browse by occasion and recipient. Every product page shows exactly what is inside.",
  },
  {
    n: "02",
    title: "Tell us who it is for",
    body: "Add the recipient's name, phone number and delivery address. If the gift is for you, tick 'This gift is for me' and checkout takes a minute.",
  },
  {
    n: "03",
    title: "Pay by bank transfer",
    body: "At checkout you get the account details, your payment reference and the amount to send. We confirm the transfer and your order moves to preparation.",
  },
  {
    n: "04",
    title: "We prepare and deliver",
    body: "Your gift is packed, checked and delivered to Abuja or Lagos. We confirm timing with you before dispatch and email you at every stage.",
  },
  {
    n: "05",
    title: "They open one day at a time",
    body: "Monday to Friday, one pack a day — a drink, a treat and a small LisBee card. That is the whole idea.",
  },
];

export default async function HowItWorksPage() {
  const products = await db().listProducts({ category: "workweek-boxes" });

  return (
    <>
      <section className="shell py-14 md:py-20">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">How it works</span>
          <h1 className="mt-4 text-4xl md:text-6xl">Five steps, no guesswork</h1>
          <p className="mt-5 text-sm leading-relaxed text-muted md:text-base">
            Buying a gift should not need a phone call. Here is exactly how an order with LisBee
            goes from your screen to someone&rsquo;s week.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 70}>
              <div className="h-full rounded-3xl border border-line bg-ivory p-6 md:p-7">
                <div className="font-display text-4xl text-honey">{step.n}</div>
                <h2 className="mt-4 text-xl">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-cream/70 py-16 md:py-24">
        <div className="shell">
          <Reveal className="mb-9 max-w-2xl">
            <span className="eyebrow">Choose a tier</span>
            <h2 className="mt-3 text-3xl md:text-5xl">Three ways to give a better week</h2>
          </Reveal>
          <div className="grid gap-5 md:grid-cols-3">
            {products.map((product, i) => (
              <Reveal key={product.id} delay={i * 80}>
                <Link
                  href={`/products/${product.slug}`}
                  className="flex h-full flex-col rounded-3xl border border-line bg-white p-6 transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-honey-deep">
                    {product.tier}
                  </div>
                  <h3 className="mt-2 text-2xl">{product.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{product.tagline}</p>
                  <div className="mt-5 font-display text-3xl text-espresso">
                    {formatNaira(product.price)}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="shell py-16 md:py-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Delivery",
              body: "Abuja and Lagos only for now. Fees and timing are confirmed with you before dispatch — never a surprise at the door.",
            },
            {
              title: "Payment",
              body: "Bank transfer at launch, with online card payment coming soon. Your order only starts once the transfer is confirmed.",
            },
            {
              title: "Help",
              body: "Message 07061804951 on WhatsApp or email hellolisbee@gmail.com — a real person answers.",
            },
          ].map((item) => (
            <Reveal key={item.title}>
              <div className="h-full rounded-3xl border border-line bg-ivory p-6">
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 flex flex-wrap justify-center gap-3">
          <Link href="/workweek" className="btn btn-primary">
            Shop the Workweek Box
          </Link>
          <Link href="/faq" className="btn btn-outline">
            Read the FAQs
          </Link>
        </Reveal>
      </section>
    </>
  );
}
