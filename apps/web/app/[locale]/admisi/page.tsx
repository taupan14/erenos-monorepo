import { ACADEMIC_LEVELS } from "@erenos/shared";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PageBanner } from "@/components/ui/PageBanner";
import { Reveal } from "@/components/ui/Reveal";
import { getAdmission, getSiteSettings } from "@/lib/data";
import { localeHref } from "@/lib/i18n";
import { loc } from "@/lib/localize";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await resolveLocale(params), "admission", "/admisi");
}

const h2 =
  "mb-5 font-serif text-[clamp(1.5rem,3vw,1.875rem)] font-bold text-deep";

export default async function AdmissionPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const [rows, settings] = await Promise.all([
    getAdmission(),
    getSiteSettings(),
  ]);

  const steps = rows.filter((r) => r.section === "step");
  const faqs = rows.filter((r) => r.section === "faq");
  const notes = rows.filter((r) => r.section === "note");

  // Matriks persyaratan: satu baris per dokumen; level kosong = berlaku untuk semua jenjang
  const reqs = new Map<string, { all: boolean; levels: Set<string> }>();
  for (const r of rows.filter((x) => x.section === "requirement")) {
    const title = loc(r, "title", locale) ?? r.title;
    const entry = reqs.get(title) ?? { all: false, levels: new Set<string>() };
    if (r.level) entry.levels.add(r.level);
    else entry.all = true;
    reqs.set(title, entry);
  }

  return (
    <>
      <PageBanner
        title={m.pages.admission.title}
        highlight={m.pages.admission.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.admission },
        ]}
        m={m}
      />

      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="min-w-0">
          {settings && !settings.admission_open && (
            <p
              role="status"
              className="mb-8 rounded-xl bg-soft px-5 py-4 text-sm font-semibold text-deep"
            >
              {m.admission.closedNotice}
            </p>
          )}

          {/* Alur: garis waktu vertikal */}
          <section>
            <h2 className={h2}>{m.admission.flowTitle}</h2>
            {steps.length === 0 ? (
              <p className="text-muted">{m.admission.flowEmpty}</p>
            ) : (
              <ol className="relative ml-3 border-l-2 border-[#c5d1e8] pl-8">
                {steps.map((s, i) => (
                  <li key={s.id} className="relative pb-5 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[41px] top-5 size-3.5 rounded-full border-[3px] border-white bg-accent shadow-[0_0_0_1.5px_var(--accent)]"
                    />
                    <Reveal delay={i * 60}>
                      <div className="rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(20,41,90,0.12)]">
                        <p className="font-bold text-deep">
                          <span className="mr-2 text-primary">{i + 1}.</span>
                          {loc(s, "title", locale) ?? s.title}
                        </p>
                        {loc(s, "body", locale) && (
                          <p className="mt-1 text-sm leading-relaxed text-muted">
                            {loc(s, "body", locale)}
                          </p>
                        )}
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Persyaratan: matriks dokumen x jenjang */}
          <section id="persyaratan" className="mt-12 scroll-mt-28">
            <h2 className={h2}>{m.admission.reqTitle}</h2>
            {reqs.size === 0 ? (
              <p className="text-muted">{m.admission.reqEmpty}</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-soft text-deep">
                      <th scope="col" className="px-4 py-3 text-left font-bold">
                        {m.admission.reqDoc}
                      </th>
                      {ACADEMIC_LEVELS.map((l) => (
                        <th
                          key={l.code}
                          scope="col"
                          className="px-3 py-3 text-center font-bold"
                        >
                          {m.levels.items[l.code].short}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...reqs.entries()].map(([title, e]) => (
                      <tr key={title} className="border-t border-line">
                        <th
                          scope="row"
                          className="px-4 py-3 text-left font-medium text-ink"
                        >
                          {title}
                        </th>
                        {ACADEMIC_LEVELS.map((l) => {
                          const yes = e.all || e.levels.has(l.code);
                          return (
                            <td
                              key={l.code}
                              className={`px-3 py-3 text-center ${yes ? "font-bold text-primary" : "text-[#9aa5bd]"}`}
                            >
                              <span aria-hidden>{yes ? "✓" : "–"}</span>
                              <span className="sr-only">{yes ? "✓" : "–"}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {faqs.length > 0 && (
            <section className="mt-12">
              <h2 className={h2}>{m.admission.faqTitle}</h2>
              <div className="border-b border-line">
                {faqs.map((f) => (
                  <details
                    key={f.id}
                    className="group border-t border-line py-4"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-deep [&::-webkit-details-marker]:hidden">
                      {loc(f, "title", locale) ?? f.title}
                      <span
                        aria-hidden
                        className="text-xl text-primary transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">
                      {loc(f, "body", locale)}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {notes.length > 0 && (
            <section className="mt-12 rounded-2xl bg-soft p-6">
              <h2 className="mb-3 font-serif text-xl font-bold text-deep">
                {m.admission.notesTitle}
              </h2>
              {notes.map((n) => (
                <p
                  key={n.id}
                  className="mb-2 whitespace-pre-line leading-relaxed text-muted last:mb-0"
                >
                  <b className="text-deep">
                    {loc(n, "title", locale) ?? n.title}
                  </b>{" "}
                  {loc(n, "body", locale)}
                </p>
              ))}
            </section>
          )}
        </div>

        {/* Formulir menempel di kanan */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(20,41,90,0.14)] sm:p-7">
            <h2 className="font-serif text-xl font-bold text-deep">
              {m.admission.formTitle}
            </h2>
            <p className="mb-5 mt-1 text-sm text-muted">
              {m.admission.formIntro}
            </p>
            <InquiryForm variant="admission" />
          </div>
        </aside>
      </div>
    </>
  );
}
