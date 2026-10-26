import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Code2, Copy, Info } from "lucide-react";
import { EmptyState, focusRing, primaryButton } from "../../pages/dashboard/ui";
import { Panel, PanelBody } from "./controls";
import { useT } from "../../i18n";
import { editorMessages } from "../../i18n/messages/editor";

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
  const t = useT(editorMessages);
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
      <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
    </button>
  );
};

const STEPS = [
  { title: "step1Title", text: "step1Text" },
  { title: "step2Title", text: "step2Text" },
  { title: "step3Title", text: "step3Text" },
] as const;

const EmbedTab: React.FC<Props> = ({ chatbotId, hasChanges, saving, onSave }) => {
  const t = useT(editorMessages);
  if (!chatbotId) {
    return (
      <Panel title={t("tabInstall")} description={t("installDesc")}>
        <EmptyState
          compact
          icon={Code2}
          title={t("saveForCode")}
          description={t("saveForCodeDesc")}
          action={
            <button type="button" onClick={onSave} disabled={saving} className={primaryButton}>
              {saving ? t("creating") : t("createChatbot")}
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
            {t("unsavedNotice")}
          </p>
        </div>
      )}

      <Panel title={t("installOnSite")} description={t("installOnSiteDesc")}>
        <PanelBody>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D8DFE9] bg-[#F3F7FC] text-caption font-semibold text-[#101723] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#D7DFE5]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{t(s.title)}</p>
                  <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">{t(s.text)}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 overflow-hidden rounded-xl border border-[#1F2A3A] bg-[#101723]">
            <div className="flex items-center justify-between border-b border-white/10 py-1.5 pl-4 pr-1.5">
              <span className="text-caption font-medium text-[#9BAABD]">HTML</span>
              <CopyButton
                text={code}
                label={t("copyInstallCode")}
                className="text-[#D7DFE5] hover:bg-white/10 hover:text-white"
              />
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed text-[#E7EDF6]">
              <code>{code}</code>
            </pre>
          </div>
        </PanelBody>
      </Panel>

      <Panel title={t("builderTitle")} description={t("builderDesc")}>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{t("chatbotId")}</p>
            <p className="mt-0.5 truncate font-mono text-caption text-[#566273] dark:text-[#9BAABD]">{chatbotId}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CopyButton
              text={chatbotId}
              label={t("copyChatbotId")}
              className="border border-[#D8DFE9] text-[#566273] hover:bg-[#F3F7FC] hover:text-[#101723] dark:border-[#2B3646] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5]"
            />
            <Link
              to="/integrations"
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-caption font-medium text-[#101723] transition-colors hover:bg-[#E7EDF6] dark:text-[#D7DFE5] dark:hover:bg-[#273444] ${focusRing}`}
            >
              {t("integrations")}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default EmbedTab;
