import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { whatsappLink } from "@/lib/format";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers about the Workweek Box, delivery in Abuja and Lagos, bank transfer payments, gift messages, corporate orders and refunds.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([db().listFaqs(), db().getSettings()]);

  const groups = faqs.reduce<Record<string, typeof faqs>>((acc, faq) => {
    (acc[faq.category] = acc[faq.category] ?? []).push(faq);
    return acc;
  }, {});

  return (
    <>
      <section className="shell py-12 md:py-16">
        <div className="mb-10 max-w-2xl">
          <span className="eyebrow">FAQs</span>
          <h1 className="mt-3 text-4xl md:text-6xl">Questions, answered plainly</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            If your question is not here, message us on WhatsApp and we will tell you straight.
          </p>
        </div>

        {Object.keys(groups).length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {Object.entries(groups).map(([group, items], gi) => (
              <Reveal key={group} delay={gi * 60}>
                <section>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-honey-deep">
                    {group}
                  </h2>
                  <div className="space-y-3">
                    {items.map((faq) => (
                      <details
                        key={faq.id}
                        className="group rounded-2xl border border-line bg-ivory px-5 py-4"
                      >
                        <summary className="cursor-pointer list-none pr-6 text-sm font-medium text-espresso marker:hidden">
                          {faq.question}
                          <span className="float-right text-honey-deep transition group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                </section>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">FAQs are being updated. Please contact us directly.</p>
        )}

        <Reveal className="mt-14 flex flex-col items-center gap-4 rounded-[2rem] border border-line bg-cream/70 px-6 py-10 text-center">
          <h2 className="text-2xl md:text-3xl">Still have a question?</h2>
          <p className="max-w-md text-sm text-muted">
            We answer product, delivery and order questions ourselves — on WhatsApp or by email.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink(settings.whatsapp_number, "Hi LisBee, I have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              WhatsApp {settings.whatsapp_number}
            </a>
            <Link href="/contact" className="btn btn-outline">
              Contact page
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
