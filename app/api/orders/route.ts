import { cookies } from "next/headers";
import { db, getSettings } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { baseUrlFrom, sendOrderConfirmation } from "@/lib/email";
import { generateOrderNumber, generatePaymentReference } from "@/lib/format";
import type { Order, OrderItem, OrderRecipient } from "@/lib/types";
import {
  clean,
  cleanMultiline,
  clientKey,
  isEmail,
  isIsoDate,
  jsonError,
  normalisePhone,
  rateLimit,
  toInt,
} from "@/lib/validation";

export const runtime = "nodejs";

const MAX_QTY_PER_LINE = 20;
const ORDER_COOKIE = "lisbee_orders";

interface IncomingLine {
  slug: string;
  quantity: number;
}

function readLines(value: unknown): IncomingLine[] {
  if (!Array.isArray(value)) return [];
  const out: IncomingLine[] = [];
  for (const raw of value.slice(0, 20)) {
    const item = raw as Record<string, unknown>;
    const slug = clean(item?.slug, 120);
    const quantity = toInt(item?.quantity, 1, MAX_QTY_PER_LINE);
    if (!slug || !quantity) continue;
    const existing = out.find((l) => l.slug === slug);
    if (existing) existing.quantity = Math.min(MAX_QTY_PER_LINE, existing.quantity + quantity);
    else out.push({ slug, quantity });
  }
  return out;
}

function readRecipient(
  value: unknown,
  sameAsSender: boolean,
  senderName: string,
  senderPhone: string,
  allowedCities: string[],
): { recipient?: OrderRecipient; error?: string } {
  const raw = (value ?? {}) as Record<string, unknown>;

  if (sameAsSender) {
    // Gift is for the sender: the delivery address is still required.
    const address = cleanMultiline(raw.delivery_address, 400);
    const city = clean(raw.city, 80);
    if (address.length < 8) return { error: "Please enter your delivery address." };
    if (!allowedCities.some((c) => c.toLowerCase() === city.toLowerCase())) {
      return { error: `We currently deliver in ${allowedCities.join(" and ")} only.` };
    }
    return {
      recipient: {
        name: senderName,
        phone: senderPhone,
        delivery_address: address,
        city,
        state: city,
        delivery_instructions: cleanMultiline(raw.delivery_instructions, 300) || undefined,
      },
    };
  }

  const name = clean(raw.name, 120);
  const phone = normalisePhone(clean(raw.phone, 40));
  const address = cleanMultiline(raw.delivery_address, 400);
  const city = clean(raw.city, 80);

  if (name.length < 2) return { error: "Please enter the recipient's name." };
  if (!phone) return { error: "Please enter a valid Nigerian phone number for the recipient." };
  if (address.length < 8) return { error: "Please enter the recipient's delivery address." };
  if (!allowedCities.some((c) => c.toLowerCase() === city.toLowerCase())) {
    return { error: `We currently deliver in ${allowedCities.join(" and ")} only.` };
  }

  return {
    recipient: {
      name,
      phone,
      delivery_address: address,
      city,
      state: city,
      delivery_instructions: cleanMultiline(raw.delivery_instructions, 300) || undefined,
    },
  };
}



/**
 * Create an order from the client cart.
 * Prices, stock and availability are ALWAYS re-read from the database — the
 * browser only ever sends slugs and quantities.
 */
