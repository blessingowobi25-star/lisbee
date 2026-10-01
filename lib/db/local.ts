import fs from "node:fs";
import path from "node:path";
import { buildSeed, type DbShape } from "./seed";
import type {
  CorporateEnquiry,
  DeliveryZone,
  EmailLog,
  Faq,
  Order,
  OrderItem,
  PageContent,
  Product,
  ProductFilter,
  SiteSettings,
  Taxonomy,
  TaxonomyKind,
  User,
} from "@/lib/types";
import { priceRangeMatch } from "@/lib/format";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const g = globalThis as unknown as { __lisbeeDb?: DbShape };

function persistNow(db: DbShape) {
  try {
    const tmp = DB_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
    fs.renameSync(tmp, DB_FILE);
  } catch {
    /* memory-only fallback */
  }
}

function load(): DbShape {
  if (g.__lisbeeDb) return g.__lisbeeDb;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    /* read-only environments fall back to memory */
  }
  let db: DbShape | null = null;
  try {
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DbShape;
  } catch {
    db = null;
  }
  if (!db) db = buildSeed();
  const seed = buildSeed();
  for (const key of Object.keys(seed) as (keyof DbShape)[]) {
    if (db[key] === undefined || db[key] === null) {
      (db as unknown as Record<string, unknown>)[key] = seed[key];
    }
  }
  g.__lisbeeDb = db;
  try {
    if (!fs.existsSync(DB_FILE)) persistNow(db);
  } catch {
    /* ignore */
  }
  return db;
}

function persist() {
  persistNow(load());
}

function sortProducts(items: Product[], sort: ProductFilter["sort"]): Product[] {
  const list = [...items];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    default:
      return list.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.created_at.localeCompare(a.created_at);
      });
  }
}

