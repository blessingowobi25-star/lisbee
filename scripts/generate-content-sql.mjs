/**
 * Generates supabase/migrations/0005_content.sql from the canonical local seed.
 *
 * The FAQ and policy copy is long-form prose. Rather than transcribe it into SQL by
 * hand (and risk silent typos in legal text), this reads the same data the app
 * already ships with and emits an idempotent migration.
 *
 *   node scripts/generate-content-sql.mjs
 *
 * Run `npm run dev` once first if .data/db.json does not exist yet — the local
 * store builds itself from lib/db/seed.ts on first request.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(root, ".data", "db.json");
const outFile = path.join(root, "supabase", "migrations", "0005_content.sql");

if (!fs.existsSync(dbFile)) {
  console.error(
    `.data/db.json not found.\nRun "npm run dev" once and load the homepage, then re-run this script.`,
  );
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbFile, "utf8"));

/** SQL single-quoted literal: double any apostrophes. */
const lit = (value) => `'${String(value ?? "").replace(/'/g, "''")}'`;

const header = `-- ===========================================================================
-- LisBee — FAQ and policy content
--
-- GENERATED FILE. Do not hand-edit.
-- Regenerate with:  node scripts/generate-content-sql.mjs
--
-- Source of truth is lib/db/seed.ts. This exists so the /faq page and the four
-- policy routes are not empty on a fresh database. Both tables are editable in
-- Admin -> Content & delivery, and re-running this file restores the defaults.
--
-- Safe to run more than once: every insert is an upsert.
-- ===========================================================================

`;

const faqRows = db.faqs
  .map(
    (faq) =>
      `  (${lit(faq.id)}, ${lit(faq.category)}, ${lit(faq.question)}, ${lit(faq.answer)}, ${Number(faq.display_order) || 0})`,
  )
  .join(",\n");

const pageRows = db.pages
  .map((page) => `  (${lit(page.slug)}, ${lit(page.title)}, ${lit(page.body)})`)
  .join(",\n");

const sql = `${header}
-- ------------------------------------------------------------------- faqs
insert into public.faqs (id, category, question, answer, display_order)
values
${faqRows}
on conflict (id) do update
set category = excluded.category,
    question = excluded.question,
    answer = excluded.answer,
    display_order = excluded.display_order;

-- ----------------------------------------------------------- policy pages
insert into public.pages (slug, title, body)
values
${pageRows}
on conflict (slug) do update
set title = excluded.title,
    body = excluded.body,
    updated_at = now();

-- ================================================================ verify
select slug, title, length(body) as body_chars from public.pages order by slug;
select category, count(*) from public.faqs group by category order by category;
`;

fs.writeFileSync(outFile, sql, "utf8");
console.log(
  `Wrote ${path.relative(root, outFile)} — ${db.faqs.length} FAQs, ${db.pages.length} pages.`,
);
