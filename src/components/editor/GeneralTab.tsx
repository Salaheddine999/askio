import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, Sparkles } from "lucide-react";
import { focusRing, primaryButton } from "../../pages/dashboard/ui";
import { Field, Panel, PanelBody, Row, Switch, inputClass, invalidInput } from "./controls";
import { ChatbotConfig, ConfigChange, LIMITS, Plan } from "./types";
import { isLang, makeT, useT } from "../../i18n";
import LanguageSelect from "../LanguageSelect";
import { widgetMessages } from "../../i18n/widget";
import { editorMessages } from "../../i18n/messages/editor";

type EditorKey = keyof (typeof editorMessages)["en"];

type Position = ChatbotConfig["position"];
type Fallback = "suggest" | "email" | "handoff";

const POSITIONS: { value: Position; label: EditorKey; dot: string }[] = [
  { value: "top-left", label: "topLeft", dot: "left-2 top-2" },
  { value: "top-right", label: "topRight", dot: "right-2 top-2" },
  { value: "bottom-left", label: "bottomLeft", dot: "left-2 bottom-2" },
  { value: "bottom-right", label: "bottomRight", dot: "right-2 bottom-2" },
];

const FALLBACKS: { value: Fallback; label: EditorKey; hint: EditorKey }[] = [
  { value: "suggest", label: "fallbackSuggest", hint: "fallbackSuggestHint" },
  { value: "email", label: "fallbackEmail", hint: "fallbackEmailHint" },
  { value: "handoff", label: "fallbackHandoff", hint: "fallbackHandoffHint" },
];

export interface GeneralErrors {
  name?: string | null;
  title?: string | null;
  liveChatLink?: string | null;
}

interface Props {
  config: ChatbotConfig;
  onChange: ConfigChange;
  errors: GeneralErrors;
  onLinkBlur: () => void;
  canUseAi: boolean;
  userPlan: Plan;
}

