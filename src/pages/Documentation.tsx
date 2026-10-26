import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
  Sparkles,
  UserPlus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { EmptyState, SearchInput, focusRing, surface } from "./dashboard/ui";
import { useT } from "../i18n";
import { docsMessages } from "../i18n/messages/docs";
import { docsContent, type GuideContent, type GuideId } from "../i18n/messages/docs-content";

interface Guide extends GuideContent {
  id: GuideId;
  icon: LucideIcon;
  link?: { to: string; label: string };
}

const GUIDE_ORDER: { id: GuideId; icon: LucideIcon; to?: string }[] = [
  { id: "create", icon: Rocket, to: "/configure" },
  { id: "faqs", icon: ListChecks },
  { id: "appearance", icon: Palette },
  { id: "ai", icon: Sparkles },
  { id: "leads", icon: UserPlus },
  { id: "install", icon: Blocks, to: "/integrations" },
  { id: "improve", icon: BarChart3, to: "/analytics" },
];

const Field: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded bg-[#E7EDF6] px-1.5 py-px text-[13px] font-medium text-[#101723] dark:bg-[#243040] dark:text-[#E7EDF6]">
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

  const embedCode = `<div id="chatbot-container"></div>
<script src="${window.location.origin}/chatbot-embed.js"></script>
<script>
  ChatbotEmbed.init("YOUR_CHATBOT_ID", "${window.location.origin}");
</script>`;

  const copyEmbed = () =>
    navigator.clipboard.writeText(embedCode).then(
      () => toast.success(t("copied")),
      () => toast.error(t("copyFailed"))
    );

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>{t("metaTitle")}</title>
        <meta name="description" content={t("metaDescription")} />
      </Helmet>

      <div className="w-full space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">{t("title")}</h1>
            <p className="mt-1 max-w-2xl text-body-sm text-[#566273] dark:text-[#9BAABD]">
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
                className={`group flex items-start gap-3 ${surface} p-4 transition-colors hover:border-[#B8C3D1] dark:hover:border-[#39485B] ${focusRing}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
                  <q.icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-body-sm font-semibold text-[#101723] dark:text-[#E7EDF6]">
                    <span className="text-[#87909D]">{i + 1}.</span> {q.title}
                    <ArrowRight size={14} className="text-[#87909D] transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-0.5 block text-caption text-[#647184] dark:text-[#87909D]">{q.body}</span>
                </span>
              </Link>
            ))}
          </section>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Contents */}
          <nav aria-label={t("guides")} className="hidden lg:block">
            <div className="sticky top-6 space-y-0.5">
              <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-[#87909D]">{t("guides")}</p>
              {guides.map((g) => (
                <a
                  key={g.id}
                  href={`#${g.id}`}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-sm text-[#566273] transition-colors hover:bg-[#E7EDF6]/70 hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#1F2B3A] dark:hover:text-[#D7DFE5] ${focusRing}`}
                >
                  <g.icon size={14} className="shrink-0 opacity-70" />
                  <span className="truncate">{g.title}</span>
                </a>
              ))}
              {faqs.length > 0 && (
                <a
                  href="#troubleshooting"
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-body-sm text-[#566273] transition-colors hover:bg-[#E7EDF6]/70 hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#1F2B3A] dark:hover:text-[#D7DFE5] ${focusRing}`}
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
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] text-[#243040] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5]">
                    <g.icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-h3 leading-tight text-[#101723] dark:text-[#E7EDF6]">{g.title}</h2>
                    <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">{g.summary}</p>
                  </div>
                  {g.link && (
                    <Link
                      to={g.link.to}
                      className={`hidden shrink-0 items-center gap-1 rounded-lg border border-[#D8DFE9] px-2.5 py-1.5 text-caption font-medium text-[#101723] transition-colors hover:bg-[#F3F7FC] sm:inline-flex dark:border-[#2B3646] dark:text-[#D7DFE5] dark:hover:bg-[#273444] ${focusRing}`}
                    >
                      {g.link.label}
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>

                <ol className="mt-5 space-y-3.5">
                  {g.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E7EDF6] text-[11px] font-semibold tabular-nums text-[#243040] dark:bg-[#243040] dark:text-[#D7DFE5]">
                        {i + 1}
                      </span>
                      <p className="text-body-sm leading-relaxed text-[#566273] dark:text-[#B9C4D2]">{rich(step)}</p>
                    </li>
                  ))}
                </ol>

                {g.id === "install" && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-[#243040] bg-[#101723]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                      <span className="text-caption font-medium text-[#9BAABD]">{t("embedCode")}</span>
                      <button
                        type="button"
                        onClick={copyEmbed}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-caption font-medium text-[#E7EDF6] hover:bg-white/15 ${focusRing}`}
                      >
                        <Copy size={13} />
                        {t("copy")}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-[#D7DFE5]">
                      <code>{embedCode}</code>
                    </pre>
                    <p className="border-t border-white/10 px-4 py-2 text-caption text-[#9BAABD]">
                      {t("embedNoteBefore")} <code>YOUR_CHATBOT_ID</code> {t("embedNoteAfter")}
                    </p>
                  </div>
                )}

                {g.tip && (
                  <p className="mt-5 flex gap-2.5 rounded-lg bg-[#F3F7FC] px-3.5 py-3 text-body-sm text-[#566273] dark:bg-[#141D2B] dark:text-[#9BAABD]">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>{rich(g.tip)}</span>
                  </p>
                )}
              </section>
            ))}

            {faqs.length > 0 && (
              <section id="troubleshooting" className={`${surface} scroll-mt-6 overflow-hidden`}>
                <div className="flex items-start gap-3 p-5 pb-3 sm:p-6 sm:pb-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] text-[#243040] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5]">
                    <HelpCircle size={17} />
                  </span>
                  <div>
                    <h2 className="font-serif text-h3 leading-tight text-[#101723] dark:text-[#E7EDF6]">{t("troubleshooting")}</h2>
                    <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">{t("troubleshootingSummary")}</p>
                  </div>
                </div>
                <ul className="divide-y divide-[#E7EDF6] border-t border-[#E7EDF6] dark:divide-[#2B3646] dark:border-[#2B3646]">
                  {faqs.map((f, i) => {
                    const open = openFaq === i;
                    return (
                      <li key={f.q}>
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenFaq(open ? null : i)}
                          className={`flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-body-sm font-medium text-[#101723] hover:bg-[#F3F7FC]/70 sm:px-6 dark:text-[#E7EDF6] dark:hover:bg-[#1F2B3A] ${focusRing}`}
                        >
                          {f.q}
                          <ChevronDown size={16} className={`shrink-0 text-[#87909D] transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <p className="px-5 pb-4 text-body-sm leading-relaxed text-[#566273] sm:px-6 dark:text-[#B9C4D2]">{rich(f.a)}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <p className="flex items-center gap-2 px-1 text-body-sm text-[#647184] dark:text-[#87909D]">
              <Check size={15} className="text-emerald-500" />
              {t("stillStuckBefore")} <a href="mailto:abw.salaheddine@gmail.com" className="font-medium text-[#101723] underline underline-offset-2 dark:text-[#D7DFE5]">abw.salaheddine@gmail.com</a> {t("stillStuckAfter")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
