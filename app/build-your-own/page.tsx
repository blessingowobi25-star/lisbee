import Link from "next/link";
import type { Metadata } from "next";
import { getSettings } from "@/lib/db";
import { whatsappLink } from "@/lib/format";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Build your own gift",
  description:
    "Choose a box, pick the products, add a message and preview your gift. Build Your Own Gift is coming soon at LisBee.",
  alternates: { canonical: "/build-your-own" },
};

const STEPS = [
  { n: "01", title: "Choose a box", body: "Pick a size and presentation — from a single-box build to a full Workweek-format box." },
  { n: "02", title: "Select products", body: "Chocolates, nuts, coffee, tea, savouries and treats — as many as fit the box you chose." },
  { n: "03", title: "Add a message", body: "Choose the occasion, the recipient and the words that go on the card." },
  { n: "04", title: "Preview and checkout", body: "See the finished gift, add it to your cart and check out like any other order." },
];

export default async function BuildYourOwnPage() {
  const settings = await getSettings();

  return (
    <section className="shell py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <Reveal>
            <span className="pill bg-sand text-cocoa">Coming soon</span>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mt-5 text-4xl md:text-6xl">Build your own gift</h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted md:text-base">
              Most gift sites make you choose between a fixed box and nothing at all. We are
              building a builder that respects both: a proper box presentation, contents you
              choose, and a preview before you pay.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={160 + i * 60}>
                <div className="h-full rounded-3xl border border-line bg-ivory p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-honey-deep">
                    {step.n}
                  </div>
                  <h2 className="mt-2 text-lg">{step.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={420}>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={whatsappLink(
                  settings.whatsapp_number,
                  "Hi LisBee, I'm interested in Build Your Own Gift.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Tell me when it launches
              </a>
              <Link href="/shop" className="btn btn-outline">
                Browse current gifts
              </Link>
            </div>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="rounded-[2rem] border border-line bg-cream/70 p-7 md:p-9">
            <h2 className="text-2xl">In the meantime</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The Workweek Box is already built the same way — a considered combination of
              products in a box you can present with confidence. If you need something specific
              now, message us and we will do it manually.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "A specific occasion or recipient not listed?",
                "Corporate branding or a personalised card?",
                "A larger order with a deadline?",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-ink/80">
                  <span className="text-honey">—</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/corporate" className="btn btn-outline btn-sm mt-7">
              Request a custom gift
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
