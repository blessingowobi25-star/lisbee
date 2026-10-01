"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    brand_name: settings.brand_name,
    tagline: settings.tagline,
    whatsapp_number: settings.whatsapp_number,
    email: settings.email,
    instagram: settings.instagram,
    tiktok: settings.tiktok,
    linkedin: settings.linkedin,
    announcement: settings.announcement,
    from_name: settings.from_name,
    from_email: settings.from_email,
    delivery_cities: settings.delivery_cities.join(", "),
    target_margin_percent: String(settings.target_margin_percent),
    paystack_enabled: settings.paystack_enabled,
    bank: { ...settings.bank },
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = (key: keyof typeof form, value: (typeof form)[keyof typeof form]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          target_margin_percent: Number(form.target_margin_percent),
          delivery_cities: form.delivery_cities
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage({ tone: "error", text: data.error ?? "Could not save settings" });
        return;
      }
      setMessage({ tone: "ok", text: "Settings saved" });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Network error — try again" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl">Brand & contact</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Brand name</span>
            <input className="field" value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Tagline</span>
            <input className="field" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">WhatsApp number</span>
            <input className="field" value={form.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Public email</span>
            <input type="email" className="field" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Instagram</span>
            <input className="field" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">TikTok</span>
            <input className="field" value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">LinkedIn</span>
            <input className="field" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Announcement bar</span>
            <input className="field" value={form.announcement} onChange={(e) => set("announcement", e.target.value)} />
          </label>
        </div>
      </section>
      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl">Bank details</h2>
        <p className="mt-1 text-sm text-muted">
          Shown on the payment instructions page. Leave blank until the live account is confirmed —
          the page then tells customers we will send the details.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">Bank name</span>
            <input
              className="field"
              value={form.bank.bank_name}
              onChange={(e) => set("bank", { ...form.bank, bank_name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="field-label">Account name</span>
            <input
              className="field"
              value={form.bank.account_name}
              onChange={(e) => set("bank", { ...form.bank, account_name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="field-label">Account number</span>
            <input
              className="field"
              inputMode="numeric"
              value={form.bank.account_number}
              onChange={(e) =>
                set("bank", { ...form.bank, account_number: e.target.value.replace(/[^\d]/g, "") })
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-xl">Commerce</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Delivery cities (comma separated)</span>
            <input
              className="field"
              value={form.delivery_cities}
              onChange={(e) => set("delivery_cities", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="field-label">Target margin (%)</span>
            <input
              className="field"
              inputMode="numeric"
              value={form.target_margin_percent}
              onChange={(e) => set("target_margin_percent", e.target.value.replace(/[^\d]/g, ""))}
            />
          </label>
          <label className="block">
            <span className="field-label">From name (emails)</span>
            <input className="field" value={form.from_name} onChange={(e) => set("from_name", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">From email</span>
            <input type="email" className="field" value={form.from_email} onChange={(e) => set("from_email", e.target.value)} />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-espresso"
            checked={form.paystack_enabled}
            onChange={(e) => set("paystack_enabled", e.target.checked)}
          />
          Enable card payments (Paystack) — only switch on once live keys exist
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saving…" : "Save settings"}
        </button>
        {message && (
          <span className={message.tone === "ok" ? "text-sm text-olive" : "text-sm text-red-700"}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
