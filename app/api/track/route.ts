import fs from "node:fs";
import path from "node:path";
import { jsonError, rateLimit, clientKey, toInt } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * First-party analytics sink. Events are appended to .data/analytics.jsonl so
 * the funnel can be verified locally. No cookies, no cross-site tracking and no
 * personal data — only the event name and the params the UI already sends.
 */
export async function POST(request: Request): Promise<Response> {
  if (!rateLimit(clientKey(request, "track"), 120, 60_000)) {
    return jsonError("Too many events", 429);
  }

  let body: { event?: unknown; params?: unknown; t?: unknown };
  try {
    body = (await request.json()) as { event?: unknown; params?: unknown; t?: unknown };
  } catch {
    return jsonError("Invalid request", 400);
  }

  const event = typeof body.event === "string" ? body.event.slice(0, 60) : "";
  if (!event) return jsonError("Missing event", 422);

  const entry = {
    event,
    params: body.params && typeof body.params === "object" ? body.params : {},
    at: new Date().toISOString(),
    client_t: toInt(body.t, 0, Number.MAX_SAFE_INTEGER) ?? null,
  };

  try {
    const dir = path.join(process.cwd(), ".data");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, "analytics.jsonl"),
      `${JSON.stringify(entry)}\n`,
      "utf8",
    );
  } catch {
    /* analytics must never break the UI */
  }

  return Response.json({ ok: true }, { status: 202 });
}
