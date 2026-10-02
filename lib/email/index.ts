import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db, getSettings } from "@/lib/db";
import type { CorporateEnquiry, Order, OrderStatus } from "@/lib/types";
import {
  adminEnquiryEmail,
  adminNewOrderEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  paymentReceivedEmail,
  paymentReminderEmail,
} from "./templates";

/**
 * Transactional email delivery.
 * Uses Mailgun when MAILGUN_API_KEY + MAILGUN_DOMAIN are configured.
 * Otherwise the message is written to a local outbox (.data/outbox) and
 * recorded in the email log, so every trigger stays verifiable in dev.
 */

function outboxDir(): string {
  const dir = path.join(process.cwd(), ".data", "outbox");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* read-only */
  }
  return dir;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  template: string;
}): Promise<"sent" | "logged" | "failed"> {
  const { to, subject, html, template } = opts;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(outboxDir(), `${stamp}-${template}.html`);
  try {
    fs.writeFileSync(file, html, "utf8");
  } catch {
    /* ignore */
  }

  let provider: "mailgun" | "outbox" = "outbox";
  let status: "sent" | "logged" | "failed" = "logged";

  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const settings = await getSettings();

  if (apiKey && domain) {
    provider = "mailgun";
    try {
      const endpoint = `https://api.mailgun.net/v3/${domain}/messages`;

      // Mailgun rejects any "from" address that is not on the sending domain.
      // Falling back automatically avoids a silent failure where every email
      // is quietly rejected because the configured sender lives elsewhere.
      const configured = (settings.from_email || "").toLowerCase();
      const onSendingDomain = configured.endsWith(`@${domain.toLowerCase()}`);
      const from = onSendingDomain
        ? `${settings.from_name} <${settings.from_email}>`
        : `${settings.from_name} <orders@${domain}>`;

      const body = new URLSearchParams({ from, to, subject, html });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      });

      if (res.ok) {
        status = "sent";
      } else {
        status = "failed";
        // Keep the reason. Without this a misconfigured sender looks identical
        // to a working one until a customer complains they got nothing.
        const detail = await res.text().catch(() => "");
        console.error(
          `[email] Mailgun rejected "${template}" to ${to} (HTTP ${res.status}): ${detail.slice(0, 400)}`,
        );
      }
    } catch (error) {
      status = "failed";
      console.error(`[email] Mailgun request failed for "${template}":`, error);
    }
  }

  try {
    await db().logEmail({
      id: crypto.randomUUID(),
      to,
      subject,
      template,
      provider,
      status,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* logging must never break checkout */
  }
  return status;
}

export function baseUrlFrom(headers: Headers): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const origin = headers.get("origin");
  if (origin) return origin;
  const host = headers.get("host");
  if (host) return `${headers.get("x-forwarded-proto") ?? "http"}://${host}`;
  return "http://localhost:3000";
}

/**
 * Runs an email task and swallows failures, but RETURNS the promise.
 *
 * Callers must await this. A "fire and forget" send is fine on a long-running
 * server, but on serverless hosting the function is frozen the moment the HTTP
 * response is returned, so an in-flight email never completes and the customer
 * silently receives nothing.
 */
function safe(promiseFactory: () => Promise<unknown>): Promise<void> {
  return promiseFactory().then(
    () => undefined,
    (error) => {
      console.error("[email]", error);
    },
  );
}

export function sendOrderConfirmation(order: Order, baseUrl: string): Promise<void> {
  return safe(async () => {
    const settings = await getSettings();
    const items = await db().listOrderItems(order.id);
    const { subject, html } = orderConfirmationEmail(order, items, settings, baseUrl);
    await sendEmail({ to: order.customer_email, subject, html, template: "order-confirmation" });
    const admin = adminNewOrderEmail(order, items, settings, baseUrl);
    await sendEmail({ to: settings.email, subject: admin.subject, html: admin.html, template: "admin-new-order" });
  });
}

export function sendPaymentReceived(order: Order, baseUrl: string): Promise<void> {
  return safe(async () => {
    const settings = await getSettings();
    const { subject, html } = paymentReceivedEmail(order, settings, baseUrl);
    await sendEmail({ to: order.customer_email, subject, html, template: "payment-received" });
    await sendEmail({ to: settings.email, subject, html, template: "admin-payment-confirmed" });
  });
}

const STATUS_TEMPLATE: Partial<Record<OrderStatus, "preparing" | "ready" | "dispatched" | "delivered">> = {
  preparing: "preparing",
  ready: "ready",
  dispatched: "dispatched",
  delivered: "delivered",
};

export function sendOrderStatusUpdate(
  order: Order,
  status: OrderStatus,
  baseUrl: string,
): Promise<void> {
  const key = STATUS_TEMPLATE[status];
  if (!key) return Promise.resolve();
  return safe(async () => {
    const settings = await getSettings();
    const { subject, html } = orderStatusEmail(order, key, settings, baseUrl);
    await sendEmail({ to: order.customer_email, subject, html, template: `order-${key}` });
  });
}

export function sendPaymentReminder(order: Order, baseUrl: string): Promise<void> {
  return safe(async () => {
    const settings = await getSettings();
    const { subject, html } = paymentReminderEmail(order, settings, baseUrl);
    await sendEmail({ to: order.customer_email, subject, html, template: "payment-reminder" });
  });
}

export function notifyAdminOfEnquiry(
  enquiry: CorporateEnquiry,
  baseUrl: string,
): Promise<void> {
  return safe(async () => {
    const settings = await getSettings();
    const { subject, html } = adminEnquiryEmail(enquiry, settings, baseUrl);
    await sendEmail({ to: settings.email, subject, html, template: "admin-corporate-enquiry" });
    await sendEmail({ to: enquiry.work_email, subject: "We've received your enquiry — LisBee", html, template: "enquiry-receipt" });
  });
}