export async function POST(request: Request): Promise<Response> {
  if (!rateLimit(clientKey(request, "order"), 10, 10 * 60_000)) {
    return jsonError("Too many checkout attempts. Please try again shortly.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const lines = readLines(body.items);
  if (lines.length === 0) return jsonError("Your cart is empty.", 422);

  const settings = await getSettings();
  const senderName = clean(body.sender_name, 120);
  const senderEmail = clean(body.customer_email, 254).toLowerCase();
  const senderPhoneRaw = clean(body.customer_phone, 40);

  if (senderName.length < 2) return jsonError("Please enter the sender's name.", 422);
  if (!isEmail(senderEmail)) return jsonError("Please enter a valid email address.", 422);
  const senderPhone = normalisePhone(senderPhoneRaw);
  if (!senderPhone) return jsonError("Please enter a valid Nigerian phone number.", 422);

  const sameAsRecipient = body.same_as_recipient === true;
  const { recipient, error: recipientError } = readRecipient(
    body.recipient,
    sameAsRecipient,
    senderName,
    senderPhone,
    settings.delivery_cities,
  );
  if (!recipient) return jsonError(recipientError ?? "Invalid delivery details.", 422);

  const giftMessage = cleanMultiline(body.gift_message, 500);
  const occasion = clean(body.occasion, 80);
  const notes = cleanMultiline(body.notes, 1000);
  const deliveryDateRaw = clean(body.delivery_date, 20);
  if (deliveryDateRaw && !isIsoDate(deliveryDateRaw)) {
    return jsonError("Please choose a valid delivery date.", 422);
  }
  const deliveryDate = deliveryDateRaw || undefined;

  // ---- revalidate every line against the database ----
  const items: OrderItem[] = [];
  let subtotal = 0;
  for (const line of lines) {
    const product = await db().getProductBySlug(line.slug);
    if (!product || product.status !== "published") {
      return jsonError("One of the items in your cart is no longer available.", 409);
    }
    if (product.stock_status !== "in_stock" || product.coming_soon) {
      return jsonError(`“${product.name}” is not available to order right now.`, 409);
    }
    const lineTotal = product.price * line.quantity;
    subtotal += lineTotal;
    items.push({
      id: crypto.randomUUID(),
      order_id: "",
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      image: product.images?.[0] ?? null,
      quantity: line.quantity,
      unit_price: product.price,
      total: lineTotal,
    });
  }

  // ---- delivery fee: only applied when a zone fee is actually configured ----
  const zones = await db().listZones();
  const zone = zones.find(
    (z) => z.active && z.city.toLowerCase() === recipient.city.toLowerCase(),
  );
  const deliveryFee = typeof zone?.fee === "number" ? zone.fee : null;
  const total = subtotal + (deliveryFee ?? 0);

  const user = await getSessionUser();
  const now = new Date().toISOString();

  const order: Order = {
    id: crypto.randomUUID(),
    order_number: generateOrderNumber(),
    payment_reference: generatePaymentReference(),
    customer_id: user?.id ?? null,
    customer_name: senderName,
    customer_email: senderEmail,
    customer_phone: senderPhone,
    subtotal,
    delivery_fee: deliveryFee,
    delivery_fee_status: deliveryFee === null ? "pending_confirmation" : "quoted",
    total,
    payment_method: settings.paystack_enabled ? "paystack" : "bank_transfer",
    payment_status: "awaiting_confirmation",
    order_status: "awaiting_payment_confirmation",
    sender_name: senderName,
    same_as_recipient: sameAsRecipient,
    occasion: occasion || undefined,
    gift_message: giftMessage || undefined,
    delivery_date: deliveryDate,
    is_corporate: false,
    recipient,
    created_at: now,
    updated_at: now,
    notes: notes || undefined,
  };

  items.forEach((item) => {
    item.order_id = order.id;
  });

  await db().createOrder(order, items);

  // Remember guest orders so the payment-instructions page can be reopened.
  try {
    const store = await cookies();
    const existing = (store.get(ORDER_COOKIE)?.value ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const next = [order.order_number, ...existing].slice(0, 20).join(",");
    store.set(ORDER_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production" && !process.env.INSECURE_HTTP,
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
  } catch {
    /* cookies unavailable — the order is still saved */
  }

  // Awaited on purpose: see the note in lib/email/index.ts. On serverless
  // hosting an un-awaited send would be cancelled when this function returns.
  await sendOrderConfirmation(order, baseUrlFrom(request.headers));

  return Response.json(
    {
      ok: true,
      order_number: order.order_number,
      payment_reference: order.payment_reference,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
    },
    { status: 201 },
  );
}

/** Order history for the signed-in customer. */
export async function GET(): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return jsonError("Not signed in", 401);
  const orders = await db().listOrders({ email: user.email });
  return Response.json({ orders });
}
