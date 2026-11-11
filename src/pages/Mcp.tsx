import { useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Check, Copy, ShieldCheck } from "../components/icons";
import { backLink, surface } from "./dashboard/styles";
import { useLeftToRight } from "../i18n";
import AgentStart from "./home/AgentStart";
import { ChatGptLogo, ClaudeLogo, CodexLogo, CursorLogo, GeminiLogo, GrokLogo } from "./home/agentLogos";

// Public page about Askio's MCP server (/api/mcp): what it is, how to connect
// it from each AI app, what it can do, and how access is controlled. The tool
// list mirrors api/_lib/mcp/tools.js; keep the two in step.

const MCP_URL = "https://www.getaskio.xyz/api/mcp";

type Logo = ComponentType<{ size?: number | string; className?: string }>;

const STEPS = [
  { title: "Connect", text: "Add Askio's server address to your AI app as a connector." },
  { title: "Allow access", text: "Sign in to Askio, or create a free account, and click Allow access." },
  { title: "Just ask", text: "Tell your AI about your business. It builds the chatbot and gives you the install code." },
];

const CLIENTS: { name: string; logo: Logo; steps: ReactNode }[] = [
  { name: "Claude", logo: ClaudeLogo, steps: "Settings > Connectors > Add custom connector, then paste the address." },
  {
    name: "ChatGPT",
    logo: ChatGptLogo,
    steps: "Settings > Connectors (turn on Developer mode if asked), then add a custom connector with the address.",
  },
  {
    name: "Claude Code",
    logo: ClaudeLogo,
    steps: <code className="break-all text-[13px]">claude mcp add --transport http askio {MCP_URL}</code>,
  },
  { name: "Cursor", logo: CursorLogo, steps: "Add the address as a remote (HTTP) MCP server in the MCP settings." },
  { name: "Codex", logo: CodexLogo, steps: "Add the address as an MCP server in its configuration." },
  { name: "Gemini and Grok", logo: GeminiLogo, steps: "Add the address as an MCP server or connector where the app supports it." },
];

const TOOL_GROUPS: { title: string; tools: { name: string; text: string }[] }[] = [
  {
    title: "Set up",
    tools: [
      { name: "list_chatbots", text: "See the chatbots in your account." },
      { name: "get_chatbot", text: "Read a chatbot's settings, FAQs and install code." },
      { name: "create_chatbot", text: "Create a chatbot, optionally with its first FAQs." },
      { name: "update_chatbot", text: "Change its look, language, messages and options." },
    ],
  },
  {
    title: "Teach it",
    tools: [
      { name: "add_faqs", text: "Add questions and answers, keeping the existing ones." },
      { name: "replace_faqs", text: "Replace the whole FAQ list." },
      { name: "generate_faqs_from_website", text: "Read a website and draft FAQs from it." },
    ],
  },
  {
    title: "Launch and improve",
    tools: [
      { name: "get_install_code", text: "The line of HTML that puts the chatbot on your site." },
      { name: "list_unanswered_questions", text: "What visitors asked that no FAQ answered." },
    ],
  },
];

const PROMPTS = [
  "Create a chatbot for my bakery and write its FAQs from my website.",
  "What did visitors ask this week that my chatbot couldn't answer?",
  "Add an FAQ about our return policy, then give me the install code.",
];

const FAQ: { q: string; a: ReactNode }[] = [
  { q: "What is MCP?", a: "The Model Context Protocol is an open standard that lets AI apps connect to other services. Askio's server lets your AI manage your chatbots for you." },
  { q: "Do I need an API key?", a: "No. You sign in and click Allow access. Developers who prefer keys can create one in Settings." },
  { q: "Can the AI see other people's data?", a: "No. It only works inside your own account, on your own chatbots." },
  { q: "How do I disconnect an app?", a: <>Open <Link to="/settings" className="font-medium text-ink-900 underline underline-offset-2 dark:text-ink-70">Settings</Link> and disconnect it under Connect your AI. Access stops right away.</> },
  { q: "Does it cost anything?", a: "The server is free to use. Your chatbot's plan limits apply as usual, so Pro features such as AI answers still need Pro." },
];

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-425";

