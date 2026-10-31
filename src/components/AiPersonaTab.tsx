import React from "react";
import { Anchor, Briefcase, Check, Cpu, Leaf, LucideIcon, Sun, Zap } from "./icons";
import { focusRing, surface } from "../pages/dashboard/ui";
import { Field, inputClass } from "./editor/controls";
import { LIMITS } from "./editor/types";
import { useT } from "../i18n";
import { personaMessages } from "../i18n/messages/persona";
import { AiIcon } from "./icons";

type PersonaKey = keyof (typeof personaMessages)["en"];

interface AiPersonaTabProps {
  aiTone: string;
  onChange: (value: string) => void;
  /** The chatbot's primary colour, for the sample reply's avatar. */
  accentColor?: string;
}

interface Character {
  id: string;
  icon: LucideIcon;
  /** Tile background and icon colour, light and dark. */
  tint: string;
  /** A character name, kept as is in every language. */
  name: string;
  tagline: PersonaKey;
  /** The instruction sent to the AI; stays in English and is stored in the chatbot. */
  prompt: string;
  sampleResponse: PersonaKey;
}

// The server falls back to this voice when no persona is set.
const DEFAULT_VOICE: Character = {
  id: "default",
  name: "",
  tagline: "defaultTagline",
  icon: AiIcon,
  tint: "border border-ink-120 bg-ink-25 text-ink-605 dark:border-ink-780 dark:bg-ink-850 dark:text-ink-325",
  prompt: "",
  sampleResponse: "defaultSample",
};

const CHARACTERS: Character[] = [
  {
    id: "professional",
    icon: Briefcase,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    name: "Corporate Pro",
    tagline: "professionalTagline",
    prompt:
      "You are a professional, courteous, and highly knowledgeable customer support agent. Answer questions concisely and politely, always prioritizing clarity and helpfulness.",
    sampleResponse: "professionalSample",
  },
  {
    id: "friendly",
    icon: Sun,
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
    name: "Sunny Helper",
    tagline: "friendlyTagline",
    prompt:
      "You are a super friendly, upbeat, and enthusiastic customer service representative! Use an encouraging tone and feel free to use emojis appropriately to keep the mood light and helpful. 😊",
    sampleResponse: "friendlySample",
  },
  {
    id: "genz",
    icon: Zap,
    tint: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    name: "Vibe Check",
    tagline: "genzTagline",
    prompt:
      "You are a hip, Gen-Z social media manager turned support agent. Use trendy language, be casual, confident, and straight to the point. Emojis are strongly encouraged. 💅✨",
    sampleResponse: "genzSample",
  },
  {
    id: "pirate",
    icon: Anchor,
    tint: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    name: "Captain Chat",
    tagline: "pirateTagline",
    prompt:
      "You are a swashbuckling pirate answering support questions from your ship. Use pirate slang (like 'Ahoy!', 'Matey', 'Shiver me timbers'), be slightly gruff but ultimately helpful in answering their queries.",
    sampleResponse: "pirateSample",
  },
  {
    id: "zen",
    icon: Leaf,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    name: "Calm Guide",
    tagline: "zenTagline",
    prompt:
      "You are a calm, mindful, and centered support agent. Speak gently and reassuringly. Use a warm, zen-like tone that puts people at ease. Encourage patience and understanding. Occasionally use nature metaphors.",
    sampleResponse: "zenSample",
  },
  {
    id: "robot",
    icon: Cpu,
    tint: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    name: "Robo Agent",
    tagline: "robotTagline",
    prompt:
      "You are a highly efficient, robotic AI assistant. Respond in a factual, structured, and concise manner. Use bullet points and numbered lists where appropriate. Minimize filler words. Prioritize accuracy and efficiency.",
    sampleResponse: "robotSample",
  },
];

const AiPersonaTab: React.FC<AiPersonaTabProps> = ({ aiTone, onChange, accentColor = "#101723" }) => {
  const t = useT(personaMessages);
  const tone = aiTone || "";
  const isDefault = tone.trim() === "";
  const active = isDefault ? DEFAULT_VOICE : CHARACTERS.find((c) => c.prompt === tone);
  const isCustom = !active;

  return (
    <div className="space-y-5">
      <section className={surface}>
        <div className="border-b border-ink-70 px-5 py-4 sm:px-6 dark:border-ink-780">
          <h2 className="text-body font-semibold text-ink-900 dark:text-ink-70">{t("voice")}</h2>
          <p className="mt-0.5 text-body-sm text-fg-subtle">
            {t("voiceDesc")}
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div role="radiogroup" aria-label={t("voiceAria")} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
            {[DEFAULT_VOICE, ...CHARACTERS].map((char) => {
              const selected = active?.id === char.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(char.prompt)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-start transition-colors ${focusRing} ${
                    selected
                      ? "border-ink-900 bg-ink-30 dark:border-ink-130 dark:bg-ink-875"
                      : "border-ink-120 hover:border-ink-325 dark:border-ink-780 dark:hover:border-ink-605"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${char.tint}`}>
                    <char.icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-sm font-medium text-fg">{char.name || t("defaultName")}</span>
                    <span className="block truncate text-caption text-fg-subtle">{t(char.tagline)}</span>
                  </span>
                  {selected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-900 dark:bg-ink-130">
                      <Check size={12} strokeWidth={3} className="text-white dark:text-ink-875" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-ink-70 bg-ink-30 p-4 dark:border-ink-780 dark:bg-ink-875">
            <p className="text-caption font-medium text-fg-subtle">
              {active ? t("soundsLike", { name: active.name || t("defaultName") }) : t("yourOwnVoice")}
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="flex justify-end">
                <span
                  className="max-w-[80%] rounded-2xl rounded-ee-md px-3.5 py-2 text-body-sm text-white"
                  style={{ background: accentColor }}
                >
                  {t("sampleQuestion")}
                </span>
              </div>
              <div className="flex justify-start">
                <span className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-es-md bg-ink-25 px-3.5 py-2 text-body-sm text-ink-900 ring-1 ring-ink-70 dark:bg-ink-850 dark:text-ink-130 dark:ring-ink-780">
                  {active
                    ? t(active.sampleResponse)
                    : t("customSample")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={surface}>
        <div className="border-b border-ink-70 px-5 py-4 sm:px-6 dark:border-ink-780">
          <h2 className="flex items-center gap-2 text-body font-semibold text-ink-900 dark:text-ink-70">
            {t("instructions")}
            {isCustom && (
              <span className="rounded-full bg-ink-70 px-2 py-0.5 text-caption font-medium text-ink-605 dark:bg-ink-790 dark:text-ink-325">
                {t("custom")}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-body-sm text-fg-subtle">
            {t("instructionsDesc")}
          </p>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <Field
            label={t("persona")}
            htmlFor="ai-persona"
            hint={t("personaHint")}
            counter={{ value: tone.length, max: LIMITS.persona }}
          >
            <textarea
              id="ai-persona"
              rows={5}
              className={`${inputClass} resize-y py-2.5 leading-relaxed`}
              placeholder={t("personaPlaceholder")}
              maxLength={LIMITS.persona}
              value={tone}
              onChange={(e) => onChange(e.target.value)}
            />
          </Field>
        </div>
      </section>
    </div>
  );
};

export default AiPersonaTab;
