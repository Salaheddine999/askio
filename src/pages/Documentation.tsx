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

interface Guide {
  id: string;
  title: string;
  summary: string;
  icon: LucideIcon;
  steps: React.ReactNode[];
  tip?: React.ReactNode;
  link?: { to: string; label: string };
  /** Plain text used for search, on top of the title and summary. */
  keywords: string;
}

const Field: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="rounded bg-[#E7EDF6] px-1.5 py-px text-[13px] font-medium text-[#101723] dark:bg-[#243040] dark:text-[#E7EDF6]">
    {children}
  </span>
);

const GUIDES: Guide[] = [
  {
    id: "create",
    title: "Create your first chatbot",
    summary: "Name it, write a greeting and choose where it appears.",
    icon: Rocket,
    link: { to: "/configure", label: "Create a chatbot" },
    keywords: "new name title position greeting initial message placeholder save general",
    steps: [
      <>Click <Field>New chatbot</Field> at the top of the sidebar. The chatbot editor opens on the <Field>General</Field> tab.</>,
      <>Give it a <Field>Chatbot Name</Field> (only you see this) and a <Field>Chatbot Title</Field>, which visitors see in the chat header.</>,
      <>Write the <Field>Initial Message</Field> visitors see when they open the chat, and the <Field>Input Placeholder</Field> shown in the message box.</>,
      <>Pick a <Field>Widget Position</Field>: bottom right, bottom left, top right or top left.</>,
      <>Click <Field>Save Configuration</Field>. Your chatbot now appears on the dashboard.</>,
    ],
    tip: <>The preview on the right updates as you type, so you can see exactly what visitors will see.</>,
  },
  {
    id: "faqs",
    title: "Add your FAQs",
    summary: "The questions and answers your chatbot replies with.",
    icon: ListChecks,
    keywords: "faq question answer add edit delete generate ai website url import",
    steps: [
      <>Open the <Field>FAQ</Field> tab in the chatbot editor.</>,
      <>Type a question and its answer, then add it. Repeat for each common question.</>,
      <>Use the edit and delete buttons next to an FAQ to change or remove it.</>,
      <>
        On Pro, you can generate FAQs with AI: paste your website's address and Askio reads the page and drafts questions
        and answers for you to review.
      </>,
    ],
    tip: (
      <>
        Write questions the way visitors ask them (&quot;How long does delivery take?&quot;), not as headings. Askio matches
        similar wording, so one FAQ covers many phrasings.
      </>
    ),
  },
  {
    id: "appearance",
    title: "Match your brand",
    summary: "Colours, launcher style and the greeting bubble.",
    icon: Palette,
    keywords: "appearance color colour gradient brand launcher kio orb classic greeting bubble style",
    steps: [
      <>Open the <Field>Appearance</Field> tab.</>,
      <>Choose a <Field>Primary Color</Field> and <Field>Secondary Color</Field>, or pick one of the <Field>Quick Colors</Field>.</>,
      <>Turn on <Field>Use Gradient Colors</Field> for a gradient, and set its start, end and angle.</>,
      <>Choose a <Field>Launcher Style</Field>: <strong>Classic</strong> (a chat button) or <strong>Kio</strong> (an orb in your colour whose eyes follow the visitor's pointer).</>,
      <>Turn on <Field>Show a greeting bubble</Field> to show your greeting next to the launcher a few seconds after the page loads.</>,
    ],
  },
  {
    id: "ai",
    title: "AI replies and persona",
    summary: "Let AI answer what your FAQs don't cover.",
    icon: Sparkles,
    keywords: "ai artificial intelligence persona tone personality replies limit pro gemini",
    steps: [
      <>AI features are part of the Pro plan. Upgrade from <Link to="/settings" className="font-medium underline underline-offset-2">Settings</Link> if you're on Free.</>,
      <>In the <Field>General</Field> tab, turn on <Field>Enable AI features for this chatbot</Field>.</>,
      <>Open the <Field>AI Persona</Field> tab to set your chatbot's personality and tone of voice.</>,
      <>
        Pro includes 3,000 AI replies a month across your chatbots. The dashboard shows how many you've used, and if you run
        out, your chatbots keep answering from your FAQs until the next month.
      </>,
    ],
    tip: <>AI uses your FAQs as its source, so better FAQs mean better AI answers.</>,
  },
  {
    id: "leads",
    title: "Capture leads and hand off to a person",
    summary: "Collect emails and offer a way to reach you.",
    icon: UserPlus,
    keywords: "lead capture email contact live chat link whatsapp handoff human support",
    steps: [
      <>In the <Field>General</Field> tab, turn on <Field>Enable Lead Capture</Field>. When the chatbot can't answer, it asks the visitor for their email.</>,
      <>Add a <Field>Live Chat Link</Field>, such as a WhatsApp link or <code className="text-[13px]">mailto:</code> address, so visitors can reach a person when the chatbot can't help.</>,
      <>Find collected emails on the <Link to="/analytics" className="font-medium underline underline-offset-2">Analytics</Link> page, where you can also export them as CSV.</>,
    ],
    tip: <>Mention in your website's privacy notice that you collect emails through the chatbot.</>,
  },
  {
    id: "install",
    title: "Put it on your website",
    summary: "WordPress, Shopify, Wix or any site.",
    icon: Blocks,
    link: { to: "/integrations", label: "Open Integrations" },
    keywords: "install embed code website wordpress shopify wix webflow squarespace html script body",
    steps: [
      <>Open <Link to="/integrations" className="font-medium underline underline-offset-2">Integrations</Link> and pick the chatbot to install.</>,
      <>Choose your platform: <strong>WordPress</strong> (install the plugin), <strong>Shopify</strong> (connect your store), <strong>Wix</strong> or <strong>Any website</strong> (paste the embed code).</>,
      <>For the embed code, paste it just before the closing <code className="text-[13px]">&lt;/body&gt;</code> tag, ideally in a shared footer or layout so it loads on every page.</>,
      <>Reload your site. The launcher appears in the corner you chose. Changes you save in Askio show up automatically.</>,
    ],
  },
  {
    id: "improve",
    title: "Track and improve",
    summary: "See what visitors ask and fill the gaps.",
    icon: BarChart3,
    link: { to: "/analytics", label: "Open Analytics" },
    keywords: "analytics stats performance unanswered questions answer rate reports csv improve",
    steps: [
      <>Open <Link to="/analytics" className="font-medium underline underline-offset-2">Analytics</Link> to see questions answered, your answer rate, unanswered questions and leads.</>,
      <>Check <Field>Couldn&apos;t answer</Field>: these are questions visitors asked that your chatbot had no answer for. Click <Field>Add answer</Field> to add one.</>,
      <>Download raw data from the <Field>Reports</Field> tab on the dashboard.</>,
    ],
    tip: <>A quick weekly look at unanswered questions is the fastest way to make your chatbot more useful.</>,
  },
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "The chatbot doesn't appear on my website",
    a: (
      <>
        Check that the code is inside the <code className="text-[13px]">&lt;body&gt;</code> of every page, that the chatbot is
        live (not paused) on your dashboard, and clear your site's cache if it uses one. Some site builders only show custom code
        on the published site, not in their editor preview.
      </>
    ),
  },
  {
    q: "My changes aren't showing on my site",
    a: <>Make sure you clicked Save Configuration, then reload your site. Changes apply automatically; you don't need to update the code.</>,
  },
  {
    q: "The chatbot gives the wrong answer",
    a: (
      <>
        Rewrite the FAQ so the question matches how visitors phrase it, or add a second FAQ for a different phrasing. For AI
        answers, make sure your FAQs cover the topic and adjust the AI Persona instructions.
      </>
    ),
  },
  {
    q: "AI replies stopped working",
    a: (
      <>
        You may have used this month's AI replies. Your dashboard shows your usage; your chatbots answer from FAQs until the
        limit resets on the 1st of the month.
      </>
    ),
  },
  {
    q: "Shopify says the app isn't approved",
    a: <>Askio is still in Shopify's review. It's safe to continue: click &quot;Install unlisted app&quot; at the bottom of Shopify's page.</>,
  },
];

