import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { motion, useReducedMotion } from "framer-motion";
import HatchStrip from "./HatchStrip";
import brandLogo from "../../assets/logo.svg";
import { ghostCta, primaryCta } from "./buttonStyles";

const TRUST_POINTS = ["Free plan", "No credit card", "Live in minutes"];

export default function CTASection() {
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, rootMargin: "0px 0px 200px 0px" });
  const reduceMotion = useReducedMotion();

  // The after-hours exchange plays once the section is in view.
  const bubble = (delay: number) => ({
    initial: { opacity: 0, y: 8, scale: 0.98 },
    animate: ctaInView ? { opacity: 1, y: 0, scale: 1 } : {},
    transition: { duration: 0.35, ease: "easeOut", delay: reduceMotion ? 0 : delay },
  });

  return (
    <motion.section
      ref={ctaRef}
      initial={{ opacity: 0, y: 40 }}
      animate={ctaInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35 }}
      className="border-b border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] bg-gradient-to-b from-[#F3F7FC] to-[#E7EDF6] dark:from-[#141D2B] dark:to-[#1A2533]"
    >
      <div className="flex">
        <HatchStrip />
        <div className="relative isolate flex-1 overflow-hidden py-20 sm:py-24 flex flex-col items-center text-center px-4 border-l border-r border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[260px] w-[70%] -translate-x-1/2 rounded-full bg-[#93B5D9]/35 blur-[80px] dark:bg-[#769CC5]/15"
          />

          <div className="mb-10 w-full max-w-[340px] space-y-2 text-left" aria-label="Example: a visitor question answered at 3:12 AM">
            <motion.div {...bubble(0.15)} className="flex items-end justify-end gap-2">
              <span className="mb-1 text-[10px] font-medium text-[#87909D]">3:12 AM</span>
              <p className="rounded-2xl rounded-br-md bg-[#101723] px-3.5 py-2.5 text-[13px] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
                Do you ship to Belgium?
              </p>
            </motion.div>
            <motion.div {...bubble(0.75)}>
              <div className="flex items-end gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#D8DFE9] bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#202C3C]">
                  <img src={brandLogo} alt="" className="h-4 w-4 dark:brightness-0 dark:invert" />
                </span>
                <p className="rounded-2xl rounded-bl-md border border-[#D8DFE9] bg-[#F9FCFF] px-3.5 py-2.5 text-[13px] text-[#101723] shadow-[0_8px_24px_-16px_rgba(16,23,35,0.35)] dark:border-[#2B3646] dark:bg-[#202C3C] dark:text-[#D7DFE5]">
                  Yes! Orders to Belgium arrive in 2–3 business days.
                </p>
              </div>
              <span className="mt-1 block pl-9 text-[10px] font-medium text-[#87909D]">Answered instantly by Askio</span>
            </motion.div>
          </div>

          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] [text-wrap:balance] font-serif text-[#101723] dark:text-[#D7DFE5] mb-5">
            Give your visitors answers,<br className="hidden sm:block" /> around the clock.
          </h2>
          <p className="text-[#566273] dark:text-[#9BAABD] text-body-lg max-w-md mb-8 leading-relaxed">
            Start with your FAQs. Add your branding. Put your first chatbot on your website without writing code.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <Link
              to="/auth"
              className={primaryCta}
              aria-label="Get started with Askio for free"
            >
              Build my free chatbot
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className={ghostCta}
            >
              See how it works
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#566273] dark:text-[#9BAABD]">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#4F9A63] dark:text-[#8FD19B]" />
                {point}
              </li>
            ))}
          </ul>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
