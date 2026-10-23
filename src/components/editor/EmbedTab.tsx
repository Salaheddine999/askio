import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Code2, Copy, Info } from "lucide-react";
import { EmptyState, focusRing, primaryButton } from "../../pages/dashboard/ui";
import { Panel, PanelBody } from "./controls";

interface Props {
  chatbotId?: string;
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
}

function embedCodeFor(chatbotId: string) {
  const origin = window.location.origin;
  return `<div id="chatbot-container"></div>
<script src="${origin}/chatbot-embed.js"></script>
<script>
  ChatbotEmbed.init("${chatbotId}", "${origin}");
</script>`;
}

const CopyButton: React.FC<{ text: string; label: string; className?: string }> = ({ text, label, className = "" }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the text is still selectable.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-caption font-medium transition-colors ${focusRing} ${className}`}
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
};

const STEPS = [
  { title: "Copy the code", text: "It's unique to this chatbot." },
  { title: "Paste it before </body>", text: "On every page where the chat should appear." },
  { title: "Publish your site", text: "The chat shows up in the corner you picked." },
];

const EmbedTab: React.FC<Props> = ({ chatbotId, hasChanges, saving, onSave }) => {
  if (!chatbotId) {
    return (
      <Panel title="Install" description="Add the chatbot to your website.">
        <EmptyState
          compact
          icon={Code2}
          title="Save to get your install code"
          description="Your chatbot needs a name and a title, then it gets its own code to paste on your site."
          action={
            <button type="button" onClick={onSave} disabled={saving} className={primaryButton}>
              {saving ? "Creating…" : "Create chatbot"}
            </button>
          }
        />
      </Panel>
    );
  }

  const code = embedCodeFor(chatbotId);

  return (
    <div className="space-y-5">
      {hasChanges && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-body-sm text-amber-900 dark:text-amber-200">
            Your site shows the last saved version. Save to publish your latest changes; the code stays the same.
          </p>
        </div>
      )}

      <Panel title="Install on your website" description="One snippet. It works on any site where you can edit the HTML.">
        <PanelBody>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D8DFE9] bg-[#F3F7FC] text-caption font-semibold text-[#101723] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{s.title}</p>
                  <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 overflow-hidden rounded-xl border border-[#1F2A3A] bg-[#101723]">
            <div className="flex items-center justify-between border-b border-white/10 py-1.5 pl-4 pr-1.5">
              <span className="text-caption font-medium text-[#9BAABD]">HTML</span>
              <CopyButton
                text={code}
                label="Copy install code"
                className="text-[#D7DFE5] hover:bg-white/10 hover:text-white"
              />
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed text-[#E7EDF6]">
              <code>{code}</code>
            </pre>
          </div>
        </PanelBody>
      </Panel>

      <Panel title="Using a store or site builder?" description="Shopify and WordPress have their own install steps.">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">Chatbot ID</p>
            <p className="mt-0.5 truncate font-mono text-caption text-[#566273] dark:text-[#9BAABD]">{chatbotId}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CopyButton
              text={chatbotId}
              label="Copy chatbot ID"
              className="border border-[#D8DFE9] text-[#566273] hover:bg-[#F3F7FC] hover:text-[#101723] dark:border-[#2B3646] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5]"
            />
            <Link
              to="/integrations"
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-caption font-medium text-[#101723] transition-colors hover:bg-[#E7EDF6] dark:text-[#D7DFE5] dark:hover:bg-[#273444] ${focusRing}`}
            >
              Integrations
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default EmbedTab;
