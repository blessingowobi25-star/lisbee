import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "About LisBee",
  description:
    "LisBee is a modern premium gifting brand from Nigeria. Thoughtfully given. Happily received. Home of the Workweek Box.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Fewer, better items",
    body: "A box should never be filled with filler. Every item earns its place — if it would not look right unwrapped on a desk, it does not go in.",
  },
  {
    title: "Presentation is part of the gift",
    body: "Rigid boxes, weekday compartments, ribbon and a card with your words. How it looks when it arrives matters as much as what is inside.",
  },
  {
    title: "Say what is true",
    body: "Real prices, real delivery locations, real answers. If we cannot do something yet, we say so instead of pretending.",
  },
  {
    title: "Make ordinary weeks better",
    body: "The best gifts are not saved for birthdays. A better Tuesday is a reason enough.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-espresso text-cream">
        <div className="shell grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <Reveal>
              <span className="eyebrow text-honey">About LisBee</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-4 text-4xl leading-tight text-cream md:text-6xl">
                Thoughtfully given.
                <br />
                <span className="italic text-honey">Happily received.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-cream/80 md:text-base">
                LisBee is a modern premium gifting brand built on a simple belief: a thoughtful
                gift should feel personal, look beautiful and stay with someone longer than a
                single moment.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream/70">
                That idea became our signature product — the Workweek Box. One gift, five
                individually packaged moments, one for each working day. Give someone a better
                week, one day at a time.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/workweek" className="btn btn-honey">
                  Shop the Workweek Box
                </Link>
                <Link href="/corporate" className="btn btn-light">
                  Corporate gifting
                </Link>
              </div>
            </Reveal>
          </div>
          <Reveal delay={140}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-cream/15">
              <Image
                src="/images/lifestyle-warm.webp"
                alt="A LisBee gifting moment"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="shell py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <Reveal>
            <span className="eyebrow">Our philosophy</span>
            <h2 className="mt-3 text-3xl md:text-5xl">Not another hamper</h2>
            <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted md:text-base">
              <p>
                Most gifts are opened once and forgotten by lunchtime. We wanted something
                different: a gift that keeps arriving. The Workweek Box turns one delivery into
                five moments of anticipation — Monday through Friday, each one packaged on its own.
              </p>
              <p>
                We serve individuals and organisations. People buy LisBee for friends, partners,
                family and colleagues; companies buy it for employees, teams, clients and
                executives. Corporate gifting is a major part of what we do, but it is not all we
                are — the brand belongs to every thoughtful gesture.
              </p>
              <p>
                We deliver in Abuja and Lagos, because delivering properly matters more than
                delivering everywhere. Every order is confirmed by a person, not a bot.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="rounded-[2rem] border border-line bg-ivory p-7 md:p-8">
              <h3 className="text-2xl">The LisBee standard</h3>
              <div className="mt-5 space-y-5">
                {VALUES.map((value) => (
                  <div key={value.title}>
                    <div className="flex items-center gap-3">
                      <span className="h-1 w-8 rounded-full bg-honey" />
                      <h4 className="text-base font-semibold text-espresso">{value.title}</h4>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{value.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
