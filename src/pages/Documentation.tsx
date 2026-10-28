import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { embedCodeFor } from "../utils/embedCode";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Check,
  ChevronDown,
  Copy,
  HelpCircle,
  Lightbulb,
  ListChecks,
  LucideIcon,
  Palette,
  Plus,
  Rocket,
  SearchX,
  UserPlus,
  Languages,
  MessagesSquare,
} from "../components/icons";
import { toast } from "react-hot-toast";
import { EmptyState, SearchInput, focusRing, surface } from "./dashboard/ui";
import { useT } from "../i18n";
import { docsMessages } from "../i18n/messages/docs";
import { docsContent, type GuideContent, type GuideId } from "../i18n/messages/docs-content";
import { COMPANY } from "./legal/company";
import { AiIcon } from "../components/icons";

interface Guide extends GuideContent {
  id: GuideId;
  icon: LucideIcon;
  link?: { to: string; label: string };
}

const GUIDE_ORDER: { id: GuideId; icon: LucideIcon; to?: string }[] = [
  { id: "create", icon: Rocket, to: "/configure" },
  { id: "faqs", icon: ListChecks },
  { id: "appearance", icon: Palette },
  { id: "ai", icon: AiIcon },
  { id: "leads", icon: UserPlus },
  { id: "install", icon: Blocks, to: "/integrations" },
  { id: "improve", icon: BarChart3, to: "/analytics" },
  { id: "conversations", icon: MessagesSquare, to: "/conversations" },
  { id: "languages", icon: Languages },
];

const Field: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded bg-ink-70 px-1.5 py-px text-[13px] font-medium text-ink-900 dark:bg-ink-805 dark:text-ink-70">
    {children}
  </span>
);

// Renders the small markup used in docs-content.ts: {{Field}}, **bold**,
// `code` and [label](/path).
const TOKEN = /(\{\{[^}]+\}\}|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

const rich = (text: string): React.ReactNode =>
  text.split(TOKEN).map((part, i) => {
    if (part.startsWith("{{") && part.endsWith("}}")) return <Field key={i}>{part.slice(2, -2)}</Field>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1)
      return (
        <code key={i} className="text-[13px]">
          {part.slice(1, -1)}
        </code>
      );
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link)
      return (
        <Link key={i} to={link[2]} className="font-medium underline underline-offset-2">
          {link[1]}
        </Link>
      );
    return part;
  });

