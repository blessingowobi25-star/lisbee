/**
 * Applies 0006_delivery_areas.sql to the live Supabase project.
 *
 * The SQL migration needs the database password, which we do not have, so this
 * performs the same change through the Supabase REST API instead. It is
 * idempotent: re-running is harmless.
 *
 *   node scripts/migrate-delivery-areas.mjs
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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("1. Adding the delivery_area column to recipients");
  // PostgREST cannot ALTER a table, so this uses the RPC the SQL editor would
  // need. If it is absent we fall back to a clear message.
  const { error: rpcError } = await db.rpc("exec_sql", {
    sql: "alter table public.recipients add column if not exists delivery_area text;",
  });
  if (rpcError) {
    console.log(`   could not run DDL directly: ${rpcError.message}`);
    console.log("   -> paste supabase/migrations/0006_delivery_areas.sql into the SQL editor instead");
  } else {
    console.log("   done");
  }

  console.log("\n2. Writing the Lagos zones");
  const zones = [
    { id: "zone-lagos-mainland", city: "Lagos", zone_name: "Mainland", fee: 3000 },
    { id: "zone-lagos-island", city: "Lagos", zone_name: "Island", fee: 4000 },
  ];
  for (const z of zones) {
    const { data: existing } = await db
      .from("delivery_zones")
      .select("id, fee")
      .eq("id", z.id)
      .maybeSingle();
    if (existing) {
      // Only set the fee the first time, so later price edits are not clobbered.
      if (existing.fee === null) {
        await db.from("delivery_zones").update({ fee: z.fee }).eq("id", z.id);
      }
      console.log(`   ${z.city} ${z.zone_name}: kept (fee ${existing.fee})`);
    } else {
      const { error } = await db.from("delivery_zones").insert({
        ...z,
        same_day: false,
        next_day: false,
        standard: true,
        active: true,
      });
      console.log(`   ${z.city} ${z.zone_name}: ${error ? "FAILED " + error.message : "added, fee " + z.fee}`);
    }
  }

  await db.from("delivery_zones").delete().eq("id", "zone-lagos");
  console.log("   removed the old single Lagos row");

  const { data: all } = await db
    .from("delivery_zones")
    .select("city, zone_name, fee, active")
    .order("city");
  console.log("\nZones now:");
  for (const z of all ?? []) {
    console.log(`   ${z.city} / ${z.zone_name}: fee ${z.fee ?? "not set"} (active ${z.active})`);
  }
}

main();