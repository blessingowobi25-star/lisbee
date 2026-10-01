/**
 * Server-side input validation helpers.
 * Every field that reaches the database or an email goes through these, so the
 * API never trusts what the browser sent.
 */
import crypto from "node:crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function clean(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function cleanMultiline(value: unknown, maxLength = 4000): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value) && value.length <= 254;
}

/** Nigerian numbers: 0803… / +234803… / 234803… — digits only after cleaning. */
export function normalisePhone(value: string): string | null {
  const digits = value.replace(/[^\d+]/g, "");
  if (!digits) return null;
  const local = digits.replace(/^\+?234/, "0");
  if (!/^0[789]\d{9}$/.test(local) && !/^\d{11}$/.test(local)) return null;
  return local;
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

export function toInt(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  if (int < min || int > max) return null;
  return int;
}

/**
 * Constant-time string comparison. Used for shared secrets so a wrong value
 * cannot be discovered by measuring how long the check took.
 */
export function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Fixed-window in-memory rate limit (per process) to stop form spam. */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientKey(request: Request, suffix = ""): string {
  const headers = request.headers;
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "local";
  return `${ip}:${suffix}`;
}

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
