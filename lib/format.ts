import type { OrderStatus } from "@/lib/types";

/** Format a Naira amount, e.g. 20000 -> ₦20,000 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/** WhatsApp international link for a local Nigerian number. */
export function whatsappLink(number: string, message?: string): string {
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const DEFAULT_WHATSAPP = "07061804951";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Status pill colour used by the account and admin views. */
export function statusTone(status: OrderStatus): string {
  switch (status) {
    case "delivered":
      return "bg-olive text-cream";
    case "cancelled":
      return "bg-red-50 text-red-700";
    case "awaiting_payment_confirmation":
      return "bg-honey/20 text-honey-deep";
    default:
      return "bg-sand text-cocoa";
  }
}

/** Merge class names; falsy values are dropped. */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function orderId(): string {
  return crypto.randomUUID();
}

/** Short human order number, e.g. LB-2610-4832 */
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LB-${yy}${mm}-${rand}`;
}

/** Payment reference shown to customers making a bank transfer. */
export function generatePaymentReference(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `LISB${rand}`;
}

export function priceRangeMatch(price: number, range: string): boolean {
  switch (range) {
    case "under-25":
      return price < 25000;
    case "25-50":
      return price >= 25000 && price < 50000;
    case "50-100":
      return price >= 50000 && price < 100000;
    case "100-plus":
      return price >= 100000;
    default:
      return true;
  }
}

export const PRICE_RANGES: { value: string; label: string }[] = [
  { value: "under-25", label: "Under ₦25,000" },
  { value: "25-50", label: "₦25,000 – ₦50,000" },
  { value: "50-100", label: "₦50,000 – ₦100,000" },
  { value: "100-plus", label: "₦100,000+" },
];
