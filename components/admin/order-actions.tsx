"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_STATUS_LABELS, type OrderStatus, type PaymentStatus } from "@/lib/types";
import { formatNaira } from "@/lib/format";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const PAYMENTS: PaymentStatus[] = ["awaiting_confirmation", "paid", "refunded", "cancelled"];

export function OrderActions({
  orderId,
  orderStatus,
  paymentStatus,
  deliveryFee,
  subtotal,
}: {
  orderId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryFee: number | null;
  subtotal: number;
}) {
  const router = useRouter();
  const [fee, setFee] = useState(deliveryFee === null ? "" : String(deliveryFee));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const update = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Update failed");
        return;
      }
      setMessage("Saved");
      router.refresh();
    } catch {
      setMessage("Network error — try again");
    } finally {
      setBusy(false);
    }
  };

  const total = subtotal + (fee === "" ? 0 : Number(fee));

  return (
    <div className="rounded-3xl border border-line bg-white p-6">
      <h2 className="text-xl">Manage this order</h2>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="field-label">Order status</span>
          <select
            className="field"
            value={orderStatus}
            disabled={busy}
            onChange={(e) => update({ order_status: e.target.value })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Payment status</span>
          <select
            className="field"
            value={paymentStatus}
            disabled={busy}
            onChange={(e) => update({ payment_status: e.target.value })}
          >
            {PAYMENTS.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="field-label">Delivery fee (₦)</span>
          <div className="flex gap-2">
            <input
              className="field"
              inputMode="numeric"
              value={fee}
              placeholder="Leave blank if unconfirmed"
              onChange={(e) => setFee(e.target.value.replace(/[^\d]/g, ""))}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => update({ delivery_fee: fee === "" ? null : Number(fee) })}
              className="btn btn-outline btn-sm shrink-0"
            >
              Save
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Blank keeps the fee “to be confirmed”. Customer total after saving:{" "}
            <strong className="text-espresso">{formatNaira(total)}</strong>
          </p>
        </div>

        {message && <p className="text-xs text-muted">{message}</p>}
      </div>
    </div>
  );
}
