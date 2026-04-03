import { Check, Code, ListChecks, MessageCircle, Move, Settings, Type, Palette, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { forwardRef, useRef } from "react";
import { FaAngular, FaReact, FaShopify, FaVuejs, FaWordpress } from "react-icons/fa";
import { SiWix } from "react-icons/si";
import { AnimatedList } from "../../components/magicui/animated-list";
import { AnimatedBeam } from "../../components/magicui/animated-beam";
import HatchStrip from "./HatchStrip";
import Badge from "./Badge";

const IntegrationCircle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={`z-10 flex size-12 items-center justify-center rounded-full border-2 border-[#E7E5E4] bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:border-[#57524F] dark:bg-[#292524] ${className ?? ""}`}
    >
      {children}
    </div>
  );
});

IntegrationCircle.displayName = "IntegrationCircle";

type ConfigItem = {
  name: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
  controlType: "toggle" | "choice" | "button" | "chips";
  enabled?: boolean;
  choice?: string;
  buttonLabel?: string;
  chips?: string[];
};

const configurationItems: ConfigItem[] = [
  {
    name: "Theme color",
    description: "Brand color applied to launcher and chat accents",
    time: "just now",
    icon: <Palette className="h-4 w-4 text-white" />,
    color: "#D79B3B",
    controlType: "button",
    buttonLabel: "Edit",
  },
  {
    name: "Widget position",
    description: "Launcher anchored to bottom right",
    time: "1m ago",
    icon: <Move className="h-4 w-4 text-white" />,
    color: "#7C6B58",
    controlType: "choice",
    choice: "Bottom right",
  },
  {
    name: "Welcome message",
    description: "Greeting shown when a visitor opens Askio",
    time: "2m ago",
    icon: <MessageCircle className="h-4 w-4 text-white" />,
    color: "#C46A5A",
    controlType: "toggle",
    enabled: true,
  },
  {
    name: "Placeholder text",
    description: "Prompt shown inside the message input",
    time: "4m ago",
    icon: <Type className="h-4 w-4 text-white" />,
    color: "#5B8E7D",
    controlType: "button",
    buttonLabel: "Update",
  },
  {
    name: "FAQs",
    description: "Frequently asked questions shown in the widget",
    time: "6m ago",
    icon: <ListChecks className="h-4 w-4 text-white" />,
    color: "#7C75C7",
    controlType: "chips",
    chips: ["Shipping", "Pricing", "Returns"],
  },
];

function ConfigurationControl({
  controlType,
  enabled,
  choice,
  buttonLabel,
  chips,
}: Pick<ConfigItem, "controlType" | "enabled" | "choice" | "buttonLabel" | "chips">) {
  if (controlType === "toggle") {
    return (
      <div
        className={`flex h-6 w-10 shrink-0 items-center rounded-full px-0.5 transition-colors ${
          enabled ? "justify-end bg-[#2F2A25]" : "justify-start bg-[#E8E1D7] dark:bg-[#4A433E]"
        }`}
      >
        <div className="flex size-5 items-center justify-center rounded-full bg-white shadow-sm">
          {enabled ? <Check className="h-3 w-3 text-[#2F2A25]" /> : null}
        </div>
      </div>
    );
  }

  if (controlType === "choice") {
    return (
      <div className="shrink-0 rounded-full bg-[#F3EEE7] px-2.5 py-1 text-[10px] font-medium text-[#5E554D] dark:bg-[#433B35] dark:text-[#F5F5F4]">
        {choice}
      </div>
    );
  }

  if (controlType === "button") {
    return (
      <button
        type="button"
        className="shrink-0 rounded-full bg-[#2F2A25] px-2.5 py-1 text-[10px] font-medium text-white dark:bg-[#F5F5F4] dark:text-[#1C1917]"
      >
        {buttonLabel}
      </button>
    );
  }

  return (
    <div className="flex shrink-0 gap-1">
      {(chips ?? []).slice(0, 2).map((chip) => (
        <span
          key={chip}
          className="rounded-full bg-[#F3EEE7] px-2 py-1 text-[9px] font-medium text-[#5E554D] dark:bg-[#433B35] dark:text-[#F5F5F4]"
        >
          {chip}
        </span>
      ))}
      {(chips?.length ?? 0) > 2 ? (
        <span className="rounded-full bg-[#E7DED3] px-2 py-1 text-[9px] font-medium text-[#7A6D60] dark:bg-[#514740] dark:text-[#D6D3D1]">
          +{(chips?.length ?? 0) - 2}
        </span>
      ) : null}
    </div>
  );
}

