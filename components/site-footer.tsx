import Link from "next/link";
import Image from "next/image";
import type { SiteSettings } from "@/lib/types";
import { whatsappLink } from "@/lib/format";

const shopLinks = [
  { href: "/shop", label: "Shop all gifts" },
  { href: "/workweek", label: "Workweek Box" },
  { href: "/occasions", label: "Shop by occasion" },
  { href: "/recipients", label: "Shop by recipient" },
  { href: "/corporate", label: "Corporate gifting" },
  { href: "/build-your-own", label: "Build your own gift" },
];

const companyLinks = [
  { href: "/about", label: "About LisBee" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
  { href: "/account", label: "My account" },
];

const policyLinks = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Terms & conditions" },
  { href: "/refunds", label: "Refunds & returns" },
  { href: "/delivery", label: "Delivery policy" },
];

function SocialIcon({ kind }: { kind: "instagram" | "tiktok" | "linkedin" }) {
  const cls = "h-4 w-4";
  if (kind === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
        <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.48a2.5 2.5 0 0 1-.02-4.98ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.1c0-1.22-.02-2.78-1.8-2.78-1.8 0-2.07 1.32-2.07 2.69V21h-4v-11Z" />
      </svg>
    );
  }
  if (kind === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
        <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.79-2.46V9.77a5.67 5.67 0 1 0 4.88 5.6V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={cls} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const socials = [
    { kind: "instagram" as const, label: settings.instagram, href: "https://instagram.com/hellolisbee" },
    { kind: "tiktok" as const, label: settings.tiktok, href: "https://tiktok.com/@hellolisbee" },
    { kind: "linkedin" as const, label: settings.linkedin, href: "https://www.linkedin.com/company/lisbee" },
  ];

  return (
    <footer className="mt-24 bg-espresso text-cream">
      <div className="shell py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-roundel.webp"
                alt="LisBee"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
              <span className="font-display text-2xl font-semibold">LisBee</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/70">
              {settings.tagline} Thoughtfully curated gifts, delivered in Abuja and Lagos.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.kind}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/25 text-cream/80 transition hover:border-honey hover:text-honey"
                >
                  <SocialIcon kind={s.kind} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Shop">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-honey">
              Shop
            </h3>
            <ul className="space-y-2.5 text-sm text-cream/75">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-honey">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-honey">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-cream/75">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-honey">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-honey">
              Get in touch
            </h3>
            <ul className="space-y-2.5 text-sm text-cream/75">
              <li>
                <a
                  href={whatsappLink(
                    settings.whatsapp_number,
                    "Hi LisBee, I'd like to ask about your gifts.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-honey"
                >
                  WhatsApp: {settings.whatsapp_number}
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="transition hover:text-honey">
                  {settings.email}
                </a>
              </li>
              <li className="pt-1 text-cream/60">Delivery: Abuja &amp; Lagos</li>
              <li className="text-cream/60">Payment at launch: bank transfer</li>
            </ul>
            <Link href="/corporate" className="btn btn-honey btn-sm mt-5">
              Plan a corporate gift
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-cream/15 pt-6 text-xs text-cream/55 md:flex-row md:items-center md:justify-between">
          <p>© {year} LisBee. Thoughtfully given. Happily received.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {policyLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-honey">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}


