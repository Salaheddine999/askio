import { Check, Code, MessageCircle, Move, Settings, Palette, BarChart3, Send } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { forwardRef, useEffect, useRef, useState } from "react";
import { FaAngular, FaReact, FaShopify, FaVuejs, FaWordpress } from "react-icons/fa";
import { SiWix } from "react-icons/si";
import { AnimatedBeam } from "../../components/magicui/animated-beam";
import HatchStrip from "./HatchStrip";
import Badge from "./Badge";
import logoHome from "../../assets/logo.svg";

const IntegrationCircle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={`z-10 flex size-12 items-center justify-center rounded-full border-2 border-[#E7EDF6] bg-[#F9FCFF] p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:border-[#566273] dark:bg-[#1A2533] ${className ?? ""}`}
    >
      {children}
    </div>
  );
});

IntegrationCircle.displayName = "IntegrationCircle";

const THEME_COLORS = ["#101723", "#2F6FEB", "#0F9D74", "#C2410C"];
const WIDGET_POSITIONS = ["Bottom right", "Bottom left"];
const CONFIG_STEP_MS = 2400;

type ConfigState = { theme: number; position: number; greeting: boolean; active: number };

// Each step activates the next row and changes its setting.
function nextConfigState(state: ConfigState): ConfigState {
  const active = (state.active + 1) % 3;
  if (active === 0) return { ...state, active, theme: (state.theme + 1) % THEME_COLORS.length };
  if (active === 1) return { ...state, active, position: (state.position + 1) % WIDGET_POSITIONS.length };
  return { ...state, active, greeting: !state.greeting };
}

