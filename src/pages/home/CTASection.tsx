import { useInView } from "react-intersection-observer";
import { motion, useReducedMotion } from "framer-motion";
import HatchStrip from "./HatchStrip";
import brandLogo from "../../assets/logo.svg";
import { ghostCta } from "./buttonStyles";
import MainCta from "./MainCta";

export default function CTASection() {
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, rootMargin: "0px 0px 200px 0px" });
  const reduceMotion = useReducedMotion();

  // The after-hours exchange plays once the section is in view.
  const bubble = (delay: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: ctaInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.35, ease: "easeOut", delay: reduceMotion ? 0 : delay },
  });

  return (
    // A darker band than the page, lit from above by a blue glare: the one
    // section that feels like evening. No bottom border: the footer's top
    // border closes it.
    <section
      ref={ctaRef}
      className="bg-[radial-gradient(ellipse_70%_75%_at_50%_0%,rgba(79,140,247,0.24),rgba(79,140,247,0.08)_45%,transparent_75%),linear-gradient(180deg,#EDF2F8,#E2E8F1)] dark:bg-[radial-gradient(ellipse_70%_75%_at_50%_0%,rgba(118,156,197,0.22),rgba(118,156,197,0.06)_45%,transparent_75%),linear-gradient(180deg,#141D2B,#0B111B)]"
    >
      <div className="flex">
        <HatchStrip />
        <div className="flex-1 py-20 sm:py-24 flex flex-col items-center text-center px-4 border-l border-r border-[rgba(16,23,35,0.12)] dark:border-ink-780">
          <div className="mb-10 w-full max-w-[340px] space-y-2 text-left" aria-label="Example: a visitor question answered at 3:12 AM">
            <motion.div {...bubble(0.15)} className="flex items-end justify-end gap-2">
              <span className="mb-1 text-caption tabular-nums text-fg-subtle">3:12 AM</span>
              <p className="rounded-2xl rounded-br-md bg-ink-900 px-3.5 py-2.5 text-body-sm text-white dark:bg-ink-130 dark:text-ink-875">
                Do you ship to Belgium?
              </p>
            </motion.div>
            <motion.div {...bubble(0.75)}>
              <div className="flex items-end gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-ink-120 bg-ink-25 dark:border-ink-780 dark:bg-ink-820">
                  <img src={brandLogo} alt="" className="h-4 w-4 dark:brightness-0 dark:invert" />
                </span>
                <p className="rounded-2xl rounded-bl-md border border-ink-120 bg-ink-25 px-3.5 py-2.5 text-body-sm text-fg dark:border-ink-780 dark:bg-ink-820">
                  Yes, orders to Belgium arrive in 2–3 business days.
                </p>
              </div>
              <span className="mt-1 block pl-9 text-caption text-fg-subtle">Answered while you were asleep</span>
            </motion.div>
          </div>

          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] [text-wrap:balance] font-display text-fg mb-5">
            Give your visitors answers,<br className="hidden sm:block" /> around the clock.
          </h2>
          <p className="text-fg-muted text-body-lg max-w-md mb-8 leading-relaxed">
            Start with your FAQs. Add your branding. Put your first chatbot on your website without writing code.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <MainCta>Build my free chatbot</MainCta>
            <a href="#how-it-works" className={ghostCta}>
              See how it works
            </a>
          </div>
          <p className="mt-6 text-caption text-fg-subtle">Free plan · No credit card · Live in minutes</p>
        </div>
        <HatchStrip />
      </div>
    </section>
  );
}
