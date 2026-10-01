"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { PRICE_RANGES } from "@/lib/format";

interface ToolbarProps {
  occasions: { name: string; slug: string }[];
  recipients: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
  sort: string;
  q: string;
}

/** Client-side filter bar; every change writes to the URL so results are shareable. */
export function ShopToolbar({ occasions, recipients, categories, sort, q }: ToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(q);
  const [lastQ, setLastQ] = useState(q);

  // Keep the input in step with the URL without an extra render pass.
  if (q !== lastQ) {
    setLastQ(q);
    setQuery(q);
  }

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}${next.toString() ? `?${next.toString()}` : ""}`);
  };

  const current = (key: string) => params.get(key) ?? "";

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update("q", query.trim() || null);
          update("page", null);
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gifts, boxes, occasions…"
          className="field flex-1"
          aria-label="Search products"
        />
        <button type="submit" className="btn btn-primary btn-sm px-5">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <select
          className="field w-auto min-w-40 text-sm"
          value={current("category")}
          onChange={(e) => update("category", e.target.value || null)}
          aria-label="Filter by collection"
        >
          <option value="">All collections</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="field w-auto min-w-40 text-sm"
          value={current("occasion")}
          onChange={(e) => update("occasion", e.target.value || null)}
          aria-label="Filter by occasion"
        >
          <option value="">All occasions</option>
          {occasions.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.name}
            </option>
          ))}
        </select>

        <select
          className="field w-auto min-w-40 text-sm"
          value={current("recipient")}
          onChange={(e) => update("recipient", e.target.value || null)}
          aria-label="Filter by recipient"
        >
          <option value="">All recipients</option>
          {recipients.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          className="field w-auto min-w-40 text-sm"
          value={current("price")}
          onChange={(e) => update("price", e.target.value || null)}
          aria-label="Filter by price"
        >
          <option value="">Any price</option>
          {PRICE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          className="field w-auto min-w-40 text-sm"
          value={sort || current("sort") || "featured"}
          onChange={(e) => update("sort", e.target.value === "featured" ? null : e.target.value)}
          aria-label="Sort products"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
        </select>

        {(params.get("category") ||
          params.get("occasion") ||
          params.get("recipient") ||
          params.get("price") ||
          params.get("q")) && (
          <button
            type="button"
            onClick={() => router.push(pathname)}
            className="btn btn-sm btn-outline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
