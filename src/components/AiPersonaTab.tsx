import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Check, MessageSquare, Ban } from "lucide-react";

interface AiPersonaTabProps {
  aiTone: string;
  onChange: (value: string) => void;
  inputClasses: string;
}

interface Character {
  id: string;
  imageSrc: string;
  name: string;
  tagline: string;
  color: string;
  darkColor: string;
  borderColor: string;
  darkBorderColor: string;
  prompt: string;
  sampleResponse: string;
}

// --- Character Icons are now provided via Lucide React ---

const CHARACTERS: Character[] = [
  {
    id: "professional",
    imageSrc: "/personas/avatar_corporate_1772643348087.png",
    name: "Corporate Pro",
    tagline: "Polished, clear, and highly knowledgeable",
    color: "#EFF6FF",
    darkColor: "#1E293B",
    borderColor: "#BFDBFE",
    darkBorderColor: "#334155",
    prompt:
      "You are a professional, courteous, and highly knowledgeable customer support agent. Answer questions concisely and politely, always prioritizing clarity and helpfulness.",
    sampleResponse:
      "Thank you for your inquiry. Our business hours are Monday through Friday, 9 AM to 6 PM EST. Is there anything else I can assist you with?",
  },
  {
    id: "friendly",
    imageSrc: "/personas/avatar_sunny_1772643367530.png",
    name: "Sunny Helper",
    tagline: "Warm, upbeat, and encouraging",
    color: "#FEF9C3",
    darkColor: "#422006",
    borderColor: "#FDE68A",
    darkBorderColor: "#713F12",
    prompt:
      "You are a super friendly, upbeat, and enthusiastic customer service representative! Use an encouraging tone and feel free to use emojis appropriately to keep the mood light and helpful. 😊",
    sampleResponse:
      "Hey there! 😊 Great question! We're open Mon–Fri, 9 AM to 6 PM EST. Don't hesitate to reach out anytime — we're always happy to help! 🎉",
  },
  {
    id: "genz",
    imageSrc: "/personas/avatar_vibe_1772643382638.png",
    name: "Vibe Check",
    tagline: "Trendy, casual, and straight to the point",
    color: "#F5F3FF",
    darkColor: "#2E1065",
    borderColor: "#DDD6FE",
    darkBorderColor: "#4C1D95",
    prompt:
      "You are a hip, Gen-Z social media manager turned support agent. Use trendy language, be casual, confident, and straight to the point. Emojis are strongly encouraged. 💅✨",
    sampleResponse:
      "bestie we're open Mon–Fri 9-6 EST 💅 slide into our DMs anytime during those hours and we gotchu ✨",
  },
  {
    id: "pirate",
    imageSrc: "/personas/avatar_pirate_1772643395921.png",
    name: "Captain Chat",
    tagline: "Swashbuckling charm with helpful answers",
    color: "#FFF7ED",
    darkColor: "#431407",
    borderColor: "#FED7AA",
    darkBorderColor: "#7C2D12",
    prompt:
      "You are a swashbuckling pirate answering support questions from your ship. Use pirate slang (like 'Ahoy!', 'Matey', 'Shiver me timbers'), be slightly gruff but ultimately helpful in answering their queries.",
    sampleResponse:
      "Ahoy, matey! 🏴‍☠️ We be open fer business Monday through Friday, 9 in the mornin' to 6 in the evenin'. Now set sail back 'ere if ye need more help, savvy?",
  },
  {
    id: "zen",
    imageSrc: "/personas/avatar_zen_1772643416480.png",
    name: "Calm Guide",
    tagline: "Peaceful, thoughtful, and reassuring",
    color: "#ECFDF5",
    darkColor: "#022C22",
    borderColor: "#A7F3D0",
    darkBorderColor: "#065F46",
    prompt:
      "You are a calm, mindful, and centered support agent. Speak gently and reassuringly. Use a warm, zen-like tone that puts people at ease. Encourage patience and understanding. Occasionally use nature metaphors.",
    sampleResponse:
      "Welcome 🌿 Our doors are open Monday through Friday, from 9 AM to 6 PM EST — like the sun rising and setting, we're here during the brightest hours. Take your time, and reach out whenever feels right.",
  },
  {
    id: "robot",
    imageSrc: "/personas/avatar_robo_1772643431968.png",
    name: "Robo Agent",
    tagline: "Efficient, precise, and data-driven",
    color: "#F0F9FF",
    darkColor: "#0C1829",
    borderColor: "#BAE6FD",
    darkBorderColor: "#0C4A6E",
    prompt:
      "You are a highly efficient, robotic AI assistant. Respond in a factual, structured, and concise manner. Use bullet points and numbered lists where appropriate. Minimize filler words. Prioritize accuracy and efficiency.",
    sampleResponse:
      "QUERY PROCESSED ✅\n• Operating hours: Mon–Fri, 09:00–18:00 EST\n• Status: Currently online\n• Response time: < 2 minutes\nAdditional queries welcome.",
  },
];

