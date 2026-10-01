# Deploying LisBee to Vercel — a complete beginner's guide

This takes about **20 minutes**. It assumes you have never deployed anything before.

**What Vercel is:** a hosting service. It takes your code, builds it, and puts it on the
internet at a real web address. It has a free plan, and for a site like this you will not be
charged unless you go over their limits.

**What "deploying" means here:** Vercel copies your project from GitHub onto its own
computers, runs the build, and serves the result. Every time you push new code to GitHub, it
rebuilds and updates automatically.

---

## What you need first

| Thing | Why | Takes |
|-------|-----|-------|
| A **GitHub** account | Holds your code so Vercel can read it | 5 min |
| A **Vercel** account | Does the actual hosting | 2 min — sign up with GitHub and it's instant |
| A text editor | To create your two secret codes | 1 min |

You do **not** need to know any code for this. Copy each command exactly as written.

---

## Step 1 — Create your two secret codes

These are random passwords for your site. Generate them now.

Open **PowerShell** (press the Windows key, type `powershell`, press Enter) and run:

```powershell
node -e "console.log('AUTH_SECRET   =', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ADMIN_ACCESS_CODE =', require('crypto').randomBytes(18).toString('base64url'))"
```

**Copy both lines to a text file and keep them.** You will paste them into Vercel in step 5.
The second one becomes your staff login code — **write it down somewhere safe**, because
without it nobody (including you) can open the admin area.

---

## Step 2 — Put your code on GitHub

Your project is already a Git project with everything committed. It just isn't on GitHub yet.

**2a. Create an empty repository**

1. Go to <https://github.com> and sign in.
2. Top-right, click the **+** icon → **New repository**.
3. Name it `lisbee` (or anything you like).
4. **Tick "Private"** if you want the code hidden, or leave public — either is fine.
5. **Important:** do NOT tick "Add a README", "Add .gitignore" or "Choose a license". The
   box that says *"Initialize this repository with…"* must stay **unticked**, or Git will
   complain.
6. Click **Create repository**.

**2b. Connect your project to it**

Back in PowerShell, run these three commands. Replace `YOUR-GITHUB-USERNAME` with your actual
GitHub username.

```powershell
cd c:\Users\bless\LisBee
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/lisbee.git
git push -u origin main
```

