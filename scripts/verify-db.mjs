/**
 * Connects to your real Supabase database and reports what is inside it.
 *
 *   node scripts/verify-db.mjs
 *
 * Reads .env.local directly and NEVER prints any key, token or password.
 * Prints row counts and public catalogue data only, so the output is safe to
 * paste into a chat or a screenshot.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error(".env.local not found. Fill it in before running this.");
  process.exit(1);
}

// Minimal .env parser so we do not need an extra dependency.
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    })
    .filter(([key]) => key),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

const report = (ok, label, extra = "") =>
  console.log(`${ok ? "OK  " : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);

console.log("\n=== 1. Credentials ===");
report(Boolean(url), "Project URL present", url ? url.replace(/\/\/.*\./, "//<project>.") : "missing");
report(Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY), "Publishable/anon key present");
report(Boolean(key), "Secret/service_role key present");

if (!url || !key) {
  console.log("\nCannot continue without the URL and secret key.\n");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

console.log("\n=== 2. Can we connect? ===");
const probe = await db.from("products").select("id").limit(1);
if (probe.error) {
  report(false, "Connection to database", probe.error.message);
  console.log("\nIf this says 'relation does not exist', run the SQL setup again.\n");
  process.exit(1);
}
report(true, "Connected to Supabase");

console.log("\n=== 3. Do the tables exist? ===");
const TABLES = [
  "users", "products", "orders", "recipients", "order_items", "taxonomies",
  "corporate_enquiries", "delivery_zones", "faqs", "pages", "site_settings", "email_log",
];
for (const table of TABLES) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  report(!error, table.padEnd(20), error ? error.message : `${count} row${count === 1 ? "" : "s"}`);
}

console.log("\n=== 4. Is the catalogue correct? ===");
const { data: products } = await db
  .from("products")
  .select("name, slug, price, status, stock_status, featured, cost_product")
  .order("price");
for (const p of products ?? []) {
  console.log(
    `      ${p.name.padEnd(20)} ${p.slug.padEnd(24)} N${p.price.toLocaleString()}  ${p.status}  ${p.stock_status}${p.featured ? "  featured" : ""}${p.cost_product === null ? "  (costs not set)" : ""}`,
  );
}
report((products?.length ?? 0) === 3, "Exactly 3 products", `found ${products?.length ?? 0}`);

console.log("\n=== 5. Settings and delivery ===");
const { data: settings } = await db.from("site_settings").select("data").eq("id", 1).maybeSingle();
if (settings?.data) {
  const d = settings.data;
  console.log(`      brand       : ${d.brand_name}`);
  console.log(`      email       : ${d.email}`);
  console.log(`      whatsapp    : ${d.whatsapp_number}`);
  console.log(`      cities      : ${(d.delivery_cities ?? []).join(", ")}`);
  console.log(`      bank details: ${d.bank?.account_number ? "SET" : "still blank (fine for now)"}`);
}
const { data: zones } = await db.from("delivery_zones").select("city, fee, active");
for (const z of zones ?? []) {
  console.log(`      zone: ${z.city.padEnd(8)} fee=${z.fee === null ? "not set yet" : z.fee}  active=${z.active}`);
}
const { data: admin } = await db.from("users").select("email, role").eq("role", "admin");
console.log(`      admin user  : ${admin?.[0]?.email ?? "NONE — this is a problem"}`);

console.log("\n=== 6. Content ===");
const { count: faqCount } = await db.from("faqs").select("*", { count: "exact", head: true });
const { data: pages } = await db.from("pages").select("slug");
const { count: taxCount } = await db.from("taxonomies").select("*", { count: "exact", head: true });
console.log(`      FAQs: ${faqCount}   policy pages: ${(pages ?? []).map((p) => p.slug).join(", ")}   menu items: ${taxCount}`);
console.log("");
