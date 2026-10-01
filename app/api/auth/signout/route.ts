import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { supabaseAuthConfigured, supabaseServer } from "@/lib/auth/supabase";

export const runtime = "nodejs";

/** Sign out: clears the LisBee session and the Supabase session (if any). */
export async function POST(request: Request): Promise<Response> {
  if (supabaseAuthConfigured()) {
    try {
      const supabase = await supabaseServer();
      await supabase.auth.signOut();
    } catch {
      /* local session is cleared regardless */
    }
  }
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
