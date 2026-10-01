import { db } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";
import { integrationStatus } from "@/lib/config-status";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await db().getSettings();
  const integrations = integrationStatus();
  const missing = integrations.filter((item) => !item.configured);

  return (
    <div>
      <h2 className="text-2xl">Settings</h2>
      <p className="mt-1 text-sm text-muted">
        Contact channels, bank details, delivery cities and the margin target used by the product
        editor.
      </p>

      <section className="mt-7 rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Launch readiness</h2>
          <span
            className={`pill ${
              missing.length === 0 ? "bg-olive text-cream" : "bg-honey/20 text-honey-deep"
            }`}
          >
            {missing.length === 0
              ? "All integrations ready"
              : `${missing.length} item(s) outstanding`}
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {integrations.map((item) => (
            <li key={item.key} className="flex items-start gap-3 text-sm">
              <span className={item.configured ? "text-olive" : "text-honey-deep"}>
                {item.configured ? "✓" : "○"}
              </span>
              <span>
                <span className="font-medium text-espresso">{item.label}</span>
                <span className="block text-xs text-muted">{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        {missing.length > 0 && (
          <p className="mt-5 rounded-2xl bg-ivory px-4 py-3 text-xs leading-relaxed text-muted">
            These are read from environment variables, never from the database — see
            <code className="mx-1">.env.example</code> for the full list. The admin key is checked
            in the hosting provider&apos;s environment settings, not in the repo.
          </p>
        )}
      </section>

      <div className="mt-7">
        <SettingsForm settings={settings} />
      </div>
      <p className="mt-8 rounded-2xl bg-ivory px-4 py-3 text-xs leading-relaxed text-muted">
        API keys never live in the database. Supabase, Mailgun and Paystack are read from
        environment variables (see <code>.env.example</code>) and are only used server-side.
      </p>
    </div>
  );
}

