import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { ArrowRight, Check, ChevronDown, Code2, Copy, Globe, Info, Send } from "lucide-react";
import { EmptyState, focusRing, primaryButton } from "../../pages/dashboard/ui";
import { Panel, PanelBody, inputClass } from "./controls";
import { PLATFORMS, guideFor, otherSiteLabel, tagManagerCodeFor, type PlatformId } from "./installGuides";
import { apiRequest } from "../../utils/api";
import { useLanguage, useT } from "../../i18n";
import { editorMessages } from "../../i18n/messages/editor";
import { embedCodeFor } from "../../utils/embedCode";

interface Props {
  chatbotId?: string;
  hasChanges: boolean;
  saving: boolean;
  onSave: () => void;
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

/** A dark code box with a copy button. */
const CodeBlock: React.FC<{ code: string; label: string }> = ({ code, label }) => (
  <div className="overflow-hidden rounded-xl border border-[#1F2A3A] bg-[#101723]">
    <div className="flex items-center justify-between border-b border-white/10 py-1.5 pl-4 pr-1.5">
      <span className="text-caption font-medium text-[#9BAABD]">HTML</span>
      <CopyButton text={code} label={label} className="text-[#D7DFE5] hover:bg-white/10 hover:text-white" />
    </div>
    {/* Wrapped, so the whole line shows without scrolling sideways. */}
    <pre className="whitespace-pre-wrap break-all px-4 py-4 font-mono text-[12.5px] leading-relaxed text-[#E7EDF6]">
      <code>{code}</code>
    </pre>
  </div>
);

/** "Someone else builds your website?": the code and steps by email. */
const SendToDeveloper: React.FC<{ chatbotId: string }> = ({ chatbotId }) => {
  const t = useT(editorMessages);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const to = email.trim();
    if (!to) return;
    setSending(true);
    try {
      await apiRequest("/api/account/install-email", { authRequired: true, body: { chatbotId, email: to } });
      toast.success(t("sentDev", { email: to }));
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t("sendDevFailed"));
    } finally {
      setSending(false);
    }
  };
  return (
    <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="block min-w-0 flex-1">
        <span className="text-caption font-medium text-[#566273] dark:text-[#9BAABD]">{t("devEmailLabel")}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("devEmailPlaceholder")}
          autoComplete="off"
          className={`${inputClass} mt-1 h-10`}
        />
      </label>
      <button type="submit" disabled={sending || !email.trim()} className={`${primaryButton} h-10 shrink-0`}>
        <Send size={14} />
        {sending ? t("sendingDev") : t("sendDev")}
      </button>
    </form>
  );
};

