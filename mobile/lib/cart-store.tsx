import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchCart, setCartQuantity, removeFromCart, type Cart, type CartLine } from "./api";

/**
 * The cart lives on the SERVER, so this store is a thin mirror of /api/cart.
 *
 * It never invents state: every mutation awaits the server response and renders
 * exactly what came back. That is what guarantees the phone and the website show
 * the same items — there is no second copy of the cart that could disagree.
 */

interface CartStore {
  lines: CartLine[];
  count: number;
  subtotal: number;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  setQuantity: (slug: string, quantity: number) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartStore | null>(null);

/** How often the app re-checks for changes made on the website. */
const POLL_MS = 5000;

const EMPTY: Cart = { items: [], count: 0, subtotal: 0, updated_at: null };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCart(await fetchCart());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach LisBee.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Poll so a change made on the website appears here without a manual pull.
    const id = setInterval(() => {
      void fetchCart()
        .then(setCart)
        .catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const setQuantity = useCallback(async (slug: string, quantity: number) => {
    // Optimistic: the tap feels instant, and the server response confirms it.
    setCart((prev) => {
      const items = prev.items
        .map((i) => (i.slug === slug ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0);
      return {
        items,
        count: items.reduce((s, i) => s + i.quantity, 0),
        subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
        updated_at: prev.updated_at,
      };
    });
    setSyncing(true);
    try {
      setCart(await setCartQuantity(slug, quantity));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your cart.");
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const remove = useCallback(async (slug: string) => {
    setSyncing(true);
    try {
      setCart(await removeFromCart(slug));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your cart.");
      await refresh();
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  return (
    <CartContext.Provider
      value={{
        lines: cart.items,
        count: cart.count,
        subtotal: cart.subtotal,
        loading,
        syncing,
        error,
        setQuantity,
        remove,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartStore {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
