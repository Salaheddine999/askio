import {
  BarChart3,
  Check,
  Clock,
  Code,
  Globe,
  MessageCircle,
  PanelLeft,
  PanelRight,
  RotateCcw,
  Send,
  Settings,
  Truck,
  Type,
  X,
} from "../../components/icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { FaAngular, FaReact, FaShopify, FaVuejs, FaWordpress } from "react-icons/fa";
import { SiWix } from "react-icons/si";
import { AnimatedBeam } from "../../components/magicui/animated-beam";
import HatchStrip from "./HatchStrip";
import logoHome from "../../assets/logo.svg";
import { AiIcon } from "../../components/icons";

const IntegrationCircle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={`z-10 flex size-12 items-center justify-center rounded-full border-2 border-ink-70 bg-ink-25 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:border-ink-605 dark:bg-ink-850 ${className ?? ""}`}
    >
      {children}
    </div>
  );
});

IntegrationCircle.displayName = "IntegrationCircle";

const EDIT_COLORS = [
  { name: "Ink", value: "#101723" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Teal", value: "#0F766E" },
  { name: "Ember", value: "#E8590C" },
  { name: "Rose", value: "#DB2777" },
];
const EDIT_GREETINGS = [
  "Hi! Ask me anything about your order.",
  "Hey there! Need a hand? 👋",
  "Questions before you buy? Ask away.",
  "Welcome to Northwind! How can I help?",
];
// What the AI finds on the page, and the question it turns each into.
const SITE_FACTS = [
  { icon: Truck, text: "Free shipping over €50 · 2–4 days", tag: "Shipping", question: "How long is shipping?" },
  { icon: RotateCcw, text: "30-day free returns", tag: "Returns", question: "Can I return an order?" },
  { icon: Clock, text: "Open Mon–Sat, 9:00–18:00", tag: "Hours", question: "When are you open?" },
];
const SITE_URL = "northwind.shop";
type WidgetSide = "left" | "right";

// After a visitor clicks the toolbar, the demo waits this long before editing again.
const EDIT_IDLE_MS = 9000;
const EDIT_TYPE_MS = 42;
const URL_TYPE_MS = 55;
const editSpring = { type: "spring", stiffness: 380, damping: 32 } as const;

/**
 * Colour fill that sweeps in from the left whenever the colour changes: a
 * circle grows from the left edge over the previous colour, which stays
 * underneath until it's covered.
 */
function ColorSweep({ color }: { color: string }) {
  return (
    <span aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={color}
          initial={{ scale: 0, zIndex: 1 }}
          animate={{ scale: 1, zIndex: 1 }}
          exit={{ zIndex: 0, opacity: 0, transition: { delay: 0.65, duration: 0 } }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-1/2 aspect-square w-[260%] rounded-full"
          style={{ backgroundColor: color, x: "-50%", y: "-50%" }}
        />
      </AnimatePresence>
    </span>
  );
}

type ScanState = "idle" | "scanning" | "done";

function BrandShowcasePreview() {
  const reduceMotion = useReducedMotion();
  const [previewRef, inView] = useInView({ rootMargin: "100px 0px" });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const swatchRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const greetingButtonRef = useRef<HTMLButtonElement | null>(null);
  const sideRefs = useRef<Record<WidgetSide, HTMLButtonElement | null>>({ left: null, right: null });
  const bubbleRef = useRef<HTMLParagraphElement | null>(null);

  // Reduced motion starts (and stays) on the finished result.
  const finished = !!reduceMotion;
  const [url, setUrl] = useState(finished ? SITE_URL : "");
  const [scan, setScan] = useState<ScanState>(finished ? "done" : "idle");
  const [found, setFound] = useState(finished ? SITE_FACTS.length : 0);
  const [answers, setAnswers] = useState(finished ? SITE_FACTS.length : 0);
  const [widgetOpen, setWidgetOpen] = useState(finished);
  const [editing, setEditing] = useState(finished);

  const [color, setColor] = useState(0);
  const [greeting, setGreeting] = useState(0);
  const [typed, setTyped] = useState(EDIT_GREETINGS[0]);
  const [editingText, setEditingText] = useState<"idle" | "selected" | "typing">("idle");
  const [side, setSide] = useState<WidgetSide>("right");
  const [tool, setTool] = useState<"color" | "text" | "side" | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; pressed: boolean } | null>(null);
  const [cycle, setCycle] = useState(0);
  const state = useRef({ color, greeting, side });
  state.current = { color, greeting, side };
  const idleUntil = useRef(0);

  // Stable, so React doesn't detach and reattach the in-view observer on every render.
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      containerRef.current = el;
      previewRef(el);
    },
    [previewRef]
  );

  const showFinished = () => {
    setUrl(SITE_URL);
    setScan("done");
    setFound(SITE_FACTS.length);
    setAnswers(SITE_FACTS.length);
    setWidgetOpen(true);
    setEditing(true);
  };

  // One pass: the AI reads the page and adds answers, then the widget is
  // recoloured, its greeting rewritten and it's moved to the other corner.
  useEffect(() => {
    if (reduceMotion) {
      showFinished();
      return;
    }
    if (!inView) {
      setCursor(null);
      return;
    }
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const pointAt = (el: HTMLElement | null | undefined, pressed = false) => {
      const box = containerRef.current?.getBoundingClientRect();
      const target = el?.getBoundingClientRect();
      if (!box || !target) return;
      setCursor({
        x: target.left - box.left + target.width * 0.55,
        y: target.top - box.top + target.height * 0.6,
        pressed,
      });
    };
    const click = (el: () => HTMLElement | null | undefined, start: number, action: () => void) => {
      at(start, () => pointAt(el()));
      at(start + 650, () => pointAt(el(), true));
      at(start + 800, () => {
        action();
        pointAt(el());
      });
    };

    if (document.hidden || Date.now() < idleUntil.current) {
      at(1000, () => setCycle((c) => c + 1));
      return () => timers.forEach(window.clearTimeout);
    }

    // Scan
    setCursor(null);
    setTool(null);
    setEditing(false);
    setWidgetOpen(false);
    setAnswers(0);
    setFound(0);
    setScan("idle");
    setUrl("");
    for (let i = 1; i <= SITE_URL.length; i++) at(250 + i * URL_TYPE_MS, () => setUrl(SITE_URL.slice(0, i)));
    const scanAt = 250 + SITE_URL.length * URL_TYPE_MS + 350;
    at(scanAt, () => setScan("scanning"));
    SITE_FACTS.forEach((_, i) => at(scanAt + 500 + i * 420, () => setFound(i + 1)));
    const doneAt = scanAt + 500 + SITE_FACTS.length * 420 + 300;
    at(doneAt, () => {
      setScan("done");
      setWidgetOpen(true);
    });
    SITE_FACTS.forEach((_, i) => at(doneAt + 350 + i * 300, () => setAnswers(i + 1)));

    // Customise
    const editAt = doneAt + 350 + SITE_FACTS.length * 300 + 700;
    at(editAt, () => setEditing(true));
    const { color: current, greeting: currentGreeting, side: currentSide } = state.current;
    const nextColor = (current + 1) % EDIT_COLORS.length;
    const nextGreeting = (currentGreeting + 1) % EDIT_GREETINGS.length;
    const nextSide: WidgetSide = currentSide === "right" ? "left" : "right";
    const text = EDIT_GREETINGS[nextGreeting];

    const colorAt = editAt + 500;
    click(() => swatchRefs.current[nextColor], colorAt, () => {
      setTool("color");
      setColor(nextColor);
    });
    const textAt = colorAt + 1500;
    click(() => greetingButtonRef.current, textAt, () => setTool("text"));
    at(textAt + 1050, () => pointAt(bubbleRef.current));
    at(textAt + 1600, () => setEditingText("selected"));
    at(textAt + 2050, () => {
      setEditingText("typing");
      setTyped("");
    });
    for (let i = 1; i <= text.length; i++) at(textAt + 2050 + i * EDIT_TYPE_MS, () => setTyped(text.slice(0, i)));
    const typedAt = textAt + 2050 + text.length * EDIT_TYPE_MS;
    at(typedAt + 150, () => {
      setGreeting(nextGreeting);
      setEditingText("idle");
    });
    click(() => sideRefs.current[nextSide], typedAt + 500, () => {
      setTool("side");
      setSide(nextSide);
    });
    at(typedAt + 3200, () => setCycle((c) => c + 1));
    return () => timers.forEach(window.clearTimeout);
  }, [cycle, reduceMotion, inView]);

  // A visitor's click applies straight away, finishes the scan and pauses the demo.
  const takeOver = () => {
    idleUntil.current = Date.now() + EDIT_IDLE_MS;
    setCursor(null);
    setEditingText("idle");
    showFinished();
  };

  const accent = EDIT_COLORS[color].value;
  const onLeft = side === "left";
  const bubbleText = editingText === "idle" ? EDIT_GREETINGS[greeting] : typed;
  const scanning = scan === "scanning";

  const toolButton = (active: boolean) =>
    `relative flex h-6 items-center justify-center rounded-md px-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 ${
      active ? "text-white" : "text-white/65 hover:text-white"
    }`;

  return (
    <div
      ref={setRefs}
      className="relative mt-auto h-[282px] w-full overflow-hidden rounded-[14px] border border-ink-120 bg-ink-25 shadow-[0px_8px_24px_rgba(0,0,0,0.05)] dark:border-ink-780 dark:bg-ink-875"
    >
      {/* Browser chrome with the address being typed and the AI's status */}
      <div className="relative z-20 flex h-[30px] items-center gap-2 border-b border-ink-70 bg-ink-30 px-2.5 dark:border-ink-780 dark:bg-ink-850">
        <span className="flex shrink-0 gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-ink-145 dark:bg-ink-710" />
          ))}
        </span>
        <span className="flex h-[18px] min-w-0 flex-1 items-center gap-1 rounded-md bg-ink-25 px-2 text-caption text-ink-605 ring-1 ring-ink-70 dark:bg-ink-875 dark:text-ink-325 dark:ring-ink-780">
          <Globe className="h-2.5 w-2.5 shrink-0 text-ink-325" aria-hidden="true" />
          <span className="truncate">{url || <span className="text-ink-325">Paste your website…</span>}</span>
          {url && url.length < SITE_URL.length ? <span className="h-2.5 w-px animate-pulse bg-current" /> : null}
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {scan !== "idle" ? (
            <motion.span
              key={scan}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className={`flex h-[18px] shrink-0 items-center gap-1 rounded-full px-2 text-[8.5px] font-medium ring-1 ring-inset ${
                scanning
                  ? "bg-ink-40 text-[#3B63D9] ring-[#4F8CF7]/25 dark:bg-ink-815 dark:text-[#9DB8FF]"
                  : "bg-[#EEF6F0] text-[#3F8A55] ring-[#4F9A63]/25 dark:bg-[#1F3127] dark:text-[#8FD19B]"
              }`}
            >
              {scanning ? (
                <AiIcon className="h-2.5 w-2.5" />
              ) : (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              )}
              <span className="hidden sm:inline">{scanning ? "AI reading page…" : `${SITE_FACTS.length} answers found`}</span>
              <span className="sm:hidden">{scanning ? "Reading…" : `${SITE_FACTS.length} found`}</span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      {/* The page being read */}
      <div className="absolute inset-x-0 bottom-0 top-[30px] overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(16,23,35,0.06)_1px,transparent_1px)] [background-size:12px_12px] dark:bg-[radial-gradient(rgba(215,223,229,0.06)_1px,transparent_1px)]" />

        <div className="relative px-4 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[4px] bg-ink-900 dark:bg-ink-130" />
            <span className="text-caption font-semibold text-fg">Northwind</span>
            <span className="ml-auto flex gap-2">
              {[18, 14, 20].map((w, i) => (
                <span key={i} className="h-1 rounded-full bg-ink-120 dark:bg-ink-780" style={{ width: w }} />
              ))}
            </span>
          </div>

          <p className="mt-4 font-display text-[15px] leading-[17px] text-ink-900 dark:text-ink-70">
            Everyday goods,
            <br />
            made to last.
          </p>
          <div className="mt-2 h-1 w-28 rounded-full bg-ink-85 dark:bg-ink-805" />
          <span className="mt-2.5 inline-flex h-4 items-center rounded-full bg-ink-900 px-2 text-[7.5px] font-medium text-white dark:bg-ink-130 dark:text-ink-875">
            Shop now
          </span>

          <ul className="mt-4 w-[58%] max-w-[230px] space-y-1.5">
            {SITE_FACTS.map((fact, i) => {
              const FactIcon = fact.icon;
              const isFound = found > i;
              const movedToWidget = answers > i;
              return (
                <li key={fact.tag} className="relative">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isFound ? "rgba(79,140,247,0.10)" : "rgba(79,140,247,0)",
                      boxShadow: isFound ? "0 0 0 1px rgba(79,140,247,0.55)" : "0 0 0 1px rgba(79,140,247,0)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-1.5 rounded-md px-1.5 py-1"
                  >
                    <FactIcon className="h-2.5 w-2.5 shrink-0 text-ink-545 dark:text-ink-325" />
                    <span className="truncate text-[8px] text-fg-muted">{fact.text}</span>
                  </motion.div>
                  {isFound && !movedToWidget ? (
                    <motion.span
                      layoutId={`site-fact-${i}`}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={editSpring}
                      className="absolute -right-1 -top-2 z-10 flex items-center gap-0.5 whitespace-nowrap rounded-full bg-[#4F8CF7] px-1.5 py-px text-[7px] font-semibold text-white shadow-sm"
                    >
                      <AiIcon className="h-2 w-2" />
                      {fact.tag}
                    </motion.span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        {/* The scanning line */}
        <AnimatePresence>
          {scanning ? (
            <motion.div
              key="beam"
              initial={{ top: "-12%", opacity: 0 }}
              animate={{ top: "100%", opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ top: { duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.1 }, opacity: { duration: 0.2 } }}
              className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent to-[#4F8CF7]/15"
            >
              <div className="absolute inset-x-0 bottom-0 h-px bg-[#4F8CF7] shadow-[0_0_10px_2px_rgba(79,140,247,0.6)]" />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* The chat widget */}
      <div className={`absolute inset-x-3 bottom-2 z-10 flex flex-col gap-2 ${onLeft ? "items-start" : "items-end"}`}>
        {/* Editor toolbar: attached above the widget, so it keeps its distance and follows it across */}
        <AnimatePresence>
          {editing ? (
            <motion.div
              key="toolbar"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              layout
              transition={{ duration: 0.25, ease: "easeOut", layout: editSpring }}
              className="relative z-20"
            >
              <div className="flex items-center gap-0.5 rounded-full bg-ink-900 p-1 pl-2 shadow-[0_10px_24px_-10px_rgba(16,23,35,0.6)] ring-1 ring-white/10 dark:bg-ink-925">
                <div role="radiogroup" aria-label="Widget colour" className="flex items-center gap-1 pr-1">
                  {EDIT_COLORS.map((c, i) => {
                    const selected = i === color;
                    return (
                      <button
                        key={c.value}
                        ref={(el) => {
                          swatchRefs.current[i] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={c.name}
                        onClick={() => {
                          takeOver();
                          setTool("color");
                          setColor(i);
                        }}
                        className="relative flex h-5 w-5 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
                      >
                        {selected ? (
                          <motion.span layoutId="edit-swatch" transition={editSpring} className="absolute inset-0 rounded-full ring-[1.5px] ring-white" />
                        ) : null}
                        <span
                          className="h-3 w-3 rounded-full ring-1 ring-white/25"
                          style={{ backgroundColor: c.value === "#101723" ? "#3A4659" : c.value }}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="mx-0.5 h-4 w-px bg-white/15" aria-hidden="true" />
                <button
                  ref={greetingButtonRef}
                  type="button"
                  aria-label="Next greeting"
                  onClick={() => {
                    takeOver();
                    setTool("text");
                    setGreeting((g) => (g + 1) % EDIT_GREETINGS.length);
                  }}
                  className={toolButton(tool === "text")}
                >
                  {tool === "text" ? (
                    <motion.span layoutId="edit-tool" transition={editSpring} className="absolute inset-0 rounded-md bg-white/15" />
                  ) : null}
                  <Type className="relative h-3 w-3" />
                </button>
                <span className="mx-0.5 h-4 w-px bg-white/15" aria-hidden="true" />
                <div role="radiogroup" aria-label="Widget position" className="flex items-center">
                  {(["left", "right"] as const).map((s) => {
                    const SideIcon = s === "left" ? PanelLeft : PanelRight;
                    return (
                      <button
                        key={s}
                        ref={(el) => {
                          sideRefs.current[s] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={side === s}
                        aria-label={s === "left" ? "Bottom left" : "Bottom right"}
                        onClick={() => {
                          takeOver();
                          setTool("side");
                          setSide(s);
                        }}
                        className={toolButton(side === s)}
                      >
                        {side === s ? (
                          <motion.span layoutId="edit-side" transition={editSpring} className="absolute inset-0 rounded-md bg-white/15" />
                        ) : null}
                        <SideIcon className="relative h-3 w-3" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {widgetOpen ? (
            <motion.div
              key="widget"
              aria-hidden="true"
              layout
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 8 }}
              transition={editSpring}
              style={{ transformOrigin: onLeft ? "bottom left" : "bottom right" }}
              className="relative w-[78%] max-w-[210px] rounded-xl border border-black/5 bg-white shadow-[0_16px_34px_-14px_rgba(16,23,35,0.45)]"
            >
              {/* Dashed outline while the editor has the widget selected */}
              <AnimatePresence>
                {editing ? (
                  <motion.span
                    key="selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute -inset-[3px] z-10 rounded-[14px] border border-dashed border-[#4F8CF7]/80"
                  >
                    {["-left-[3px] -top-[3px]", "-right-[3px] -top-[3px]", "-bottom-[3px] -left-[3px]", "-bottom-[3px] -right-[3px]"].map((pos) => (
                      <span key={pos} className={`absolute h-1.5 w-1.5 rounded-[1px] border border-[#4F8CF7] bg-white ${pos}`} />
                    ))}
                  </motion.span>
                ) : null}
              </AnimatePresence>

              <div className="relative flex items-center gap-1.5 overflow-hidden rounded-t-xl px-2 py-1.5 text-white">
                <ColorSweep color={accent} />
                <span className="relative flex h-4 w-4 items-center justify-center gap-[2px] rounded-full bg-white">
                  <motion.span animate={{ backgroundColor: accent }} className="h-[5px] w-[2px] rounded-full" />
                  <motion.span animate={{ backgroundColor: accent }} className="h-[5px] w-[2px] rounded-full" />
                </span>
                <span className="relative text-caption font-semibold">Northwind</span>
                <span className="relative ml-auto flex items-center gap-1 text-[8px] opacity-85">
                  <span className="h-1 w-1 rounded-full bg-[#7CE38B]" />
                  Online
                </span>
              </div>
              <div className="space-y-1.5 p-2">
                <p
                  ref={bubbleRef}
                  className="w-fit max-w-[94%] rounded-xl rounded-bl-sm bg-ink-50 px-2 py-1.5 text-[8.5px] leading-[12px] text-ink-900"
                >
                  <span className={editingText === "selected" ? "rounded-[2px] bg-[#4F8CF7]/30" : ""}>{bubbleText || "​"}</span>
                  {editingText !== "idle" ? (
                    <span className="ml-px inline-block h-2.5 w-px translate-y-0.5 animate-pulse bg-ink-900" />
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-1">
                  {SITE_FACTS.map((fact, i) =>
                    answers > i ? (
                      <motion.span
                        key={fact.tag}
                        layoutId={`site-fact-${i}`}
                        transition={editSpring}
                        className="relative overflow-hidden rounded-full border px-1.5 py-px text-[7.5px] font-medium"
                        style={{ borderColor: `${accent}55`, color: accent }}
                      >
                        {fact.question}
                      </motion.span>
                    ) : null
                  )}
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-ink-70 py-0.5 pl-2 pr-0.5">
                  <span className="flex-1 truncate text-[8px] text-ink-325">Type a message…</span>
                  <span className="relative flex h-4 w-4 items-center justify-center overflow-hidden rounded-full text-white">
                    <ColorSweep color={accent} />
                    <Send className="relative h-2 w-2" />
                  </span>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.span
          layout
          transition={editSpring}
          aria-hidden="true"
          className="relative mt-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-white shadow-[0_8px_18px_-6px_rgba(16,23,35,0.45)] ring-1 ring-black/5 dark:ring-white/20"
        >
          <ColorSweep color={accent} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={widgetOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative"
            >
              {widgetOpen ? <X className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </div>

      {/* The pretend pointer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-30"
        initial={false}
        animate={
          cursor
            ? { opacity: 1, x: cursor.x, y: cursor.y, scale: cursor.pressed ? 0.82 : 1 }
            : { opacity: 0, scale: 1 }
        }
        transition={{
          x: { type: "spring", stiffness: 110, damping: 19 },
          y: { type: "spring", stiffness: 110, damping: 19 },
          scale: { duration: 0.12 },
          opacity: { duration: 0.25 },
        }}
      >
        <svg width="16" height="18" viewBox="0 0 16 18" className="drop-shadow-[0_2px_3px_rgba(16,23,35,0.35)]">
          <path d="M1.5 1.2 14 9.1l-5.6 1.2-2.9 5.3z" fill="#101723" stroke="#FFFFFF" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
        <AnimatePresence>
          {cursor?.pressed ? (
            <motion.span
              key="press"
              initial={{ opacity: 0.55, scale: 0.4 }}
              animate={{ opacity: 0, scale: 1.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="absolute -left-2 -top-2 h-6 w-6 rounded-full bg-[#4F8CF7]/40"
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
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
    <div className="w-5 h-5 rounded-full bg-ink-25 dark:bg-ink-820 shrink-0 flex items-center justify-center shadow-sm ring-1 ring-black/5">
      <img src={logoHome} alt="" className="h-2.5 w-2.5 dark:brightness-0 dark:invert" />
    </div>
  );
}

const botBubbleClass =
  "bg-ink-70 dark:bg-ink-780 rounded-2xl rounded-bl-md px-3 py-2 max-w-[84%] shadow-[0_6px_18px_rgba(0,0,0,0.04)]";

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
      <div className="px-4 py-2.5 border-b border-ink-120 dark:border-ink-780 flex items-center gap-2 bg-[rgba(243,247,252,0.85)] dark:bg-[rgba(20,29,43,0.82)]">
        <div className="w-6 h-6 rounded-full bg-ink-25 dark:bg-ink-820 flex items-center justify-center shadow-sm ring-1 ring-black/5">
          <img src={logoHome} alt="Askio" className="h-3.5 w-3.5 dark:brightness-0 dark:invert" />
        </div>
        <span className="text-caption text-fg font-semibold font-sans">Askio Bot</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7CB342]" />
          <span className="text-caption font-medium text-ink-545 dark:text-ink-325">Live now</span>
        </div>
      </div>

      <div className="flex-1 px-3.5 pt-3 pb-2 space-y-2 overflow-hidden">
        <div className="flex items-end gap-2">
          <BotAvatar />
          <div className={botBubbleClass}>
            <p className="text-caption text-fg font-sans leading-[14px]">Hi! How can I help you today?</p>
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
              <div className="bg-ink-900 dark:bg-ink-130 rounded-2xl rounded-br-md px-3 py-2 max-w-[84%] shadow-[0_8px_20px_rgba(16,23,35,0.16)]">
                <p className="text-caption text-white dark:text-ink-875 font-sans leading-[14px]">{q}</p>
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
              <div className="bg-ink-70 dark:bg-ink-780 rounded-2xl rounded-bl-md px-3 py-2.5 flex items-center gap-1 shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1 h-1 rounded-full bg-ink-605 dark:bg-ink-325 animate-bounce"
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
                <p className="text-caption text-fg font-sans leading-[14px]">{a}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* The visitor's message box, where the question is typed */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2 rounded-full border border-ink-120 bg-ink-25 py-1 pl-3 pr-1 dark:border-ink-780 dark:bg-ink-875">
          <span className={`flex-1 truncate text-caption leading-[14px] ${draft ? "text-fg" : "text-ink-325"}`}>
            {draft || "Type your message..."}
            {draft ? <span className="ml-px inline-block h-2.5 w-px translate-y-0.5 animate-pulse bg-current" /> : null}
          </span>
          <motion.span
            animate={sent && !answered && exchangeVisible ? { scale: [1, 0.85, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-200 ${
              draft ? "bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875" : "bg-ink-70 text-ink-425 dark:bg-ink-805"
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
      <div className="absolute inset-x-6 top-0 h-[160px] rounded-[14px] border border-ink-120 bg-ink-25 opacity-55 dark:border-ink-780 dark:bg-ink-820" />
      <div className="absolute inset-x-3 top-4 h-[168px] rounded-[14px] border border-ink-120 bg-ink-25 opacity-80 dark:border-ink-780 dark:bg-ink-820" />

      <div className="relative rounded-[16px] border border-ink-120 bg-[linear-gradient(180deg,#F9FCFF_0%,#F3F7FC_100%)] p-4 shadow-[0px_10px_30px_rgba(0,0,0,0.08)] dark:border-ink-780 dark:bg-[linear-gradient(180deg,#202C3C_0%,#17212F_100%)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-caption font-medium text-ink-545 dark:text-ink-325">Captured leads · this week</p>
            <div className="relative mt-1 h-[30px] overflow-hidden text-[28px] font-semibold leading-[30px] tabular-nums text-fg">
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
          <div className="rounded-full bg-[#EEF6F0] px-2.5 py-1 text-caption font-medium text-[#4F9A63] dark:bg-[#253128] dark:text-[#8FD19B]">
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
                    isToday ? "bg-ink-900 dark:bg-ink-130" : "bg-ink-120 dark:bg-ink-780"
                  }`}
                />
              </motion.div>
            );
          })}
        </div>
        <div className="mt-1.5 flex gap-2 text-caption font-medium text-ink-325 dark:text-ink-545">
          {LEAD_DAYS.map((day, index) => (
            <span
              key={index}
              className={`flex-1 text-center ${index === LEAD_DAYS.length - 1 ? "text-fg" : ""}`}
            >
              {day}
            </span>
          ))}
        </div>
  
        <div className="relative mt-3 h-[44px] overflow-hidden rounded-xl border border-ink-120/80 bg-ink-25 dark:border-ink-780 dark:bg-ink-850">
          <AnimatePresence initial={false}>
            <motion.div
              key={captured}
              initial={{ y: 44, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -44, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 flex items-center gap-2.5 px-3"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-70 text-caption font-semibold text-ink-605 dark:bg-ink-805 dark:text-ink-130">
                {lead.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-caption font-semibold text-fg">{lead.email}</p>
                <p className="truncate text-caption text-ink-545 dark:text-ink-325">via {lead.source}</p>
              </div>
              <span className="shrink-0 rounded-full bg-[#EEF6F0] px-2 py-0.5 text-caption font-medium text-[#4F9A63] dark:bg-[#253128] dark:text-[#8FD19B]">
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
        <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-display tracking-tight [text-wrap:balance] text-fg">
          From first question to next customer
        </h2>
        <p className="mt-3 text-fg-muted text-body max-w-md">
          Add Askio to your site, answer common questions, and see what visitors need.
        </p>
      </div>

      <div className="flex border-t border-[rgba(16,23,35,0.12)] dark:border-ink-780">
        <HatchStrip />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(16,23,35,0.12)] dark:border-ink-780">
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-b md:border-b-0 border-r-0 md:border-r border-[rgba(16,23,35,0.12)] dark:border-ink-780 cursor-default">
            <div className="flex items-center gap-3 md:min-h-[58px] lg:min-h-0">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-ink-120/70 bg-ink-25 dark:border-ink-780 dark:bg-ink-850 flex items-center justify-center">
                <Code className="w-4 h-4 text-fg" />
              </div>
              <h3 className="text-fg text-h3">Connect your website</h3>
            </div>
            <p className="text-fg-muted text-body-sm leading-relaxed">
              Paste one embed code into your site. Keep the tools you already use.
            </p>
            <IntegrationBeamPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t md:border-t-0 border-b md:border-b-0 border-[rgba(16,23,35,0.12)] dark:border-ink-780 cursor-default">
            <div className="flex items-center gap-3 md:min-h-[58px] lg:min-h-0">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-ink-120/70 bg-ink-25 dark:border-ink-780 dark:bg-ink-850 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-fg" />
              </div>
              <h3 className="text-fg text-h3">Answer everyday questions</h3>
            </div>
            <p className="text-fg-muted text-body-sm leading-relaxed">
              Give visitors your answers to common questions, even when you’re away.
            </p>
            <FaqChatPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t md:border-t border-r-0 md:border-r border-[rgba(16,23,35,0.12)] dark:border-ink-780 cursor-default">
            <div className="flex items-center gap-3 md:min-h-[58px] lg:min-h-0">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-ink-120/70 bg-ink-25 dark:border-ink-780 dark:bg-ink-850 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-fg" />
              </div>
              <h3 className="text-fg text-h3">Turn interest into leads</h3>
            </div>
            <p className="text-fg-muted text-body-sm leading-relaxed">
              Capture contact details and track activity so you know where to follow up.
            </p>
            <AnalyticsLeadsPreview />
          </div>

          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-t border-[rgba(16,23,35,0.12)] dark:border-ink-780 cursor-default">
            <div className="flex items-center gap-3 md:min-h-[58px] lg:min-h-0">
              <div className="w-9 h-9 shrink-0 rounded-xl border border-ink-120/70 bg-ink-25 dark:border-ink-780 dark:bg-ink-850 flex items-center justify-center">
                <Settings className="w-4 h-4 text-fg" />
              </div>
              <h3 className="text-fg text-h3">Make it your own</h3>
            </div>
            <p className="text-fg-muted text-body-sm leading-relaxed">
              Askio reads your website for answers. Then match your colors, set a greeting, and choose where it appears.
            </p>
            <BrandShowcasePreview />
          </div>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