function ConfigurationRow({
  active,
  name,
  time,
  description,
  icon,
  iconColor,
  children,
}: {
  active: boolean;
  name: string;
  time: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <motion.figure
      animate={{ opacity: active ? 1 : 0.85, scale: active ? 1 : 0.985 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative mx-auto w-full cursor-default rounded-2xl bg-[#F9FCFF]/95 p-3 transition-shadow duration-300 dark:bg-[#202C3C] ${
        active
          ? "[box-shadow:0_0_0_1px_rgba(16,23,35,.10),0_10px_24px_rgba(16,23,35,.10)] dark:[box-shadow:0_0_0_1px_rgba(255,255,255,.12),0_12px_28px_rgba(0,0,0,.32)]"
          : "[box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_6px_18px_rgba(0,0,0,.05)] dark:[box-shadow:0_0_0_1px_rgba(255,255,255,.06),0_12px_28px_rgba(0,0,0,.24)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ backgroundColor: iconColor }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex size-8 shrink-0 items-center justify-center rounded-xl sm:size-10 sm:rounded-2xl"
        >
          {icon}
        </motion.div>
        <div className="min-w-0 flex-1">
          <figcaption className="flex items-center gap-1 text-[11px] font-semibold text-[#101723] dark:text-[#D7DFE5]">
            <span className="truncate">{name}</span>
            <span className="hidden text-[#87909D] sm:inline">·</span>
            <span className="hidden shrink-0 text-[10px] font-medium text-[#9BAABD] sm:inline">{active ? "just now" : time}</span>
          </figcaption>
          <p className="mt-0.5 truncate text-[10px] leading-[14px] text-[#647184] dark:text-[#9BAABD]">{description}</p>
        </div>
        {children}
      </div>
    </motion.figure>
  );
}

function ConfigurationListPreview() {
  const reduceMotion = useReducedMotion();
  const [previewRef, inView] = useInView({ rootMargin: "100px 0px" });
  const [state, setState] = useState<ConfigState>({ theme: 0, position: 0, greeting: true, active: 0 });

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setState(nextConfigState);
    }, CONFIG_STEP_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, inView]);

  const themeColor = THEME_COLORS[state.theme];
  const position = WIDGET_POSITIONS[state.position];

  return (
    <div
      ref={previewRef}
      className="relative mt-auto flex min-h-[220px] w-full flex-col justify-center gap-2 rounded-[9px] bg-[linear-gradient(180deg,#F9FCFF_0%,#E7EDF6_100%)] p-2 dark:bg-[linear-gradient(180deg,#1A2533_0%,#141D2B_100%)]"
    >
      <ConfigurationRow
        active={state.active === 0}
        name="Theme color"
        time="2m ago"
        description="Applied to the launcher and chat"
        icon={<Palette className="h-4 w-4 text-white" />}
        iconColor={themeColor}
      >
        <div className="flex shrink-0 items-center gap-1">
          {THEME_COLORS.map((color, i) => (
            <span key={color} className="relative flex size-4 items-center justify-center">
              {i === state.theme ? (
                <motion.span
                  layoutId="theme-swatch-ring"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-full ring-[1.5px] ring-[#101723] dark:ring-[#D7DFE5]"
                />
              ) : null}
              <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            </span>
          ))}
        </div>
      </ConfigurationRow>

      <ConfigurationRow
        active={state.active === 1}
        name="Widget position"
        time="1m ago"
        description={`Launcher anchored to ${position.toLowerCase()}`}
        icon={<Move className="h-4 w-4 text-white" />}
        iconColor="#566273"
      >
        <div className="relative h-6 w-[78px] shrink-0 overflow-hidden rounded-full bg-[#E7EDF6] text-[10px] font-medium text-[#566273] dark:bg-[#243040] dark:text-[#D7DFE5]">
          <AnimatePresence initial={false}>
            <motion.span
              key={position}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {position}
            </motion.span>
          </AnimatePresence>
        </div>
      </ConfigurationRow>

      <ConfigurationRow
        active={state.active === 2}
        name="Welcome message"
        time="4m ago"
        description={state.greeting ? "Greeting shown when a visitor opens Askio" : "Visitors start with an empty chat"}
        icon={<MessageCircle className="h-4 w-4 text-white" />}
        iconColor="#6E7C8C"
      >
        <div
          className={`flex h-6 w-10 shrink-0 items-center rounded-full px-0.5 transition-colors duration-300 ${
            state.greeting ? "justify-end bg-[#101723] dark:bg-[#566273]" : "justify-start bg-[#D8DFE9] dark:bg-[#3A4657]"
          }`}
        >
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className="flex size-5 items-center justify-center rounded-full bg-[#F9FCFF] shadow-sm"
          >
            {state.greeting ? <Check className="h-3 w-3 text-[#101723]" /> : null}
          </motion.div>
        </div>
      </ConfigurationRow>
    </div>
  );
}

const FAQ_DEMO = [
  { q: "Do you have a return policy?", a: "Yes! 30-day free returns on all items." },
  { q: "How long does shipping take?", a: "Orders arrive in 2–4 business days." },
  { q: "Are you open on weekends?", a: "We're open Saturdays, 10:00–16:00." },
];

// One exchange: the visitor types and sends, the bot types, then answers.
const TYPE_START_MS = 300;
const TYPE_MS_PER_CHAR = 38;
const faqTimeline = (question: string) => {
  const sentAt = TYPE_START_MS + question.length * TYPE_MS_PER_CHAR + 250;
  const botTypingAt = sentAt + 450;
  const answerAt = botTypingAt + 1000;
  const clearAt = answerAt + 2800;
  return { sentAt, botTypingAt, answerAt, clearAt, endAt: clearAt + 450 };
};

function BotAvatar() {
  return (
    <div className="w-5 h-5 rounded-full bg-[#F9FCFF] dark:bg-[#202C3C] shrink-0 flex items-center justify-center shadow-sm ring-1 ring-black/5">
      <img src={logoHome} alt="" className="h-2.5 w-2.5 dark:brightness-0 dark:invert" />
    </div>
  );
}

const botBubbleClass =
  "bg-[#E7EDF6] dark:bg-[#2B3646] rounded-2xl rounded-bl-md px-3 py-2 max-w-[84%] shadow-[0_6px_18px_rgba(0,0,0,0.04)]";

function FaqChatPreview() {
  const reduceMotion = useReducedMotion();
  const [previewRef, inView] = useInView({ rootMargin: "100px 0px" });
  const [pair, setPair] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const { q, a } = FAQ_DEMO[pair];
  const timeline = faqTimeline(q);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setElapsed((t) => t + 50);
    }, 50);
    return () => window.clearInterval(id);
  }, [reduceMotion, inView]);

  useEffect(() => {
    if (elapsed < timeline.endAt) return;
    setPair((p) => (p + 1) % FAQ_DEMO.length);
    setElapsed(0);
  }, [elapsed, timeline.endAt]);

  // Reduced motion shows the first exchange, finished.
  const t = reduceMotion ? timeline.answerAt : elapsed;
  const typedLength = Math.max(0, Math.min(q.length, Math.floor((t - TYPE_START_MS) / TYPE_MS_PER_CHAR)));
  const sent = t >= timeline.sentAt;
  const draft = sent ? "" : q.slice(0, typedLength);
  const exchangeVisible = t < timeline.clearAt;
  const botTyping = t >= timeline.botTypingAt && t < timeline.answerAt;
  const answered = t >= timeline.answerAt;

  return (
    <div
      ref={previewRef}
      className="mt-auto w-full h-[236px] rounded-[14px] bg-[linear-gradient(180deg,#F9FCFF_0%,#F3F7FC_100%)] dark:bg-[linear-gradient(180deg,#1A2533_0%,#1A2533_100%)] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_8px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col"
    >
      <div className="px-4 py-2.5 border-b border-[#D8DFE9] dark:border-[#2B3646] flex items-center gap-2 bg-[rgba(243,247,252,0.85)] dark:bg-[rgba(20,29,43,0.82)] backdrop-blur-sm">
        <div className="w-6 h-6 rounded-full bg-[#F9FCFF] dark:bg-[#202C3C] flex items-center justify-center shadow-sm ring-1 ring-black/5">
          <img src={logoHome} alt="Askio" className="h-3.5 w-3.5 dark:brightness-0 dark:invert" />
        </div>
        <span className="text-[10px] text-[#101723] dark:text-[#D7DFE5] font-semibold font-sans">Askio Bot</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7CB342]" />
          <span className="text-[9px] font-medium text-[#647184] dark:text-[#9BAABD]">Live now</span>
        </div>
      </div>

      <div className="flex-1 px-3.5 pt-3 pb-2 space-y-2 overflow-hidden">
        <div className="flex items-end gap-2">
          <BotAvatar />
          <div className={botBubbleClass}>
            <p className="text-[10px] text-[#101723] dark:text-[#D7DFE5] font-sans leading-[14px]">Hi! How can I help you today?</p>
          </div>
        </div>

        <AnimatePresence>
          {exchangeVisible && sent ? (
            <motion.div
              key={`q-${pair}`}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ transformOrigin: "bottom right" }}
              className="flex justify-end"
            >
              <div className="bg-[#101723] dark:bg-[#D7DFE5] rounded-2xl rounded-br-md px-3 py-2 max-w-[84%] shadow-[0_8px_20px_rgba(16,23,35,0.16)]">
                <p className="text-[10px] text-white dark:text-[#141D2B] font-sans leading-[14px]">{q}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {exchangeVisible && botTyping ? (
            <motion.div
              key={`dots-${pair}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.22 }}
              className="flex items-end gap-2"
            >
              <BotAvatar />
              <div className="bg-[#E7EDF6] dark:bg-[#2B3646] rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1 shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1 h-1 rounded-full bg-[#566273] dark:bg-[#9BAABD] animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </motion.div>
          ) : exchangeVisible && answered ? (
            <motion.div
              key={`a-${pair}`}
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ transformOrigin: "bottom left" }}
              className="flex items-end gap-2"
            >
              <BotAvatar />
              <div className={botBubbleClass}>
                <p className="text-[10px] text-[#101723] dark:text-[#D7DFE5] font-sans leading-[14px]">{a}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* The visitor's message box, where the question is typed */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-full border border-[#D8DFE9] bg-[#F9FCFF] py-1 pl-3 pr-1 dark:border-[#2B3646] dark:bg-[#141D2B]">
          <span className={`flex-1 truncate text-[10px] leading-[14px] ${draft ? "text-[#101723] dark:text-[#D7DFE5]" : "text-[#9BAABD]"}`}>
            {draft || "Type your message..."}
            {draft ? <span className="ml-px inline-block h-2.5 w-px translate-y-0.5 animate-pulse bg-current" /> : null}
          </span>
          <motion.span
            animate={sent && !answered && exchangeVisible ? { scale: [1, 0.85, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-200 ${
              draft ? "bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]" : "bg-[#E7EDF6] text-[#87909D] dark:bg-[#243040]"
            }`}
          >
            <Send className="h-2.5 w-2.5" />
          </motion.span>
        </div>
      </div>
    </div>
  );
}

