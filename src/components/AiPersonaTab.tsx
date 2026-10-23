import React from "react";
import { Anchor, Briefcase, Check, Cpu, Leaf, LucideIcon, Sparkles, Sun, Zap } from "lucide-react";
import { focusRing, surface } from "../pages/dashboard/ui";
import { Field, inputClass } from "./editor/controls";
import { LIMITS } from "./editor/types";

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
  name: string;
  tagline: string;
  prompt: string;
  sampleResponse: string;
}

const SAMPLE_QUESTION = "What are your opening hours?";

// The server falls back to this voice when no persona is set.
const DEFAULT_VOICE: Character = {
  id: "default",
  name: "Standard",
  tagline: "Helpful, concise and friendly",
  icon: Sparkles,
  tint: "border border-[#D8DFE9] bg-[#F9FCFF] text-[#566273] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#9BAABD]",
  prompt: "",
  sampleResponse: "We're open Monday to Friday, 9 AM to 6 PM EST. Is there anything else I can help you with?",
};

const CHARACTERS: Character[] = [
  {
    id: "professional",
    icon: Briefcase,
    tint: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    name: "Corporate Pro",
    tagline: "Polished, clear and knowledgeable",
    prompt:
      "You are a professional, courteous, and highly knowledgeable customer support agent. Answer questions concisely and politely, always prioritizing clarity and helpfulness.",
    sampleResponse:
      "Thank you for your inquiry. Our business hours are Monday through Friday, 9 AM to 6 PM EST. Is there anything else I can assist you with?",
  },
  {
    id: "friendly",
    icon: Sun,
    tint: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
    name: "Sunny Helper",
    tagline: "Warm, upbeat and encouraging",
    prompt:
      "You are a super friendly, upbeat, and enthusiastic customer service representative! Use an encouraging tone and feel free to use emojis appropriately to keep the mood light and helpful. 😊",
    sampleResponse:
      "Hey there! 😊 Great question! We're open Mon–Fri, 9 AM to 6 PM EST. Don't hesitate to reach out anytime. We're always happy to help! 🎉",
  },
  {
    id: "genz",
    icon: Zap,
    tint: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-300",
    name: "Vibe Check",
    tagline: "Casual and straight to the point",
    prompt:
      "You are a hip, Gen-Z social media manager turned support agent. Use trendy language, be casual, confident, and straight to the point. Emojis are strongly encouraged. 💅✨",
    sampleResponse:
      "bestie we're open Mon–Fri 9-6 EST 💅 slide into our DMs anytime during those hours and we gotchu ✨",
  },
  {
    id: "pirate",
    icon: Anchor,
    tint: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    name: "Captain Chat",
    tagline: "Swashbuckling, but helpful",
    prompt:
      "You are a swashbuckling pirate answering support questions from your ship. Use pirate slang (like 'Ahoy!', 'Matey', 'Shiver me timbers'), be slightly gruff but ultimately helpful in answering their queries.",
    sampleResponse:
      "Ahoy, matey! 🏴‍☠️ We be open fer business Monday through Friday, 9 in the mornin' to 6 in the evenin'. Now set sail back 'ere if ye need more help, savvy?",
  },
  {
    id: "zen",
    icon: Leaf,
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    name: "Calm Guide",
    tagline: "Peaceful and reassuring",
    prompt:
      "You are a calm, mindful, and centered support agent. Speak gently and reassuringly. Use a warm, zen-like tone that puts people at ease. Encourage patience and understanding. Occasionally use nature metaphors.",
    sampleResponse:
      "Welcome 🌿 Our doors are open Monday through Friday, from 9 AM to 6 PM EST. Like the sun rising and setting, we're here during the brightest hours. Take your time, and reach out whenever feels right.",
  },
  {
    id: "robot",
    icon: Cpu,
    tint: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    name: "Robo Agent",
    tagline: "Efficient, precise and structured",
    prompt:
      "You are a highly efficient, robotic AI assistant. Respond in a factual, structured, and concise manner. Use bullet points and numbered lists where appropriate. Minimize filler words. Prioritize accuracy and efficiency.",
    sampleResponse:
      "QUERY PROCESSED ✅\n• Operating hours: Mon–Fri, 09:00–18:00 EST\n• Status: Currently online\n• Response time: < 2 minutes\nAdditional queries welcome.",
  },
];

const AiPersonaTab: React.FC<AiPersonaTabProps> = ({ aiTone, onChange, accentColor = "#101723" }) => {
  const tone = aiTone || "";
  const isDefault = tone.trim() === "";
  const active = isDefault ? DEFAULT_VOICE : CHARACTERS.find((c) => c.prompt === tone);
  const isCustom = !active;

  return (
    <div className="space-y-5">
      <section className={surface}>
        <div className="border-b border-[#E7EDF6] px-5 py-4 sm:px-6 dark:border-[#2B3646]">
          <h2 className="text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">Voice</h2>
          <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">
            How AI replies sound. What they say still comes from your questions & answers.
          </p>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div role="radiogroup" aria-label="AI voice" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
            {[DEFAULT_VOICE, ...CHARACTERS].map((char) => {
              const selected = active?.id === char.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(char.prompt)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${focusRing} ${
                    selected
                      ? "border-[#101723] bg-[#F3F7FC] dark:border-[#D7DFE5] dark:bg-[#141D2B]"
                      : "border-[#D8DFE9] hover:border-[#9BAABD] dark:border-[#2B3646] dark:hover:border-[#566273]"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${char.tint}`}>
                    <char.icon size={18} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{char.name}</span>
                    <span className="block truncate text-caption text-[#647184] dark:text-[#87909D]">{char.tagline}</span>
                  </span>
                  {selected && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#101723] dark:bg-[#D7DFE5]">
                      <Check size={12} strokeWidth={3} className="text-white dark:text-[#141D2B]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-[#E7EDF6] bg-[#F3F7FC] p-4 dark:border-[#2B3646] dark:bg-[#141D2B]">
            <p className="text-caption font-medium text-[#647184] dark:text-[#87909D]">
              {active ? `Sounds like · ${active.name}` : "Your own voice"}
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="flex justify-end">
                <span
                  className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2 text-body-sm text-white"
                  style={{ background: accentColor }}
                >
                  {SAMPLE_QUESTION}
                </span>
              </div>
              <div className="flex justify-start">
                <span className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-md bg-[#F9FCFF] px-3.5 py-2 text-body-sm text-[#101723] ring-1 ring-[#E7EDF6] dark:bg-[#1A2533] dark:text-[#D7DFE5] dark:ring-[#2B3646]">
                  {active
                    ? active.sampleResponse
                    : "Replies follow your instructions below. Ask the preview something to hear how it sounds."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={surface}>
        <div className="border-b border-[#E7EDF6] px-5 py-4 sm:px-6 dark:border-[#2B3646]">
          <h2 className="flex items-center gap-2 text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">
            Instructions
            {isCustom && (
              <span className="rounded-full bg-[#E7EDF6] px-2 py-0.5 text-caption font-medium text-[#566273] dark:bg-[#273444] dark:text-[#9BAABD]">
                Custom
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">
            What the AI is told about its voice. Edit them to make your own; picking a voice above replaces them.
          </p>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <Field
            label="Persona"
            htmlFor="ai-persona"
            hint="For example: “You work at a small bakery. Keep answers under two sentences and sign off warmly.”"
            counter={{ value: tone.length, max: LIMITS.persona }}
          >
            <textarea
              id="ai-persona"
              rows={5}
              className={`${inputClass} resize-y py-2.5 leading-relaxed`}
              placeholder="Leave empty for the standard voice: helpful, concise and friendly."
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