const GeneralTab: React.FC<Props> = ({ config, onChange, errors, onLinkBlur, canUseAi, userPlan }) => {
  const t = useT(editorMessages);
  // Examples of the widget's own texts, in the language the widget is set to.
  const widgetT = makeT(widgetMessages, isLang(config.language) ? config.language : "en");
  // Switching away from the handoff option clears the link; remember it so
  // switching back doesn't make the owner type it again.
  const lastLink = useRef(config.liveChatLink || "");
  const leadCapture =
    config.enableLeadCapture === true || (config.enableLeadCapture as unknown as string) === "true";
  // The widget asks for an email first when both are set.
  const fallback: Fallback = leadCapture ? "email" : config.liveChatLink ? "handoff" : "suggest";
  const showLinkField = fallback === "handoff" || (fallback !== "email" && !!errors.liveChatLink);

  const chooseFallback = (next: Fallback) => {
    if (config.liveChatLink) lastLink.current = config.liveChatLink;
    onChange("enableLeadCapture", next === "email");
    if (next === "suggest") onChange("liveChatLink", "");
    if (next === "handoff") onChange("liveChatLink", lastLink.current || "https://");
  };

  return (
    <div className="space-y-5">
      <Panel title={t("basics")} description={t("basicsDesc")}>
        <PanelBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label={t("name")}
            htmlFor="bot-name"
            hint={t("nameHint")}
            error={errors.name}
            counter={{ value: config.name.length, max: LIMITS.name }}
          >
            <input
              id="bot-name"
              className={`${inputClass} h-10 ${errors.name ? invalidInput : ""}`}
              placeholder={t("namePlaceholder")}
              maxLength={LIMITS.name}
              value={config.name}
              aria-invalid={!!errors.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </Field>
          <Field
            label={t("title")}
            htmlFor="bot-title"
            hint={t("titleHint")}
            error={errors.title}
            counter={{ value: config.title.length, max: LIMITS.title }}
          >
            <input
              id="bot-title"
              className={`${inputClass} h-10 ${errors.title ? invalidInput : ""}`}
              placeholder={t("titlePlaceholder")}
              maxLength={LIMITS.title}
              value={config.title}
              aria-invalid={!!errors.title}
              onChange={(e) => onChange("title", e.target.value)}
            />
          </Field>
        </PanelBody>
      </Panel>

      <Panel title={t("conversation")} description={t("conversationDesc")}>
        <PanelBody className="space-y-5">
          <Field
            label={t("language")}
            htmlFor="bot-language"
            hint={t("languageHint")}
          >
            <LanguageSelect
              id="bot-language"
              value={isLang(config.language) ? config.language : "en"}
              className="sm:max-w-xs"
              onChange={(next) => {
                const before = makeT(widgetMessages, isLang(config.language) ? config.language : "en");
                const after = makeT(widgetMessages, next);
                onChange("language", next);
                // Swap the default texts too, but never ones the owner wrote.
                if (config.initialMessage === before("defaultWelcome")) onChange("initialMessage", after("defaultWelcome"));
                if (config.placeholder === before("defaultPlaceholder")) onChange("placeholder", after("defaultPlaceholder"));
              }}
            />
          </Field>
          <Field
            label={t("welcomeMessage")}
            htmlFor="bot-welcome"
            counter={{ value: config.initialMessage.length, max: LIMITS.initialMessage }}
          >
            <textarea
              id="bot-welcome"
              rows={2}
              className={`${inputClass} resize-y py-2.5 leading-relaxed`}
              placeholder={widgetT("defaultWelcome")}
              maxLength={LIMITS.initialMessage}
              value={config.initialMessage}
              onChange={(e) => onChange("initialMessage", e.target.value)}
            />
          </Field>
          <Field
            label={t("placeholderLabel")}
            htmlFor="bot-placeholder"
            hint={t("placeholderHint")}
            counter={{ value: config.placeholder.length, max: LIMITS.placeholder }}
          >
            <input
              id="bot-placeholder"
              className={`${inputClass} h-10`}
              placeholder={widgetT("defaultPlaceholder")}
              maxLength={LIMITS.placeholder}
              value={config.placeholder}
              onChange={(e) => onChange("placeholder", e.target.value)}
            />
          </Field>
        </PanelBody>
      </Panel>

      <Panel title={t("position")} description={t("positionDesc")}>
        <PanelBody>
          <div role="radiogroup" aria-label={t("positionAria")} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {POSITIONS.map((p) => {
              const selected = config.position === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange("position", p.value)}
                  className={`group rounded-xl border p-2 text-left transition-colors ${focusRing} ${
                    selected
                      ? "border-[#101723] bg-[#F3F7FC] dark:border-[#D7DFE5] dark:bg-[#141D2B]"
                      : "border-[#D8DFE9] hover:border-[#9BAABD] dark:border-[#2B3646] dark:hover:border-[#566273]"
                  }`}
                >
                  <span className="relative block h-14 rounded-lg border border-[#E7EDF6] bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533]">
                    <span className="absolute left-2 right-8 top-2.5 h-1 rounded-full bg-[#E7EDF6] dark:bg-[#273444]" />
                    <span className="absolute left-2 right-12 top-5 h-1 rounded-full bg-[#E7EDF6] dark:bg-[#273444]" />
                    <span
                      className={`absolute h-3.5 w-3.5 rounded-full transition-colors ${p.dot} ${
                        selected ? "" : "bg-[#C9D2DE] group-hover:bg-[#9BAABD] dark:bg-[#39485B]"
                      }`}
                      style={selected ? { background: config.primaryColor } : undefined}
                    />
                  </span>
                  <span
                    className={`mt-2 block px-0.5 text-caption font-medium ${
                      selected ? "text-[#101723] dark:text-[#E7EDF6]" : "text-[#566273] dark:text-[#9BAABD]"
                    }`}
                  >
                    {t(p.label)}
                  </span>
                </button>
              );
            })}
          </div>
        </PanelBody>
      </Panel>

      <Panel title={t("fallbackTitle")} description={t("fallbackDesc")}>
        <PanelBody className="space-y-2">
          <div role="radiogroup" aria-label={t("fallbackAria")} className="space-y-2">
            {FALLBACKS.map((f) => {
              const selected = fallback === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => chooseFallback(f.value)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${focusRing} ${
                    selected
                      ? "border-[#101723] bg-[#F3F7FC] dark:border-[#D7DFE5] dark:bg-[#141D2B]"
                      : "border-[#D8DFE9] hover:border-[#9BAABD] dark:border-[#2B3646] dark:hover:border-[#566273]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? "border-[#101723] dark:border-[#D7DFE5]"
                        : "border-[#C9D2DE] dark:border-[#39485B]"
                    }`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-[#101723] dark:bg-[#D7DFE5]" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{t(f.label)}</span>
                    <span className="mt-0.5 block text-caption text-[#647184] dark:text-[#87909D]">{t(f.hint, { button: widgetT("chatWithHuman") })}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {showLinkField && (
            <div className="pt-3">
              <Field
                label={t("handoffLabel")}
                htmlFor="bot-handoff"
                hint={t("handoffHint")}
                error={errors.liveChatLink}
              >
                <input
                  id="bot-handoff"
                  className={`${inputClass} h-10 ${errors.liveChatLink ? invalidInput : ""}`}
                  placeholder="wa.me/212600000000"
                  value={config.liveChatLink === "https://" ? "" : config.liveChatLink || ""}
                  aria-invalid={!!errors.liveChatLink}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => onChange("liveChatLink", e.target.value || "https://")}
                  onBlur={onLinkBlur}
                />
              </Field>
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel title={t("aiReplies")} description={t("aiRepliesDesc")}>
        {canUseAi ? (
          <Row
            label={t("answerWithAi")}
            hint={userPlan === "enterprise" ? t("aiHintEnterprise") : t("aiHintPro")}
          >
            <Switch
              checked={config.aiEnabled === true}
              onChange={(v) => onChange("aiEnabled", v)}
              label={t("answerWithAi")}
            />
          </Row>
        ) : (
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] text-[#566273] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#9BAABD]">
                <Sparkles size={15} />
              </span>
              <div>
                <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{t("aiProTitle")}</p>
                <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">
                  {t("aiProText")}
                </p>
              </div>
            </div>
            <Link to="/plans" className={`${primaryButton} shrink-0 self-start sm:self-auto`}>
              {t("seePro")}
            </Link>
          </div>
        )}
      </Panel>

      <Panel title={t("historyTitle")} description={t("historyDesc")}>
        {canUseAi ? (
          <Row label={t("saveConversations")} hint={t("saveConversationsHint")}>
            <Switch
              checked={config.saveConversations === true}
              onChange={(v) => onChange("saveConversations", v)}
              label={t("saveConversations")}
            />
          </Row>
        ) : (
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] text-[#566273] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#9BAABD]">
                <MessagesSquare size={15} />
              </span>
              <div>
                <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{t("historyProTitle")}</p>
                <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">{t("historyProText")}</p>
              </div>
            </div>
            <Link to="/plans" className={`${primaryButton} shrink-0 self-start sm:self-auto`}>
              {t("seePro")}
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default GeneralTab;
