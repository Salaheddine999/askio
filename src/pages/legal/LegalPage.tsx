import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle, ArrowLeft } from "lucide-react";
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
    <a href={`mailto:${COMPANY.contactEmail}`} className="font-medium text-[#101723] underline underline-offset-2 dark:text-[#E7EDF6]">
      {COMPANY.contactEmail}
    </a>
  );

export const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="mb-3 font-serif text-[22px] leading-tight text-[#101723] dark:text-[#E7EDF6]">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

export const List: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="list-disc space-y-2 pl-5 marker:text-[#9BAABD]">{children}</ul>
);

export const Term: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="font-semibold text-[#101723] dark:text-[#E7EDF6]">{children}</strong>
);

interface LegalPageProps {
  title: string;
  description: string;
  intro: React.ReactNode;
  sections: { id: string; title: string }[];
  children: React.ReactNode;
}

export default function LegalPage({ title, description, intro, sections, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#F3F7FC] px-4 py-12 sm:py-16 dark:bg-[#141D2B]">
      <Helmet>
        <title>{title} | Askio</title>
        <meta name="description" content={description} />
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#E7EDF6]"
        >
          <ArrowLeft size={15} />
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

        <h1 className="mt-8 font-serif text-[clamp(2rem,5vw,2.75rem)] leading-tight text-[#101723] dark:text-[#E7EDF6]">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[#647184] dark:text-[#9BAABD]">
          Effective <Detail field="effectiveDate" />
        </p>

        <div className="mt-6 space-y-3 text-[15px] leading-7 text-[#566273] dark:text-[#B9C4D2]">{intro}</div>

        <nav
          aria-label="On this page"
          className="mt-8 rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-5 dark:border-[#2B3646] dark:bg-[#1A2533]"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.08em] text-[#87909D]">On this page</p>
          <ol className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#E7EDF6]">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10 text-[15px] leading-7 text-[#566273] dark:text-[#B9C4D2]">{children}</div>
      </div>
    </div>
  );
}
