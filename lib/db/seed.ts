import type {
  CorporateEnquiry,
  DeliveryZone,
  EmailLog,
  Faq,
  Order,
  OrderItem,
  PageContent,
  Product,
  SiteSettings,
  StoredCartItem,
  Taxonomy,
  User,
} from "@/lib/types";

/**
 * Database shape shared by the local file store.
 * Mirrors lib/db/schema.sql used on Supabase.
 */
export interface DbShape {
  users: User[];
  products: Product[];
  taxonomies: Taxonomy[];
  orders: Order[];
  order_items: OrderItem[];
  enquiries: CorporateEnquiry[];
  cart_items: StoredCartItem[];
  delivery_zones: DeliveryZone[];
  faqs: Faq[];
  pages: PageContent[];
  settings: SiteSettings;
  email_log: EmailLog[];
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brand_name: "LisBee",
  tagline: "Thoughtfully given. Happily received.",
  whatsapp_number: "07061804951",
  email: "hellolisbee@gmail.com",
  instagram: "@hellolisbee",
  tiktok: "@hellolisbee",
  linkedin: "LisBee",
  delivery_cities: ["Abuja", "Lagos"],
  bank: { bank_name: "", account_name: "", account_number: "" },
  paystack_enabled: false,
  target_margin_percent: 30,
  announcement: "",
  from_name: "LisBee",
  from_email: "hellolisbee@gmail.com",
  updated_at: new Date().toISOString(),
};

export const ADMIN_EMAIL = "admin@hellolisbee.com";

const adminUser: User = {
  id: "user-admin",
  name: "LisBee Admin",
  email: ADMIN_EMAIL,
  role: "admin",
  provider: "local",
  created_at: new Date().toISOString(),
};

export function buildSeed(): DbShape {
  return {
    users: [{ ...adminUser }],
    products: products.map((p) => ({ ...p })),
    taxonomies: taxonomies.map((t) => ({ ...t })),
    orders: [],
    order_items: [],
    enquiries: [],
    cart_items: [],
    delivery_zones: delivery_zones.map((z) => ({ ...z })),
    faqs: faqs.map((f) => ({ ...f })),
    pages: pages.map((p) => ({ ...p })),
    settings: { ...DEFAULT_SETTINGS, bank: { ...DEFAULT_SETTINGS.bank } },
    email_log: [],
  };
}

