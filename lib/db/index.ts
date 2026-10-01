import { localStore } from "./local";
import { supabaseStore } from "./supabase";
import type { SiteSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "./seed";

/** The data layer every server module talks to. */
export type DataStore = typeof localStore;

let remote: DataStore | null = null;

/**
 * The data layer every server module talks to.
 *
 * Supabase is used only when a URL AND a service-role key are present. The
 * anon/publishable key is never enough: the adapter performs privileged
 * writes, so a missing service-role key means the app stays on the local file
 * store (fully functional for development, not for production).
 */
export function supabaseUrl(): string | null {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || null;
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let warned = false;

/** Warns once if a project is half-configured, so nobody ships on the local store by accident. */
function warnIfHalfConfigured(): void {
  if (warned) return;
  if (!supabaseUrl() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  warned = true;
  console.warn(
    "[lisbee] Supabase URL and anon key are set but SUPABASE_SERVICE_ROLE_KEY is not — " +
      "running on the local file store (.data/db.json). Orders will not persist across " +
      "deploys until the service-role key is added.",
  );
}

export function db(): DataStore {
  if (supabaseConfigured()) {
    if (!remote) remote = supabaseStore();
    return remote;
  }
  warnIfHalfConfigured();
  return localStore;
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await db().getSettings();
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export { DEFAULT_SETTINGS };
