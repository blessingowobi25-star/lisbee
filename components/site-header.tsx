"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/cart-context";

export interface NavItem {
  name: string;
  href: string;
  soon?: boolean;
}

interface HeaderProps {
  occasions: NavItem[];
  recipients: NavItem[];
  categories: NavItem[];
  user: { name: string; role: string } | null;
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
      <path d="M6 8h12l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H8.5A1.5 1.5 0 0 1 7 19.5L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20c1.4-3.4 4.2-5 7.5-5s6.1 1.6 7.5 5" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader({ occasions, recipients, categories, user }: HeaderProps) {
  const pathname = usePathname();
  const { count } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation. Adjusting state during render avoids
  // an extra commit, and the pattern is safe because it only touches this
  // component's own state.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMobileSection(null);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const dropdownClass =
    "invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-line bg-ivory/90 backdrop-blur-md"
          : "border-b border-transparent bg-ivory/70 backdrop-blur-sm"
      }`}
    >
      <div className="shell flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="LisBee home">
          <Image
            src="/images/logo-roundel.webp"
            alt="LisBee"
            width={44}
            height={44}
            className="h-9 w-9 rounded-full object-cover md:h-11 md:w-11"
            priority
          />
          <span className="font-display text-xl font-semibold tracking-tight text-espresso md:text-2xl">
            LisBee
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <div className="group relative">
            <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-sand hover:text-espresso">
              Shop <Chevron />
            </button>
            <div className={dropdownClass}>
              <div className="card w-64 p-2">
                <Link href="/shop" className="block rounded-xl px-3 py-2.5 text-sm hover:bg-linen">
                  All gifts
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm hover:bg-linen"
                  >
                    {c.name}
                    {c.soon && <span className="pill bg-sand text-cocoa">Soon</span>}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/workweek"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-sand hover:text-espresso"
          >
            Workweek Box
          </Link>

          <div className="group relative">
            <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-sand hover:text-espresso">
              Occasions <Chevron />
            </button>
            <div className={dropdownClass}>
              <div className="card grid w-[26rem] grid-cols-2 gap-1 p-2">
                {occasions.map((o) => (
                  <Link key={o.href} href={o.href} className="rounded-xl px-3 py-2.5 text-sm hover:bg-linen">
                    {o.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="group relative">
            <button className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-sand hover:text-espresso">
              Recipients <Chevron />
            </button>
            <div className={dropdownClass}>
              <div className="card grid w-[26rem] grid-cols-2 gap-1 p-2">
                {recipients.map((r) => (
                  <Link key={r.href} href={r.href} className="rounded-xl px-3 py-2.5 text-sm hover:bg-linen">
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/corporate"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-sand hover:text-espresso"
          >
            Corporate
          </Link>
          <Link
            href="/about"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/80 transition hover:bg-sand hover:text-espresso"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 md:gap-2.5">
          <Link
            href={user ? (user.role === "admin" ? "/admin" : "/account") : "/sign-in"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink/75 transition hover:bg-sand hover:text-espresso"
            aria-label={user ? `Account — ${user.name}` : "Sign in"}
            title={user ? user.name : "Sign in"}
          >
            <UserIcon />
          </Link>
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink/75 transition hover:bg-sand hover:text-espresso"
            aria-label={`Cart${count ? `, ${count} items` : ""}`}
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-honey px-1 text-[11px] font-bold text-espresso">
                {count}
              </span>
            )}
          </Link>
          <Link href="/shop" className="btn btn-primary hidden md:inline-flex btn-sm">
            Shop gifts
          </Link>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-sand lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line bg-ivory md:top-20 lg:hidden">
          <div className="shell flex flex-col gap-1 py-6">
            <Link href="/shop" className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-sand">
              Shop all gifts
            </Link>
            <Link href="/workweek" className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-sand">
              Workweek Box
            </Link>

            {(
              [
                { key: "categories", label: "Collections", items: categories },
                { key: "occasions", label: "Occasions", items: occasions },
                { key: "recipients", label: "Recipients", items: recipients },
              ] as { key: string; label: string; items: NavItem[] }[]
            ).map((section) => (
              <div key={section.key} className="border-t border-line/70">
                <button
                  onClick={() =>
                    setMobileSection(mobileSection === section.key ? null : section.key)
                  }
                  className="flex w-full items-center justify-between px-3 py-3.5 text-lg font-medium"
                  aria-expanded={mobileSection === section.key}
                >
                  {section.label}
                  <Chevron open={mobileSection === section.key} />
                </button>
                {mobileSection === section.key && (
                  <div className="grid grid-cols-2 gap-1 pb-3">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-xl px-3 py-2.5 text-sm text-ink/80 hover:bg-sand"
                      >
                        {item.name}
                        {item.soon && <span className="ml-1 text-xs text-honey-deep">· soon</span>}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link href="/corporate" className="border-t border-line/70 rounded-xl px-3 py-3.5 text-lg font-medium hover:bg-sand">
              Corporate gifting
            </Link>
            <Link href="/how-it-works" className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-sand">
              How it works
            </Link>
            <Link href="/about" className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-sand">
              About LisBee
            </Link>
            <Link href="/faq" className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-sand">
              FAQs
            </Link>
            <Link href="/contact" className="rounded-xl px-3 py-3 text-lg font-medium hover:bg-sand">
              Contact
            </Link>
            <div className="mt-4 flex gap-3">
              <Link href="/shop" className="btn btn-primary flex-1">
                Shop the Workweek Box
              </Link>
              <Link href="/cart" className="btn btn-outline flex-1">
                Cart ({count})
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


