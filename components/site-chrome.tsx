"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader, type NavItem } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import type { SiteSettings } from "@/lib/types";

interface ChromeProps {
  children: ReactNode;
  settings: SiteSettings;
  occasions: NavItem[];
  recipients: NavItem[];
  categories: NavItem[];
  user: { name: string; role: string } | null;
}

/**
 * The storefront chrome (header, footer, WhatsApp button).
 * Admin routes render their own layout, so chrome is skipped there.
 */
export function SiteChrome({ children, settings, occasions, recipients, categories, user }: ChromeProps) {
  const pathname = usePathname() ?? "/";
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {settings.announcement && (
        <div className="bg-espresso px-4 py-2 text-center text-xs tracking-wide text-cream/90">
          {settings.announcement}
        </div>
      )}
      <SiteHeader occasions={occasions} recipients={recipients} categories={categories} user={user} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      <WhatsAppFab number={settings.whatsapp_number} />
    </>
  );
}
