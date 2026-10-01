import Link from "next/link";
import type { Metadata } from "next";
import { CorporateForm } from "@/components/corporate-form";
import { Reveal } from "@/components/reveal";
import { getSettings } from "@/lib/db";
import { whatsappLink } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Corporate gifting in Nigeria",
  description:
    "Employee appreciation, onboarding, client gifts, executive gifting, events and festive programmes — corporate gifting by LisBee, delivered in Abuja and Lagos.",
  alternates: { canonical: "/corporate" },
};

const USE_CASES = [
  { title: "Employee appreciation", body: "Milestones, hard weeks, wins worth marking — a gift that arrives at the desk." },
  { title: "New employee onboarding", body: "Welcome the joiner before day one with something that says the team planned ahead." },
  { title: "Work anniversaries", body: "Mark another year without another generic email." },
  { title: "Promotions & milestones", body: "A step up deserves more than a message in the group chat." },
  { title: "Client gifting", body: "Thank the clients who carry the business — presented properly." },
  { title: "Executive gifting", body: "Board members, directors and VIP recipients, handled with care." },
  { title: "Conferences & events", body: "Delegate gifts, speaker thank-yous and launch events." },
  { title: "Christmas & festive", body: "End-of-year programmes for teams, clients and partners." },
];

const PROCESS = [
  { n: "01", title: "Tell us the brief", body: "Recipients, budget per person, city, date and any branding requirements." },
  { n: "02", title: "We send a proposal", body: "Tiers, contents, pricing and timing — written clearly, no vague quotes." },
  { n: "03", title: "Confirm and pay", body: "Deposit to confirm, balance before dispatch. Invoices and POs accepted." },
  { n: "04", title: "We deliver", body: "One delivery per address in Abuja or Lagos, with recipient lists handled by us." },
];

export default async function CorporatePage() {
  const settings = await getSettings();

  return (
    <>
      <section className="bg-espresso text-cream">
        <div className="shell grid gap-10 py-16 md:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <Reveal>
              <span className="eyebrow text-honey">Corporate gifting</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-4 text-4xl leading-tight text-cream md:text-6xl">
                A better way to appreciate your team.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-cream/80 md:text-base">
                Not another generic hamper. The Workweek Box gives every recipient five moments
                across one week — for employees, clients, executives and teams. One order, one
                delivery, five days of looking forward to something.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#enquiry" className="btn btn-honey">
                  Plan a corporate gift
                </a>
                <a
                  href={whatsappLink(
                    settings.whatsapp_number,
                    "Hi LisBee, I'd like to enquire about corporate gifting.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-light"
                >
                  WhatsApp us
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <div className="grid gap-3 sm:grid-cols-2">
              {USE_CASES.slice(0, 6).map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-cream/15 bg-cream/5 px-5 py-4"
                >
                  <div className="font-medium text-cream">{item.title}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-cream/65">{item.body}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Use cases continued ---------------- */}
      <section className="shell py-16 md:py-24">
        <Reveal className="mb-9 max-w-2xl">
          <span className="eyebrow">Where LisBee fits</span>
          <h2 className="mt-3 text-3xl md:text-5xl">Gifting programmes, not one-offs</h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.slice(4)
            .concat([
              { title: "Recurring gifting", body: "Monthly or quarterly programmes for teams — scheduled, not scrambled." },
              { title: "Team gifting", body: "Department wins, offsites and retreats." },
            ])
            .map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className="h-full rounded-3xl border border-line bg-ivory p-6">
                  <h3 className="text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
        </div>
      </section>

      {/* ---------------- Process ---------------- */}
      <section className="bg-cream/70 py-16 md:py-24">
        <div className="shell">
          <Reveal className="mb-9 max-w-2xl">
            <span className="eyebrow">How it works</span>
            <h2 className="mt-3 text-3xl md:text-5xl">From brief to delivered</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((step, i) => (
              <Reveal key={step.n} delay={i * 70}>
                <div className="h-full rounded-3xl border border-line bg-ivory p-6">
                  <div className="font-display text-4xl text-honey">{step.n}</div>
                  <h3 className="mt-4 text-xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 rounded-3xl border border-line bg-white px-6 py-6 text-sm text-muted md:px-8">
            Payment: 70% deposit to confirm corporate orders, balance before dispatch. Invoices and
            purchase orders accepted. Delivery limited to Abuja and Lagos for now.
          </Reveal>
        </div>
      </section>

      {/* ---------------- Enquiry form ---------------- */}
      <section id="enquiry" className="shell scroll-mt-24 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="eyebrow">Corporate enquiry</span>
            <h2 className="mt-3 text-3xl md:text-5xl">Tell us what you need</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Share the basics and we will come back with a proposal — tiers, contents, per-person
              pricing and delivery timing for your city.
            </p>
            <div className="mt-7 space-y-3 text-sm">
              <Link href="/workweek" className="block text-honey-deep hover:underline">
                See the Workweek Box tiers →
              </Link>
              <a
                href={whatsappLink(
                  settings.whatsapp_number,
                  "Hi LisBee, I'd like to enquire about corporate gifting.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-honey-deep hover:underline"
              >
                WhatsApp {settings.whatsapp_number} →
              </a>
              <a href={`mailto:${settings.email}`} className="block text-honey-deep hover:underline">
                {settings.email} →
              </a>
            </div>
          </div>
          <CorporateForm />
        </div>
      </section>
    </>
  );
}
