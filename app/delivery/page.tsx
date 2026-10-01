import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery policy",
  description:
    "Where LisBee delivers, how delivery timing and fees work, and what happens if a delivery cannot be completed.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPolicy() {
  return <PolicyPage slug="delivery" />;
}
