"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product, Taxonomy, WorkweekDay } from "@/lib/types";
import { formatNaira } from "@/lib/format";

interface Props {
  product: Product | null;
  taxonomies: { categories: Taxonomy[]; occasions: Taxonomy[]; recipients: Taxonomy[] };
  targetMargin: number;
}

interface FormState {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: string;
  cost_product: string;
  cost_packaging: string;
  cost_other: string;
  sku: string;
  category: string;
  tier: string;
  stock_status: string;
  availability: string;
  status: string;
  featured: boolean;
  coming_soon: boolean;
  bestseller: boolean;
  is_new: boolean;
  images: string;
  occasions: string[];
  recipients: string[];
  weight: string;
  delivery_info: string;
  customisation: string;
  seo_title: string;
  seo_description: string;
  whats_inside: WorkweekDay[];
}

const BLANK_DAY: WorkweekDay = { day: "", moment: "", items: [] };

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ProductForm({ product, taxonomies, targetMargin }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    tagline: product?.tagline ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    cost_product: product?.cost_product === null || product?.cost_product === undefined ? "" : String(product.cost_product),
    cost_packaging: product?.cost_packaging === null || product?.cost_packaging === undefined ? "" : String(product.cost_packaging),
    cost_other: product?.cost_other === null || product?.cost_other === undefined ? "" : String(product.cost_other),
    sku: product?.sku ?? "",
    category: product?.category ?? taxonomies.categories[0]?.slug ?? "workweek-boxes",
    tier: product?.tier ?? "",
    stock_status: product?.stock_status ?? "in_stock",
    availability: product?.availability ?? "available",
    status: product?.status ?? "draft",
    featured: product?.featured ?? false,
    coming_soon: product?.coming_soon ?? false,
    bestseller: product?.bestseller ?? false,
    is_new: product?.is_new ?? false,
    images: (product?.images ?? []).join("\n"),
    occasions: product?.occasions ?? [],
    recipients: product?.recipients ?? [],
    weight: product?.weight ?? "",
    delivery_info: product?.delivery_info ?? "",
    customisation: product?.customisation ?? "",
    seo_title: product?.seo_title ?? "",
    seo_description: product?.seo_description ?? "",
    whats_inside: product?.whats_inside ?? [BLANK_DAY],
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const number = (value: string) => (value.trim() === "" ? null : Number(value));
  const price = Number(form.price || 0);
  const cost = [number(form.cost_product), number(form.cost_packaging), number(form.cost_other)];
  const complete = cost.every((c) => c !== null);
  const totalCost = cost.reduce<number>((sum, c) => sum + (c ?? 0), 0);
  const margin = complete && price > 0 ? ((price - totalCost) / price) * 100 : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: product?.id,
          ...form,
          price: Number(form.price),
          cost_product: number(form.cost_product),
          cost_packaging: number(form.cost_packaging),
          cost_other: number(form.cost_other),
          tier: form.tier || null,
          images: form.images
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean),
          whats_inside: form.whats_inside.filter((day) => day.day.trim()),
        }),
      });
      const data = (await res.json()) as { error?: string; product?: Product };
      if (!res.ok || !data.product) {
        setMessage({ tone: "error", text: data.error ?? "Could not save the product" });
        return;
      }
      setMessage({ tone: "ok", text: "Saved" });
      router.push("/admin/products");
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Network error — try again" });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-lg">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Name *</span>
            <input required className="field" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Slug</span>
            <input className="field" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="derived-from-name" />
          </label>
          <label className="block sm:col-span-2">
            <span className="field-label">Tagline</span>
            <input className="field" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="One line shown on cards" />
          </label>
          <label className="block sm:col-span-2">
            <span className="field-label">Description</span>
            <textarea rows={5} className="field" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">SKU</span>
            <input className="field" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Weight / size</span>
            <input className="field" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-lg">Pricing & costing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="field-label">Selling price (₦) *</span>
            <input
              required
              inputMode="numeric"
              className="field"
              value={form.price}
              onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))}
            />
          </label>
          <label className="block">
            <span className="field-label">Product cost (₦)</span>
            <input className="field" inputMode="numeric" value={form.cost_product} onChange={(e) => set("cost_product", e.target.value.replace(/[^\d]/g, ""))} />
          </label>
          <label className="block">
            <span className="field-label">Packaging cost (₦)</span>
            <input className="field" inputMode="numeric" value={form.cost_packaging} onChange={(e) => set("cost_packaging", e.target.value.replace(/[^\d]/g, ""))} />
          </label>
          <label className="block">
            <span className="field-label">Other cost (₦)</span>
            <input className="field" inputMode="numeric" value={form.cost_other} onChange={(e) => set("cost_other", e.target.value.replace(/[^\d]/g, ""))} />
          </label>
        </div>
        <div className="mt-4 rounded-2xl bg-ivory px-4 py-3 text-sm">
          {margin === null ? (
            <span className="text-muted">
              Enter the full cost set to see the margin. Blank costs stay blank — they are never
              estimated.
            </span>
          ) : (
            <span className={margin >= targetMargin ? "text-olive" : "text-red-700"}>
              Margin {margin.toFixed(1)}% · cost {formatNaira(totalCost)} · target {targetMargin}%
            </span>
          )}
        </div>
      </section>
      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-lg">Merchandising</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="field-label">Category</span>
            <select className="field" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {taxonomies.categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Tier</span>
            <select className="field" value={form.tier} onChange={(e) => set("tier", e.target.value)}>
              <option value="">None</option>
              <option value="premium">Premium</option>
              <option value="signature">Signature</option>
              <option value="executive">Executive</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Status</span>
            <select className="field" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Stock</span>
            <select className="field" value={form.stock_status} onChange={(e) => set("stock_status", e.target.value)}>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Availability</span>
            <select className="field" value={form.availability} onChange={(e) => set("availability", e.target.value)}>
              <option value="available">Available now</option>
              <option value="pre_order">Pre-order</option>
            </select>
          </label>
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="field-label">Images (one path per line)</span>
            <textarea
              rows={3}
              className="field font-mono text-xs"
              value={form.images}
              onChange={(e) => set("images", e.target.value)}
              placeholder="/images/premium-a.webp"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-sm">
          {[
            { key: "featured" as const, label: "Featured" },
            { key: "bestseller" as const, label: "Bestseller" },
            { key: "is_new" as const, label: "New" },
            { key: "coming_soon" as const, label: "Coming soon" },
          ].map((flag) => (
            <label key={flag.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-espresso"
                checked={form[flag.key]}
                onChange={(e) => set(flag.key, e.target.checked)}
              />
              {flag.label}
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-lg">Where it appears</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {[
            { title: "Occasions", options: taxonomies.occasions, key: "occasions" as const },
            { title: "Recipients", options: taxonomies.recipients, key: "recipients" as const },
          ].map((group) => (
            <div key={group.key}>
              <h3 className="text-xs uppercase tracking-[0.14em] text-muted">{group.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.options.map((option) => {
                  const active = form[group.key].includes(option.slug);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => set(group.key, toggle(form[group.key], option.slug))}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                        active
                          ? "border-espresso bg-espresso text-cream"
                          : "border-line bg-white text-ink/75 hover:bg-sand"
                      }`}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">What&rsquo;s inside (workweek days)</h2>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() =>
              set("whats_inside", [
                ...form.whats_inside,
                { day: "", moment: "", items: [] } as WorkweekDay,
              ])
            }
          >
            Add day
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {form.whats_inside.map((day, index) => (
            <div key={index} className="rounded-2xl border border-line bg-ivory p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className="field"
                  placeholder="Monday"
                  value={day.day}
                  onChange={(e) => {
                    const next = [...form.whats_inside];
                    next[index] = { ...day, day: e.target.value };
                    set("whats_inside", next);
                  }}
                />
                <input
                  className="field sm:col-span-2"
                  placeholder="Moment name, e.g. Start Strong"
                  value={day.moment}
                  onChange={(e) => {
                    const next = [...form.whats_inside];
                    next[index] = { ...day, moment: e.target.value };
                    set("whats_inside", next);
                  }}
                />
              </div>
              <input
                className="field mt-3"
                placeholder="Items, comma separated"
                value={day.items.join(", ")}
                onChange={(e) => {
                  const next = [...form.whats_inside];
                  next[index] = {
                    ...day,
                    items: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
                  };
                  set("whats_inside", next);
                }}
              />
              {form.whats_inside.length > 1 && (
                <button
                  type="button"
                  className="mt-3 text-xs text-muted underline"
                  onClick={() =>
                    set("whats_inside", form.whats_inside.filter((_, i) => i !== index))
                  }
                >
                  Remove this day
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-white p-6">
        <h2 className="text-lg">SEO & details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">SEO title</span>
            <input className="field" value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">SEO description</span>
            <input className="field" value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Delivery info</span>
            <input className="field" value={form.delivery_info} onChange={(e) => set("delivery_info", e.target.value)} />
          </label>
          <label className="block">
            <span className="field-label">Customisation</span>
            <input className="field" value={form.customisation} onChange={(e) => set("customisation", e.target.value)} />
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saving…" : product ? "Save changes" : "Create product"}
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
