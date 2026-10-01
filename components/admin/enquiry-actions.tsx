"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CorporateEnquiry } from "@/lib/types";
import { whatsappLink } from "@/lib/format";

const STATUSES: CorporateEnquiry["status"][] = [
  "new",
  "in_review",
  "contacted",
  "converted",
  "closed",
];

export function EnquiryActions({
  enquiryId,
  status,
}: {
  enquiryId: string;
  status: CorporateEnquiry["status"];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const update = async (value: CorporateEnquiry["status"]) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <select
      className="field py-2 text-sm"
      value={status}
      disabled={busy}
      onChange={(e) => update(e.target.value as CorporateEnquiry["status"])}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

export function EnquiryContactLink({ enquiry }: { enquiry: CorporateEnquiry }) {
  return (
    <a
      href={whatsappLink(
        enquiry.phone,
        `Hi ${enquiry.name}, thank you for your LisBee corporate gifting enquiry about ${enquiry.company}.`,
      )}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-honey-deep hover:underline"
    >
      WhatsApp {enquiry.name}
    </a>
  );
}