const taxonomies: Taxonomy[] = [
  // ---- categories ----
  { id: "cat-signature", kind: "category", name: "Signature", slug: "signature", description: "The LisBee signature line.", show_in_nav: true, display_order: 0 },
  { id: "cat-workweek", kind: "category", name: "Workweek Boxes", slug: "workweek-boxes", description: "The signature five-day gifting experience.", show_in_nav: true, display_order: 1 },
  { id: "cat-birthday", kind: "category", name: "Birthday Gifts", slug: "birthday-gifts", description: "Birthday boxes and celebration gifts.", show_in_nav: true, display_order: 3, coming_soon: true },
  { id: "cat-anniversary", kind: "category", name: "Anniversary Gifts", slug: "anniversary-gifts", description: "Gifts for couples and milestones.", show_in_nav: true, display_order: 4, coming_soon: true },
  { id: "cat-christmas", kind: "category", name: "Christmas & Festive", slug: "christmas-festive", description: "Seasonal boxes, hampers and festive corporate gifting.", show_in_nav: true, display_order: 5, coming_soon: true },
  { id: "cat-coffee", kind: "category", name: "Coffee Gifts", slug: "coffee-gifts", description: "Coffee and café-style gifting.", show_in_nav: true, display_order: 6, coming_soon: true },
  { id: "cat-corporate", kind: "category", name: "Corporate", slug: "corporate", description: "Employee, client, executive and team gifting.", show_in_nav: true, display_order: 7, coming_soon: true },
  { id: "cat-byo", kind: "category", name: "Build Your Own Gift", slug: "build-your-own", description: "Choose a box, pick the contents, add a message.", show_in_nav: false, display_order: 90, coming_soon: true },

  // ---- occasions ----
  { id: "occ-birthday", kind: "occasion", name: "Birthday", slug: "birthday", show_in_nav: true, display_order: 1 },
  { id: "occ-anniversary", kind: "occasion", name: "Anniversary", slug: "anniversary", show_in_nav: true, display_order: 2 },
  { id: "occ-bromance", kind: "occasion", name: "Bromance", slug: "bromance", show_in_nav: true, display_order: 3 },
  { id: "occ-christmas", kind: "occasion", name: "Christmas & Festive", slug: "christmas", show_in_nav: true, display_order: 4 },
  { id: "occ-congrats", kind: "occasion", name: "Congratulations", slug: "congratulations", show_in_nav: true, display_order: 5 },
  { id: "occ-new-mom", kind: "occasion", name: "New Mom", slug: "new-mom", show_in_nav: true, display_order: 6 },
  { id: "occ-new-baby", kind: "occasion", name: "New Baby", slug: "new-baby", show_in_nav: true, display_order: 7 },
  { id: "occ-graduation", kind: "occasion", name: "Graduation", slug: "graduation", show_in_nav: true, display_order: 8 },
  { id: "occ-thank-you", kind: "occasion", name: "Thank You", slug: "thank-you", show_in_nav: true, display_order: 9 },
  { id: "occ-coffee", kind: "occasion", name: "Coffee Gifts", slug: "coffee", show_in_nav: true, display_order: 10 },

  // ---- recipients ----
  { id: "rec-her", kind: "recipient", name: "For Her", slug: "for-her", show_in_nav: true, display_order: 1 },
  { id: "rec-him", kind: "recipient", name: "For Him", slug: "for-him", show_in_nav: true, display_order: 2 },
  { id: "rec-friends", kind: "recipient", name: "For Friends", slug: "for-friends", show_in_nav: true, display_order: 3 },
  { id: "rec-partners", kind: "recipient", name: "For Partners", slug: "for-partners", show_in_nav: true, display_order: 4 },
  { id: "rec-family", kind: "recipient", name: "For Family", slug: "for-family", show_in_nav: true, display_order: 5 },
  { id: "rec-colleagues", kind: "recipient", name: "For Colleagues", slug: "for-colleagues", show_in_nav: true, display_order: 6 },
  { id: "rec-employees", kind: "recipient", name: "For Employees", slug: "for-employees", show_in_nav: true, display_order: 7 },
  { id: "rec-clients", kind: "recipient", name: "For Clients", slug: "for-clients", show_in_nav: true, display_order: 8 },
  { id: "rec-teams", kind: "recipient", name: "For Teams", slug: "for-teams", show_in_nav: true, display_order: 9 },
  { id: "rec-executives", kind: "recipient", name: "For Executives", slug: "for-executives", show_in_nav: true, display_order: 10 },
];

const COMMON_TAIL =
  "One delivery, five moments. Your recipient opens one pack each day, Monday to Friday — something to look forward to every workday.";