export const localStore = {
  // ---------------- users ----------------
  async getUserById(id: string): Promise<User | null> {
    return load().users.find((u) => u.id === id) ?? null;
  },
  async getUserByEmail(email: string): Promise<User | null> {
    const target = email.trim().toLowerCase();
    return load().users.find((u) => u.email.toLowerCase() === target) ?? null;
  },
  async createUser(data: Omit<User, "id" | "created_at"> & { id?: string }): Promise<User> {
    const db = load();
    const existing = db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) return existing;
    const user: User = {
      id: data.id ?? crypto.randomUUID(),
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role: data.role,
      provider: data.provider,
      avatar_url: data.avatar_url,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    persist();
    return user;
  },
  async listUsers(): Promise<User[]> {
    return [...load().users].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    const db = load();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, patch, { id: user.id });
    persist();
    return user;
  },

  // ---------------- products ----------------
  async listProducts(filter: ProductFilter = {}): Promise<Product[]> {
    let items = load().products.filter((p) =>
      filter.include_unpublished ? true : p.status === "published",
    );
    if (filter.category) items = items.filter((p) => p.category === filter.category);
    if (filter.occasion) items = items.filter((p) => p.occasions.includes(filter.occasion!));
    if (filter.recipient) items = items.filter((p) => p.recipients.includes(filter.recipient!));
    if (filter.price) items = items.filter((p) => priceRangeMatch(p.price, filter.price!));
    if (filter.coming_soon !== undefined) {
      items = items.filter((p) => p.coming_soon === filter.coming_soon);
    }
    if (filter.q) {
      const q = filter.q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      );
    }
    return sortProducts(items, filter.sort);
  },
  async getProductBySlug(slug: string): Promise<Product | null> {
    return load().products.find((p) => p.slug === slug) ?? null;
  },
  async getProductById(id: string): Promise<Product | null> {
    return load().products.find((p) => p.id === id) ?? null;
  },
  async saveProduct(product: Product): Promise<Product> {
    const db = load();
    const idx = db.products.findIndex((p) => p.id === product.id);
    const saved = { ...product, updated_at: new Date().toISOString() };
    if (idx >= 0) db.products[idx] = saved;
    else db.products.push(saved);
    persist();
    return saved;
  },
  async deleteProduct(id: string): Promise<void> {
    const db = load();
    db.products = db.products.filter((p) => p.id !== id);
    persist();
  },

  // ---------------- taxonomies ----------------
  async listTaxonomies(kind: TaxonomyKind): Promise<Taxonomy[]> {
    return load()
      .taxonomies.filter((t) => t.kind === kind)
      .sort((a, b) => a.display_order - b.display_order);
  },
  async getTaxonomyBySlug(kind: TaxonomyKind, slug: string): Promise<Taxonomy | null> {
    return load().taxonomies.find((t) => t.kind === kind && t.slug === slug) ?? null;
  },
  async saveTaxonomy(taxonomy: Taxonomy): Promise<Taxonomy> {
    const db = load();
    const idx = db.taxonomies.findIndex((t) => t.id === taxonomy.id);
    if (idx >= 0) db.taxonomies[idx] = taxonomy;
    else db.taxonomies.push(taxonomy);
    persist();
    return taxonomy;
  },
  async deleteTaxonomy(id: string): Promise<void> {
    const db = load();
    db.taxonomies = db.taxonomies.filter((t) => t.id !== id);
    persist();
  },

  // ---------------- orders ----------------
  async createOrder(order: Order, items: OrderItem[]): Promise<Order> {
    const db = load();
    db.orders.push({ ...order });
    db.order_items.push(...items.map((i) => ({ ...i })));
    persist();
    return order;
  },
  async getOrderById(id: string): Promise<Order | null> {
    return load().orders.find((o) => o.id === id) ?? null;
  },
  async getOrderByNumber(order_number: string): Promise<Order | null> {
    return (
      load().orders.find(
        (o) => o.order_number === order_number || o.payment_reference === order_number,
      ) ?? null
    );
  },
  async listOrders(options: { email?: string; limit?: number } = {}): Promise<Order[]> {
    let orders = [...load().orders];
    if (options.email) {
      const target = options.email.toLowerCase();
      orders = orders.filter((o) => o.customer_email.toLowerCase() === target);
    }
    orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return options.limit ? orders.slice(0, options.limit) : orders;
  },
  async listOrderItems(order_id: string): Promise<OrderItem[]> {
    return load().order_items.filter((i) => i.order_id === order_id);
  },
  async updateOrder(id: string, patch: Partial<Order>): Promise<Order | null> {
    const db = load();
    const order = db.orders.find((o) => o.id === id);
    if (!order) return null;
    Object.assign(order, patch, { id: order.id, updated_at: new Date().toISOString() });
    persist();
    return order;
  },

  // ---------------- corporate enquiries ----------------
  async createEnquiry(enquiry: CorporateEnquiry): Promise<CorporateEnquiry> {
    const db = load();
    db.enquiries.push({ ...enquiry });
    persist();
    return enquiry;
  },
  async listEnquiries(): Promise<CorporateEnquiry[]> {
    return [...load().enquiries].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async updateEnquiry(id: string, patch: Partial<CorporateEnquiry>): Promise<CorporateEnquiry | null> {
    const db = load();
    const item = db.enquiries.find((e) => e.id === id);
    if (!item) return null;
    Object.assign(item, patch, { id: item.id });
    persist();
    return item;
  },

  // ---------------- settings ----------------
  async getSettings(): Promise<SiteSettings> {
    const db = load();
    const seedSettings = buildSeed().settings;
    return { ...seedSettings, ...db.settings, bank: { ...seedSettings.bank, ...db.settings.bank } };
  },
  async updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
    const db = load();
    db.settings = {
      ...db.settings,
      ...patch,
      bank: { ...db.settings.bank, ...(patch.bank ?? {}) },
      updated_at: new Date().toISOString(),
    };
    persist();
    return db.settings;
  },

  // ---------------- FAQs ----------------
  async listFaqs(): Promise<Faq[]> {
    return [...load().faqs].sort((a, b) => a.display_order - b.display_order);
  },
  async saveFaq(faq: Faq): Promise<Faq> {
    const db = load();
    const idx = db.faqs.findIndex((f) => f.id === faq.id);
    if (idx >= 0) db.faqs[idx] = faq;
    else db.faqs.push(faq);
    persist();
    return faq;
  },
  async deleteFaq(id: string): Promise<void> {
    const db = load();
    db.faqs = db.faqs.filter((f) => f.id !== id);
    persist();
  },

  // ---------------- page content ----------------
  async listPages(): Promise<PageContent[]> {
    return [...load().pages];
  },
  async getPage(slug: string): Promise<PageContent | null> {
    return load().pages.find((p) => p.slug === slug) ?? null;
  },
  async savePage(page: PageContent): Promise<PageContent> {
    const db = load();
    const idx = db.pages.findIndex((p) => p.slug === page.slug);
    const saved = { ...page, updated_at: new Date().toISOString() };
    if (idx >= 0) db.pages[idx] = saved;
    else db.pages.push(saved);
    persist();
    return saved;
  },

  // ---------------- delivery zones ----------------
  async listZones(): Promise<DeliveryZone[]> {
    return [...load().delivery_zones].sort((a, b) => a.city.localeCompare(b.city));
  },
  async saveZone(zone: DeliveryZone): Promise<DeliveryZone> {
    const db = load();
    const idx = db.delivery_zones.findIndex((z) => z.id === zone.id);
    if (idx >= 0) db.delivery_zones[idx] = zone;
    else db.delivery_zones.push(zone);
    persist();
    return zone;
  },
  async deleteZone(id: string): Promise<void> {
    const db = load();
    db.delivery_zones = db.delivery_zones.filter((z) => z.id !== id);
    persist();
  },

  // ---------------- email log (outbox) ----------------
  async logEmail(entry: EmailLog): Promise<void> {
    const db = load();
    db.email_log.unshift({ ...entry });
    db.email_log = db.email_log.slice(0, 200);
    persist();
  },
  async listEmails(limit = 50): Promise<EmailLog[]> {
    return load().email_log.slice(0, limit);
  },
};