> **If it asks you to sign in:** Git may open a browser to log in to GitHub. Allow access and
> come back. If you would rather not deal with that, see [Troubleshooting](#troubleshooting).

**How to know it worked:** PowerShell will print something like
`branch 'main' set up to track 'origin/main'`. Reload your GitHub repository page and you
will see your files.

---

## Step 3 — Create the Vercel project

1. Go to <https://vercel.com> → **Sign up** → continue with **GitHub**.
2. Once inside, click **Add New… → Project**.
3. Find your `lisbee` repository in the list and click **Import**.
4. On the setup screen, leave **Framework Preset** as `Next.js` and leave
   **Root Directory** blank. Click **Deploy**.

Vercel starts building straight away. **Your first build has no environment variables yet**,
so the site will go live but orders and admin sign-in will not work. That is expected — we
fix it in the next step. Wait for the green **Success** box, then note the URL it shows you
(looks like `https://lisbee-abc123.vercel.app`).

> This build usually takes 1–3 minutes. The log scrolls past a lot of text; that is normal.
> You are looking for the word **"Compiled successfully"** and finally **"Success"**.



---

## Step 4 — Add the environment variables

Environment variables are settings that live on the server rather than in your code. They are
where secrets go so they are never published.

1. In Vercel, open your project → **Settings** → **Environment Variables**.
2. Add each one below. For the **Environment** column, select **All Environments**
   (Production, Preview *and* Development) so future test deploys work too.
3. Press **Add** after each one.

| Name | Value | Required? |
|------|-------|-----------|
| `AUTH_SECRET` | the first code from step 1 | **Yes** |
| `ADMIN_ACCESS_CODE` | the second code from step 1 | **Yes** |
| `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://lisbee-abc123.vercel.app` | Recommended |

That is genuinely all you need to get a working site. The other variables in `.env.example`
(Supabase, Mailgun, Paystack) are for when you connect those services — see
[What still won't work yet](#what-still-wont-work-yet).

4. Click **Save**. Vercel will offer to **redeploy** — say yes.

> **Why these two matter:** `AUTH_SECRET` keeps people from forging login cookies. Without it,
> a random one is generated every time the site restarts, which signs you out constantly.
> `ADMIN_ACCESS_CODE` is the staff login code. If it is missing, the admin area refuses to open
> at all — that is the safe behaviour, not a bug.

---

## Step 5 — Check your live site

Open your Vercel URL in a **private/incognito window** and click through:

- [ ] The homepage loads and looks right on desktop and on your phone
- [ ] `/workweek` shows Premium ₦20,000, Signature ₦35,000, Executive ₦60,000
- [ ] Add something to the cart, then open `/cart` — the total is correct
- [ ] Go to `/checkout` and fill it in. **The order will be accepted.**
- [ ] You land on a payment-instructions page with an order number

Now test the admin area:

1. Go to `/sign-in`, expand **Staff sign-in**, and type:
   - Name: anything
   - Email: `admin@hellolisbee.com`
   - **Staff access code**: your code from step 1
2. You should land in `/admin` with the dashboard showing your test order.
3. In `/admin` you will see a **red warning about the local file store** — that is expected
   and explained below.

**Test that the lock works:** sign out, then try to sign in as
`admin@hellolisbee.com` *without* the code. You should get
*"That staff access code is not correct."* If you got in, something is wrong — check that
`ADMIN_ACCESS_CODE` is spelled exactly right.

---

## Step 6 — Add your own domain (optional, do this later)

Only worth doing once the site is behaving.

1. Vercel → your project → **Settings** → **Domains**.
2. Type your domain (e.g. `hellolisbee.com`) → **Add**.
3. Vercel shows you DNS records. At your domain registrar, add them exactly as shown.
4. Wait a few minutes to 24 hours, then Vercel shows a green tick.
5. Update `NEXT_PUBLIC_SITE_URL` in step 4 to your new domain and redeploy, so links in
   emails and the sitemap are correct.

---

## Troubleshooting

| What you see | What it means | What to do |
|---|---|---|
| `error: failed to push some refs` | GitHub rejected the push | Run `git pull --rebase origin main`, then push again |
| `Updates were rejected` | GitHub already has commits | Same fix as above |
| Build fails with a **font** error | Google Fonts was unreachable during the build | Click **Redeploy** in Vercel. Usually the second attempt works |
| Build fails with `MODULE_NOT_FOUND` | Dependencies out of date | Locally run `npm install`, commit the updated `package-lock.json`, push |
| Site loads but `/admin` sends you to sign-in | `ADMIN_ACCESS_CODE` is wrong or missing | Settings → Environment Variables → fix it → Redeploy |
| Orders disappear after a while | Supabase is not connected | See below — this is expected for now |
| "Too many checkout attempts" | You submitted too many times quickly | Wait 10 minutes; the limit is deliberate anti-spam protection |

**Rollback:** Vercel → **Deployments** → click the three dots on an earlier successful
build → **Promote to Production**. This instantly puts the site back to how it was.

---

## What still won't work yet

The site is fully live and browsable, but three things are deliberately switched off until
you connect paid services. None of them break the site — they just mean it cannot yet take
real money or send real email.

1. **Orders are not saved permanently.** Without Supabase, orders are written to a temporary
   file on Vercel's computer, which is wiped when the computer shuts down. Perfect for a
   demonstration; not for real customers. The red banner in `/admin` is warning you about
   exactly this. Full setup: [`LAUNCH.md`](LAUNCH.md) sections 2–3.
2. **No emails are sent.** Order confirmations are written to a log instead. You need a
   Mailgun account: [`LAUNCH.md`](LAUNCH.md) section 6.
3. **Payment is bank transfer only, and the account details are blank.** Enter them in
   `/admin` → **Settings** → **Bank details**. Until then the site honestly tells customers
   the details will be sent separately.

**Before you take a single real order**, work through
[`LAUNCH.md`](LAUNCH.md) — especially the "Before you go live" checklist in section 9.
