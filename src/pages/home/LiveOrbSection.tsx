import { useState } from "react";
import { Eye, Hand, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Badge from "./Badge";
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
      className="border-t border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]"
    >
      <div className="grid items-center gap-10 px-5 py-14 sm:px-10 sm:py-20 md:grid-cols-2 md:items-stretch md:gap-12 lg:px-16">
        <div className="flex flex-col items-start">
          <Badge text="New" />
          <h2 className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-serif tracking-tight [text-wrap:balance] text-[#101723] dark:text-[#D7DFE5]">
            Meet Kio
          </h2>
          <p className="mt-3 max-w-md text-body text-[#566273] dark:text-[#9BAABD]">
            Kio is a chat launcher with a little personality. It notices your visitors, so they notice it.
          </p>
          <p className="mt-2 max-w-md text-xs text-[#87909D]">
            Its name comes from as<span className="font-semibold">kio</span>, and means “what” in Esperanto, where every question starts.
          </p>

          <ul className="mt-8 space-y-5">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8DFE9]/70 bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533]">
                  <Icon className="h-4 w-4 text-[#101723] dark:text-[#D7DFE5]" />
                </span>
                <div>
                  <p className="text-body-sm font-semibold text-[#101723] dark:text-[#D7DFE5]">{title}</p>
                  <p className="mt-0.5 text-body-sm text-[#566273] dark:text-[#9BAABD]">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs text-[#647184] dark:text-[#87909D]">
            Free on every plan. Turn it on under Appearance → Launcher style.
          </p>
        </div>

        <div className="relative isolate flex flex-col items-center justify-center overflow-hidden rounded-[16px] border border-[#D8DFE9] bg-[linear-gradient(180deg,#F9FCFF_0%,#E7EDF6_100%)] px-6 py-10 dark:border-[#2B3646] dark:bg-[linear-gradient(180deg,#202C3C_0%,#17212F_100%)]">
          <div className="relative flex flex-col items-center">
            {/* The glow sits directly behind the orb */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[92px] -z-10 h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#93B5D9]/35 blur-[60px] dark:bg-[#769CC5]/15"
            />
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

          <p className="mt-5 hidden text-xs text-[#647184] md:block dark:text-[#9BAABD]">
            {mood === "idle" ? "Move your cursor around. Kio is watching." : "Try the other moods too."}
          </p>

          <div
            role="radiogroup"
            aria-label="Kio's mood"
            className="mt-3 flex rounded-full border border-[#D8DFE9] bg-[#F9FCFF] p-1 dark:border-[#2B3646] dark:bg-[#1A2533]"
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
                  className="relative rounded-full px-3.5 py-1.5 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87909D] sm:px-4"
                >
                  {selected ? (
                    <motion.span
                      layoutId="orb-mood-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#101723] dark:bg-[#D7DFE5]"
                    />
                  ) : null}
                  <span
                    className={`relative transition-colors duration-200 ${
                      selected ? "text-white dark:text-[#141D2B]" : "text-[#566273] dark:text-[#9BAABD]"
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
    </motion.section>
  );
}
