"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

interface FormState {
  name: string;
  company: string;
  work_email: string;
  phone: string;
  recipients_count: string;
  occasion: string;
  city: string;
  budget_per_recipient: string;
  preferred_delivery_date: string;
  message: string;
  requirements: string;
}

const EMPTY: FormState = {
  name: "",
  company: "",
  work_email: "",
  phone: "",
  recipients_count: "",
  occasion: "",
  city: "",
  budget_per_recipient: "",
  preferred_delivery_date: "",
  message: "",
  requirements: "",
};

export function CorporateForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again or message us on WhatsApp.");
        return;
      }
      setStatus("sent");
      track("corporate_enquiry", { company: form.company, city: form.city });
      setForm(EMPTY);
    } catch {
      setStatus("error");
      setError("Network error — please try again or message us on WhatsApp.");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-3xl border border-line bg-ivory px-6 py-14 text-center">
        <span className="pill bg-olive text-cream">Received</span>
        <h3 className="mt-4 text-2xl">Thank you — your enquiry is in</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          We have your details and will come back to you with a proposal. If it is urgent, message
          us on WhatsApp at 07061804951.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-white p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Full name *</span>
          <input required className="field" value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Adaeze Okafor" />
        </label>
        <label className="block">
          <span className="field-label">Company *</span>
          <input required className="field" value={form.company} onChange={(e) => set("company")(e.target.value)} placeholder="Company name" />
        </label>
        <label className="block">
          <span className="field-label">Work email *</span>
          <input required type="email" className="field" value={form.work_email} onChange={(e) => set("work_email")(e.target.value)} placeholder="you@company.com" />
        </label>
        <label className="block">
          <span className="field-label">Phone *</span>
          <input required type="tel" className="field" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="0800 000 0000" />
        </label>
        <label className="block">
          <span className="field-label">Number of recipients</span>
          <input className="field" value={form.recipients_count} onChange={(e) => set("recipients_count")(e.target.value)} placeholder="e.g. 25" />
        </label>
        <label className="block">
          <span className="field-label">Occasion</span>
          <select className="field" value={form.occasion} onChange={(e) => set("occasion")(e.target.value)}>
            <option value="">Select an occasion</option>
            {[
              "Employee appreciation",
              "Onboarding",
              "Work anniversary",
              "Promotion",
              "Client gifting",
              "Executive gifting",
              "Conference or event",
              "Christmas & festive",
              "Team celebration",
              "Other",
            ].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Preferred delivery city</span>
          <select className="field" value={form.city} onChange={(e) => set("city")(e.target.value)}>
            <option value="">Select a city</option>
            <option value="Abuja">Abuja</option>
            <option value="Lagos">Lagos</option>
          </select>
        </label>
        <label className="block">
          <span className="field-label">Budget per recipient</span>
          <select className="field" value={form.budget_per_recipient} onChange={(e) => set("budget_per_recipient")(e.target.value)}>
            <option value="">Select a range</option>
            {["Under ₦25,000", "₦25,000 – ₦50,000", "₦50,000 – ₦100,000", "₦100,000+", "Not sure yet"].map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">Preferred delivery date</span>
          <input type="date" className="field" value={form.preferred_delivery_date} onChange={(e) => set("preferred_delivery_date")(e.target.value)} />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">What do you have in mind? *</span>
          <textarea required rows={4} className="field" value={form.message} onChange={(e) => set("message")(e.target.value)} placeholder="Tell us about the programme, the recipients and the timing." />
        </label>
        <label className="block sm:col-span-2">
          <span className="field-label">Additional requirements</span>
          <textarea rows={3} className="field" value={form.requirements} onChange={(e) => set("requirements")(e.target.value)} placeholder="Branding, invoicing, PO terms, multiple addresses…" />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={status === "sending"} className="btn btn-primary mt-6 w-full sm:w-auto">
        {status === "sending" ? "Sending…" : "Send enquiry"}
      </button>
      <p className="mt-3 text-xs text-muted">
        Prefer WhatsApp? Message 07061804951 and we will pick it up from there.
      </p>
    </form>
  );
}
