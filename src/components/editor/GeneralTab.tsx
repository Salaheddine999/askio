import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { focusRing, primaryButton } from "../../pages/dashboard/ui";
import { Field, Panel, PanelBody, Row, Switch, inputClass, invalidInput } from "./controls";
import { ChatbotConfig, ConfigChange, LIMITS, Plan } from "./types";

type Position = ChatbotConfig["position"];
type Fallback = "suggest" | "email" | "handoff";

const POSITIONS: { value: Position; label: string; dot: string }[] = [
  { value: "top-left", label: "Top left", dot: "left-2 top-2" },
  { value: "top-right", label: "Top right", dot: "right-2 top-2" },
  { value: "bottom-left", label: "Bottom left", dot: "left-2 bottom-2" },
  { value: "bottom-right", label: "Bottom right", dot: "right-2 bottom-2" },
];

const FALLBACKS: { value: Fallback; label: string; hint: string }[] = [
  {
    value: "suggest",
    label: "Suggest related questions",
    hint: "Offers the closest questions from your FAQ.",
  },
  {
    value: "email",
    label: "Ask for their email",
    hint: "Shows an email form so you can follow up. Emails appear under Leads in Analytics.",
  },
  {
    value: "handoff",
    label: "Offer to talk to a human",
    hint: "Suggests related questions and adds a “Chat with a human” button.",
  },
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
      <Panel title="Basics" description="How you and your visitors know this chatbot.">
        <PanelBody className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Name"
            htmlFor="bot-name"
            hint="Only you see this, in your dashboard."
            error={errors.name}
            counter={{ value: config.name.length, max: LIMITS.name }}
          >
            <input
              id="bot-name"
              className={`${inputClass} h-10 ${errors.name ? invalidInput : ""}`}
              placeholder="e.g. Store support"
              maxLength={LIMITS.name}
              value={config.name}
              aria-invalid={!!errors.name}
              onChange={(e) => onChange("name", e.target.value)}
            />
          </Field>
          <Field
            label="Title"
            htmlFor="bot-title"
            hint="Shown to visitors at the top of the chat."
            error={errors.title}
            counter={{ value: config.title.length, max: LIMITS.title }}
          >
            <input
              id="bot-title"
              className={`${inputClass} h-10 ${errors.title ? invalidInput : ""}`}
              placeholder="e.g. Ask us anything"
              maxLength={LIMITS.title}
              value={config.title}
              aria-invalid={!!errors.title}
              onChange={(e) => onChange("title", e.target.value)}
            />
          </Field>
        </PanelBody>
      </Panel>

      <Panel title="Conversation" description="The first thing visitors read when they open the chat.">
        <PanelBody className="space-y-5">
          <Field
            label="Welcome message"
            htmlFor="bot-welcome"
            counter={{ value: config.initialMessage.length, max: LIMITS.initialMessage }}
          >
            <textarea
              id="bot-welcome"
              rows={2}
              className={`${inputClass} resize-y py-2.5 leading-relaxed`}
              placeholder="Hello! How can I help you today?"
              maxLength={LIMITS.initialMessage}
              value={config.initialMessage}
              onChange={(e) => onChange("initialMessage", e.target.value)}
            />
          </Field>
          <Field
            label="Message box placeholder"
            htmlFor="bot-placeholder"
            hint="Faint text inside the box where visitors type."
            counter={{ value: config.placeholder.length, max: LIMITS.placeholder }}
          >
            <input
              id="bot-placeholder"
              className={`${inputClass} h-10`}
              placeholder="Type your message..."
              maxLength={LIMITS.placeholder}
              value={config.placeholder}
              onChange={(e) => onChange("placeholder", e.target.value)}
            />
          </Field>
        </PanelBody>
      </Panel>

      <Panel title="Position" description="Which corner of your site the chat sits in.">
        <PanelBody>
          <div role="radiogroup" aria-label="Widget position" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </PanelBody>
      </Panel>

      <Panel title="When it can't answer" description="What happens when a question isn't covered by your FAQ.">
        <PanelBody className="space-y-2">
          <div role="radiogroup" aria-label="When the chatbot can't answer" className="space-y-2">
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
                    <span className="block text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{f.label}</span>
                    <span className="mt-0.5 block text-caption text-[#647184] dark:text-[#87909D]">{f.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {showLinkField && (
            <div className="pt-3">
              <Field
                label="Link to a human"
                htmlFor="bot-handoff"
                hint="A WhatsApp link, a contact page or an email address, like wa.me/212600000000 or help@yourstore.com."
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

      <Panel title="AI replies" description="Let AI answer what your FAQ doesn't cover, using your FAQ as its source.">
        {canUseAi ? (
          <Row
            label="Answer with AI"
            hint={
              userPlan === "enterprise"
                ? "Your plan sets how many chatbots can use AI."
                : "Pro covers up to 10 chatbots with AI. Turn it off here to free one up."
            }
          >
            <Switch
              checked={config.aiEnabled === true}
              onChange={(v) => onChange("aiEnabled", v)}
              label="Answer with AI"
            />
          </Row>
        ) : (
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] text-[#566273] dark:border-[#2B3646] dark:bg-[#141D2B] dark:text-[#9BAABD]">
                <Sparkles size={15} />
              </span>
              <div>
                <p className="text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">AI replies are part of Pro</p>
                <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">
                  Your chatbots answer from your FAQ on every plan. Pro adds AI on up to 10 of them.
                </p>
              </div>
            </div>
            <Link to="/plans" className={`${primaryButton} shrink-0 self-start sm:self-auto`}>
              See Pro
            </Link>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default GeneralTab;
