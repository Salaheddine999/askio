import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Copy, MessageCircle, Plus, Send } from "lucide-react";

// Each illustration mounts when its step becomes active and plays a short
// timeline from there. With reduced motion it renders the finished state.
function useElapsed() {
  const reduceMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(performance.now() - start), 50);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return reduceMotion ? Number.POSITIVE_INFINITY : elapsed;
}

function typed(text: string, elapsed: number, startMs: number, msPerChar: number) {
  return text.slice(0, Math.max(0, Math.floor((elapsed - startMs) / msPerChar)));
}

function Caret() {
  return <span className="ml-px inline-block h-3 w-px translate-y-0.5 animate-pulse bg-current" />;
}

function TabBar({ tabs, active }: { tabs: string[]; active: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#D8DFE9] bg-[#F3F7FC] px-4 pt-2.5 dark:border-[#2B3646] dark:bg-[#141D2B]">
      {tabs.map((tab) => (
        <span
          key={tab}
          className={`pb-2 text-caption font-sans ${
            tab === active
              ? "border-b-2 border-[#101723] font-semibold text-[#101723] dark:border-[#D7DFE5] dark:text-[#D7DFE5]"
              : "font-medium text-[#647184]"
          }`}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}

const FAQ_SEED = [
  { q: "What are your opening hours?", a: "Monday to Friday, 9:00–17:00." },
  { q: "How long does delivery take?", a: "Orders arrive in 2–4 business days." },
];
const FAQ_NEW = { q: "Do you ship internationally?", a: "Yes, we ship to over 30 countries." };

export function ConfigureIllustration() {
  const elapsed = useElapsed();
  const question = typed(FAQ_NEW.q, elapsed, 500, 40);
  const answer = typed(FAQ_NEW.a, elapsed, 1900, 28);
  const typingQuestion = elapsed >= 500 && question.length < FAQ_NEW.q.length;
  const typingAnswer = elapsed >= 1900 && answer.length < FAQ_NEW.a.length;
  const saved = elapsed > 3200;

  return (
    <div className="flex h-full flex-col">
      <TabBar tabs={["General", "FAQ", "Embed"]} active="FAQ" />
      <div className="flex-1 space-y-2.5 overflow-hidden p-4 sm:space-y-3 sm:p-6">
        {FAQ_SEED.map((item, index) => (
          <div
            key={item.q}
            className={`rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] px-3 py-2.5 dark:border-[#2B3646] dark:bg-[#1A2533] ${
              index === 0 ? "hidden sm:block" : ""
            }`}
          >
            <p className="text-caption font-medium text-[#101723] dark:text-[#D7DFE5]">{item.q}</p>
            <p className="mt-0.5 text-[11px] text-[#647184] dark:text-[#9BAABD]">{item.a}</p>
          </div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`space-y-2 rounded-lg border bg-[#F9FCFF] p-3 transition-colors duration-300 dark:bg-[#1A2533] ${
            saved
              ? "border-[#D8DFE9] dark:border-[#2B3646]"
              : "border-[#101723] shadow-[0_0_0_3px_rgba(16,23,35,0.06)] dark:border-[#D7DFE5]"
          }`}
        >
          <div className="flex h-8 items-center rounded-md border border-[#D8DFE9] bg-[#F3F7FC] px-2.5 dark:border-[#2B3646] dark:bg-[#141D2B]">
            <span className={`text-caption font-medium ${question ? "text-[#101723] dark:text-[#D7DFE5]" : "text-[#9BAABD]"}`}>
              {question || "Question"}
            </span>
            {typingQuestion ? <Caret /> : null}
          </div>
          <div className="flex h-8 items-center rounded-md border border-[#D8DFE9] bg-[#F3F7FC] px-2.5 dark:border-[#2B3646] dark:bg-[#141D2B]">
            <span className={`text-[11px] ${answer ? "text-[#566273] dark:text-[#9BAABD]" : "text-[#9BAABD]"}`}>
              {answer || "Answer"}
            </span>
            {typingAnswer ? <Caret /> : null}
          </div>
        </motion.div>
      </div>
      <div className="flex items-center justify-between border-t border-[#D8DFE9] bg-[#F3F7FC] px-4 py-2.5 dark:border-[#2B3646] dark:bg-[#141D2B]">
        <span className="flex items-center gap-1.5 text-caption text-[#566273] dark:text-[#9BAABD]">
          {saved ? (
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex size-4 items-center justify-center rounded-full bg-[#0F9D74]"
            >
              <Check className="h-2.5 w-2.5 text-white" />
            </motion.span>
          ) : (
            <span className="size-2 rounded-full bg-[#D7A43B]" />
          )}
          {saved ? "3 answers saved" : "Unsaved changes"}
        </span>
        <span className="flex items-center gap-1 rounded-md bg-[#101723] px-3 py-1.5 text-caption font-medium text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
          <Plus className="h-3 w-3" /> Add Q&amp;A
        </span>
      </div>
    </div>
  );
}

// The first swatch follows the site's own ink color so it reads in dark mode.
const DESIGN_COLORS = [null, "#2F6FEB", "#0F9D74", "#C2410C"] as const;

function accent(index: number) {
  const color = DESIGN_COLORS[index];
  return color
    ? { className: "text-white", style: { backgroundColor: color } }
    : { className: "bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]", style: {} };
}

export function DesignIllustration() {
  const elapsed = useElapsed();
  const colorIndex = elapsed > 2600 ? 2 : elapsed > 1200 ? 1 : 0;
  const onLeft = elapsed > 3700;
  const theme = accent(colorIndex);

  return (
    <div className="flex h-full">
      <div className="flex w-[38%] flex-col gap-4 border-r border-[#D8DFE9] bg-[#F3F7FC] p-3 sm:w-1/3 sm:p-5 dark:border-[#2B3646] dark:bg-[#141D2B]">
        <div className="text-caption font-semibold text-[#101723] dark:text-[#D7DFE5]">Appearance</div>
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-[#566273] dark:text-[#9BAABD]">Theme color</div>
          <div className="flex gap-1 sm:gap-2">
            {DESIGN_COLORS.map((_, index) => {
              const swatch = accent(index);
              return (
                <span key={index} className="relative flex size-5 items-center justify-center sm:size-6">
                  {index === colorIndex ? (
                    <motion.span
                      layoutId="design-swatch-ring"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute inset-0 rounded-full ring-2 ring-[#101723] dark:ring-[#D7DFE5]"
                    />
                  ) : null}
                  <span className={`size-3.5 rounded-full sm:size-4 ${swatch.className}`} style={swatch.style} />
                </span>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-[#566273] dark:text-[#9BAABD]">Position</div>
          <div className="relative flex rounded-md border border-[#D8DFE9] p-0.5 dark:border-[#2B3646]">
            {["Left", "Right"].map((side) => {
              const selected = (side === "Left") === onLeft;
              return (
                <span key={side} className="relative flex h-6 flex-1 items-center justify-center">
                  {selected ? (
                    <motion.span
                      layoutId="design-position-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded bg-[#101723] dark:bg-[#D7DFE5]"
                    />
                  ) : null}
                  <span
                    className={`relative text-[9px] font-medium transition-colors duration-200 ${
                      selected ? "text-white dark:text-[#141D2B]" : "text-[#566273] dark:text-[#9BAABD]"
                    }`}
                  >
                    {side}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="hidden space-y-2 sm:block">
          <div className="text-[10px] font-medium text-[#566273] dark:text-[#9BAABD]">Corner radius</div>
          <div className="h-1.5 w-full rounded-full bg-[#D8DFE9] dark:bg-[#2B3646]">
            <div className="h-full w-3/4 rounded-full bg-[#101723] dark:bg-[#D7DFE5]" />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col bg-[#F3F7FC] p-3 sm:p-5 dark:bg-[#141D2B]">
        <div className="mb-3 hidden text-[10px] font-medium tracking-wide text-[#647184] sm:block">PREVIEW</div>
        {/* A blank page sketch behind the widget */}
        <div className="hidden space-y-2 opacity-60 sm:block" aria-hidden="true">
          <div className="h-2 w-2/5 rounded-full bg-[#D8DFE9] dark:bg-[#2B3646]" />
          <div className="h-2 w-4/5 rounded-full bg-[#E7EDF6] dark:bg-[#202C3C]" />
          <div className="h-2 w-3/5 rounded-full bg-[#E7EDF6] dark:bg-[#202C3C]" />
        </div>
        <div className={`mt-auto flex ${onLeft ? "justify-start" : "justify-end"}`}>
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={`flex flex-col gap-2 ${onLeft ? "items-start" : "items-end"}`}
          >
            <div className="w-[170px] space-y-2.5 rounded-xl bg-[#F9FCFF] p-3 shadow-lg sm:w-[210px] dark:bg-[#1A2533]">
              <div className="flex items-center gap-2 border-b border-[#D8DFE9] pb-2 dark:border-[#2B3646]">
                <span
                  className={`flex size-6 items-center justify-center rounded-full transition-colors duration-500 ${theme.className}`}
                  style={theme.style}
                >
                  <MessageCircle className="h-3 w-3" />
                </span>
                <span className="text-caption font-semibold text-[#101723] dark:text-[#D7DFE5]">Askio Bot</span>
                <span className="ml-auto size-1.5 rounded-full bg-[#10B981]" />
              </div>
              <p className="w-fit rounded-lg rounded-bl-none bg-[#F3F7FC] px-2.5 py-1.5 text-[10px] text-[#101723] dark:bg-[#2B3646] dark:text-[#D7DFE5]">
                Hi there! How can I help?
              </p>
              <p
                className={`ml-auto w-fit rounded-lg rounded-br-none px-2.5 py-1.5 text-[10px] transition-colors duration-500 ${theme.className}`}
                style={theme.style}
              >
                Where's my order?
              </p>
              <div className="flex items-center gap-1.5 rounded-lg bg-[#F3F7FC] p-1.5 dark:bg-[#2B3646]">
                <span className="flex-1 px-1 text-[9px] text-[#647184]">Type a message...</span>
                <span
                  className={`flex size-5 items-center justify-center rounded transition-colors duration-500 ${theme.className}`}
                  style={theme.style}
                >
                  <Send className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
            <span
              className={`flex size-9 items-center justify-center rounded-full shadow-md transition-colors duration-500 ${theme.className}`}
              style={theme.style}
            >
              <MessageCircle className="h-4 w-4" />
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const EMBED_ORIGIN = "https://getaskio.xyz";
const EMBED_LINES: { text: string; tone: "tag" | "attr" | "string" | "plain" }[][] = [
  [{ text: "<div ", tone: "tag" }, { text: "id", tone: "attr" }, { text: '="chatbot-container"', tone: "string" }, { text: "></div>", tone: "tag" }],
  [{ text: "<script ", tone: "tag" }, { text: "src", tone: "attr" }, { text: `="${EMBED_ORIGIN}/chatbot-embed.js"`, tone: "string" }, { text: "></script>", tone: "tag" }],
  [{ text: "<script>", tone: "tag" }],
  [{ text: "  ChatbotEmbed", tone: "plain" }, { text: ".init(", tone: "attr" }, { text: `"your-bot-id", "${EMBED_ORIGIN}"`, tone: "string" }, { text: ");", tone: "attr" }],
  [{ text: "</script>", tone: "tag" }],
];
const TONE_CLASS = {
  tag: "text-[#566273] dark:text-[#9BAABD]",
  attr: "text-[#647184] dark:text-[#87909D]",
  string: "text-[#101723] dark:text-[#D7DFE5]",
  plain: "font-semibold text-[#101723] dark:text-[#D7DFE5]",
};

export function EmbedIllustration() {
  const elapsed = useElapsed();
  const visibleLines = Math.min(EMBED_LINES.length, Math.floor(elapsed / 260));
  const copied = elapsed > 2000;
  const live = elapsed > 2900;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[#D8DFE9] bg-[#F3F7FC] px-4 py-2.5 dark:border-[#2B3646] dark:bg-[#141D2B]">
        <span className="font-mono text-caption font-medium text-[#101723] dark:text-[#D7DFE5]">index.html</span>
        <span className="text-[10px] text-[#647184]">Paste before &lt;/body&gt;</span>
      </div>
      <div className="flex-1 overflow-hidden bg-[#F9FCFF] px-3 py-3 font-mono text-[10px] leading-[20px] sm:px-5 sm:py-4 sm:text-[12px] sm:leading-[24px] dark:bg-[#1A2533]">
        {EMBED_LINES.map((tokens, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ opacity: index < visibleLines ? 1 : 0, x: index < visibleLines ? 0 : -6 }}
            transition={{ duration: 0.2 }}
            className="flex whitespace-nowrap"
          >
            <span className="mr-3 w-4 shrink-0 select-none text-right text-[#B8C2CF] sm:mr-4 dark:text-[#3A4657]">{index + 1}</span>
            <span className="truncate">
              {tokens.map((token, i) => (
                <span key={i} className={TONE_CLASS[token.tone]}>
                  {token.text}
                </span>
              ))}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[#D8DFE9] bg-[#F3F7FC] px-3 py-2.5 sm:px-5 dark:border-[#2B3646] dark:bg-[#141D2B]">
        <span className="flex items-center gap-2 text-caption text-[#566273] dark:text-[#9BAABD]">
          <span className={`size-2 rounded-full transition-colors duration-300 ${live ? "bg-[#10B981]" : "bg-[#D8DFE9] dark:bg-[#2B3646]"}`} />
          {live ? "Live on yourstore.com" : "Waiting for install"}
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption font-medium transition-colors duration-300 ${
            copied
              ? "bg-[#0F9D74] text-white"
              : "bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]"
          }`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy code"}
        </span>
      </div>

      {/* The visitor's site, with the chatbot launcher arriving once installed */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={live ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="absolute bottom-14 right-3 w-[150px] overflow-hidden rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] shadow-[0_12px_32px_-12px_rgba(16,23,35,0.35)] sm:bottom-16 sm:right-5 sm:w-[200px] dark:border-[#2B3646] dark:bg-[#202C3C]"
        aria-hidden="true"
      >
        <div className="flex items-center gap-1 border-b border-[#D8DFE9] bg-[#F3F7FC] px-2 py-1.5 dark:border-[#2B3646] dark:bg-[#141D2B]">
          <span className="truncate rounded bg-[#F9FCFF] px-1.5 text-[8px] text-[#647184] sm:text-[9px] dark:bg-[#1A2533]">yourstore.com</span>
        </div>
        <div className="relative h-[64px] space-y-1.5 p-2 sm:h-[84px]">
          <div className="h-1.5 w-1/2 rounded-full bg-[#D8DFE9] dark:bg-[#2B3646]" />
          <div className="h-1.5 w-4/5 rounded-full bg-[#E7EDF6] dark:bg-[#1A2533]" />
          <div className="h-1.5 w-3/5 rounded-full bg-[#E7EDF6] dark:bg-[#1A2533]" />
          <motion.span
            initial={{ scale: 0 }}
            animate={live ? { scale: 1 } : { scale: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.25 }}
            className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded-full bg-[#101723] text-white shadow-md sm:size-7 dark:bg-[#D7DFE5] dark:text-[#141D2B]"
          >
            <MessageCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
}
