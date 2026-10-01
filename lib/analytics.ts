/**
 * Analytics helpers.
 * Events are pushed to window.dataLayer (Google Tag Manager / GA4) when
 * configured, mirrored to Meta Pixel when configured, and always logged
 * server-side to .data/analytics.jsonl for local verification.
 * No fake data, no PII.
 */

export type AnalyticsEvent =
  | "view_item"
  | "add_to_cart"
  | "view_cart"
  | "begin_checkout"
  | "purchase"
  | "whatsapp_click"
  | "corporate_enquiry"
  | "sign_up"
  | "google_login"
  | "search";

type DataLayer = Array<Record<string, unknown>>;

declare global {
  interface Window {
    dataLayer?: DataLayer;
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(
  event: AnalyticsEvent,
  params: Record<string, unknown> = {},
): void {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event, ...params });
    if (window.fbq) {
      const pixelEvent =
        event === "purchase"
          ? "Purchase"
          : event === "add_to_cart"
            ? "AddToCart"
            : event === "begin_checkout"
              ? "InitiateCheckout"
              : event === "view_item"
                ? "ViewContent"
                : "CustomEvent";
      try {
        window.fbq("track", pixelEvent, params);
      } catch {
        /* pixel not loaded */
      }
    }
  }
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, params, t: Date.now() }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* never break the UI for analytics */
  }
}
