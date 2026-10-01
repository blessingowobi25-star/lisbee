import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { EnquiryActions, EnquiryContactLink } from "@/components/admin/enquiry-actions";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const enquiries = await db().listEnquiries();

  return (
    <div>
      <h2 className="text-2xl">Corporate enquiries</h2>
      <p className="mt-1 text-sm text-muted">
        Every submission from the corporate form, newest first.
      </p>

      {enquiries.length === 0 ? (
        <p className="mt-6 rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center text-sm text-muted">
          No enquiries yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id} className="rounded-3xl border border-line bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg">{enquiry.company}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {enquiry.name} · {enquiry.work_email} · {enquiry.phone}
                  </p>
                </div>
                <div className="w-44">
                  <EnquiryActions enquiryId={enquiry.id} status={enquiry.status} />
                </div>
              </div>

              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
                {[
                  { label: "Recipients", value: enquiry.recipients_count || "—" },
                  { label: "Occasion", value: enquiry.occasion || "—" },
                  { label: "City", value: enquiry.city || "—" },
                  { label: "Budget", value: enquiry.budget_per_recipient || "—" },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                      {item.label}
                    </dt>
                    <dd className="mt-1">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {enquiry.message && (
                <p className="mt-4 rounded-2xl bg-ivory px-4 py-3 text-sm leading-relaxed text-muted">
                  {enquiry.message}
                </p>
              )}
              {enquiry.requirements && (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  <span className="uppercase tracking-[0.14em]">Requirements: </span>
                  {enquiry.requirements}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
                <EnquiryContactLink enquiry={enquiry} />
                <span>
                  Preferred date: {enquiry.preferred_delivery_date || "flexible"}
                </span>
                <span>Received {formatDate(enquiry.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
