/** Matches the ceiling the cart table and checkout already enforce. */
export const MAX_QTY_PER_LINE = 20;

/** Parses a JSON body without letting a malformed request throw a 500. */
export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
