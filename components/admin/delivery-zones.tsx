"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DeliveryZone } from "@/lib/types";
import { formatNaira } from "@/lib/format";

export function DeliveryZones({ zones }: { zones: DeliveryZone[] }) {
  const router = useRouter();
  const [fees, setFees] = useState<Record<string, string>>(
    Object.fromEntries(zones.map((z) => [z.id, z.fee === null ? "" : String(z.fee)])),
  );
  const [active, setActive] = useState<Record<string, boolean>>(
    Object.fromEntries(zones.map((z) => [z.id, z.active])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const save = async (zone: DeliveryZone) => {
    setBusy(zone.id);
    setMessage("");
    const fee = fees[zone.id] ?? "";
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "zone",
          id: zone.id,
          city: zone.city,
          zone_name: zone.zone_name,
          fee: fee === "" ? null : Number(fee),
          same_day: zone.same_day,
          next_day: zone.next_day,
          standard: zone.standard,
          active: active[zone.id] ?? zone.active,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? "Could not save the zone");
        return;
      }
      setMessage("Saved");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const add = async () => {
    const city = window.prompt("City to add");
    if (!city) return;
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "zone", city, zone_name: city }),
    });
    if (res.ok) {
      setMessage("Zone added");
      router.refresh();
    }
  };

  return (
    <section className="rounded-3xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl">Delivery zones</h2>
          <p className="mt-1 text-sm text-muted">
            Leave a fee blank and checkout says “confirmed before dispatch” — nothing is invented.
          </p>
        </div>
        <button type="button" onClick={add} className="btn btn-outline btn-sm">
          Add city
        </button>
      </div>

      {zones.length === 0 ? (
        <p className="mt-5 text-sm text-muted">No zones yet.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {zones.map((zone) => (
            <li
              key={zone.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ivory px-4 py-3"
            >
              <div className="min-w-40">
                <div className="font-medium text-espresso">{zone.city}</div>
                <div className="text-xs text-muted">{zone.zone_name}</div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-muted">Fee (₦)</span>
                <input
                  className="field w-32 py-2"
                  inputMode="numeric"
                  value={fees[zone.id] ?? ""}
                  placeholder="TBC"
                  onChange={(e) =>
                    setFees((prev) => ({ ...prev, [zone.id]: e.target.value.replace(/[^\d]/g, "") }))
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={active[zone.id] ?? zone.active}
                  className="h-4 w-4 accent-espresso"
                  onChange={(e) => setActive((prev) => ({ ...prev, [zone.id]: e.target.checked }))}
                />
                Active
              </label>
              <button
                type="button"
                disabled={busy === zone.id}
                className="btn btn-outline btn-sm ml-auto"
                onClick={() => save(zone)}
              >
                {busy === zone.id ? "Saving…" : "Save"}
              </button>
              <span className="text-xs text-muted">
                {zone.fee === null ? "Fee pending" : formatNaira(zone.fee)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-4 text-xs text-muted">{message}</p>}
    </section>
  );
}
