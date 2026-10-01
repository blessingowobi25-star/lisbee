import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, occasions, recipients] = await Promise.all([
    db().listProducts({}),
    db().listTaxonomies("occasion"),
    db().listTaxonomies("recipient"),
  ]);

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/workweek`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/corporate`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/build-your-own`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/occasions`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/recipients`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/delivery`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/refunds`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...products.map((p) => ({
      url: `${BASE}/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...occasions
      .filter((o) => !o.coming_soon)
      .map((o) => ({
        url: `${BASE}/occasions/${o.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ...recipients
      .filter((r) => !r.coming_soon)
      .map((r) => ({
        url: `${BASE}/recipients/${r.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
  ];
}
