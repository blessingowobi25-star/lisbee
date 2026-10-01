import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { baseUrlFrom, sendOrderStatusUpdate, sendPaymentReceived } from "@/lib/email";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/types";
import { clean, cleanMultiline, jsonError, toInt } from "@/lib/validation";

export const runtime = "nodejs";

const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const PAYMENT_STATUSES: PaymentStatus[] = [
  "awaiting_confirmation",
  "paid",
  "refunded",
  "cancelled",
];

/** Update order status, payment status, delivery fee or internal notes. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (!user) return jsonError(error ?? "Not authorised", 401);

  const { id } = await params;
  const existing = await db().getOrderById(id);
  if (!existing) return jsonError("Order not found", 404);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request", 400);
  }

  const patch: Record<string, unknown> = {};

  if (body.order_status !== undefined) {
    const value = clean(body.order_status, 40) as OrderStatus;
    if (!ORDER_STATUSES.includes(value)) return jsonError("Unknown order status", 422);
    patch.order_status = value;
    // Payment confirmation implies the order moves out of the waiting state.
    if (value === "payment_received" && existing.payment_status !== "paid") {
      patch.payment_status = "paid";
    }
  }

  if (body.payment_status !== undefined) {
    const value = clean(body.payment_status, 40) as PaymentStatus;
    if (!PAYMENT_STATUSES.includes(value)) return jsonError("Unknown payment status", 422);
    patch.payment_status = value;
  }

  if (body.delivery_fee !== undefined) {
    if (body.delivery_fee === null || body.delivery_fee === "") {
      patch.delivery_fee = null;
      patch.delivery_fee_status = "pending_confirmation";
    } else {
      const fee = toInt(body.delivery_fee, 0, 2_000_000);
      if (fee === null) return jsonError("Delivery fee must be a number in Naira", 422);
      patch.delivery_fee = fee;
      patch.delivery_fee_status = "quoted";
    }
  }

  if (body.notes !== undefined) patch.notes = cleanMultiline(body.notes, 2000);
  if (Object.keys(patch).length === 0) return jsonError("Nothing to update", 422);

  // Snapshot the previous values BEFORE updating: the local store hands back
  // live object references, so `existing` reflects the patch afterwards.
  const wasPaid = existing.payment_status === "paid";
  const previousStatus = existing.order_status;
  const nextFee = (patch.delivery_fee as number | null | undefined) ?? existing.delivery_fee;
  patch.total = existing.subtotal + (nextFee ?? 0);

  const updated = await db().updateOrder(id, patch);
  if (!updated) return jsonError("Order not found", 404);

  const base = baseUrlFrom(request.headers);
  if (updated.payment_status === "paid" && !wasPaid) {
    sendPaymentReceived(updated, base);
  } else if (
    patch.order_status &&
    patch.order_status !== previousStatus &&
    (patch.order_status as OrderStatus) !== "cancelled"
  ) {
    sendOrderStatusUpdate(updated, patch.order_status as OrderStatus, base);
  }

  return Response.json({ ok: true, order: updated });
}
