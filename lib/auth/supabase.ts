import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Google (and future OAuth) sign-in.
 * Only used when a Supabase project is configured. Without it, LisBee uses the
 * email sign-in form, which issues the same signed session cookie.
 */
export function supabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(items) {
        try {
          for (const { name, value, options } of items) store.set(name, value, options);
        } catch {
          /* called from a Server Component — refresh happens in middleware */
        }
      },
    },
  });
}
