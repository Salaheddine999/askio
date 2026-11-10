import { useState, type ComponentType } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowUpRight, Check, Copy, MoreHorizontal, X } from "../../components/icons";
import { ChatGptLogo, ClaudeLogo, CodexLogo, CursorLogo, GeminiLogo, GrokLogo } from "./agentLogos";

// "Set up with your AI": the hero's second button, next to "Create your
// chatbot". It opens a dialog where the visitor picks their AI app and gets a
// ready-made message to send it. The message asks the AI to connect to
// Askio's MCP server (/api/mcp), where they sign in and click "Allow access"
// (see api/_lib/oauth.js), and then to set up their chatbot with them.

const SITE = "https://www.getaskio.xyz";
const MCP_URL = `${SITE}/api/mcp`;

const PROMPT = `Hi! I want to set up a chatbot for my website with Askio (${SITE}), with your help.

1. Connect the Askio MCP server: ${MCP_URL}
Add it as a connector / MCP server here. When Askio opens, I'll sign in (or create a free account) and click "Allow access". There is no API key, so don't ask me for one.

2. If you can't add it yourself, tell me the exact clicks for this app. In Claude: Settings > Connectors > Add custom connector. In ChatGPT: add it as a custom connector in Settings (Developer mode may need to be on). In Cursor, Codex, Claude Code, Gemini CLI, Grok and other tools: add the URL as an MCP server.

3. Once connected, list my chatbots. If I have none, ask me about my business and my website, create a chatbot, write its first FAQs with me, then give me the install code and tell me where to paste it. Explain each step simply, and ask me before you change a chatbot that already exists.`;

type Agent = {
  name: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  /** Opens the app with the message already typed, where the app supports it. */
  openUrl?: (prompt: string) => string;
};

const AGENTS: Agent[] = [
  { name: "Claude", icon: ClaudeLogo, openUrl: (prompt) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}` },
  { name: "ChatGPT", icon: ChatGptLogo, openUrl: (prompt) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}` },
  { name: "Codex", icon: CodexLogo },
  { name: "Grok", icon: GrokLogo },
  { name: "Gemini", icon: GeminiLogo },
  { name: "Cursor", icon: CursorLogo },
  { name: "Others", icon: MoreHorizontal },
];

/** The logos shown on the hero button itself. */
const ON_BUTTON = [ClaudeLogo, ChatGptLogo, GeminiLogo];

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-425";

// Single-colour logos take the page's ink; Claude and Gemini keep their own colours.
const ink = "text-ink-900 dark:text-ink-70";

const dialogButton = `inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-body-sm font-medium transition-colors duration-150 ${focus} focus-visible:outline-offset-2`;

export default function AgentStart() {
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState<Agent>(AGENTS[0]);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the message can be selected by hand.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCopied(false);
          setOpen(true);
        }}
        className={`inline-flex h-[52px] items-center justify-center gap-3 rounded-full bg-ink-25 pl-3 pr-6 text-button font-medium text-ink-900 ring-1 ring-inset ring-ink-120 transition-[background-color,box-shadow,transform] duration-150 ease-out hover:bg-white hover:ring-ink-235 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 dark:bg-ink-850 dark:text-ink-70 dark:ring-ink-780 dark:hover:bg-ink-825 dark:hover:ring-ink-710 ${focus}`}
      >
        {/* The apps it works with, overlapping like a short stack of coins. */}
        <span className="flex items-center" aria-hidden="true">
          {ON_BUTTON.map((Logo, index) => (
            <span
              key={index}
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-ink-120 dark:bg-ink-805 dark:ring-ink-710 ${ink} ${
                index > 0 ? "-ml-2" : ""
              }`}
            >
              <Logo size={16} />
            </span>
          ))}
        </span>
        Set up with your AI
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out data-[closed]:opacity-0"
        />
        {/* On phones the panel stops short of the bottom, where the chat launcher sits. */}
        <div className="fixed inset-0 flex items-start justify-center p-4 pb-24 sm:items-center sm:pb-4">
          <DialogPanel
            transition
            className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-ink-25 text-left shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_16px_48px_-16px_rgba(16,23,35,0.3)] transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 dark:bg-ink-850"
          >
            <div className="flex items-start gap-4 px-6 pt-6">
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-display text-h3 tracking-tight text-fg">Set up with your AI</DialogTitle>
                <p className="mt-1 text-body-sm text-fg-muted">
                  Pick your AI and send it this message. It connects to Askio, you sign in and click Allow access,
                  and it builds your chatbot with you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className={`shrink-0 rounded-md text-ink-605 transition-colors duration-150 hover:text-ink-900 dark:text-ink-325 dark:hover:text-ink-130 ${focus} focus-visible:outline-offset-2`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div role="radiogroup" aria-label="Your AI app" className="flex flex-wrap gap-1.5">
                {AGENTS.map((item) => {
                  const selected = item.name === agent.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAgent(item)}
                      className={`inline-flex h-9 items-center gap-2 rounded-full pl-2.5 pr-3.5 text-[13px] font-medium ring-1 ring-inset transition-colors duration-150 ${focus} focus-visible:outline-offset-2 ${
                        selected
                          ? "bg-ink-900 text-white ring-ink-900 dark:bg-ink-70 dark:text-ink-900 dark:ring-ink-70"
                          : "text-ink-805 ring-ink-120 hover:ring-ink-235 dark:text-ink-130 dark:ring-ink-780 dark:hover:ring-ink-710"
                      }`}
                    >
                      {/* A white disc keeps each logo's own colours on the dark selected state. */}
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink-900">
                        <item.icon size={13} />
                      </span>
                      {item.name}
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 whitespace-pre-wrap rounded-xl border border-ink-120 bg-ink-30 p-4 text-[13px] leading-relaxed text-ink-805 [overflow-wrap:anywhere] dark:border-ink-780 dark:bg-ink-875 dark:text-ink-130">
                {PROMPT}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-ink-120/70 px-6 py-4 sm:flex-row sm:justify-end dark:border-ink-780">
              <button
                type="button"
                onClick={copy}
                className={`${dialogButton} ${
                  agent.openUrl
                    ? "border border-ink-120 text-ink-805 hover:border-ink-235 hover:text-ink-900 dark:border-ink-780 dark:text-ink-130 dark:hover:border-ink-710"
                    : "bg-ink-900 text-white hover:bg-ink-830 dark:bg-ink-70 dark:text-ink-900 dark:hover:bg-white"
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy message"}
              </button>
              {agent.openUrl && (
                <a
                  href={agent.openUrl(PROMPT)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${dialogButton} bg-ink-900 text-white hover:bg-ink-830 dark:bg-ink-70 dark:text-ink-900 dark:hover:bg-white`}
                >
                  Open {agent.name}
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
