import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { supabaseAuthConfigured, supabaseServer } from "@/lib/auth/supabase";
import { clean } from "@/lib/validation";

export const runtime = "nodejs";

/** OAuth callback: exchanges the code, mirrors the user, starts a session. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";
  const next = clean(url.searchParams.get("next"), 200);
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (!supabaseAuthConfigured() || !code) {
    return NextResponse.redirect(new URL("/sign-in?error=google-failed", request.url));
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/sign-in?error=google-failed", request.url));
  }

  const email = (data.user.email ?? "").toLowerCase();
  if (!email) {
    return NextResponse.redirect(new URL("/sign-in?error=no-email", request.url));
  }

  const existing = await db().getUserByEmail(email);
  const user = existing
    ? await db().updateUser(existing.id, {
        name: data.user.user_metadata?.full_name ?? existing.name,
        avatar_url: data.user.user_metadata?.avatar_url ?? existing.avatar_url,
        provider: "google",
      })
    : await db().createUser({
        id: data.user.id,
        name: (data.user.user_metadata?.full_name as string) ?? email.split("@")[0],
        email,
        role: "customer",
        provider: "google",
        avatar_url: (data.user.user_metadata?.avatar_url as string) ?? undefined,
      });

  if (user) await createSession(user.id);
  return NextResponse.redirect(new URL(destination, request.url));
}
