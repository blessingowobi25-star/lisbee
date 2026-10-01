import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the Supabase session fresh when Google sign-in is configured.
 * Without Supabase this is a no-op and the app uses its own signed cookie.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  const { createServerClient } = await import("@supabase/ssr");
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        for (const { name, value } of items) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of items) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() revalidates the JWT; getSession() alone trusts the cookie.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
