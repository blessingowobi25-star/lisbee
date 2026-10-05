# LisBee mobile app

An Expo (React Native) app for the LisBee shop. It is a **client of the same API
the website uses** — there is no mobile-specific backend and no separate login.

## Why the backend had to change first

The cart used to live only in the browser's `localStorage`, and sign-in used an
`httpOnly` cookie. Neither can cross to a phone, so "share one cart and one
account across devices" was not possible from the app side alone. The following
was added to make it possible:

| Piece | Why it was needed |
| --- | --- |
| `cart_items` table (`0007_cart_sync.sql`) | The cart had to become a server resource. |
| `GET/POST/PUT/PATCH/DELETE /api/cart` | One cart endpoint both clients read and write. |
| `POST /api/auth/token` | React Native cannot use cookies; it needs a bearer token. |
| `GET /api/auth/me` | Confirms a stored token is still valid. |
| `GET /api/products`, `/api/products/[slug]` | A native app cannot read Server Components. |

Both clients resolve to the same owner key — `user:<uuid>` when signed in — so
they are looking at one cart, not two copies.

## Step 1 — run the migration

`/api/cart` will return **HTTP 500** until this is done:

1. Supabase → **SQL Editor**
2. Paste and run `supabase/migrations/0007_cart_sync.sql`
3. Confirm with `select * from cart_items;`

It is idempotent, so re-running is safe.

## Step 2 — deploy the website

The API routes and the new server-backed cart only exist once deployed:

```powershell
git push
```

## Step 3 — run the app

```powershell
cd mobile
npm install
npm start
```

Then on your phone:

1. Install **Expo Go** (Google Play / App Store).
2. Put the phone and this computer on the **same Wi-Fi**.
3. Scan the QR code shown in the terminal.

### Pointing the app at the right server

The app defaults to `http://localhost:8081`, which is wrong on a real phone.
Set the API URL to your computer's LAN address (shown by `npm start`) or to the
deployed site:

```powershell
# Windows PowerShell, for the current shell only
$env:EXPO_PUBLIC_API_URL="https://lisbee.vercel.app"
npm start
```

For a permanently configured copy, create `mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://lisbee.vercel.app
```

> Use the **deployed** site for the recording. Pointing the app at a local `next
> dev` server works only while that server is running, and a phone on mobile
> data cannot reach your computer at all.

## Testing the sync

1. `npm start`, scan the QR code, and open the app on the phone.
2. On the Account tab, sign in with the **same email** used on the website.
3. Go to Shop and add an item — the Cart tab badge updates immediately.
4. On your computer, open `https://lisbee.vercel.app/cart` and sign in with the
   same email. **The same item is there.**
5. Add another item on the website, wait ~5 seconds, and it appears on the phone
   without any refresh.
6. Change a quantity on the phone and check the website cart.

Sync is a 5-second poll on the phone and an 8-second poll on the web, plus an
immediate refresh on any action. That satisfies the "advanced" requirement of
instant synchronisation without the cost and complexity of a WebSocket server on
a serverless host.

## What to record

A screen recording showing: signing in on the phone → adding an item on the
website → the item appearing on the phone within seconds → changing the quantity
on the phone and seeing it on the website.

## Notes

- **Prices are always server-side.** The cart stores only a slug and a quantity;
  name, price and image are re-read from the products table on every response, so
  a tampered client cannot change what is charged.
- **Staff sign-in is still gated.** The mobile token route uses the same
  `ADMIN_ACCESS_CODE` check as the website (`lib/auth/staff-gate.ts`); an admin
  cannot obtain a mobile token without the code.
- **Guests can shop.** Without signing in, the app uses a guest cart, and signing
  in merges that cart into the account so nothing is lost.
