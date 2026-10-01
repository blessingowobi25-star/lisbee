import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CollectionLanding } from "@/components/collection-landing";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const rec = await db().getTaxonomyBySlug("recipient", slug);
  if (!rec) return { title: "Recipient not found" };
  return {
    title: rec.name,
    description:
      rec.description ||
      `Gifts ${rec.name.toLowerCase()} — thoughtfully curated by LisBee and delivered in Abuja and Lagos.`,
    alternates: { canonical: `/recipients/${rec.slug}` },
  };
}

export default async function RecipientPage({ params }: Params) {
  const { slug } = await params;
  const rec = await db().getTaxonomyBySlug("recipient", slug);
  if (!rec) notFound();

  const products = await db().listProducts({ recipient: rec.slug });

  return (
    <CollectionLanding
      eyebrow="Shop by recipient"
      taxonomy={rec}
      products={products}
      allHref="/shop"
      allLabel="Shop all gifts"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Recipients", href: "/recipients" },
        { label: rec.name },
      ]}
    />
  );
}
