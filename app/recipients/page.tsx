import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop by recipient",
  description:
    "Gifts for her, for him, for friends, partners, family, colleagues, employees, clients, teams and executives. LisBee delivers in Abuja and Lagos.",
  alternates: { canonical: "/recipients" },
};

export default async function RecipientsPage() {
  const [recipients, products] = await Promise.all([
    db().listTaxonomies("recipient"),
    db().listProducts({}),
  ]);

  const countFor = (slug: string) => products.filter((p) => p.recipients.includes(slug)).length;

  return (
    <div className="shell py-10 md:py-14">
      <nav className="mb-6 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-espresso">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Recipients</span>
      </nav>

      <div className="mb-9 max-w-2xl">
        <span className="eyebrow">Shop by recipient</span>
        <h1 className="mt-3 text-4xl md:text-6xl">Who are you buying for?</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Pick the person and we will narrow it down — from a thoughtful gift for a colleague to an
          executive box that means business.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {recipients.map((rec, i) => {
          const count = countFor(rec.slug);
          return (
            <Reveal key={rec.id} delay={i * 50}>
              <Link
                href={`/recipients/${rec.slug}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border-line bg-ivory p-6 transition hover:-translate-y-1 hover:border-honey hover:bg-white hover:shadow-card"
              >
                <h2 className="text-2xl">{rec.name}</h2>
                <div className="mt-6 flex items-center justify-between text-xs">
                  <span className={count ? "text-honey-deep" : "text-muted"}>
                    {count ? `${count} ${count === 1 ? "gift" : "gifts"}` : "Coming soon"}
                  </span>
                  <span className="text-ink transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
