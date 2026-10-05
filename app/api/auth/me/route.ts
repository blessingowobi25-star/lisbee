import { getRequestUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Who am I?
 *
 * Lets the app confirm a stored token is still valid on launch. It also tells
 * the app WHICH account it is signed in as, which is what makes it obvious the
 * phone and the website resolved to the same user.
 */
export async function GET(request: Request): Promise<Response> {
  const user = await getRequestUser(request);
  if (!user) return jsonError("Not signed in", 401);
  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
