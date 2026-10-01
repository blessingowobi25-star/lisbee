import { cookies } from "next/headers";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import type { User } from "@/lib/types";

const COOKIE = "lisbee_session";
const g = globalThis as unknown as { __lisbeeSecret?: string };

/**
 * Session secret. Set AUTH_SECRET in production; a per-installation secret is
 * generated and stored in .data for local development.
 */
function secret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (!g.__lisbeeSecret) {
    try {
      const file = path.join(process.cwd(), ".data", "auth-secret");
      try {
        g.__lisbeeSecret = fs.readFileSync(file, "utf8").trim();
      } catch {
        g.__lisbeeSecret = crypto.randomBytes(32).toString("hex");
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, g.__lisbeeSecret, { mode: 0o600 });
      }
    } catch {
      g.__lisbeeSecret = crypto.randomBytes(32).toString("hex");
    }
  }
  return g.__lisbeeSecret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export type SessionPayload = { uid: string; exp: number };

export async function createSession(userId: string): Promise<void> {
  const payload: SessionPayload = { uid: userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const token = `${body}.${sign(body)}`;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.INSECURE_HTTP,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return await db().getUserById(payload.uid);
  } catch {
    return null;
  }
}

/** For API routes: returns the user or null. */
export async function requireUser(): Promise<User | null> {
  return getSessionUser();
}

/** For admin API routes: returns { user } or an error response body. */
export async function requireAdmin(): Promise<
  { user: User; error: null } | { user: null; error: string; status: number }
> {
  const user = await getSessionUser();
  if (!user) return { user: null, error: "Not signed in", status: 401 };
  if (user.role !== "admin") return { user: null, error: "Admin access required", status: 403 };
  return { user, error: null };
}
