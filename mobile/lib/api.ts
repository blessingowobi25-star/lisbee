/**
 * The one place the app talks to LisBee.
 *
 * Every call here hits the SAME endpoints the website uses, which is what makes
 * the two clients share accounts and carts. Nothing is stored or cached as a
 * source of truth: the server response is always rendered as-is, so a stale
 * phone can never show a stale price.
 */

// Physical devices on the same Wi-Fi need your computer's LAN address, not
// localhost. Override with EXPO_PUBLIC_API_URL when testing on a real phone.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8081";

export interface Product {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  image: string | null;
  images: string[];
  tier: string | null;
  stock_status: string;
  availability: string;
  category: string;
  occasions: string[];
  recipients: string[];
  featured: boolean;
  bestseller: boolean;
  is_new: boolean;
  sku: string;
}

export interface CartLine {
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

export interface Cart {
  items: CartLine[];
  count: number;
  subtotal: number;
  updated_at: string | null;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}

/** Where the bearer token lives between app launches. */
const TOKEN_KEY = "lisbee-token";

let token: string | null = null;
let currentUser: SessionUser | null = null;

export function getToken(): string | null {
  return token;
}

export function getUser(): SessionUser | null {
  return currentUser;
}

export async function loadSession(): Promise<SessionUser | null> {
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    token = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    token = null;
  }
  if (!token) return null;
  try {
    // Confirms the stored token is still valid before trusting it.
    const me = await api<{ user: SessionUser }>("/api/auth/me");
    currentUser = me.user;
    return currentUser;
  } catch {
    await signOut();
    return null;
  }
}

async function saveToken(value: string | null): Promise<void> {
  token = value;
  try {
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    if (value) await AsyncStorage.setItem(TOKEN_KEY, value);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — the session lasts for this launch only */
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong.", res.status);
  return data as T;
}

/** Signs in and stores the bearer token. This is the same account as the website. */
export async function signIn(name: string, email: string): Promise<SessionUser> {
  const res = await api<{ token: string; user: SessionUser }>("/api/auth/token", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
  await saveToken(res.token);
  currentUser = res.user;
  return res.user;
}

export async function signOut(): Promise<void> {
  await saveToken(null);
  currentUser = null;
}

export function fetchProducts(): Promise<{ products: Product[] }> {
  return api("/api/products");
}

export function fetchCart(): Promise<Cart> {
  return api("/api/cart");
}

export function setCartQuantity(slug: string, quantity: number): Promise<Cart> {
  return api("/api/cart", {
    method: "PATCH",
    body: JSON.stringify({ slug, quantity }),
  });
}

export function addToCart(slug: string, quantity: number): Promise<Cart> {
  return api("/api/cart", {
    method: "POST",
    body: JSON.stringify({ slug, quantity }),
  });
}

export function removeFromCart(slug: string): Promise<Cart> {
  return api(`/api/cart?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
}

/** Absolute URL for a product image path. */
export function imageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