const products: Product[] = [
  {
    id: "prod-premium-workweek",
    name: "Premium Workweek",
    slug: "premium-workweek",
    tagline: "A thoughtful start to the five-day ritual.",
    description:
      "Give someone a better week, one day at a time. The Premium Workweek is one gift that unfolds across five days: a pack for each weekday, each holding a drink or tea, a snack and a small LisBee daily card.\n\n" +
      COMMON_TAIL,
    price: 20000,
    cost_product: null,
    cost_packaging: null,
    cost_other: null,
    category: "workweek-boxes",
    occasions: ["thank-you", "congratulations"],
    recipients: ["for-colleagues", "for-friends", "for-employees"],
    images: ["/images/premium-a.webp", "/images/premium-b.webp"],
    sku: "LB-WW-PRE",
    tier: "premium",
    stock_status: "in_stock",
    availability: "available",
    status: "published",
    featured: true,
    coming_soon: false,
    bestseller: false,
    is_new: true,
    delivery_info: "Delivered in Abuja and Lagos. Delivery timing and fee are confirmed before dispatch.",
    customisation: "Gift message included. Recipient name on the daily card on request.",
    whats_inside: [
      { day: "Monday", moment: "Start Strong", items: ["Dried mango snack (30g)", "Roasted cashews sachet (40g)", "Monday card"] },
      { day: "Tuesday", moment: "Keep Going", items: ["Toblerone 35g miniature", "Shortbread cookies (2pc)", "Tuesday card"] },
      { day: "Wednesday", moment: "Recharge", items: ["Tigernut snack mix", "Premium green tea sachet", "Wednesday card"] },
      { day: "Thursday", moment: "Finish Strong", items: ["Gourmet plantain chips", "Chivita juice", "Thursday card"] },
      { day: "Friday", moment: "Celebrate", items: ["Nigerian craft chocolate bar", "One bonus treat", "Friday card"] },
    ],
    seo_title: "Premium Workweek Box | LisBee",
    seo_description:
      "The Premium Workweek Box: five individually packaged weekday moments with snacks, drinks and a daily card. Delivered in Abuja and Lagos.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-signature-workweek",
    name: "Signature Workweek",
    slug: "signature-workweek",
    tagline: "The flagship. Five days done properly.",
    description:
      "Our hero box, and the one everything else is built around. The Signature Workweek carries a richer set of weekday moments — premium chocolate, whole-leaf tea and coffee, better savouries — in a rigid box with five clearly marked day compartments.\n\n" +
      COMMON_TAIL,
    price: 35000,
    cost_product: null,
    cost_packaging: null,
    cost_other: null,
    category: "workweek-boxes",
    occasions: ["congratulations", "thank-you", "birthday"],
    recipients: ["for-colleagues", "for-friends", "for-partners", "for-employees", "for-her", "for-him"],
    images: ["/images/signature-a.webp"],
    sku: "LB-WW-SIG",
    tier: "signature",
    stock_status: "in_stock",
    availability: "available",
    status: "published",
    featured: true,
    coming_soon: false,
    bestseller: false,
    is_new: true,
    delivery_info: "Delivered in Abuja and Lagos. Delivery timing and fee are confirmed before dispatch.",
    customisation: "Gift message included. Recipient name and corporate branding available on request.",
    whats_inside: [
      { day: "Monday", moment: "Start Strong", items: ["ReelFruit dried fruit (70g)", "Honey-roasted mixed nuts (60g)", "San Pellegrino 250ml or premium juice", "Monday card"] },
      { day: "Tuesday", moment: "Keep Going", items: ["Lindt Lindor 3-piece or Toblerone 50g", "Artisan cookie duo", "Tuesday card"] },
      { day: "Wednesday", moment: "Recharge", items: ["Premium trail mix (50g)", "Whole-leaf tea sachet", "Coffee sachet", "Wednesday card"] },
      { day: "Thursday", moment: "Finish Strong", items: ["Gourmet crackers with cheese portion", "Premium soft drink", "Thursday card"] },
      { day: "Friday", moment: "Celebrate", items: ["Craft chocolate bar", "Gourmet popcorn or brownie bite", "Friday card"] },
    ],
    seo_title: "Signature Workweek Box | LisBee",
    seo_description:
      "The Signature Workweek Box — five days of premium weekday moments with chocolate, tea, coffee and savouries. LisBee's flagship gift, delivered in Abuja and Lagos.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod-executive-workweek",
    name: "Executive Workweek",
    slug: "executive-workweek",
    tagline: "For executives, board members and valued clients.",
    description:
      "The full expression of the Workweek idea. The Executive box pairs luxury chocolate and premium nuts with specialty coffee, a personalised name card and a Friday moment worth clearing the calendar for.\n\n" +
      COMMON_TAIL,
    price: 60000,
    cost_product: null,
    cost_packaging: null,
    cost_other: null,
    category: "workweek-boxes",
    occasions: ["congratulations", "thank-you"],
    recipients: ["for-executives", "for-clients", "for-teams", "for-colleagues"],
    images: ["/images/executive-c.webp", "/images/executive-wide.webp", "/images/executive-a.webp"],
    sku: "LB-WW-EXE",
    tier: "executive",
    stock_status: "in_stock",
    availability: "available",
    status: "published",
    featured: true,
    coming_soon: false,
    bestseller: false,
    is_new: true,
    delivery_info: "Delivered in Abuja and Lagos. Delivery timing and fee are confirmed before dispatch.",
    customisation: "Gift message, personalised name card and corporate branding available on request.",
    whats_inside: [
      { day: "Monday", moment: "Start Strong", items: ["Premium nut trio (cashew, almond, macadamia)", "San Pellegrino Panna or premium juice", "Monday card"] },
      { day: "Tuesday", moment: "Keep Going", items: ["Lindt Excellence 70% bar or Lindor gift box", "Gourmet shortbread", "Tuesday card"] },
      { day: "Wednesday", moment: "Recharge", items: ["Premium granola portion", "Whole-leaf tea", "Drip-bag coffee", "Wednesday card"] },
      { day: "Thursday", moment: "Finish Strong", items: ["Artisan savoury selection with cheese portion", "Premium beverage", "Thursday card"] },
      { day: "Friday", moment: "Celebrate", items: ["Toblerone 100g or Lindt equivalent", "Craft chocolate", "Personalised name card"] },
    ],
    seo_title: "Executive Workweek Box | LisBee",
    seo_description:
      "The Executive Workweek Box — luxury chocolate, premium nuts, specialty coffee and a personalised card across five days. For executives and VIP clients in Abuja and Lagos.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const delivery_zones: DeliveryZone[] = [
  { id: "zone-abuja", city: "Abuja", zone_name: "Abuja (city-wide)", fee: null, same_day: false, next_day: false, standard: true, active: true },
  { id: "zone-lagos", city: "Lagos", zone_name: "Lagos (city-wide)", fee: null, same_day: false, next_day: false, standard: true, active: true },
];

const faqs: Faq[] = [
  {
    id: "faq-1",
    category: "Workweek Box",
    question: "How does the Workweek Box work?",
    answer:
      "You place one order and we deliver one box. Inside are five individually packaged moments, one for each weekday from Monday to Friday. Each day's pack holds a drink or tea, a snack or treat, and a small LisBee daily card. The recipient opens one pack a day.",
    display_order: 1,
  },
  {
    id: "faq-2",
    category: "Workweek Box",
    question: "Which size should I choose?",
    answer:
      "Premium (₦20,000) is a thoughtful everyday gift. Signature (₦35,000) is our flagship and the best balance of variety and presentation. Executive (₦60,000) is built for executives, board members and valued clients.",
    display_order: 2,
  },
  {
    id: "faq-3",
    category: "Delivery",
    question: "Where does LisBee deliver?",
    answer:
      "We currently deliver in Abuja and Lagos only. Delivery timing and the delivery fee are confirmed before your order is dispatched. More cities will follow.",
    display_order: 3,
  },
  {
    id: "faq-4",
    category: "Payment",
    question: "How do I pay?",
    answer:
      "At launch we accept bank transfer. After checkout you will see the account details, your payment reference and the exact amount to send. Once we confirm the transfer, we start preparing your order. Online card payment is coming soon.",
    display_order: 4,
  },
  {
    id: "faq-5",
    category: "Orders",
    question: "Can I send the gift directly to someone else?",
    answer:
      "Yes. Enter the recipient's name, phone number and delivery address at checkout. If the gift is for you, tick 'This gift is for me' and we will use your details.",
    display_order: 5,
  },
  {
    id: "faq-6",
    category: "Orders",
    question: "Can I add a gift message?",
    answer:
      "Yes. There is a gift message field at checkout. We print it on the card that goes with the box.",
    display_order: 6,
  },
  {
    id: "faq-7",
    category: "Corporate",
    question: "Do you handle corporate and bulk orders?",
    answer:
      "Yes. Employee appreciation, onboarding, client gifting, executive gifts, team celebrations and festive programmes. Share the details on our corporate gifting page and we will come back with a proposal.",
    display_order: 7,
  },
  {
    id: "faq-8",
    category: "Corporate",
    question: "Can you add our company branding?",
    answer:
      "Personalisation and company branding are available on request for corporate orders. Mention it in your enquiry and we will confirm what is possible for your timeline.",
    display_order: 8,
  },
  {
    id: "faq-9",
    category: "Workweek Box",
    question: "How long do the items keep?",
    answer:
      "The box is built around shelf-stable packaged goods. Exact batch and expiry details are shared with each order — tell us if you need them for a specific date.",
    display_order: 9,
  },
  {
    id: "faq-10",
    category: "Orders",
    question: "What if I need help with my order?",
    answer:
      "Message us on WhatsApp at 07061804951 or email hellolisbee@gmail.com. We answer order questions there directly.",
    display_order: 10,
  },
];

const pages: PageContent[] = [
  {
    slug: "delivery",
    title: "Delivery Policy",
    updated_at: new Date().toISOString(),
    body:
      "Where we deliver: Abuja and Lagos. We are not delivering to other locations at this time.\n\nFees: delivery fees depend on your location and are confirmed before your order is dispatched. Fees appear at checkout once they are configured for your area.\n\nTiming: choose a preferred delivery date at checkout. We confirm the exact window with you, including same-day or next-day options where they are available for your area.\n\nReceiving the gift: someone should be available at the delivery address. If the recipient is unavailable, we will call the phone number provided to arrange the next attempt.\n\nDelays: traffic, weather and public holidays can affect timing. If we expect a delay, we will tell you early.\n\nQuestions: WhatsApp 07061804951 or email hellolisbee@gmail.com.",
  },
  {
    slug: "refunds",
    title: "Refund & Returns Policy",
    updated_at: new Date().toISOString(),
    body:
      "We want every gift to arrive as expected.\n\nDamaged or incorrect orders: if your order arrives damaged, incomplete or different from what you ordered, contact us within 24 hours with a photo. We will make it right — replace the item, send the missing piece or refund you.\n\nChange of mind: because our gifts are food products assembled to order, we cannot accept returns for a change of mind once the order has been prepared.\n\nCancellations: orders can be cancelled for a full refund before preparation begins. Once an order is prepared or dispatched, it can no longer be cancelled.\n\nRefund timing: approved refunds are sent by bank transfer within 3–5 working days to the account used for payment.\n\nStart a request: WhatsApp 07061804951 or email hellolisbee@gmail.com with your order number.",
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    updated_at: new Date().toISOString(),
    body:
      "These terms apply to orders placed on the LisBee website.\n\nOrders: an order is confirmed once we receive payment by bank transfer and send you a payment confirmation. Until then, prices and availability may change.\n\nPricing: all prices are in Naira and include packaging. Delivery fees are confirmed separately based on your delivery location.\n\nDelivery: we currently deliver in Abuja and Lagos. Delivery dates are estimates and depend on location and schedule; we confirm timing with you before dispatch.\n\nGift content: the box contents listed for each product describe the intended composition. Individual items may be substituted with one of equal or greater value when a specific item is unavailable; we will tell you if this happens.\n\nCancellation: contact us as soon as possible. If your order has not been prepared, we can usually cancel and refund. Once dispatched, the order cannot be cancelled.\n\nContact: hellolisbee@gmail.com or WhatsApp 07061804951.",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    updated_at: new Date().toISOString(),
    body:
      "This policy explains how LisBee handles your information when you shop with us.\n\nWhat we collect: your name, email address, phone number, delivery details, recipient details and order history. We collect only what we need to take payment, deliver gifts and support you after the sale.\n\nHow we use it: to process and deliver orders, send order updates by email, respond to enquiries and improve the shop. We do not sell your personal information.\n\nRecipients: when you send a gift, we use the recipient's name, phone number and address for that delivery only.\n\nPayments: at launch, payments are made by bank transfer. Card payments will be processed by a secure payment provider once enabled; we never store your bank details.\n\nCookies: we use essential cookies to keep your cart and session working, and optional analytics cookies to understand how the shop is used.\n\nQuestions: email hellolisbee@gmail.com or message 07061804951.",
  },
];







