"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Faq, Taxonomy, TaxonomyKind } from "@/lib/types";

const KIND_LABEL: Record<TaxonomyKind, string> = {
  category: "Collections",
  occasion: "Occasions",
  recipient: "Recipients",
};

async function post(body: Record<string, unknown>, method = "POST") {
  return fetch("/api/admin/content", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function TaxonomyManager({ taxonomies }: { taxonomies: Taxonomy[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<TaxonomyKind>("category");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const visible = taxonomies.filter((t) => t.kind === kind);

  const add = async () => {
    if (name.trim().length < 2) return;
    setBusy(true);
    const res = await post({
      kind: "taxonomy",
      taxonomy_kind: kind,
      name,
      display_order: visible.length,
    });
    setBusy(false);
    if (res.ok) {
      setName("");
      setMessage("Added");
      router.refresh();
    } else {
      setMessage("Could not add — check the name");
    }
  };

  const toggleNav = async (taxonomy: Taxonomy) => {
    await post({
      kind: "taxonomy",
      id: taxonomy.id,
      taxonomy_kind: taxonomy.kind,
      name: taxonomy.name,
      slug: taxonomy.slug,
      description: taxonomy.description,
      image: taxonomy.image,
      show_in_nav: !taxonomy.show_in_nav,
      display_order: taxonomy.display_order,
      coming_soon: taxonomy.coming_soon,
    });
    router.refresh();
  };

  const remove = async (taxonomy: Taxonomy) => {
    if (!window.confirm(`Delete “${taxonomy.name}”?`)) return;
    await post({ kind: "taxonomy", id: taxonomy.id }, "DELETE");
    router.refresh();
  };

  return (
    <section className="rounded-3xl border border-line bg-white p-6">
      <h2 className="text-xl">Collections, occasions & recipients</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(KIND_LABEL) as TaxonomyKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              kind === k ? "border-espresso bg-espresso text-cream" : "border-line hover:bg-sand"
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <ul className="mt-5 divide-y divide-line">
        {visible.map((taxonomy) => (
          <li key={taxonomy.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-44">
              <div className="font-medium">{taxonomy.name}</div>
              <div className="text-xs text-muted">/{taxonomy.slug}</div>
            </div>
            {taxonomy.coming_soon && (
              <span className="pill bg-sand text-cocoa text-[11px]">soon</span>
            )}
            <label className="ml-auto flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                className="h-4 w-4 accent-espresso"
                checked={taxonomy.show_in_nav}
                onChange={() => toggleNav(taxonomy)}
              />
              In nav
            </label>
            <button
              type="button"
              onClick={() => remove(taxonomy)}
              className="text-xs text-muted underline hover:text-red-700"

            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          className="field max-w-xs"
          placeholder={`New ${KIND_LABEL[kind].toLowerCase().replace(/s$/, "")} name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="button" onClick={add} disabled={busy} className="btn btn-outline btn-sm">
          {busy ? "Adding…" : "Add"}
        </button>
        {message && <span className="text-xs text-muted">{message}</span>}
      </div>
    </section>
  );
}


export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState(faqs[0]?.category ?? "General");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { question: string; answer: string }>>({});

  const categories = Array.from(new Set(faqs.map((f) => f.category)));

  const add = async () => {
    if (question.trim().length < 5 || answer.trim().length < 5) return;
    setBusy(true);
    const res = await post({
      kind: "faq",
      question,
      answer,
      category,
      display_order: faqs.length,
    });
    setBusy(false);
    if (res.ok) {
      setQuestion("");
      setAnswer("");
      router.refresh();
    }
  };

  const save = async (faq: Faq) => {
    const draft = drafts[faq.id];
    await post({ kind: "faq", ...faq, ...(draft ?? {}) });
    setEditing(null);
    router.refresh();
  };

  const remove = async (faq: Faq) => {
    if (!window.confirm("Delete this FAQ?")) return;
    await post({ kind: "faq", id: faq.id }, "DELETE");
    router.refresh();
  };

  return (
    <section className="rounded-3xl border border-line bg-white p-6">
      <h2 className="text-xl">FAQs</h2>
      <p className="mt-1 text-sm text-muted">These appear on the /faq page, grouped by category.</p>

      <ul className="mt-5 space-y-3">
        {faqs.map((faq) => {
          const draft = drafts[faq.id];
          return (
            <li key={faq.id} className="rounded-2xl border border-line bg-ivory px-4 py-3">
              {editing === faq.id ? (
                <div className="space-y-2">
                  <input
                    className="field"
                    value={draft?.question ?? faq.question}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [faq.id]: {
                          question: e.target.value,
                          answer: prev[faq.id]?.answer ?? faq.answer,
                        },
                      }))
                    }
                  />
                  <textarea
                    rows={3}
                    className="field"
                    value={draft?.answer ?? faq.answer}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [faq.id]: {
                          question: prev[faq.id]?.question ?? faq.question,
                          answer: e.target.value,
                        },
                      }))
                    }
                  />
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => save(faq)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-muted underline"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-56 flex-1">
                    <div className="font-medium">{faq.question}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{faq.answer}</p>
                    <span className="mt-2 inline-block pill bg-white text-cocoa text-[11px]">
                      {faq.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(faq.id)}
                    className="text-xs text-honey-deep hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(faq)}
                    className="text-xs text-muted underline hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 space-y-3">
        <input
          className="field"
          placeholder="Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <textarea
          rows={3}
          className="field"
          placeholder="Answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="field max-w-[200px]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="button" onClick={add} disabled={busy} className="btn btn-outline btn-sm">
            {busy ? "Adding…" : "Add FAQ"}
          </button>
        </div>
      </div>
    </section>
  );
}
