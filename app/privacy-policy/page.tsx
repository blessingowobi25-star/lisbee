import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What data LisBee collects when you order or create an account, and how it is used.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicy() {
  return <PolicyPage slug="privacy-policy" />;
}