function ConfigurationItem({ name, description, time, icon, color, controlType, enabled, choice, buttonLabel, chips }: ConfigItem) {
  return (
    <motion.figure
      variants={{
        hidden: { opacity: 0, y: 18, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative mx-auto w-full cursor-default overflow-hidden rounded-2xl bg-white/95 p-3.5 [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_6px_18px_rgba(0,0,0,.06)] dark:bg-[#312C29] dark:[box-shadow:0_0_0_1px_rgba(255,255,255,.06),0_12px_28px_rgba(0,0,0,.24)]"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <figcaption className="flex items-center gap-1 text-[11px] font-semibold text-[#37322F] dark:text-[#F5F5F4]">
            <span className="truncate">{name}</span>
            <span className="text-[#B0AAA5]">·</span>
            <span className="shrink-0 text-[10px] font-medium text-[#A8A29E]">{time}</span>
          </figcaption>
          <p className="mt-0.5 text-[10px] leading-[14px] text-[#78716C] dark:text-[#A8A29E]">{description}</p>
        </div>
        <ConfigurationControl
          controlType={controlType}
          enabled={enabled}
          choice={choice}
          buttonLabel={buttonLabel}
          chips={chips}
        />
      </div>
    </motion.figure>
  );
}

function ConfigurationListPreview() {
  const movingItems = [...configurationItems, ...configurationItems];

  return (
    <div className="relative mt-auto h-[220px] w-full overflow-hidden rounded-[9px] bg-[linear-gradient(180deg,#FCFAF7_0%,#F5EFE7_100%)] p-2 dark:bg-[linear-gradient(180deg,#27211D_0%,#1F1A17_100%)]">
      <motion.div
        animate={{ y: ["0%", "-50%"] }}
        transition={{ duration: 11, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
      >
        <AnimatedList className="space-y-2">
          {movingItems.map((item, index) => (
            <ConfigurationItem key={`${item.name}-${index}`} {...item} />
          ))}
        </AnimatedList>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#FCFAF7] to-transparent dark:from-[#27211D]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-[#F8F4EE] via-[#F8F4EE]/55 to-transparent dark:from-[#221D1A] dark:via-[#221D1A]/45" />
    </div>
  );
}

function AnalyticsLeadsPreview() {
  const chartBars = [64, 42, 70, 58, 74, 61, 79, 52, 68];

  return (
    <div className="mt-auto relative h-[220px] w-full overflow-hidden">
      <div className="absolute inset-x-6 top-2 h-[160px] rounded-[14px] border border-[#E7E1D9] bg-[#FCFBFA] opacity-55 dark:border-[#44403C] dark:bg-[#2A2421]" />
      <div className="absolute inset-x-3 top-6 h-[168px] rounded-[14px] border border-[#E7E1D9] bg-[#FDFCFA] opacity-80 dark:border-[#44403C] dark:bg-[#312B27]" />

      <div className="absolute inset-x-0 top-12 rounded-[16px] border border-[#E7E1D9] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF8F4_100%)] p-5 shadow-[0px_10px_30px_rgba(0,0,0,0.08)] dark:border-[#44403C] dark:bg-[linear-gradient(180deg,#2A2421_0%,#211D1A_100%)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#8A8178] dark:text-[#A8A29E]">
              Captured Leads
            </p>
            <p className="mt-1 text-[30px] font-semibold leading-none text-[#37322F] dark:text-[#F5F5F4]">
              317
            </p>
          </div>
          <div className="rounded-full bg-[#EEF6F0] px-2.5 py-1 text-[10px] font-medium text-[#4F9A63] dark:bg-[#253128] dark:text-[#8FD19B]">
            +18.4%
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-end justify-between text-[9px] text-[#A8A29E] dark:text-[#78716C]">
            <span>100</span>
            <span>300</span>
            <span>500</span>
          </div>

          <div className="flex h-[86px] items-end gap-3">
            {chartBars.map((height, index) => (
              <motion.div
                key={index}
                style={{ height: `${height}px`, transformOrigin: "bottom" }}
                animate={{ scaleY: [0.88, 1.08, 0.88] }}
                transition={{
                  duration: 3.8,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: index * 0.08,
                }}
                className="flex-1 rounded-t-[6px] bg-[linear-gradient(180deg,#7B6A58_0%,#5E5144_100%)] shadow-[inset_0_-14px_20px_rgba(255,255,255,0.28)] dark:bg-[linear-gradient(180deg,#D6D3D1_0%,#A8A29E_100%)] dark:shadow-[inset_0_-14px_20px_rgba(28,25,23,0.18)]"
              />
            ))}
          </div>
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
            <img src="/logo.svg" alt="Askio" className="h-8 w-8" />
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

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={wordpressRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        curvature={-75}
        endYOffset={-10}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={shopifyRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={wixRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        curvature={75}
        endYOffset={10}
      />
      <AnimatedBeam
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
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={angularRef}
        toRef={askioRef}
        duration={4.8}
        pathWidth={2.4}
        pathOpacity={0.28}
        reverse
      />
      <AnimatedBeam
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
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.section
      ref={featuresRef}
      initial={{ opacity: 0, y: 40 }}
      animate={featuresInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      id="features"
      className=""
    >
      <div className="py-20 flex flex-col items-center text-center px-4">
        <Badge text="Features" />
        <h2 className="mt-5 text-display font-serif tracking-tight text-[#49423D] dark:text-[#F5F5F4]">
          Powerful features for your chatbots
        </h2>
        <p className="mt-3 text-[#57524F] dark:text-[#A8A29E] text-body max-w-md">
          Everything you need to create, customize, and deploy chatbots that engage your visitors.
        </p>
      </div>

      <div className="flex border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
        <HatchStrip />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-b md:border-b-0 border-r-0 md:border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center">
                <Code className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Seamless Integration</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Add your chatbot to any website with just a few clicks using a simple embed code.
            </p>
            <IntegrationBeamPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t md:border-t-0 border-b md:border-b-0 border-[rgba(55,50,47,0.12)] dark:border-[#44403C] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Real-Time Engagement</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Engage visitors instantly with automated conversations tailored to your business needs.
            </p>
            <div className="mt-auto w-full h-[220px] rounded-[14px] bg-[linear-gradient(180deg,#FFFFFF_0%,#FBF9F6_100%)] dark:bg-[linear-gradient(180deg,#292524_0%,#221F1D_100%)] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_8px_24px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-2 bg-[rgba(250,250,249,0.85)] dark:bg-[rgba(28,25,23,0.82)] backdrop-blur-sm">
                <div className="w-6 h-6 rounded-full bg-white dark:bg-[#2A2421] flex items-center justify-center shadow-sm ring-1 ring-black/5">
                  <img src="/logo.svg" alt="Askio" className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans">Askio Bot</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7CB342]" />
                  <span className="text-[9px] font-medium text-[#78716C] dark:text-[#A8A29E]">Live now</span>
                </div>
              </div>
              <div className="flex-1 p-3.5 space-y-2.5">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, 0, 8] }}
                  transition={{ duration: 6.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", times: [0, 0.07, 0.16, 0.78, 0.87, 1] }}
                  className="flex items-end gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-white dark:bg-[#2A2421] shrink-0 flex items-center justify-center shadow-sm ring-1 ring-black/5">
                    <img src="/logo.svg" alt="Askio" className="h-2.5 w-2.5" />
                  </div>
                  <div className="bg-[#F5F1EB] dark:bg-[#44403C] rounded-2xl rounded-bl-md px-3 py-2 max-w-[78%] shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                    <p className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-sans leading-[14px]">Hi! How can I help you today?</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, 0, 8] }}
                  transition={{ duration: 6.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", times: [0, 0.18, 0.27, 0.78, 0.87, 1] }}
                  className="flex justify-end"
                >
                  <div className="bg-[#37322F] dark:bg-[#F5F5F4] rounded-2xl rounded-br-md px-3 py-2 max-w-[78%] shadow-[0_8px_20px_rgba(55,50,47,0.16)]">
                    <p className="text-[10px] text-white dark:text-[#1C1917] font-sans leading-[14px]">Do you have a return policy?</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, 0, 8] }}
                  transition={{ duration: 6.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", times: [0, 0.34, 0.43, 0.78, 0.87, 1] }}
                  className="flex items-end gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-white dark:bg-[#2A2421] shrink-0 flex items-center justify-center shadow-sm ring-1 ring-black/5">
                    <img src="/logo.svg" alt="Askio" className="h-2.5 w-2.5" />
                  </div>
                  <div className="bg-[#F5F1EB] dark:bg-[#44403C] rounded-2xl rounded-bl-md px-3 py-2 max-w-[78%] shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                    <p className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-sans leading-[14px]">Yes! 30-day free returns on all items.</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: [0, 0, 1, 1, 0, 0], y: [8, 8, 0, 0, 0, 8] }}
                  transition={{ duration: 6.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", times: [0, 0.5, 0.59, 0.78, 0.87, 1] }}
                  className="flex items-end gap-2"
                >
                  <div className="w-5 h-5 shrink-0 opacity-0" />
                  <div className="bg-[#F5F1EB] dark:bg-[#44403C] rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                    <div className="w-1 h-1 rounded-full bg-[#57524F] dark:bg-[#A8A29E] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1 h-1 rounded-full bg-[#57524F] dark:bg-[#A8A29E] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1 h-1 rounded-full bg-[#57524F] dark:bg-[#A8A29E] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t md:border-t border-r-0 md:border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Analytics & Leads</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Track performance, capture leads, and spot unanswered questions so you can keep improving every chatbot.
            </p>
            <AnalyticsLeadsPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C] cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center">
                <Settings className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Easy Configuration</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Set up responses, behavior, and placement with our user-friendly interface.
            </p>
            <ConfigurationListPreview />
          </div>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