const LEAD_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const LEAD_BARS = [38, 52, 44, 60, 48, 66];
const LEAD_STEP_MS = 2800;
const SAMPLE_LEADS = [
  { initials: "EM", email: "emma@northshop.co", source: "Shipping question" },
  { initials: "JR", email: "jonas@studiorue.com", source: "Pricing question" },
  { initials: "AK", email: "aylin@kettleandco.nl", source: "Returns question" },
  { initials: "DB", email: "dev@brightdesk.io", source: "Contact form" },
];

function AnalyticsLeadsPreview() {
  const reduceMotion = useReducedMotion();
  const [previewRef, inView] = useInView({ rootMargin: "100px 0px" });
  const [captured, setCaptured] = useState(0);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setCaptured((n) => n + 1);
    }, LEAD_STEP_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion, inView]);

  const count = 317 + captured;
  const lead = SAMPLE_LEADS[captured % SAMPLE_LEADS.length];
  // Today's bar grows with each new lead until it tops the week.
  const todayHeight = Math.min(30 + captured * 6, 72);

  return (
    <div ref={previewRef} className="relative mt-auto w-full pt-8">
      <div className="absolute inset-x-6 top-0 h-[160px] rounded-[14px] border border-[#D8DFE9] bg-[#F9FCFF] opacity-55 dark:border-[#2B3646] dark:bg-[#202C3C]" />
      <div className="absolute inset-x-3 top-4 h-[168px] rounded-[14px] border border-[#D8DFE9] bg-[#F9FCFF] opacity-80 dark:border-[#2B3646] dark:bg-[#202C3C]" />

      <div className="relative rounded-[16px] border border-[#D8DFE9] bg-[linear-gradient(180deg,#F9FCFF_0%,#F3F7FC_100%)] p-4 shadow-[0px_10px_30px_rgba(0,0,0,0.08)] dark:border-[#2B3646] dark:bg-[linear-gradient(180deg,#202C3C_0%,#17212F_100%)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#647184] dark:text-[#9BAABD]">Captured leads · this week</p>
            <div className="relative mt-1 h-[30px] overflow-hidden text-[28px] font-semibold leading-[30px] tabular-nums text-[#101723] dark:text-[#D7DFE5]">
              <AnimatePresence initial={false}>
                <motion.span
                  key={count}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute left-0 top-0"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
              <span className="invisible">{count}</span>
            </div>
          </div>
          <div className="rounded-full bg-[#EEF6F0] px-2.5 py-1 text-[10px] font-medium text-[#4F9A63] dark:bg-[#253128] dark:text-[#8FD19B]">
            +18.4%
          </div>
        </div>
  
        <div className="mt-4 flex h-[72px] items-end gap-2">
          {[...LEAD_BARS, todayHeight].map((height, index) => {
            const isToday = index === LEAD_BARS.length;
            return (
              <motion.div
                key={index}
                initial={false}
                animate={{ height }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="flex flex-1 items-end"
              >
                {/* Inner bar breathes on its own so it doesn't fight the height spring */}
                <motion.div
                  style={{ transformOrigin: "bottom" }}
                  animate={reduceMotion ? undefined : { scaleY: [0.88, 1.06, 0.88] }}
                  transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: index * 0.08 }}
                  className={`h-full w-full rounded-t-[5px] ${
                    isToday ? "bg-[#101723] dark:bg-[#D7DFE5]" : "bg-[#D8DFE9] dark:bg-[#2B3646]"
                  }`}
                />
              </motion.div>
            );
          })}
        </div>
        <div className="mt-1.5 flex gap-2 text-[9px] font-medium text-[#9BAABD] dark:text-[#647184]">
          {LEAD_DAYS.map((day, index) => (
            <span
              key={index}
              className={`flex-1 text-center ${index === LEAD_DAYS.length - 1 ? "text-[#101723] dark:text-[#D7DFE5]" : ""}`}
            >
              {day}
            </span>
          ))}
        </div>
  
        <div className="relative mt-3 h-[44px] overflow-hidden rounded-xl border border-[#D8DFE9]/80 bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533]">
          <AnimatePresence initial={false}>
            <motion.div
              key={captured}
              initial={{ y: 44, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -44, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 flex items-center gap-2.5 px-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E7EDF6] text-[9px] font-semibold text-[#566273] dark:bg-[#243040] dark:text-[#D7DFE5]">
                {lead.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold text-[#101723] dark:text-[#D7DFE5]">{lead.email}</p>
                <p className="truncate text-[10px] text-[#647184] dark:text-[#9BAABD]">via {lead.source}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EEF6F0] px-2 py-0.5 text-[9px] font-medium text-[#4F9A63] dark:bg-[#253128] dark:text-[#8FD19B]">
                New
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function IntegrationBeamPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordpressRef = useRef<HTMLDivElement>(null);
  const shopifyRef = useRef<HTMLDivElement>(null);
  const wixRef = useRef<HTMLDivElement>(null);
  const reactRef = useRef<HTMLDivElement>(null);
  const angularRef = useRef<HTMLDivElement>(null);
  const vueRef = useRef<HTMLDivElement>(null);
  const askioRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="mt-auto relative flex h-[220px] w-full items-center justify-center overflow-visible pt-1"
    >
      <div className="flex size-full max-h-[156px] flex-col items-stretch justify-between gap-3">
        <div className="flex flex-row items-center justify-between">
          <IntegrationCircle ref={wordpressRef}>
            <FaWordpress className="h-5 w-5 text-[#21759B]" />
          </IntegrationCircle>
          <IntegrationCircle ref={reactRef}>
            <FaReact className="h-5 w-5 text-[#61DAFB]" />
          </IntegrationCircle>
        </div>

        <div className="flex flex-row items-center justify-between">
          <IntegrationCircle ref={shopifyRef}>
            <FaShopify className="h-5 w-5 text-[#95BF47]" />
          </IntegrationCircle>
          <IntegrationCircle ref={askioRef} className="size-16 p-3.5">
            <img src={logoHome} alt="Askio" className="h-8 w-8 dark:brightness-0 dark:invert" />
          </IntegrationCircle>
          <IntegrationCircle ref={angularRef}>
            <FaAngular className="h-5 w-5 text-[#DD0031]" />
          </IntegrationCircle>
        </div>

        <div className="flex flex-row items-center justify-between">
          <IntegrationCircle ref={wixRef}>
            <SiWix className="h-4.5 w-4.5 text-[#0C6EFC]" />
          </IntegrationCircle>
          <IntegrationCircle ref={vueRef}>
            <FaVuejs className="h-5 w-5 text-[#42B883]" />
          </IntegrationCircle>
        </div>
      </div>

      <AnimatedBeam pathColor="#87909D" gradientStartColor="#D7DFE5" gradientStopColor="#101723"
        containerRef={containerRef}
        fromRef={wordpressRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam pathColor="#87909D" gradientStartColor="#D7DFE5" gradientStopColor="#101723"
        containerRef={containerRef}
        fromRef={shopifyRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
      />
      <AnimatedBeam pathColor="#87909D" gradientStartColor="#D7DFE5" gradientStopColor="#101723"
        containerRef={containerRef}
        fromRef={wixRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam pathColor="#87909D" gradientStartColor="#D7DFE5" gradientStopColor="#101723"
        containerRef={containerRef}
        fromRef={reactRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        curvature={-75}
        endYOffset={-10}
        reverse
      />
      <AnimatedBeam pathColor="#87909D" gradientStartColor="#D7DFE5" gradientStopColor="#101723"
        containerRef={containerRef}
        fromRef={angularRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        reverse
      />
      <AnimatedBeam pathColor="#87909D" gradientStartColor="#D7DFE5" gradientStopColor="#101723"
        containerRef={containerRef}
        fromRef={vueRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        curvature={75}
        endYOffset={10}
        reverse
      />
    </div>
  );
}

export default function FeaturesSection() {
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, rootMargin: "0px 0px 200px 0px" });

  return (
    <motion.section
      ref={featuresRef}
      initial={{ opacity: 0, y: 40 }}
      animate={featuresInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35 }}
      id="features"
      className=""
    >
      <div className="py-16 sm:py-20 flex flex-col items-center text-center px-4">
        <Badge text="Features" />
        <h2 className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-serif tracking-tight [text-wrap:balance] text-[#101723] dark:text-[#D7DFE5]">
          From first question to next customer
        </h2>
        <p className="mt-3 text-[#566273] dark:text-[#9BAABD] text-body max-w-md">
          Add Askio to your site, answer common questions, and see what visitors need.
        </p>
      </div>

      <div className="flex border-t border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
        <HatchStrip />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-b md:border-b-0 border-r-0 md:border-r border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-[#D8DFE9]/70 bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533] flex items-center justify-center">
                <Code className="w-4 h-4 text-[#101723] dark:text-[#D7DFE5]" />
              </div>
              <h3 className="text-[#101723] dark:text-[#D7DFE5] text-h3">Connect your website</h3>
            </div>
            <p className="text-[#566273] dark:text-[#9BAABD] text-body-sm leading-relaxed">
              Paste one embed code into your site. Keep the tools you already use.
            </p>
            <IntegrationBeamPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t md:border-t-0 border-b md:border-b-0 border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-[#D8DFE9]/70 bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#101723] dark:text-[#D7DFE5]" />
              </div>
              <h3 className="text-[#101723] dark:text-[#D7DFE5] text-h3">Answer FAQs instantly</h3>
            </div>
            <p className="text-[#566273] dark:text-[#9BAABD] text-body-sm leading-relaxed">
              Give visitors your answers to common questions, even when you’re away.
            </p>
            <FaqChatPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t md:border-t border-r-0 md:border-r border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-[#D8DFE9]/70 bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#101723] dark:text-[#D7DFE5]" />
              </div>
              <h3 className="text-[#101723] dark:text-[#D7DFE5] text-h3">Turn interest into leads</h3>
            </div>
            <p className="text-[#566273] dark:text-[#9BAABD] text-body-sm leading-relaxed">
              Capture contact details and track activity so you know where to follow up.
            </p>
            <AnalyticsLeadsPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-[#D8DFE9]/70 bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533] flex items-center justify-center">
                <Settings className="w-4 h-4 text-[#101723] dark:text-[#D7DFE5]" />
              </div>
              <h3 className="text-[#101723] dark:text-[#D7DFE5] text-h3">Make it your own</h3>
            </div>
            <p className="text-[#566273] dark:text-[#9BAABD] text-body-sm leading-relaxed">
              Match your colors, set a greeting, and choose where your chatbot appears.
            </p>
            <ConfigurationListPreview />
          </div>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
