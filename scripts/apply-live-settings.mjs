/**
 * Applies settings through the LIVE site's own admin API, using the admin
 * session cookie. This is the same path the admin dashboard uses, so it also
 * proves authentication and the settings endpoint work in production.
 *
 *   node scripts/apply-live-settings.mjs
 *
 * Reads secrets from .env.local and never prints them.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const SITE = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
const CURRENT_ADMIN = "admin@hellolisbee.com";
const NEW_ADMIN = "hellolisbee@gmail.com";

async function signIn(email, code) {
  const res = await fetch(`${SITE}/api/auth/email`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "LisBee Admin", email, admin_code: code, next: "/admin" }),
  });
  if (!res.ok) throw new Error(`sign-in failed: HTTP ${res.status} ${await res.text()}`);
  return res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
}

console.log("1. Signing in as the current admin address...");
const cookie = await signIn(CURRENT_ADMIN, env.ADMIN_ACCESS_CODE);
console.log("   session established");

console.log("\n2. Saving bank details through /api/admin/settings");
const res = await fetch(`${SITE}/api/admin/settings`, {
  method: "PATCH",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({
    bank: {
      bank_name: "First Bank of Nigeria",
      account_name: "Blessing Owobi",
      account_number: "3145766710",
    },
  }),
});
const saved = await res.json();
if (!res.ok) throw new Error(`settings failed: ${JSON.stringify(saved)}`);
console.log(`   HTTP ${res.status}`);
console.log(`   bank name : ${saved.settings.bank.bank_name}`);
console.log(`   account   : ${saved.settings.bank.account_name}`);
console.log(`   number    : ${saved.settings.bank.account_number}`);

console.log("\n3. Moving the admin account to your Gmail address");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data: existing } = await db
  .from("users")
  .select("id, email, role")
  .eq("email", NEW_ADMIN)
  .maybeSingle();

if (existing) {
  await db.from("users").update({ role: "admin" }).eq("id", existing.id);
  await db.from("users").delete().eq("email", CURRENT_ADMIN);
  console.log(`   ${NEW_ADMIN} already existed -> promoted to admin, old row removed`);
} else {
  const { data: moved, error } = await db
    .from("users")
    .update({ email: NEW_ADMIN })
    .eq("email", CURRENT_ADMIN)
    .select("email, role")
    .single();
  if (error) throw new Error(error.message);
  console.log(`   admin is now ${moved.email} (${moved.role})`);
}

console.log("\n4. Signing in with the new address to confirm it works");
const cookie2 = await signIn(NEW_ADMIN, env.ADMIN_ACCESS_CODE);
const check = await fetch(`${SITE}/admin`, { headers: { cookie: cookie2 }, redirect: "manual" });
console.log(`   /admin responds: ${check.status} ${check.status === 200 ? "(signed in)" : "(NOT signed in)"}`);
console.log("\nDone.");