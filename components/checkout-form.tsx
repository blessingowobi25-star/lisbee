"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart-context";
import { track } from "@/lib/analytics";
import { formatNaira, whatsappLink } from "@/lib/format";
import type { DeliveryZone } from "@/lib/types";

interface Props {
  deliveryCities: string[];
  zones: DeliveryZone[];
  whatsapp: string;
  user?: { name: string; email: string } | null;
}

const OCCASIONS = [
  "",
  "Birthday",
  "Anniversary",
  "Wedding",
  "Thank you",
  "Welcome gift",
  "New baby",
  "Promotion",
  "Work anniversary",
  "Just because",
];

export function CheckoutForm({ deliveryCities, whatsapp, zones, user }: Props) {
  const { lines, ready, subtotal, clear } = useCart();
  const router = useRouter();

  const [senderName, setSenderName] = useState(user?.name ?? "");
  const [senderEmail, setSenderEmail] = useState(user?.email ?? "");
  const [senderPhone, setSenderPhone] = useState("");
  const [sameAsRecipient, setSameAsRecipient] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(deliveryCities[0] ?? "Abuja");
  const [area, setArea] = useState("");

  // Only ask for an area when the chosen city actually has more than one zone.
  const cityZones = zones.filter(
    (z) => z.active && z.city.toLowerCase() === city.toLowerCase(),
  );
  const areaFee =
    cityZones.find((z) => z.zone_name.toLowerCase() === area.toLowerCase())?.fee ?? null;
  const [instructions, setInstructions] = useState("");
  const [occasion, setOccasion] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && lines.length > 0) track("begin_checkout", { items: lines.length, value: subtotal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lines.length]);

  if (ready && lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-ivory px-6 py-16 text-center">
        <h2 className="text-2xl">Nothing to check out yet</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          Add a gift to your cart and come back.
        </p>
        <Link href="/workweek" className="btn btn-primary mt-7">
          Shop the Workweek Box
        </Link>
      </div>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const payload = {
      items: lines.map((l) => ({ slug: l.slug, quantity: l.quantity })),
      sender_name: senderName,
      customer_email: senderEmail,
      customer_phone: senderPhone,
      same_as_recipient: sameAsRecipient,
      recipient: {
        name: sameAsRecipient ? senderName : recipientName,
        phone: sameAsRecipient ? senderPhone : recipientPhone,
        delivery_address: address,
        city,
        delivery_area: cityZones.length > 1 ? area : "",
        delivery_instructions: instructions,
      },
      occasion,
      gift_message: giftMessage,
      delivery_date: deliveryDate,
      notes,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        order_number?: string;
        total?: number;
      };
      if (!res.ok || !data.order_number) {
        setStatus("error");
        setError(data.error ?? "We could not place your order. Please try again.");
        return;
      }
      clear();
      track("purchase", { order_number: data.order_number, value: data.total, items: lines.length });
      router.push(`/checkout/payment-instructions?order=${encodeURIComponent(data.order_number)}`);
    } catch {
      setStatus("error");
      setError("Network error — please try again, or message us on WhatsApp.");
    }
  };


  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-6">
        <section className="rounded-3xl border border-line bg-white p-6 md:p-7">
          <h2 className="text-xl">1. Your details</h2>
          <p className="mt-1.5 text-sm text-muted">
            We send your order confirmation and payment instructions here.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Your name *</span>
              <input
                required
                className="field"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Adaeze Okafor"
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className="field-label">Email address *</span>
              <input
                required
                type="email"
                className="field"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="field-label">Phone number *</span>
              <input
                required
                type="tel"
                className="field"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="0803 000 0000"
                autoComplete="tel"
              />
            </label>
          </div>
        </section>

        <section className="rounded-3xl border border-line bg-white p-6 md:p-7">
          <h2 className="text-xl">2. Who is it for?</h2>
          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-ivory px-4 py-3.5">
            <input
              type="checkbox"
              checked={sameAsRecipient}
              onChange={(e) => setSameAsRecipient(e.target.checked)}
              className="mt-1 h-4 w-4 accent-espresso"
            />
            <span className="text-sm">
              <span className="font-medium text-espresso">This gift is for me</span>
              <span className="mt-0.5 block text-muted">
                We will deliver to your address and skip the recipient details.
              </span>
            </span>
          </label>

          {!sameAsRecipient && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="field-label">Recipient&rsquo;s name *</span>
                <input
                  required
                  className="field"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Chinedu Okafor"
                />
              </label>
              <label className="block">
                <span className="field-label">Recipient&rsquo;s phone *</span>
                <input
                  required
                  type="tel"
                  className="field"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="0803 000 0000"
                />
              </label>
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="field-label">Delivery address *</span>
              <textarea
                required
                rows={3}
                className="field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address, area, landmark"
              />
            </label>
            <label className="block">
              <span className="field-label">City *</span>
              <select
                required
                className="field"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {deliveryCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">Delivery date</span>
              <input
                type="date"
                className="field"
                value={deliveryDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </label>
            {cityZones.length > 1 && (
              <label className="block sm:col-span-2">
                <span className="field-label">
                  Which part of {city}? <span className="text-honey-deep">*</span>
                </span>
                <select
                  required
                  className="field"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="">Choose your area</option>
                  {cityZones.map((z) => (
                    <option key={z.id} value={z.zone_name}>
                      {z.zone_name}
                      {z.fee === null ? " — fee confirmed before dispatch" : ` — ${formatNaira(z.fee)}`}
                    </option>
                  ))}
                </select>
                <span className="mt-1.5 block text-xs text-muted">
                  Delivery fees differ by area, so we ask before you pay.
                </span>
              </label>
            )}
            <label className="block sm:col-span-2">
              <span className="field-label">Delivery notes (optional)</span>
              <input
                className="field"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Gate colour, office hours, landmark…"
              />
            </label>
          </div>
        </section>
        <section className="rounded-3xl border border-line bg-white p-6 md:p-7">
          <h2 className="text-xl">3. Make it personal</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Occasion</span>
              <select
                className="field"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              >
                {OCCASIONS.map((o) => (
                  <option key={o} value={o}>
                    {o === "" ? "Select an occasion" : o}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">Gift message</span>
              <textarea
                rows={4}
                maxLength={500}
                className="field"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="We will write this on the card inside your gift."
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="field-label">Order notes (optional)</span>
              <input
                className="field"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else we should know"
              />
            </label>
          </div>
        </section>
      </div>
      <aside className="h-fit rounded-3xl border border-line bg-ivory p-6 lg:sticky lg:top-28">
        <h2 className="text-xl">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {lines.map((line) => (
            <li key={line.slug} className="flex items-center gap-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                {line.image && (
                  <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" />
                )}
              </span>
              <span className="flex-1 text-sm">
                {line.name}
                <span className="block text-xs text-muted">Qty {line.quantity}</span>
              </span>
              <span className="text-sm font-medium">{formatNaira(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="text-right text-xs text-muted">
              {area
                ? `${area} — ${formatNaira(areaFee ?? 0)}`
                : cityZones.length > 1
                  ? `Choose your ${city} area`
                  : "Confirmed before dispatch"}
            </dd>
          </div>
          {areaFee !== null && (
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatNaira(subtotal + areaFee)}</dd>
            </div>
          )}
        </dl>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="btn btn-primary mt-5 w-full"
        >
          {status === "sending" ? "Placing order…" : "Place order"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Payment is by bank transfer. You will get the account details and your payment reference
          on the next screen. Need help?{" "}
          <a
            href={whatsappLink(whatsapp, "Hi LisBee, I need help with checkout.")}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            WhatsApp us
          </a>
          .
        </p>
      </aside>
    </form>
  );
}
