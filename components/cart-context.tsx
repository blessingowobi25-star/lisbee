"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { track } from "@/lib/analytics";

export interface CartLine {
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

interface CartValue {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "lisbee-cart-v1";
/** How often the cart re-checks the server for changes made on another device. */
const POLL_MS = 8000;
const CartContext = createContext<CartValue | null>(null);

/** The server response shape from /api/cart. */
interface ServerCart {
  items: CartLine[];
  count: number;
  subtotal: number;
  updated_at: string | null;
}

async function callCart(method: string, body?: unknown): Promise<ServerCart | null> {
  try {
    // `body` may be an object to send as JSON, or a query string for DELETE.
    const isQuery = typeof body === "string";
    const res = await fetch(`/api/cart${isQuery ? body : ""}`, {
      method,
      headers: body && !isQuery ? { "content-type": "application/json" } : undefined,
      body: body && !isQuery ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ServerCart;
  } catch {
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Mirrors `lines` so the sync effect can read the latest value without
  // re-subscribing every time a line is added.
  const linesRef = useRef<CartLine[]>([]);
  // Distinguishes our own writes from changes made on another device.
  const suppressRef = useRef(false);
  // The last line list we successfully pushed, so we can send deltas.
  const lastPushedRef = useRef<CartLine[] | null>(null);

  const applyServer = useCallback((cart: ServerCart | null) => {
    if (!cart) return;
    linesRef.current = cart.items;
    setLines(cart.items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.items));
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Hydrate from the server on load. localStorage is only a cache, so a signed-in
  // customer sees the same cart here as on their phone.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CartLine[];
          if (Array.isArray(parsed) && !cancelled) {
            linesRef.current = parsed;
            setLines(parsed);
          }
        }
      } catch {
        /* corrupted cache — the server is the real source */
      }
      const cart = await callCart("GET");
      if (!cancelled && cart) applyServer(cart);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyServer]);

  // Push local changes to the server so the phone sees them.
  //
  // This sends DELTAS, not the whole cart. Sending the full list on every change
  // would double-count: the server merges by summing, so a repeated full push
  // would turn 1 item into 2, then 3. Only the line that actually changed is sent.
  useEffect(() => {
    if (!ready) return;
    const prev = lastPushedRef.current;
    const added = lines
      .filter((l) => {
        const before = prev?.find((p) => p.slug === l.slug);
        return !before || before.quantity !== l.quantity;
      })
      .map((l) => ({ slug: l.slug, quantity: l.quantity }));
    // A line dropped locally must be deleted on the server explicitly, otherwise
    // it would reappear on the next poll.
    const removed = (prev ?? [])
      .filter((p) => !lines.some((l) => l.slug === p.slug))
      .map((p) => p.slug);

    // Nothing changed locally (the update came from another device) — don't echo it back.
    if (prev !== null && added.length === 0 && removed.length === 0) return;
    lastPushedRef.current = lines;
    if (lines.length === 0 && removed.length === 0) return;

    setSyncing(true);
    suppressRef.current = true;
    void Promise.all([
      ...added.map((line) => callCart("PATCH", { slug: line.slug, quantity: line.quantity })),
      ...removed.map((slug) => callCart("DELETE", `?slug=${encodeURIComponent(slug)}`)),
    ])
      .then(() => callCart("GET"))
      .then(applyServer)
      .finally(() => {
        suppressRef.current = false;
        setSyncing(false);
      });
  }, [lines, ready, applyServer]);

  // Poll for changes made on another device. This is what makes an item added on
  // the website appear on the phone without a manual refresh.
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      if (document.hidden || suppressRef.current) return;
      void callCart("GET").then((cart) => {
        if (!cart) return;
        const local = linesRef.current;
        const changed =
          cart.items.length !== local.length ||
          cart.items.some((item, i) => {
            const mine = local[i];
            return !mine || mine.slug !== item.slug || mine.quantity !== item.quantity;
          });
        if (changed) applyServer(cart);
      });
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [ready, applyServer]);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((prev) => {
      const next = [...prev];
      const idx = next.findIndex((l) => l.slug === line.slug);
      if (idx >= 0) next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
      else next.push({ ...line, quantity });
      linesRef.current = next;
      return next;
    });
    track("add_to_cart", { item_name: line.name, price: line.price, quantity });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((l) => l.slug !== slug)
          : prev.map((l) => (l.slug === slug ? { ...l, quantity } : l));
      linesRef.current = next;
      return next;
    });
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((prev) => {
      const next = prev.filter((l) => l.slug !== slug);
      linesRef.current = next;
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    linesRef.current = [];
    void callCart("DELETE").then(applyServer);
  }, [applyServer]);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return { lines, ready, count, subtotal, add, setQuantity, remove, clear, syncing };
  }, [lines, ready, add, setQuantity, remove, clear, syncing]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