/** The platform picker, in the app's dropdown style (like the language picker). */
const PlatformSelect: React.FC<{ value: PlatformId | ""; onChange: (id: PlatformId) => void; label: string; placeholder: string }> = ({
  value,
  onChange,
  label,
  placeholder,
}) => {
  const { lang } = useLanguage();
  // Named platforms first, "Any other site" last.
  const options = [...PLATFORMS.filter((p) => p.id !== "html"), { id: "html" as const, name: otherSiteLabel(lang) }];
  const current = options.find((p) => p.id === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        aria-label={label}
        className={`inline-flex h-9 w-full items-center gap-2 rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] pl-3 pr-2.5 text-left text-body-sm transition-colors hover:border-[#B8C3D1] sm:w-56 dark:border-[#2B3646] dark:bg-[#141D2B] dark:hover:border-[#39485B] ${focusRing}`}
      >
        <Globe size={15} className="shrink-0 text-[#647184] dark:text-[#87909D]" />
        <span className={`min-w-0 flex-1 truncate ${current ? "text-[#101723] dark:text-[#D7DFE5]" : "text-[#87909D]"}`}>
          {current ? current.name : placeholder}
        </span>
        <ChevronDown size={15} className="ml-1 shrink-0 text-[#87909D]" />
      </ListboxButton>
      {/* Anchored and non-modal, like the other pickers, so the page doesn't lock or shift. */}
      <ListboxOptions
        anchor="bottom start"
        modal={false}
        transition
        className="z-50 w-[var(--button-width)] min-w-48 rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-1.5 shadow-xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-[#2B3646] dark:bg-[#1A2533]"
      >
        {options.map((p) => (
          <ListboxOption
            key={p.id}
            value={p.id}
            className="group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-body-sm text-[#101723] data-[focus]:bg-[#F3F7FC] dark:text-[#D7DFE5] dark:data-[focus]:bg-[#273444]"
          >
            <span className="min-w-0 flex-1 truncate group-data-[selected]:font-medium">{p.name}</span>
            <Check size={14} className="invisible shrink-0 group-data-[selected]:visible" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
};

/** The code, and the steps for one platform when the owner asks for them. */
const InstallCode: React.FC<{ chatbotId: string; code: string }> = ({ chatbotId, code }) => {
  const t = useT(editorMessages);
  const { lang } = useLanguage();
  const [platform, setPlatform] = useState<PlatformId | "">("");
  const guide = platform ? guideFor(lang, platform) : null;
  return (
    <div className="space-y-4">
      <CodeBlock code={code} label={t("copyInstallCode")} />

      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <span className="text-body-sm text-[#566273] dark:text-[#9BAABD]">{t("showStepsFor")}</span>
        <PlatformSelect value={platform} onChange={setPlatform} label={t("showStepsFor")} placeholder={t("pickPlatform")} />
      </div>

      {guide && (
        <div className="space-y-3 rounded-xl border border-[#E7EDF6] bg-[#F3F7FC] p-4 dark:border-[#2B3646] dark:bg-[#141D2B]">
          <ol className="space-y-2">
            {guide.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#101723] text-[11px] font-semibold text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
                  {i + 1}
                </span>
                <p className="text-body-sm text-[#3B4656] dark:text-[#B8C3D1]">{step}</p>
              </li>
            ))}
          </ol>
          {platform === "gtm" && <CodeBlock code={tagManagerCodeFor(chatbotId)} label={t("copyInstallCode")} />}
          {(platform === "shopify" || platform === "wordpress") && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption text-[#566273] dark:text-[#9BAABD]">
                {t("chatbotId")}: <code className="font-mono text-[#101723] dark:text-[#D7DFE5]">{chatbotId}</code>
              </span>
              <CopyButton
                text={chatbotId}
                label={t("copyChatbotId")}
                className="border border-[#D8DFE9] text-[#566273] hover:bg-[#F9FCFF] hover:text-[#101723] dark:border-[#2B3646] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5]"
              />
              <Link
                to="/integrations"
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-caption font-medium text-[#101723] transition-colors hover:bg-[#E7EDF6] dark:text-[#D7DFE5] dark:hover:bg-[#273444] ${focusRing}`}
              >
                {t("openIntegrations")}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
          {guide.note && <p className="text-caption text-[#647184] dark:text-[#87909D]">{guide.note}</p>}
        </div>
      )}
    </div>
  );
};

/** An extra, folded away until it's needed. */
const MoreOption: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <details className="group border-t border-[#E7EDF6] dark:border-[#2B3646]">
    <summary
      className={`flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 sm:px-6 [&::-webkit-details-marker]:hidden ${focusRing}`}
    >
      <span className="min-w-0">
        <span className="block text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{title}</span>
        <span className="mt-0.5 block text-caption text-[#647184] dark:text-[#87909D]">{description}</span>
      </span>
      <ChevronDown size={16} className="shrink-0 text-[#87909D] transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div className="px-5 pb-5 sm:px-6">{children}</div>
  </details>
);

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
          <InstallCode chatbotId={chatbotId} code={code} />
        </PanelBody>
        <MoreOption title={t("sendDevTitle")} description={t("sendDevDesc")}>
          <SendToDeveloper chatbotId={chatbotId} />
        </MoreOption>
        <MoreOption title={t("ownButtonTitle")} description={t("ownButtonDesc")}>
          <div className="space-y-2.5">
            <CodeBlock code={'<a href="#" data-askio-open>Chat with us</a>'} label={t("copyInstallCode")} />
            <p className="text-caption text-[#647184] dark:text-[#87909D]">{t("ownButtonHint")}</p>
          </div>
        </MoreOption>
      </Panel>
    </div>
  );
};

export default EmbedTab;