/** The markup stripped, for searching. */
const plain = (text: string) =>
  text.replace(/\{\{|\}\}|\*\*|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

const matches = (text: string, term: string) => text.toLowerCase().includes(term);

const Documentation: React.FC<{ toggleSidebar: () => void }> = () => {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const t = useT(docsMessages);
  const term = search.trim().toLowerCase();
  const content = docsContent[t.lang] || docsContent.en;

  const allGuides = useMemo<Guide[]>(
    () =>
      GUIDE_ORDER.map(({ id, icon, to }) => {
        const g = content.guides[id];
        return { ...g, id, icon, link: to && g.linkLabel ? { to, label: g.linkLabel } : undefined };
      }),
    [content]
  );

  const guides = useMemo(
    () =>
      term
        ? allGuides.filter((g) =>
            matches(plain(`${g.title} ${g.summary} ${g.keywords} ${g.steps.join(" ")} ${g.tip || ""}`), term)
          )
        : allGuides,
    [term, allGuides]
  );
  const faqs = useMemo(
    () => (term ? content.faqs.filter((f) => matches(plain(`${f.q} ${f.a}`), term)) : content.faqs),
    [term, content]
  );

  const embedCode = embedCodeFor("YOUR_CHATBOT_ID");

  const copyEmbed = () =>
    navigator.clipboard.writeText(embedCode).then(
      () => toast.success(t("copied")),
      () => toast.error(t("copyFailed"))
    );

  return (
    <div className="min-h-screen bg-ink-30 font-sans text-ink-900 dark:bg-ink-875">
      <Helmet>
        <title>{t("metaTitle")}</title>
        <meta name="description" content={t("metaDescription")} />
      </Helmet>

      <div className="w-full space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-h2 tracking-tight text-ink-900 sm:text-h1 dark:text-ink-130">{t("title")}</h1>
            <p className="mt-1 max-w-2xl text-body-sm text-fg-muted">
              {t("intro")}
            </p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder={t("searchPlaceholder")} />
        </header>

        {!term && (
          <section aria-label={t("quickStart")} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { to: "/configure", icon: Plus, title: t("quickCreateTitle"), body: t("quickCreateBody") },
              { to: "/integrations", icon: Blocks, title: t("quickInstallTitle"), body: t("quickInstallBody") },
              { to: "/analytics", icon: BarChart3, title: t("quickAnalyticsTitle"), body: t("quickAnalyticsBody") },
            ].map((q, i) => (
              <Link
                key={q.to}
                to={q.to}
                className={`group flex items-start gap-3 ${surface} p-4 transition-colors hover:border-ink-230 dark:hover:border-ink-710 ${focusRing}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875">
                  <q.icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-body-sm font-semibold text-ink-900 dark:text-ink-70">
                    <span className="text-ink-425">{i + 1}.</span> {q.title}
                    <ArrowRight size={14} className="text-ink-425 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-0.5 block text-caption text-fg-subtle">{q.body}</span>
                </span>
              </Link>
            ))}
          </section>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Contents */}
          <nav aria-label={t("guides")} className="hidden lg:block">
            <div className="sticky top-6 space-y-0.5">
              <p className="mb-2 px-2.5 text-caption font-medium text-ink-425">{t("guides")}</p>
              {guides.map((g) => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-sm text-ink-605 transition-colors hover:bg-ink-70/70 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-825 dark:hover:text-ink-130 ${focusRing}`}
                >
                  <g.icon size={14} className="shrink-0 opacity-70" />
                  <span className="truncate">{g.title}</span>
                </a>
              ))}
              {faqs.length > 0 && (
                <a
                  href="#troubleshooting"
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-sm text-ink-605 transition-colors hover:bg-ink-70/70 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-825 dark:hover:text-ink-130 ${focusRing}`}
                >
                  <HelpCircle size={14} className="shrink-0 opacity-70" />
                  {t("troubleshooting")}
                </a>
              )}
            </div>
          </nav>

          <div className="min-w-0 max-w-3xl space-y-5">
            {guides.length === 0 && faqs.length === 0 ? (
              <div className={surface}>
                <EmptyState
                  icon={SearchX}
                  title={t("nothingFound")}
                  description={t("nothingFoundBody", { term: search.trim() })}
                />
              </div>
            ) : null}

            {guides.map((g) => (
              <section key={g.id} id={g.id} className={`${surface} scroll-mt-6 p-5 sm:p-6`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-120 bg-ink-30 text-ink-805 dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130">
                    <g.icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-h3 leading-tight text-ink-900 dark:text-ink-70">{g.title}</h2>
                    <p className="mt-0.5 text-body-sm text-fg-subtle">{g.summary}</p>
                  </div>
                  {g.link && (
                    <Link
                      to={g.link.to}
                      className={`hidden shrink-0 items-center gap-1 rounded-lg border border-ink-120 px-2.5 py-1.5 text-caption font-medium text-ink-900 transition-colors hover:bg-ink-30 sm:inline-flex dark:border-ink-780 dark:text-ink-130 dark:hover:bg-ink-790 ${focusRing}`}
                    >
                      {g.link.label}
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>

                <ol className="mt-5 space-y-3.5">
                  {g.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full pt-px bg-ink-70 text-caption font-semibold leading-none tabular-nums text-ink-805 dark:bg-ink-805 dark:text-ink-130">
                        {i + 1}
                      </span>
                      <p className="text-body-sm leading-relaxed text-ink-605 dark:text-ink-225">{rich(step)}</p>
                    </li>
                  ))}
                </ol>

                {g.id === "install" && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-ink-805 bg-ink-900">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                      <span className="text-caption font-medium text-ink-325">{t("embedCode")}</span>
                      <button
                        type="button"
                        onClick={copyEmbed}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-caption font-medium text-ink-70 hover:bg-white/15 ${focusRing}`}
                      >
                        <Copy size={13} />
                        {t("copy")}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-ink-130">
                      <code>{embedCode}</code>
                    </pre>
                    <p className="border-t border-white/10 px-4 py-2 text-caption text-ink-325">
                      {t("embedNoteBefore")} <code>YOUR_CHATBOT_ID</code> {t("embedNoteAfter")}
                    </p>
                  </div>
                )}

                {g.tip && (
                  <p className="mt-5 flex gap-2.5 rounded-lg bg-ink-30 px-3.5 py-3 text-body-sm text-ink-605 dark:bg-ink-875 dark:text-ink-325">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>{rich(g.tip)}</span>
                  </p>
                )}
              </section>
            ))}

            {faqs.length > 0 && (
              <section id="troubleshooting" className={`${surface} scroll-mt-6 overflow-hidden`}>
                <div className="flex items-start gap-3 p-5 pb-3 sm:p-6 sm:pb-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-120 bg-ink-30 text-ink-805 dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130">
                    <HelpCircle size={17} />
                  </span>
                  <div>
                    <h2 className="font-display text-h3 leading-tight text-ink-900 dark:text-ink-70">{t("troubleshooting")}</h2>
                    <p className="mt-0.5 text-body-sm text-fg-subtle">{t("troubleshootingSummary")}</p>
                  </div>
                </div>
                <ul className="divide-y divide-ink-70 border-t border-ink-70 dark:divide-ink-780 dark:border-ink-780">
                  {faqs.map((f, i) => {
                    const open = openFaq === i;
                    return (
                      <li key={f.q}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenFaq(open ? null : i)}
                          className={`flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-body-sm font-medium text-ink-900 hover:bg-ink-30/70 sm:px-6 dark:text-ink-70 dark:hover:bg-ink-825 ${focusRing}`}
                        >
                          {f.q}
                          <ChevronDown size={16} className={`shrink-0 text-ink-425 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <p className="px-5 pb-4 text-body-sm leading-relaxed text-ink-605 sm:px-6 dark:text-ink-225">{rich(f.a)}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <p className="flex items-center gap-2 px-1 text-body-sm text-fg-subtle">
              <Check size={15} className="text-emerald-500" />
              {t("stillStuckBefore")} <a href={`mailto:${COMPANY.contactEmail}`} className="font-medium text-ink-900 underline underline-offset-2 dark:text-ink-130">{COMPANY.contactEmail}</a> {t("stillStuckAfter")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
