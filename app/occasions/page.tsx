import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop by occasion",
  description:
    "Find the right gift for the moment — birthday, anniversary, congratulations, new baby, Christmas and more. LisBee delivers in Abuja and Lagos.",
  alternates: { canonical: "/occasions" },
};

export default async function OccasionsPage() {
  const [occasions, products] = await Promise.all([
    db().listTaxonomies("occasion"),
    db().listProducts({}),
  ]);

  const countFor = (slug: string) => products.filter((p) => p.occasions.includes(slug)).length;

  return (
    <div className="shell py-10 md:py-14">
      <nav className="mb-6 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-espresso">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">Occasions</span>
      </nav>

      <div className="mb-9 max-w-2xl">
        <span className="eyebrow">Shop by occasion</span>
        <h1 className="mt-3 text-4xl md:text-6xl">The right gift for the moment</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Every occasion has its own flavour. Pick one and we will show you what fits — or start
          with the Workweek Box, which works for almost anything.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {occasions.map((occ, i) => {
          const count = countFor(occ.slug);
          return (
            <Reveal key={occ.id} delay={i * 50}>
              <Link
                href={`/occasions/${occ.slug}`}
                className="group flex h-full flex-col justify-between rounded-3xl border border-line bg-ivory p-6 transition hover:-translate-y-1 hover:border-honey hover:bg-white hover:shadow-card"
              >
                <div>
                  <h2 className="text-2xl">{occ.name}</h2>
                  {occ.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{occ.description}</p>
                  )}
                </div>
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
