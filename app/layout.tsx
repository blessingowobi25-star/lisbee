import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { SiteChrome } from "@/components/site-chrome";
import type { NavItem } from "@/components/site-header";
import { db, getSettings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LisBee — Thoughtfully given. Happily received.",
    template: "%s | LisBee",
  },
  description:
    "Premium gifting from Abuja and Lagos. The Workweek Box gives someone a better week, one day at a time — five days, five moments, one thoughtful gift.",
  keywords: [
    "gift boxes Nigeria",
    "gift delivery Abuja",
    "gift delivery Lagos",
    "corporate gifting Nigeria",
    "premium gift boxes",
    "Workweek gift box",
  ],
  openGraph: {
    type: "website",
    siteName: "LisBee",
    title: "LisBee — Thoughtfully given. Happily received.",
    description:
      "Five days. Five moments. One thoughtful gift. Premium gifts delivered in Abuja and Lagos.",
    images: [{ url: "/images/og-image.webp", width: 1200, height: 1200 }],
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "LisBee — Thoughtfully given. Happily received.",
    description: "Premium gifts delivered in Abuja and Lagos. Shop the Workweek Box.",
    images: ["/images/og-image.webp"],
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const user = await getSessionUser();

  const [occasions, recipients, categories] = await Promise.all([
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
    db().listTaxonomies("category"),
  ]);

  const occasionNav: NavItem[] = occasions.map((o) => ({ name: o.name, href: `/occasions/${o.slug}` }));
  const recipientNav: NavItem[] = recipients.map((r) => ({ name: r.name, href: `/recipients/${r.slug}` }));
  const categoryNav: NavItem[] = categories
    .filter((c) => c.show_in_nav)
    .map((c) => ({
      name: c.name,
      href:
        c.slug === "workweek-boxes"
          ? "/workweek"
          : c.slug === "corporate"
            ? "/corporate"
            : c.slug === "signature"
              ? "/shop"
              : `/shop?category=${c.slug}`,
      soon: Boolean(c.coming_soon),
    }));

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <SiteChrome
            settings={settings}
            occasions={occasionNav}
            recipients={recipientNav}
            categories={categoryNav}
            user={user ? { name: user.name, role: user.role } : null}
          >
            {children}
          </SiteChrome>
        </CartProvider>

        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="lisbee-ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        {pixelId && (
          <Script id="lisbee-meta" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
          </Script>
        )}
      </body>
    </html>
  );
}

