import type { CorporateEnquiry, Order, OrderItem, SiteSettings } from "@/lib/types";
import { formatNaira } from "@/lib/format";

/**
 * LisBee transactional email templates.
 * Kept intentionally simple: one shared brand shell, plain human copy.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#4a3f38;">${escapeHtml(text)}</p>`;
}

function box(content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;border:1px solid #e7dcd0;border-radius:16px;margin:0 0 18px;"><tr><td style="padding:20px 22px;">${content}</td></tr></table>`;
}

function kv(rows: [string, string][]): string {
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#6e5c50;">${escapeHtml(k)}</td>` +
        `<td style="padding:6px 0;font-size:14px;color:#241109;text-align:right;font-weight:600;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
}

export function emailShell(opts: {
  title: string;
  intro: string;
  body: string;
  settings: SiteSettings;
  baseUrl: string;
}): string {
  const { title, intro, body, settings, baseUrl } = opts;
  const wa = settings.whatsapp_number.replace(/\D/g, "").replace(/^0/, "234");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1e9de;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1e9de;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fbf7f1;border-radius:20px;overflow:hidden;border:1px solid #e7dcd0;">
        <tr><td style="background:#241109;padding:26px 30px;text-align:center;">
          <div style="font-size:24px;color:#c39a5e;letter-spacing:.04em;">Hello <strong style="color:#f6efe6;">LisBee</strong></div>
          <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#c39a5e;margin-top:6px;">${escapeHtml(settings.tagline)}</div>
        </td></tr>
        <tr><td style="padding:30px 30px 10px;">
          <h1 style="margin:0 0 14px;font-size:22px;color:#241109;font-weight:600;">${escapeHtml(title)}</h1>
          ${intro ? paragraph(intro) : ""}
          ${body}
        </td></tr>
        <tr><td style="padding:14px 30px 30px;">
          <p style="font-size:13px;color:#6e5c50;margin:0 0 6px;">Questions? Message us on WhatsApp <a href="https://wa.me/${wa}" style="color:#a87b3f;">${escapeHtml(settings.whatsapp_number)}</a> or reply to this email.</p>
          <p style="font-size:13px;color:#6e5c50;margin:0;">LisBee &middot; <a href="${baseUrl}" style="color:#a87b3f;">hellolisbee.com</a> &middot; ${escapeHtml(settings.email)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function orderItemsHtml(items: OrderItem[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:7px 0;font-size:14px;color:#241109;">${escapeHtml(i.name)} <span style="color:#6e5c50;">&times; ${i.quantity}</span></td>` +
        `<td style="padding:7px 0;font-size:14px;color:#241109;text-align:right;">${formatNaira(i.total)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

export function orderSummaryRows(order: Order): [string, string][] {
  return [
    ["Subtotal", formatNaira(order.subtotal)],
    [
      "Delivery fee",
      order.delivery_fee === null ? "Confirmed before dispatch" : formatNaira(order.delivery_fee),
    ],
    ["Total", formatNaira(order.total)],
  ];
}

export function orderConfirmationEmail(
  order: Order,
  items: OrderItem[],
  settings: SiteSettings,
  baseUrl: string,
): { subject: string; html: string } {
  const subject = `Your LisBee order ${order.order_number} is confirmed`;
  const html = emailShell({
    title: "Thank you — your order is in",
    intro: `Hi ${order.customer_name.split(" ")[0]}, we've received order ${order.order_number}. Here's what happens next.`,
    settings,
    baseUrl,
    body:
      box(
        `<div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a87b3f;margin-bottom:10px;">Payment &middot; Bank transfer</div>` +
          paragraph(
            `Send ${formatNaira(order.total)} to your LisBee bank account using the reference ${order.payment_reference}. Your order moves to preparation as soon as we confirm the transfer.`,
          ) +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kv([
            ["Payment reference", order.payment_reference],
            ["Amount to pay", formatNaira(order.total)],
          ])}</table>`,
      ) +
      box(
        `<div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a87b3f;margin-bottom:10px;">Your order</div>` +
          orderItemsHtml(items) +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e7dcd0;margin-top:8px;padding-top:8px;">${kv(orderSummaryRows(order))}</table>`,
      ) +
      box(
        `<div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#a87b3f;margin-bottom:10px;">Delivery</div>` +
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kv([
            ["Recipient", order.recipient.name],
            ["City", `${order.recipient.city}, ${order.recipient.state}`],
            ["Address", order.recipient.delivery_address],
            ...(order.delivery_date
              ? ([["Preferred date", order.delivery_date]] as [string, string][])
              : []),
          ])}</table>`,
      ),
  });
  return { subject, html };
}

export function paymentReceivedEmail(
  order: Order,
  settings: SiteSettings,
  baseUrl: string,
): { subject: string; html: string } {
  return {
    subject: `Payment received — order ${order.order_number}`,
    html: emailShell({
      title: "Payment received",
      intro: `We've confirmed your payment for order ${order.order_number}. Your gift is now being prepared.`,
      settings,
      baseUrl,
      body: box(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kv([
          ["Order", order.order_number],
          ["Amount", formatNaira(order.total)],
          ["What's next", "Preparing your gift"],
        ])}</table>`,
      ),
    }),
  };
}

const STATUS_COPY: Record<string, { title: string; line: string }> = {
  preparing: { title: "We're preparing your order", line: "Your gift is being assembled and checked." },
  ready: { title: "Your order is ready", line: "Everything is packed and waiting for dispatch." },
  dispatched: { title: "Your order is on the way", line: "Your gift has left us and is heading to the delivery address." },
  delivered: { title: "Delivered", line: "Your gift has been delivered. We hope it landed well." },
};

export function orderStatusEmail(
  order: Order,
  status: keyof typeof STATUS_COPY,
  settings: SiteSettings,
  baseUrl: string,
): { subject: string; html: string } {
  const copy = STATUS_COPY[status] ?? { title: "Order update", line: `Status: ${status}` };
  return {
    subject: `${copy.title} — ${order.order_number}`,
    html: emailShell({
      title: copy.title,
      intro: copy.line,
      settings,
      baseUrl,
      body: box(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kv([
          ["Order", order.order_number],
          ["Recipient", order.recipient.name],
          ["Delivery city", order.recipient.city],
        ])}</table>`,
      ),
    }),
  };
}

export function paymentReminderEmail(
  order: Order,
  settings: SiteSettings,
  baseUrl: string,
): { subject: string; html: string } {
  return {
    subject: `Payment reminder — order ${order.order_number}`,
    html: emailShell({
      title: "We're holding your order",
      intro: `Order ${order.order_number} is confirmed but we haven't received your transfer yet.`,
      settings,
      baseUrl,
      body: box(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kv([
          ["Payment reference", order.payment_reference],
          ["Amount due", formatNaira(order.total)],
        ])}</table>` + paragraph(
          "Once the transfer lands we'll confirm and start preparing. Reply here or message us on WhatsApp if you've already sent it.",
        ),
      ),
    }),
  };
}

export function adminNewOrderEmail(
  order: Order,
  items: OrderItem[],
  settings: SiteSettings,
  baseUrl: string,
): { subject: string; html: string } {
  return {
    subject: `New order ${order.order_number} — ${formatNaira(order.total)}`,
    html: emailShell({
      title: "New order",
      intro: `${order.customer_name} placed order ${order.order_number}.`,
      settings,
      baseUrl,
      body:
        box(
          orderItemsHtml(items) +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e7dcd0;margin-top:8px;padding-top:8px;">${kv(orderSummaryRows(order))}</table>`,
        ) +
        box(
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kv([
            ["Customer", order.customer_name],
            ["Phone", order.customer_phone],
            ["Recipient", order.recipient.name],
            ["City", order.recipient.city],
          ])}</table>` + paragraph(`Review it in the admin dashboard: ${baseUrl}/admin/orders`),
        ),
    }),
  };
}

export function adminEnquiryEmail(
  enquiry: CorporateEnquiry,
  settings: SiteSettings,
  baseUrl: string,
): { subject: string; html: string } {
  return {
    subject: `Corporate enquiry — ${enquiry.company}`,
    html: emailShell({
      title: "New corporate enquiry",
      intro: `${enquiry.name} of ${enquiry.company} asked about corporate gifting.`,
      settings,
      baseUrl,
      body: box(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kv([
          ["Contact", `${enquiry.name} · ${enquiry.work_email}`],
          ["Phone", enquiry.phone],
          ["Recipients", enquiry.recipients_count || "—"],
          ["City", enquiry.city || "—"],
          ["Budget / recipient", enquiry.budget_per_recipient || "—"],
        ])}</table>` +
          paragraph(enquiry.message) +
          paragraph(`Dashboard: ${baseUrl}/admin/enquiries`),
      ),
    }),
  };
}


