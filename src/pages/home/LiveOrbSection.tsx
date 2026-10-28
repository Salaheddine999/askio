import { useState } from "react";
import { Eye, Hand, MessageCircle } from "../../components/icons";
import HatchStrip from "./HatchStrip";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { LiveOrb, type LiveOrbMood } from "../../components/LiveOrb";
import { useSiteDarkMode } from "../../utils/useSiteDarkMode";

const MOODS: { value: LiveOrbMood; label: string }[] = [
  { value: "idle", label: "Following" },
  { value: "listening", label: "Listening" },
  { value: "thinking", label: "Thinking" },
];

const POINTS = [
  {
    icon: Eye,
    title: "Follows the cursor",
    text: "Its eyes track visitors as they move around your page.",
  },
  {
    icon: MessageCircle,
    title: "Listens and thinks",
    text: "It watches the message box while visitors type, and thinks while an answer loads.",
  },
  {
    icon: Hand,
    title: "Says hello",
    text: "An optional greeting pops up once per visitor, then gets out of the way.",
  },
];

export default function LiveOrbSection() {
  const [sectionRef, inView] = useInView({ triggerOnce: true, rootMargin: "0px 0px 200px 0px" });
  const [mood, setMood] = useState<LiveOrbMood>("idle");
  const dark = useSiteDarkMode();

  return (
    <motion.section
      ref={sectionRef}
      id="kio"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35 }}
      className="border-y border-[rgba(16,23,35,0.12)] dark:border-ink-780"
    >
      <div className="flex">
      <HatchStrip />
      <div className="flex-1 border-x border-[rgba(16,23,35,0.12)] dark:border-ink-780 grid items-center gap-10 px-5 py-14 sm:px-10 sm:py-20 md:grid-cols-2 md:items-stretch md:gap-12 lg:px-16">
        <div className="flex flex-col items-start">
          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-display tracking-tight [text-wrap:balance] text-fg">
            Meet Kio
          </h2>
          <p className="mt-3 max-w-md text-body text-fg-muted">
            Kio is a chat launcher with a little personality. It notices your visitors, so they notice it.
          </p>
          <p className="mt-2 max-w-md text-caption text-fg-subtle">
            The name comes from As<span className="font-semibold">kio</span>, and is Esperanto for “what”, the word so many questions start with.
          </p>

          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink-120/70 bg-ink-25 dark:border-ink-780 dark:bg-ink-850">
                  <Icon className="h-4 w-4 text-fg" />
                </span>
                <div>
                  <p className="text-body-sm font-semibold text-fg">{title}</p>
                  <p className="mt-0.5 text-body-sm text-fg-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-fg-subtle">
            Free on every plan. Turn it on under Appearance → Launcher style.
          </p>
        </div>

        <div className="relative isolate flex flex-col items-center justify-center overflow-hidden rounded-[16px] border border-ink-120 bg-[linear-gradient(180deg,#F9FCFF_0%,#E7EDF6_100%)] px-6 py-10 dark:border-ink-780 dark:bg-[linear-gradient(180deg,#202C3C_0%,#17212F_100%)]">
          <div className="relative flex flex-col items-center">
            {/* The glow sits directly behind the orb */}
            <LiveOrb
              size={184}
              mood={mood}
              variant="custom"
              color={dark ? "#E7EDF6" : "#101723"}
              eyeColor={dark ? "#101723" : "#F9FCFF"}
            />
            {/* A soft floor shadow grounds the orb */}
            <div aria-hidden="true" className="mt-3 h-3 w-32 rounded-[50%] bg-[rgba(16,23,35,0.12)] blur-[6px] dark:bg-black/40" />
          </div>

          <p className="mt-5 hidden text-xs text-ink-545 md:block dark:text-ink-325">
            {mood === "idle" ? "Move your cursor around. Kio is watching." : "Try the other moods too."}
          </p>

          <div
            role="radiogroup"
            aria-label="Kio's mood"
            className="mt-3 flex rounded-full border border-ink-120 bg-ink-25 p-1 dark:border-ink-780 dark:bg-ink-850"
          >
            {MOODS.map((option) => {
              const selected = option.value === mood;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMood(option.value)}
                  className="relative rounded-full px-3.5 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-425 sm:px-4"
                >
                  {selected ? (
                    <motion.span
                      layoutId="orb-mood-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-ink-900 dark:bg-ink-130"
                    />
                  ) : null}
                  <span
                    className={`relative transition-colors duration-200 ${
                      selected ? "text-white dark:text-ink-875" : "text-fg-muted"
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <HatchStrip />
      </div>
    </motion.section>
  );
}