const AiPersonaTab: React.FC<AiPersonaTabProps> = ({
  aiTone,
  onChange,
  inputClasses,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewCharId, setPreviewCharId] = useState<string | null>(null);

  const activeCharacter = CHARACTERS.find((c) => c.prompt === aiTone);

  const handleSelectCharacter = (char: Character) => {
    onChange(char.prompt);
    setPreviewCharId(null);
  };

  const handleClear = () => {
    onChange("");
    setPreviewCharId(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-[#37322F] dark:text-[#F5F5F4] flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          Choose a Character
        </h2>
        <p className="text-sm text-[#78716C] dark:text-[#A8A29E] mt-1">
          Pick a personality for your chatbot. Each character has a unique voice
          and tone that shapes how it responds.
        </p>
      </div>

      {/* Character Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {CHARACTERS.map((char) => {
          const isActive = activeCharacter?.id === char.id;
          const isPreviewing = previewCharId === char.id;

          return (
            <div key={char.id} className="flex flex-col">
              {/* Character Card */}
              <button
                onClick={() => handleSelectCharacter(char)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 group ${
                  isActive
                    ? "border-[#37322F] dark:border-[#F5F5F4] shadow-md"
                    : "border-[#E0DEDB] dark:border-[#44403C] hover:border-[#A8A29E] dark:hover:border-[#78716C] hover:shadow-sm"
                }`}
              >
                {/* Selected badge */}
                {isActive && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center">
                    <Check
                      size={12}
                      className="text-white dark:text-[#1C1917]"
                      strokeWidth={3}
                    />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105 overflow-hidden ring-2 ring-white dark:ring-[#1C1917] shadow-sm">
                    <img
                      src={char.imageSrc}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[13px] text-[#37322F] dark:text-[#F5F5F4] leading-tight">
                      {char.name}
                    </p>
                    <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 leading-snug">
                      {char.tagline}
                    </p>
                  </div>
                </div>

                {/* Preview toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewCharId(isPreviewing ? null : char.id);
                  }}
                  className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-[#A8A29E] dark:text-[#78716C] hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
                >
                  <MessageSquare size={11} />
                  <span>{isPreviewing ? "Hide preview" : "Preview voice"}</span>
                </button>
              </button>

              {/* Preview Bubble */}
              {isPreviewing && (
                <div className="mt-2 mx-2 px-3.5 py-3 rounded-xl rounded-tl-md bg-[#F5F5F4] dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] text-[12px] text-[#605A57] dark:text-[#D6D3D1] leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-[10px] font-semibold text-[#A8A29E] dark:text-[#78716C] uppercase tracking-wider mb-1.5">
                    Sample response
                  </p>
                  <p className="whitespace-pre-line italic">"{char.sampleResponse}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clear / No Persona */}
      <button
        onClick={handleClear}
        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 mb-5 ${
          !aiTone || aiTone.trim() === ""
            ? "border-[#37322F] dark:border-[#F5F5F4] bg-[#FAFAF9] dark:bg-[#1C1917] shadow-md"
            : "border-[#E0DEDB] dark:border-[#44403C] hover:border-[#A8A29E] dark:hover:border-[#78716C]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#F5F5F4] dark:bg-[#292524] border-[1.5px] border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center text-[#A8A29E] dark:text-[#78716C]">
            <Ban size={22} strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-[13px] text-[#37322F] dark:text-[#F5F5F4] leading-tight">
              No Persona
            </p>
            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">
              Use standard FAQ matching only — no AI generation
            </p>
          </div>
          {(!aiTone || aiTone.trim() === "") && (
            <div className="ml-auto w-5 h-5 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center flex-shrink-0">
              <Check
                size={12}
                className="text-white dark:text-[#1C1917]"
                strokeWidth={3}
              />
            </div>
          )}
        </div>
      </button>

      {/* Advanced / Custom Section */}
      <div className="border border-[#E0DEDB] dark:border-[#44403C] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#FAFAF9] dark:bg-[#1C1917] hover:bg-[#F5F5F4] dark:hover:bg-[#292524] transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#37322F] dark:text-[#F5F5F4]">
              ✍️ Custom Persona
            </span>
            <span className="text-[11px] text-[#A8A29E] dark:text-[#78716C]">
              Write your own prompt
            </span>
          </div>
          {showAdvanced ? (
            <ChevronUp size={16} className="text-[#A8A29E]" />
          ) : (
            <ChevronDown size={16} className="text-[#A8A29E]" />
          )}
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 pt-3 bg-white dark:bg-[#292524] border-t border-[#E0DEDB] dark:border-[#44403C]">
            <p className="text-[11px] text-[#A8A29E] dark:text-[#78716C] mb-2 leading-relaxed">
              Describe how the AI should act. For example: "You are a friendly
              agent who uses emojis and keeps answers under 2 sentences." Leave
              blank to disable AI responses.
            </p>
            <textarea
              className={`${inputClasses} min-h-[120px] resize-y`}
              placeholder="You are a professional support agent for Acme Corp..."
              value={aiTone || ""}
              onChange={(e) => onChange(e.target.value)}
            />
            {aiTone &&
              aiTone.trim() !== "" &&
              !activeCharacter && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={12} />
                  <span className="font-medium">Custom persona active</span>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiPersonaTab;
