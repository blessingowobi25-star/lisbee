"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/enquiries", label: "Corporate enquiries" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/content", label: "Content & delivery" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition ${
              active
                ? "bg-espresso font-medium text-cream"
                : "text-ink/75 hover:bg-sand"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
