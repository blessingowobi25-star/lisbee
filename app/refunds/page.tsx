import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Refunds & returns",
  description:
    "How LisBee handles refunds, replacements and cancellations for gifting orders in Nigeria.",
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return <PolicyPage slug="refunds" />;
}
