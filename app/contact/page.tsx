import Link from "next/link";
import type { Metadata } from "next";
import { getSettings } from "@/lib/db";
import { whatsappLink } from "@/lib/format";
import { Reveal } from "@/components/reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact LisBee",
  description:
    "Talk to LisBee about a gift, an order or corporate gifting. WhatsApp 07061804951, email hellolisbee@gmail.com. Delivering in Abuja and Lagos.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();

  const channels = [
    {
      title: "WhatsApp",
      value: settings.whatsapp_number,
      body: "Fastest way to reach us. Product questions, order updates, corporate briefs.",
      href: whatsappLink(settings.whatsapp_number, "Hi LisBee, I'd like to ask about your gifts."),
      cta: "Open WhatsApp",
    },
    {
      title: "Email",
      value: settings.email,
      body: "For order details, invoices, proposals and anything that needs a paper trail.",
      href: `mailto:${settings.email}`,
      cta: "Send an email",
    },
    {
      title: "Corporate gifting",
      value: "Plan a corporate gift",
      body: "Employee, client, executive and bulk programmes. Share the brief and we will propose.",
      href: "/corporate",
      cta: "Open the enquiry form",
    },
  ];

  return (
    <>
      <section className="shell py-12 md:py-20">
        <div className="max-w-2xl">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-3 text-4xl md:text-6xl">Talk to a person</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
            No ticket queues and no chatbots. Message us on WhatsApp, send an email, or use the
            corporate form if you are ordering for a team.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {channels.map((channel, i) => (
            <Reveal key={channel.title} delay={i * 80}>
              <div className="flex h-full flex-col rounded-3xl border border-line bg-ivory p-6">
                <h2 className="text-xl">{channel.title}</h2>
                <div className="mt-2 font-display text-2xl text-espresso">{channel.value}</div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{channel.body}</p>
                {channel.href.startsWith("/") ? (
                  <Link href={channel.href} className="btn btn-outline btn-sm mt-5">
                    {channel.cta}
                  </Link>
                ) : (
                  <a
                    href={channel.href}
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm mt-5"
                  >
                    {channel.cta}
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-cream/70 py-16 md:py-20">
        <div className="shell">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: "Order help", body: "Message your order number and we'll check it right away." },
              { title: "Custom gifts", body: "Ask about Build Your Own Gift, branding and large quantities." },
              { title: "Delivery", body: "We deliver in Abuja and Lagos. Timing and fees are confirmed per order." },
            ].map((item) => (
              <Reveal key={item.title}>
                <div className="h-full rounded-3xl border border-line bg-white p-6">
                  <h3 className="text-xl">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-10 text-center text-sm text-muted">
            <p>
              Instagram {settings.instagram} · TikTok {settings.tiktok} · LinkedIn {settings.linkedin}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/faq" className="btn btn-sm btn-outline">
                Read the FAQs
              </Link>
              <Link href="/delivery" className="btn btn-sm btn-outline">
                Delivery policy
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
