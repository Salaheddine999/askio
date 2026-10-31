import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, ArrowLeft } from "../../components/icons";
import { backLink } from "../dashboard/styles";
import { useLeftToRight } from "../../i18n";
import { COMPANY, hasPlaceholders, isPlaceholder } from "./company";

/** A company detail; unfilled placeholders are highlighted so they're easy to spot. */
export const Detail: React.FC<{ field: keyof typeof COMPANY }> = ({ field }) => {
  const value = COMPANY[field];
  if (!isPlaceholder(value)) return <>{value}</>;
  return (
    <mark className="rounded bg-amber-100 px-1 py-px font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
      {value}
    </mark>
  );
};

/** Text that still needs confirming: highlighted, with a "Confirm:" prefix, until `confirmed`. */
export const ToConfirm: React.FC<{ confirmed: boolean; children: React.ReactNode }> = ({ confirmed, children }) =>
  confirmed ? (
    <>{children}</>
  ) : (
    <mark className="rounded bg-amber-100 px-1 py-px text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
      [Confirm: {children}]
    </mark>
  );

/** The contact email, linked once it's filled in. */
export const ContactEmail: React.FC = () =>
  isPlaceholder(COMPANY.contactEmail) ? (
    <Detail field="contactEmail" />
  ) : (
    <a href={`mailto:${COMPANY.contactEmail}`} className="font-medium text-ink-900 underline underline-offset-2 dark:text-ink-70">
      {COMPANY.contactEmail}
    </a>
  );

export const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="mb-3 font-display text-[22px] leading-tight text-ink-900 dark:text-ink-70">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

export const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="list-disc space-y-2 pl-5 marker:text-ink-325">{children}</ul>
);

export const Term: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="font-semibold text-ink-900 dark:text-ink-70">{children}</strong>
);

interface LegalPageProps {
  title: string;
  description: string;
  intro: React.ReactNode;
  sections: { id: string; title: string }[];
  children: React.ReactNode;
}

export default function LegalPage({ title, description, intro, sections, children }: LegalPageProps) {
  // The legal pages are in English only, so they always read left to right.
  useLeftToRight({ english: true });
  return (
    <div className="min-h-screen bg-ink-30 px-4 py-12 sm:py-16 dark:bg-ink-875">
      <Helmet>
        <title>{title} | Askio</title>
        <meta name="description" content={description} />
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className={backLink}
        >
          <ArrowLeft size={14} />
          Back to Askio
        </Link>

        {hasPlaceholders ? (
          <div
            role="note"
            className="mt-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-100"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>
              <strong>Draft.</strong> Resolve the highlighted items (see <code>src/pages/legal/company.ts</code>) and have this
              reviewed before launch.
            </p>
          </div>
        ) : null}

        <h1 className="mt-8 font-display text-[clamp(2rem,5vw,2.75rem)] leading-tight text-ink-900 dark:text-ink-70">
          {title}
        </h1>
        <p className="mt-2 text-sm text-ink-545 dark:text-ink-325">
          Effective <Detail field="effectiveDate" />
        </p>

        <div className="mt-6 space-y-3 text-[15px] leading-7 text-ink-605 dark:text-ink-225">{intro}</div>

        <nav
          aria-label="On this page"
          className="mt-8 rounded-xl border border-ink-120 bg-ink-25 p-5 dark:border-ink-780 dark:bg-ink-850"
        >
          <p className="mb-3 text-xs font-medium text-ink-425">On this page</p>
          <ol className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ink-605 hover:text-ink-900 dark:text-ink-325 dark:hover:text-ink-70">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10 text-[15px] leading-7 text-ink-605 dark:text-ink-225">{children}</div>
      </div>
    </div>
  );
}
