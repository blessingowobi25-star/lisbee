import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "./seed";
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
  StoredCartItem,
  Taxonomy,
  TaxonomyKind,
  User,
} from "@/lib/types";
import { priceRangeMatch } from "@/lib/format";

/**
 * Supabase-backed data layer.
 *
 * The adapter runs entirely on the server and bypasses RLS (it is the
 * privileged path used by the admin area and by order creation), so it
 * REQUIRES a service-role key. The publishable/anon key is deliberately NOT
 * accepted here: falling back to it would silently downgrade every write to
 * whatever RLS allows and fail at runtime instead of at boot.
 *
 * Activated when SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) plus
 * SUPABASE_SERVICE_ROLE_KEY are both present. Browser auth uses a separate,
 * anon-key client in lib/auth/supabase.ts.
 */
function client(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Supabase is not configured: SUPABASE_URL is missing");
  if (!key) {
    throw new Error(
      "Supabase is not configured: SUPABASE_SERVICE_ROLE_KEY is missing. " +
        "The anon key cannot be used for server-side writes — the app falls back to the " +
        "local file store until the service-role key is set.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`Supabase ${action} failed: ${error?.message ?? "unknown error"}`);
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

type OrderRow = Order & {
  recipients?: Partial<RecipientRow> | Partial<RecipientRow>[];
};
interface RecipientRow {
  name: string;
  phone: string;
  delivery_address: string;
  city: string;
  state: string;
  delivery_area: string | null;
  delivery_instructions: string | null;
}

function mapOrder(row: OrderRow): Order {
  const raw = row.recipients;
  const rec = Array.isArray(raw) ? raw[0] : raw;
  const { recipients: _drop, ...rest } = row;
  return {
    ...rest,
    recipient: rec
      ? {
          name: rec.name ?? "",
          phone: rec.phone ?? "",
          delivery_address: rec.delivery_address ?? "",
          city: rec.city ?? "",
          state: rec.state ?? "",
          delivery_area: rec.delivery_area ?? undefined,
          delivery_instructions: rec.delivery_instructions ?? undefined,
        }
      : rest.recipient ?? {
          name: "",
          phone: "",
          delivery_address: "",
          city: "",
          state: "",
        },
  } as Order;
}

export function supabaseStore() {
  return {
    // ---------------- users ----------------
    async getUserById(id: string): Promise<User | null> {
      const { data, error } = await client().from("users").select("*").eq("id", id).maybeSingle();
      if (error) fail("getUserById", error);
      return (data as User) ?? null;
    },
    async getUserByEmail(email: string): Promise<User | null> {
      const { data, error } = await client()
        .from("users")
        .select("*")
        .ilike("email", email.trim())
        .maybeSingle();
      if (error) fail("getUserByEmail", error);
      return (data as User) ?? null;
    },
    async createUser(input: Omit<User, "id" | "created_at"> & { id?: string }): Promise<User> {
      const existing = await this.getUserByEmail(input.email);
      if (existing) return existing;
      const { data, error } = await client()
        .from("users")
        .insert({
          name: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone ?? null,
          role: input.role,
          provider: input.provider,
          avatar_url: input.avatar_url ?? null,
        })
        .select()
        .single();
      if (error) fail("createUser", error);
      return data as User;
    },
    async listUsers(): Promise<User[]> {
      const { data, error } = await client()
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) fail("listUsers", error);
      return (data as User[]) ?? [];
    },
    async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
      const clean = { ...patch };
      delete clean.id;
      delete clean.created_at;
      const { data, error } = await client()
        .from("users")
        .update(clean)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) fail("updateUser", error);
      return (data as User) ?? null;
    },

    // ---------------- products ----------------
    async listProducts(filter: ProductFilter = {}): Promise<Product[]> {
      let query = client().from("products").select("*");
      if (!filter.include_unpublished) query = query.eq("status", "published");
      if (filter.category) query = query.eq("category", filter.category);
      if (filter.coming_soon !== undefined) query = query.eq("coming_soon", filter.coming_soon);
      const { data, error } = await query;
      if (error) fail("listProducts", error);
      let items = (data as Product[]) ?? [];
      if (filter.occasion) items = items.filter((p) => p.occasions.includes(filter.occasion!));
      if (filter.recipient) items = items.filter((p) => p.recipients.includes(filter.recipient!));
      if (filter.price) items = items.filter((p) => priceRangeMatch(p.price, filter.price!));
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
      const { data, error } = await client()
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) fail("getProductBySlug", error);
      return (data as Product) ?? null;
    },
    async getProductById(id: string): Promise<Product | null> {
      const { data, error } = await client()
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) fail("getProductById", error);
      return (data as Product) ?? null;
    },
    async saveProduct(product: Product): Promise<Product> {
      const row = { ...product, updated_at: new Date().toISOString() };
      const { data, error } = await client()
        .from("products")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();
      if (error) fail("saveProduct", error);
      return data as Product;
    },
    async deleteProduct(id: string): Promise<void> {
      const { error } = await client().from("products").delete().eq("id", id);
      if (error) fail("deleteProduct", error);
    },

    // ---------------- taxonomies ----------------
    async listTaxonomies(kind: TaxonomyKind): Promise<Taxonomy[]> {
      const { data, error } = await client()
        .from("taxonomies")
        .select("*")
        .eq("kind", kind)
        .order("display_order");
      if (error) fail("listTaxonomies", error);
      return (data as Taxonomy[]) ?? [];
    },
    async getTaxonomyBySlug(kind: TaxonomyKind, slug: string): Promise<Taxonomy | null> {
      const { data, error } = await client()
        .from("taxonomies")
        .select("*")
        .eq("kind", kind)
        .eq("slug", slug)
        .maybeSingle();
      if (error) fail("getTaxonomyBySlug", error);
      return (data as Taxonomy) ?? null;
    },
    async saveTaxonomy(taxonomy: Taxonomy): Promise<Taxonomy> {
      const { data, error } = await client()
        .from("taxonomies")
        .upsert(taxonomy, { onConflict: "id" })
        .select()
        .single();
      if (error) fail("saveTaxonomy", error);
      return data as Taxonomy;
    },
    async deleteTaxonomy(id: string): Promise<void> {
      const { error } = await client().from("taxonomies").delete().eq("id", id);
      if (error) fail("deleteTaxonomy", error);
    },

    // ---------------- orders ----------------
    async createOrder(order: Order, items: OrderItem[]): Promise<Order> {
      const sb = client();
      const { recipient, ...orderRow } = order;
      const { data, error } = await sb
        .from("orders")
        .insert({ ...orderRow, delivery_fee: order.delivery_fee ?? null })
        .select()
        .single();
      if (error) fail("createOrder", error);
      const orderId = (data as Order).id;
      const recipientRow = {
        order_id: orderId,
        name: recipient.name,
        phone: recipient.phone,
        delivery_address: recipient.delivery_address,
        city: recipient.city,
        state: recipient.state,
        delivery_area: recipient.delivery_area ?? null,
        delivery_instructions: recipient.delivery_instructions ?? null,
      };

      // Code can reach production before its migration does. If the
      // delivery_area column has not been added yet, retry without it rather
      // than failing the customer's whole order.
      let recErr = (await sb.from("recipients").insert(recipientRow)).error;
      if (recErr && /delivery_area|column/i.test(recErr.message)) {
        console.warn(
          "[supabase] recipients.delivery_area is missing — run migration " +
            "0006_delivery_areas.sql. Saving the order without the delivery area.",
        );
        const { delivery_area: _drop, ...withoutArea } = recipientRow;
        recErr = (await sb.from("recipients").insert(withoutArea)).error;
      }
      if (recErr) fail("createOrder recipient", recErr);
      if (items.length) {
        const { error: itemErr } = await sb
          .from("order_items")
          .insert(items.map((i) => ({ ...i, order_id: orderId })));
        if (itemErr) fail("createOrder items", itemErr);
      }
      return data as Order;
    },
    async getOrderById(id: string): Promise<Order | null> {
      const { data, error } = await client()
        .from("orders")
        .select("*, recipients(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) fail("getOrderById", error);
      return data ? mapOrder(data as OrderRow) : null;
    },
    async getOrderByNumber(order_number: string): Promise<Order | null> {
      const { data, error } = await client()
        .from("orders")
        .select("*, recipients(*)")
        .or(`order_number.eq.${order_number},payment_reference.eq.${order_number}`)
        .maybeSingle();
      if (error) fail("getOrderByNumber", error);
      return data ? mapOrder(data as OrderRow) : null;
    },
    async listOrders(options: { email?: string; limit?: number } = {}): Promise<Order[]> {
      let query = client().from("orders").select("*, recipients(*)");
      if (options.email) query = query.ilike("customer_email", options.email);
      if (options.limit) query = query.limit(options.limit);
      query = query.order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) fail("listOrders", error);
      return ((data as OrderRow[]) ?? []).map(mapOrder);
    },
    async listOrderItems(order_id: string): Promise<OrderItem[]> {
      const { data, error } = await client()
        .from("order_items")
        .select("*")
        .eq("order_id", order_id);
      if (error) fail("listOrderItems", error);
      return (data as OrderItem[]) ?? [];
    },
    async updateOrder(id: string, patch: Partial<Order>): Promise<Order | null> {
      const clean = { ...patch };
      delete clean.id;
      delete clean.recipient;
      const { data, error } = await client()
        .from("orders")
        .update({ ...clean, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) fail("updateOrder", error);
      return (data as Order) ?? null;
    },

    // ---------------- corporate enquiries ----------------
    async createEnquiry(enquiry: CorporateEnquiry): Promise<CorporateEnquiry> {
      const { id, created_at, ...row } = enquiry;
      const { data, error } = await client()
        .from("corporate_enquiries")
        .insert(row)
        .select()
        .single();
      if (error) fail("createEnquiry", error);
      return data as CorporateEnquiry;
    },
    async listEnquiries(): Promise<CorporateEnquiry[]> {
      const { data, error } = await client()
        .from("corporate_enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) fail("listEnquiries", error);
      return (data as CorporateEnquiry[]) ?? [];
    },
    async updateEnquiry(
      id: string,
      patch: Partial<CorporateEnquiry>,
    ): Promise<CorporateEnquiry | null> {
      const clean = { ...patch };
      delete clean.id;
      delete clean.created_at;
      const { data, error } = await client()
        .from("corporate_enquiries")
        .update(clean)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) fail("updateEnquiry", error);
      return (data as CorporateEnquiry) ?? null;
    },

    // ---------------- settings ----------------
    async getSettings(): Promise<SiteSettings> {
      const { data, error } = await client()
        .from("site_settings")
        .select("data")
        .eq("id", 1)
        .maybeSingle();
      if (error) fail("getSettings", error);
      const stored = (data?.data ?? {}) as Partial<SiteSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...stored,
        bank: { ...DEFAULT_SETTINGS.bank, ...(stored.bank ?? {}) },
      };
    },
    async updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
      const current = await this.getSettings();
      const next: SiteSettings = {
        ...current,
        ...patch,
        bank: { ...current.bank, ...(patch.bank ?? {}) },
        updated_at: new Date().toISOString(),
      };
      const { error } = await client()
        .from("site_settings")
        .upsert({ id: 1, data: next, updated_at: next.updated_at }, { onConflict: "id" });
      if (error) fail("updateSettings", error);
      return next;
    },

    // ---------------- cart ----------------
    async listCartItems(ownerKey: string): Promise<StoredCartItem[]> {
      const { data, error } = await client()
        .from("cart_items")
        .select("*")
        .eq("owner_key", ownerKey)
        .order("slug");
      if (error) fail("listCartItems", error);
      return (data as StoredCartItem[]) ?? [];
    },
    async getCartItem(ownerKey: string, slug: string): Promise<StoredCartItem | null> {
      const { data, error } = await client()
        .from("cart_items")
        .select("*")
        .eq("owner_key", ownerKey)
        .eq("slug", slug)
        .maybeSingle();
      if (error) fail("getCartItem", error);
      return (data as StoredCartItem) ?? null;
    },
    async upsertCartItem(
      ownerKey: string,
      slug: string,
      quantity: number,
    ): Promise<StoredCartItem> {
      const { data, error } = await client()
        .from("cart_items")
        .upsert(
          { owner_key: ownerKey, slug, quantity, updated_at: new Date().toISOString() },
          { onConflict: "owner_key,slug" },
        )
        .select()
        .single();
      if (error) fail("upsertCartItem", error);
      return data as StoredCartItem;
    },
    async removeCartItem(ownerKey: string, slug: string): Promise<void> {
      const { error } = await client()
        .from("cart_items")
        .delete()
        .eq("owner_key", ownerKey)
        .eq("slug", slug);
      if (error) fail("removeCartItem", error);
    },
    async clearCart(ownerKey: string): Promise<void> {
      const { error } = await client().from("cart_items").delete().eq("owner_key", ownerKey);
      if (error) fail("clearCart", error);
    },

    // ---------------- FAQs ----------------
    async listFaqs(): Promise<Faq[]> {
      const { data, error } = await client()
        .from("faqs")
        .select("*")
        .order("display_order");
      if (error) fail("listFaqs", error);
      return (data as Faq[]) ?? [];
    },
    async saveFaq(faq: Faq): Promise<Faq> {
      const { data, error } = await client()
        .from("faqs")
        .upsert(faq, { onConflict: "id" })
        .select()
        .single();
      if (error) fail("saveFaq", error);
      return data as Faq;
    },
    async deleteFaq(id: string): Promise<void> {
      const { error } = await client().from("faqs").delete().eq("id", id);
      if (error) fail("deleteFaq", error);
    },

    // ---------------- page content ----------------
    async listPages(): Promise<PageContent[]> {
      const { data, error } = await client().from("pages").select("*");
      if (error) fail("listPages", error);
      return (data as PageContent[]) ?? [];
    },
    async getPage(slug: string): Promise<PageContent | null> {
      const { data, error } = await client()
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) fail("getPage", error);
      return (data as PageContent) ?? null;
    },
    async savePage(page: PageContent): Promise<PageContent> {
      const { data, error } = await client()
        .from("pages")
        .upsert({ ...page, updated_at: new Date().toISOString() }, { onConflict: "slug" })
        .select()
        .single();
      if (error) fail("savePage", error);
      return data as PageContent;
    },

    // ---------------- delivery zones ----------------
    async listZones(): Promise<DeliveryZone[]> {
      const { data, error } = await client()
        .from("delivery_zones")
        .select("*")
        .order("city");
      if (error) fail("listZones", error);
      return (data as DeliveryZone[]) ?? [];
    },
    async saveZone(zone: DeliveryZone): Promise<DeliveryZone> {
      const { data, error } = await client()
        .from("delivery_zones")
        .upsert(zone, { onConflict: "id" })
        .select()
        .single();
      if (error) fail("saveZone", error);
      return data as DeliveryZone;
    },
    async deleteZone(id: string): Promise<void> {
      const { error } = await client().from("delivery_zones").delete().eq("id", id);
      if (error) fail("deleteZone", error);
    },

    // ---------------- email log ----------------
    async logEmail(entry: EmailLog): Promise<void> {
      const { id, to, ...row } = entry;
      const { error } = await client()
        .from("email_log")
        .insert({ ...row, to_email: to });
      if (error) fail("logEmail", error);
    },
    async listEmails(limit = 50): Promise<EmailLog[]> {
      const { data, error } = await client()
        .from("email_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) fail("listEmails", error);
      return (
        (data as unknown as EmailLog[])?.map((r) => ({
          ...r,
          to: (r as unknown as { to_email: string }).to_email,
        })) ?? []
      );
    },
  };
}



