import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "The terms that apply when you order from LisBee.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <PolicyPage slug="terms" />;
}
