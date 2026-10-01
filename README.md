# LisBee

A premium gifting storefront for Nigeria, built around the **Workweek Box** — one delivery
containing five individually packaged weekday moments, Monday to Friday.

Customers browse, add to cart, check out with bank transfer, and track their order. Companies
submit corporate enquiries. Everything is manageable from a protected admin area.

**Stack:** Next.js 16 (App Router, React 19, TypeScript, Tailwind 4) with a pluggable data
layer — Supabase in production, a local file store for development.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional: without it, the app runs on local data
npm run dev                    # http://localhost:3000
```

With no environment variables the app is fully functional using `.data/db.json` and writes
emails to `.data/outbox` instead of sending them. That is intentional — it means you can
develop, demo and test the entire flow before any account exists.

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npm run seed:content` | Regenerate the FAQ/policy migration from `lib/db/seed.ts` |

## Deploying

See **[docs/LAUNCH.md](docs/LAUNCH.md)** — the full runbook: Supabase setup, migrations,
DNS for Mailgun, Vercel deploy, the pre-launch data checklist and a post-launch smoke test.

---

## Project layout

```
app/
  (storefront)    /  /workweek  /shop  /products/[slug]  /occasions  /recipients
  (content)       /about  /how-it-works  /faq  /contact  /build-your-own  /corporate
  (policies)      /delivery  /refunds  /terms  /privacy-policy
  (commerce)      /cart  /checkout  /checkout/payment-instructions
  (accounts)      /sign-in  /account  /account/orders
  (admin)         /admin/orders  /admin/products  /admin/enquiries  /admin/content
  api/            orders, enquiries, track, auth/*, admin/*
components/       design-system and storefront components (client where interactive)
lib/
  db/             local file store, Supabase adapter, seed data
  auth/           signed-cookie sessions, Supabase OAuth client
  email/          Mailgun delivery with a local outbox fallback
  validation.ts   shared server-side input validation and rate limiting
supabase/
  migrations/     0001 schema · 0002 tables · 0003 RLS · 0004 seed · 0005 content
scripts/
  generate-content-sql.mjs   regenerates 0005 from the seed
```

## How the data layer works

Every server module talks to `db()` (`lib/db/index.ts`). It returns the Supabase adapter when
a URL **and** a service-role key are present, and the local file store otherwise. Pages and
API routes never import a driver directly, so switching backends is a configuration change.

Prices are **always** re-read from the database at checkout. The browser only ever sends
product slugs and quantities, so a tampered price cannot reach an order.

Delivery fees stay `null` until a real fee is configured. Checkout and the confirmation screen
say fees are "confirmed before dispatch" rather than inventing a number.

## Development notes

- Local data lives in `.data/` (gitignored): `db.json`, `outbox/`, `auth-secret`.
- Delete `.data/db.json` to reset to the seed: three Workweek tiers, taxonomies, delivery
  zones, FAQs and policy copy.
- Analytics events post to `/api/track` and are appended to `.data/analytics.jsonl`. No
  cookies, no cross-site tracking, no personal data.
- Only the three confirmed Workweek tiers are seeded. Empty collections show honest
  "Coming soon" states instead of fabricated products.
