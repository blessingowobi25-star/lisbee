import { NextResponse } from "next/server";
import { supabaseAuthConfigured, supabaseServer } from "@/lib/auth/supabase";

export const runtime = "nodejs";

/**
 * The origin the visitor is actually on.
 *
 * OAuth must come back to the same host that started the flow. Using
 * NEXT_PUBLIC_SITE_URL here would send a localhost developer back to the
 * production domain, and would send a preview deployment to production too.
 */
function originOf(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

/** Start the Google OAuth flow (only when Supabase is configured). */
export async function GET(request: Request): Promise<Response> {
  if (!supabaseAuthConfigured()) {
    return NextResponse.redirect(new URL("/sign-in?error=google-unavailable", request.url));
  }

  const supabase = await supabaseServer();
  const redirectTo = `${originOf(request)}/api/auth/callback`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // No prompt=consent: that would force returning customers to re-approve
    // every single sign-in instead of just being signed in.
    options: { redirectTo, queryParams: { access_type: "offline" } },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/sign-in?error=google-failed", request.url));
  }
  return NextResponse.redirect(data.url);
}
