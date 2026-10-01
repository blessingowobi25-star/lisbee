import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, whatsappLink } from "@/lib/format";

/**
 * Policy pages are database-driven: the copy lives in the `pages` table so it
 * can be edited from the admin area without a deploy. If a page is missing the
 * visitor is told so honestly rather than shown an empty shell.
 */
export async function PolicyPage({ slug }: { slug: string }) {
  const [page, settings] = await Promise.all([db().getPage(slug), db().getSettings()]);

  if (!page) {
    return (
      <section className="shell py-20 text-center">
        <h1 className="text-3xl md:text-4xl">This page is being finalised</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
          We would rather say nothing than publish something wrong. Message us and we will answer
          your question directly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={whatsappLink(settings.whatsapp_number, "Hi LisBee, I have a question.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            WhatsApp us
          </a>
          <Link href="/contact" className="btn btn-outline">
            Contact
          </Link>
        </div>
      </section>
    );
  }

  const paragraphs = page.body
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="shell py-12 md:py-16">
      <div className="mx-auto max-w-3xl">
        <span className="eyebrow">Policies</span>
        <h1 className="mt-3 text-3xl md:text-5xl">{page.title}</h1>
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">
          Last updated {formatDate(page.updated_at)}
        </p>

        <div className="mt-9 space-y-5 text-sm leading-relaxed text-muted md:text-base">
          {paragraphs.map((paragraph, index) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2 key={index} className="pt-3 text-xl text-espresso">
                  {paragraph.replace(/^##\s+/, "")}
                </h2>
              );
            }
            return <p key={index}>{paragraph}</p>;
          })}
        </div>

        <div className="mt-12 rounded-3xl border border-line bg-ivory p-6">
          <h2 className="text-lg">Still not sure?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Message {settings.whatsapp_number} on WhatsApp or email {settings.email}. A person
            answers.
          </p>
        </div>
      </div>
    </section>
  );
}
