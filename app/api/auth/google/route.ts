import { NextResponse } from "next/server";
import { supabaseAuthConfigured, supabaseServer } from "@/lib/auth/supabase";
import { baseUrlFrom } from "@/lib/email";

export const runtime = "nodejs";

/** Start the Google OAuth flow (only when Supabase is configured). */
export async function GET(request: Request): Promise<Response> {
  if (!supabaseAuthConfigured()) {
    return NextResponse.redirect(new URL("/sign-in?error=google-unavailable", request.url));
  }

  const supabase = await supabaseServer();
  const redirectTo = `${baseUrlFrom(request.headers)}/api/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { access_type: "offline", prompt: "consent" } },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL("/sign-in?error=google-failed", request.url),
    );
  }
  return NextResponse.redirect(data.url);
}