const Section = ({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) => (
  <section>
    <h2 className="font-display text-[24px] leading-tight text-ink-900 dark:text-ink-70">{title}</h2>
    {intro ? <p className="mt-2 text-[15px] leading-7 text-ink-605 dark:text-ink-225">{intro}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
);

export default function Mcp() {
  useLeftToRight({ english: true });
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the address can be selected by hand.
    }
  };

  return (
    <div className="min-h-screen bg-ink-30 px-4 py-12 sm:py-16 dark:bg-ink-875">
      <Helmet>
        <title>MCP: build your chatbot with your AI | Askio</title>
        <meta
          name="description"
          content="Connect Claude, ChatGPT, Cursor or any MCP app to Askio. Your AI creates your chatbot, writes its FAQs and gives you the install code. No API key."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl">
        <Link to="/" className={backLink}>
          <ArrowLeft size={14} />
          Back to Askio
        </Link>

        {/* Hero */}
        <header className="mt-8">
          <div className="flex items-center text-ink-900 dark:text-ink-70" aria-hidden="true">
            {[ClaudeLogo, ChatGptLogo, GeminiLogo, GrokLogo, CursorLogo, CodexLogo].map((L, i) => (
              <span
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-ink-120 dark:bg-ink-805 dark:ring-ink-710 ${i > 0 ? "-ml-2" : ""}`}
              >
                <L size={16} />
              </span>
            ))}
          </div>
          <h1 className="mt-5 font-display text-[clamp(2.1rem,5.5vw,3rem)] leading-[1.1] text-ink-900 dark:text-ink-70">
            Build your chatbot by talking to your AI
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-7 text-ink-605 dark:text-ink-225">
            Askio has an MCP server. Connect it to Claude, ChatGPT, Cursor or any app that supports MCP, and your AI
            creates your chatbot, writes its FAQs from your website and hands you the install code. No API key, no
            copy and paste between tabs.
          </p>
          <div className="mt-6">
            <AgentStart />
          </div>
        </header>

        <div className="mt-14 space-y-14">
          <Section title="How it works">
            <ol className="grid gap-3 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className={`${surface} p-5`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-[13px] font-semibold text-white dark:bg-ink-70 dark:text-ink-900">
                    {i + 1}
                  </span>
                  <p className="mt-3 font-semibold text-ink-900 dark:text-ink-70">{s.title}</p>
                  <p className="mt-1 text-[14px] leading-6 text-ink-605 dark:text-ink-225">{s.text}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Connect your AI app" intro="Use this server address in any app that supports MCP.">
            <div className={`${surface} flex items-center justify-between gap-3 p-4`}>
              <code className="min-w-0 break-all text-[14px] text-ink-900 dark:text-ink-70">{MCP_URL}</code>
              <button
                type="button"
                onClick={copy}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-ink-120 px-3.5 text-[13px] font-medium text-ink-805 transition-colors duration-150 hover:border-ink-235 hover:text-ink-900 dark:border-ink-780 dark:text-ink-130 dark:hover:border-ink-710 ${focus}`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {CLIENTS.map((c) => (
                <div key={c.name} className={`${surface} p-5`}>
                  <div className="flex items-center gap-2.5 text-ink-900 dark:text-ink-70">
                    <c.logo size={18} />
                    <p className="font-semibold">{c.name}</p>
                  </div>
                  <p className="mt-2 text-[14px] leading-6 text-ink-605 dark:text-ink-225">{c.steps}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="What your AI can do" intro="Nine tools, all scoped to your own account.">
            <div className="space-y-6">
              {TOOL_GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-425">{g.title}</p>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {g.tools.map((t) => (
                      <li key={t.name} className={`${surface} p-4`}>
                        <code className="text-[13px] font-semibold text-ink-900 dark:text-ink-70">{t.name}</code>
                        <p className="mt-1 text-[14px] leading-6 text-ink-605 dark:text-ink-225">{t.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Try asking">
            <ul className="space-y-2.5">
              {PROMPTS.map((p) => (
                <li
                  key={p}
                  className="w-fit max-w-full rounded-2xl rounded-bl-md border border-ink-120 bg-ink-25 px-4 py-2.5 text-[14px] leading-6 text-ink-805 dark:border-ink-780 dark:bg-ink-850 dark:text-ink-130"
                >
                  {p}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="You stay in control">
            <div className={`${surface} flex gap-4 p-5`}>
              <ShieldCheck size={22} className="mt-0.5 shrink-0 text-ink-900 dark:text-ink-70" />
              <ul className="list-disc space-y-1.5 pl-4 text-[14px] leading-6 text-ink-605 marker:text-ink-325 dark:text-ink-225">
                <li>You approve each app yourself on Askio's Allow access page.</li>
                <li>No API key is pasted into a chat.</li>
                <li>The AI only touches your own chatbots.</li>
                <li>Disconnect any app at any time from Settings.</li>
              </ul>
            </div>
          </Section>

          <Section title="Questions">
            <div className="divide-y divide-ink-120 rounded-xl border border-ink-120 bg-ink-25 dark:divide-ink-780 dark:border-ink-780 dark:bg-ink-850">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary
                    className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded font-medium text-ink-900 dark:text-ink-70 [&::-webkit-details-marker]:hidden ${focus}`}
                  >
                    {f.q}
                    <span className="text-ink-425 transition-transform duration-150 group-open:rotate-45" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="mt-2 text-[14px] leading-6 text-ink-605 dark:text-ink-225">{f.a}</p>
                </details>
              ))}
            </div>
          </Section>

          <div className={`${surface} flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}>
            <div>
              <p className="font-display text-[20px] text-ink-900 dark:text-ink-70">Ready to try it?</p>
              <p className="mt-1 text-[14px] text-ink-605 dark:text-ink-225">Pick your AI and send it one message.</p>
            </div>
            <AgentStart />
          </div>
        </div>
      </div>
    </div>
  );
}
