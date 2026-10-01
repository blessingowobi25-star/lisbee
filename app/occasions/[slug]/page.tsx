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
  const occ = await db().getTaxonomyBySlug("occasion", slug);
  if (!occ) return { title: "Occasion not found" };
  return {
    title: `${occ.name} gifts`,
    description:
      occ.description ||
      `Shop ${occ.name.toLowerCase()} gifts from LisBee — thoughtfully curated and delivered in Abuja and Lagos.`,
    alternates: { canonical: `/occasions/${occ.slug}` },
  };
}

export default async function OccasionPage({ params }: Params) {
  const { slug } = await params;
  const occ = await db().getTaxonomyBySlug("occasion", slug);
  if (!occ) notFound();

  const products = await db().listProducts({ occasion: occ.slug });

  return (
    <CollectionLanding
      eyebrow="Shop by occasion"
      taxonomy={occ}
      products={products}
      allHref="/shop"
      allLabel="Shop all gifts"
      breadcrumb={[
        { label: "Home", href: "/" },
        { label: "Occasions", href: "/occasions" },
        { label: occ.name },
      ]}
    />
  );
}