const matches = (text: string, term: string) => text.toLowerCase().includes(term);

const Documentation: React.FC<{ toggleSidebar: () => void }> = () => {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const term = search.trim().toLowerCase();

  const guides = useMemo(
    () => (term ? GUIDES.filter((g) => matches(`${g.title} ${g.summary} ${g.keywords}`, term)) : GUIDES),
    [term]
  );
  const faqs = useMemo(() => (term ? FAQS.filter((f) => matches(f.q, term)) : FAQS), [term]);

  const embedCode = `<div id="chatbot-container"></div>
<script src="${window.location.origin}/chatbot-embed.js"></script>
<script>
  ChatbotEmbed.init("YOUR_CHATBOT_ID", "${window.location.origin}");
</script>`;

  const copyEmbed = () =>
    navigator.clipboard.writeText(embedCode).then(
      () => toast.success("Embed code copied"),
      () => toast.error("Couldn't copy the code.")
    );

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>Documentation | Askio</title>
        <meta name="description" content="How to create, customise and install your Askio chatbot." />
      </Helmet>

      <div className="w-full space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">Documentation</h1>
            <p className="mt-1 max-w-2xl text-body-sm text-[#566273] dark:text-[#9BAABD]">
              Everything you need to set up a chatbot, make it look like your brand and put it on your website.
            </p>
          </div>
          <SearchInput value={search} onChange={setSearch} placeholder="Search the docs" />
        </header>

        {!term && (
          <section aria-label="Quick start" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { to: "/configure", icon: Plus, title: "Create a chatbot", body: "Set the name, greeting and FAQs." },
              { to: "/integrations", icon: Blocks, title: "Add it to your site", body: "WordPress, Shopify, Wix or any site." },
              { to: "/analytics", icon: BarChart3, title: "See what visitors ask", body: "Answer rate, gaps and leads." },
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
          <nav aria-label="Guides" className="hidden lg:block">
            <div className="sticky top-6 space-y-0.5">
              <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-wider text-[#87909D]">Guides</p>
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
                  Troubleshooting
                </a>
              )}
            </div>
          </nav>

          <div className="min-w-0 max-w-3xl space-y-5">
            {guides.length === 0 && faqs.length === 0 ? (
              <div className={surface}>
                <EmptyState
                  icon={SearchX}
                  title="Nothing found"
                  description={`No guides mention “${search.trim()}”. Try another word, or email us and we'll help.`}
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
                      <p className="text-body-sm leading-relaxed text-[#566273] dark:text-[#B9C4D2]">{step}</p>
                    </li>
                  ))}
                </ol>

                {g.id === "install" && (
                  <div className="mt-5 overflow-hidden rounded-xl border border-[#243040] bg-[#101723]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                      <span className="text-caption font-medium text-[#9BAABD]">Embed code</span>
                      <button
                        type="button"
                        onClick={copyEmbed}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-md bg-white/10 px-2.5 text-caption font-medium text-[#E7EDF6] hover:bg-white/15 ${focusRing}`}
                      >
                        <Copy size={13} />
                        Copy
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-[#D7DFE5]">
                      <code>{embedCode}</code>
                    </pre>
                    <p className="border-t border-white/10 px-4 py-2 text-caption text-[#9BAABD]">
                      Replace <code>YOUR_CHATBOT_ID</code> with your chatbot's ID, or copy the ready-made code from Integrations.
                    </p>
                  </div>
                )}

                {g.tip && (
                  <p className="mt-5 flex gap-2.5 rounded-lg bg-[#F3F7FC] px-3.5 py-3 text-body-sm text-[#566273] dark:bg-[#141D2B] dark:text-[#9BAABD]">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>{g.tip}</span>
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
                    <h2 className="font-serif text-h3 leading-tight text-[#101723] dark:text-[#E7EDF6]">Troubleshooting</h2>
                    <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">Quick fixes for common problems.</p>
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
                          <p className="px-5 pb-4 text-body-sm leading-relaxed text-[#566273] sm:px-6 dark:text-[#B9C4D2]">{f.a}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <p className="flex items-center gap-2 px-1 text-body-sm text-[#647184] dark:text-[#87909D]">
              <Check size={15} className="text-emerald-500" />
              Still stuck? Email <a href="mailto:abw.salaheddine@gmail.com" className="font-medium text-[#101723] underline underline-offset-2 dark:text-[#D7DFE5]">abw.salaheddine@gmail.com</a> and we'll help.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
