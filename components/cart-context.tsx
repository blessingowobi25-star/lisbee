"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Reading localStorage is a browser-only concern; the effect runs after the
    // first paint, so the initial render is always the empty server state.
    const id = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CartLine[];
          if (Array.isArray(parsed)) setLines(parsed);
        }
      } catch {
        /* corrupted cart — start fresh */
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable */
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "quantity">, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.slug === line.slug);
      if (existing) {
        return prev.map((l) =>
          l.slug === line.slug ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { ...line, quantity }];
    });
    track("add_to_cart", { item_name: line.name, price: line.price, quantity });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.slug !== slug)
        : prev.map((l) => (l.slug === slug ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    setLines((prev) => prev.filter((l) => l.slug !== slug));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return { lines, ready, count, subtotal, add, setQuantity, remove, clear };
  }, [lines, ready, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
