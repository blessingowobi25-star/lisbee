# LisBee — launch runbook

Everything needed to take the site from this repo to a live Nigerian storefront that can
take payment. Follow it in order. Each step states how to know it worked.

---

## 0. What you need first

| # | Item | Where it comes from | Blocks launch? |
|---|------|--------------------|----------------|
| 1 | **Verified bank account** — bank name, account name, account number | Your bank | **Yes** |
| 2 | **Supabase project** — URL, anon key, service-role key | supabase.com → New project | **Yes** (orders won't persist without it) |
| 3 | **Domain** + DNS access | Any registrar | **Yes** |
| 4 | **Mailgun** — API key, sending domain | mailgun.com | Strongly recommended |
| 5 | Google OAuth client (Client ID + Secret) | console.cloud.google.com | Optional |
| 6 | Paystack secret + public key | paystack.com | Optional (bank transfer at launch) |

> **Item 1 is the hard blocker and it is not a key.** The checkout is built and working, but
> until real account details are entered, customers see "we will send the details" and you
> cannot take money. You can enter these yourself in **Admin → Settings → Bank details**.

---

## 1. Environment variables

Copy `.env.example` to `.env.local` locally (it is gitignored). On Vercel, set the same
variables under **Project → Settings → Environment Variables**.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | Yes | e.g. `https://hellolisbee.com`. Used for sitemap, canonical links and links inside emails. |
| `AUTH_SECRET` | Yes | `openssl rand -hex 32`. **Must be set in production** — otherwise a random secret is generated at boot and every deploy signs everyone out. |
| `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL from Supabase → Project Settings → API. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Server-only.** The data adapter requires it; the anon key is deliberately rejected. Never prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For Google sign-in | Safe in the browser. Without it, sign-in falls back to email only. |
| `ADMIN_ACCESS_CODE` | **Yes, in production** | Shared code required to sign in to a staff account. Email sign-in has no password, so without this code anyone could type your admin email and take over the shop. If unset in production, the admin area is closed. |
| `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` | Recommended | Without them, emails are written to `.data/outbox` on the server and nobody receives them. |
| `PAYSTACK_SECRET_KEY` / `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | No | Leave unset at launch. |
| `INSECURE_HTTP` | No | Only for local testing over plain HTTP. Never set in production. |

Never commit `.env.local`. `.env.example` is the only env file tracked in git.

---

## 2. Create the Supabase project

1. [supabase.com](https://supabase.com) → **New project**. Choose a region near Lagos
   (Europe West / Frankfurt) to keep latency low for Nigerian customers.
2. Save the database password somewhere safe — you will need it for the CLI.
3. From **Project Settings → API**, copy: Project URL, `anon` public key, `service_role` key.

## 3. Run the migrations

Five migrations must run **in order**: schema, tables, RLS, then the seed data.

**Option A — SQL editor (simplest).** Open each file in `supabase/migrations/` and run it
top to bottom:

```
0001_init.sql   → tables: users, taxonomies, products, orders, recipients, order_items
0002_tables.sql → tables: corporate_enquiries, delivery_zones, faqs, pages,
                  site_settings, email_log + indexes
0003_rls.sql    → row-level security policies
0004_seed.sql   → the 3 Workweek products, taxonomies, zones, settings, admin user
0005_content.sql→ FAQ entries and the four policy pages (generated; see below)
```

> `0005_content.sql` is **generated**, not hand-written. It carries the long-form FAQ and
> policy copy straight from `lib/db/seed.ts` so nothing is mistyped. If you ever edit that copy
> in `lib/db/seed.ts`, regenerate it with:
> ```bash
> npm run dev            # once, so .data/db.json exists
> node scripts/generate-content-sql.mjs
> ```
> Both tables stay editable in **Admin → Content & delivery**; re-running the file just
> restores the defaults.

**Option B — CLI.**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-ref>          # from Project Settings → API
supabase db push
```

**Verify** — the end of `0004_seed.sql` prints three result sets, and `0005_content.sql`
prints two. You should see:

- 3 products: `premium-workweek` 20000, `signature-workweek` 35000, `executive-workweek` 60000
- 2 zones (Abuja, Lagos) with `fee` = NULL
- 1 row in `users` with `role = 'admin'`
- 4 policy pages and 10 FAQ entries

---

## 4. Set the real admin email

Admin access is granted purely by **which email is signed in** — that single `users` row is
the entire authorisation list.

1. Open `0004_seed.sql` and change `admin@hellolisbee.com` to your real address, **or**
2. Run this in the SQL editor:
   ```sql
   update public.users set email = 'you@yourdomain.com' where role = 'admin';
   ```

Then delete any other `admin` rows you do not want.

---

## 5. Verify locally against Supabase

```bash
cp .env.example .env.local      # fill in the values
npm install
npm run dev
```

Check **Admin → Settings → Launch readiness**. All five items should be green. Then:

- [ ] `/workweek` shows the three tiers at the right prices
- [ ] `/products/signature-workweek` shows the five weekday moments
- [ ] Place a test order end-to-end
- [ ] Sign in with the admin email and confirm `/admin` opens
- [ ] Sign in with a different email and confirm `/admin` redirects to `/account`


---

## 6. Mailgun and DNS

1. [mailgun.com](https://www.mailgun.com) → add your sending domain.
2. Mailgun shows **3–5 DNS records** (SPF, DKIM, and usually a CNAME for tracking). Add them
   at your registrar. If you already have an SPF record, add Mailgun's value to it — never
   publish a second `TXT` SPF record, or mail will be rejected.
3. DNS propagation can take up to 24–48 hours. Check status from **Mailgun → Sending →
   Domains**.
4. Add `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` to your environment.
5. **Test before going live:** place a test order and confirm the confirmation email arrives
   *and* does not land in spam. The from-address is `from_email` in **Admin → Settings**; use
   an address on the sending domain, not a personal Gmail, or deliverability will suffer.

Without Mailgun the site still works end to end, but every email lands in a server-side
outbox and no customer is ever contacted.

## 7. Google sign-in (optional)

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project →
   **APIs & Services → Credentials → Create OAuth 2.0 Client ID** (type: Web application).
2. Add authorised redirect URI: `https://<SUPABASE_URL>/auth/v1/callback`
3. In Supabase: **Authentication → Providers → Google** → paste Client ID and Secret → enable.
4. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your environment. The sign-in page then shows
   "Continue with Google" automatically; the button stays hidden when it is not configured.

## 8. Deploy to Vercel

1. Push this repo to GitHub, then [vercel.com/new](https://vercel.com/new) → import it.
2. Add every variable from section 1 under **Settings → Environment Variables** for
   Production, Preview and Development.
3. Deploy.
4. Point your domain: **Settings → Domains** → add `hellolisbee.com` → add the CNAME/TXT
   records Vercel shows at your registrar.
5. Set `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy so links are correct.

> **Deploy to Vercel only with Supabase configured.** Without it the app falls back to a
> local file (`.data/db.json`), which is ephemeral on serverless — orders placed in
> production would silently vanish. The app logs a warning when it detects this state.

---

## 9. Before you go live

Data a human must supply. The site will not invent any of it:

- [ ] **Bank details** — Admin → Settings. Without these, checkout cannot take money.
- [ ] **`ADMIN_ACCESS_CODE`** — set it in your host's environment. Without it, the admin area is
      closed in production. Pick something long and random, e.g. `openssl rand -base64 18`.
- [ ] **Delivery fees** for Abuja and Lagos — Admin → Content & delivery. Left blank, the site
      honestly says fees are "confirmed before dispatch" rather than guessing.
- [ ] **Product COGS** — Admin → Products. Margins only calculate once all three cost fields
      are filled in for a product.
- [ ] **Real admin email** (section 4).
- [ ] **Confirm the email address and WhatsApp number** in the footer.
- [ ] Review the four policy pages — they ship as honest draft copy and are yours to edit.
- [ ] Submit `https://yourdomain.com/sitemap.xml` to Google Search Console.

## 10. Post-launch smoke test

Run through this once on the live domain, in an incognito window:

1. Home → Workweek → add Signature to cart → the cart shows **₦35,000**
2. Checkout → tick "This gift is for me" → place the order
3. You land on payment instructions with an order number and payment reference
4. **Receive both emails** (customer confirmation + admin notification)
5. Sign in with the admin email → Orders → open the order → set **Payment: paid**
6. Confirm the customer receives a payment-received email
7. Set **Delivery fee** to your real fee → confirm the total recalculates
8. Advance the status to *dispatched* → confirm the status email arrives
9. Submit the corporate form on `/corporate` → confirm it appears in
   Admin → Corporate enquiries
10. On mobile, check the header menu, a product page and the checkout form

## 11. Rollback

- **Bad deploy:** Vercel → Deployments → promote the previous successful build.
- **Bad data edit:** every admin write is a single row update; restore the previous value in
  the admin UI, or re-run `0004_seed.sql` (it is an upsert and never touches orders).
- **Database backup:** Supabase → Settings → Database → Backups. Enable point-in-time
  recovery before you take your first real order.

---

## Known limitations (honest list)

- **Bank transfer only.** Card payments sit behind two gates — the `PAYSTACK_SECRET_KEY` env
  var *and* the "Enable card payments" switch in Admin → Settings — and are off until live
  keys exist.
- **Abuja and Lagos only.** Checkout rejects any other city, by design.
- **Delivery fees are unconfigured**, so the checkout never invents a number.
- **The local file store is for development only.** Fine locally, unusable in production.
- **Service-role access bypasses RLS.** Authorisation is enforced in the API route handlers
  (`requireAdmin`), not by the database; the RLS policies remain as defence-in-depth.
- **Email sign-in has no password.** It issues a session for a valid address without proving
  ownership. Customer accounts are open by design (they only see their own orders), but staff
  accounts require `ADMIN_ACCESS_CODE`. If you want stronger auth, wire up Supabase Google
  OAuth and email verification.
