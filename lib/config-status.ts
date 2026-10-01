/**
 * Which integrations are actually wired up.
 * Reports booleans only — never returns a key, a URL with credentials, or any
 * secret material. Safe to render in the admin area.
 */

export interface IntegrationStatus {
  key: string;
  label: string;
  configured: boolean;
  detail: string;
}

export function integrationStatus(): IntegrationStatus[] {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mailgunKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;

  return [
    {
      key: "database",
      label: "Database (Supabase)",
      configured: Boolean(supabaseUrl && service),
      detail: supabaseUrl && service
        ? "Connected — orders and catalogue persist in Supabase."
        : supabaseUrl
          ? "Half configured: add SUPABASE_SERVICE_ROLE_KEY. Orders are stored in the local file only."
          : "Not configured — running on the local file store (.data/db.json).",
    },
    {
      key: "google-auth",
      label: "Google sign-in",
      configured: Boolean(supabaseUrl && anon),
      detail:
        supabaseUrl && anon
          ? "Available — the sign-in page will show “Continue with Google”."
          : "Not configured — visitors sign in with email only.",
    },
    {
      key: "email",
      label: "Transactional email (Mailgun)",
      configured: Boolean(mailgunKey && mailgunDomain),
      detail:
        mailgunKey && mailgunDomain
          ? "Connected — order and enquiry emails are delivered."
          : "Not configured — emails are written to .data/outbox instead of being sent.",
    },
    {
      key: "admin-access",
      label: "Staff access code (ADMIN_ACCESS_CODE)",
      configured: Boolean(process.env.ADMIN_ACCESS_CODE),
      detail: process.env.ADMIN_ACCESS_CODE
        ? "Set — staff sign-in requires this code."
        : "Not set — in production this disables the admin area entirely, which is the safe default.",
    },
    {
      key: "site-url",
      label: "Public site URL",
      configured: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      detail: process.env.NEXT_PUBLIC_SITE_URL
        ? "Set — canonical links, sitemap and email links will use it."
        : "Not set — sitemap, canonical links and email links fall back to localhost.",
    },
    {
      key: "auth-secret",
      label: "Session secret (AUTH_SECRET)",
      configured: Boolean(process.env.AUTH_SECRET),
      detail: process.env.AUTH_SECRET
        ? "Set — sessions are signed with your own secret."
        : "Not set — a random secret is generated into .data/auth-secret. Set this before deploying.",
    },
  ];
}
