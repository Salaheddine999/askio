import { motion } from "framer-motion";
import brandLogo from "../../assets/logo.svg";
import MainCta from "./MainCta";
import KioMark from "../../components/KioMark";

export default function HeroSection() {
  const sectionBorder = "border-b border-[rgba(16,23,35,0.12)] dark:border-ink-780";

  return (
    <section className={`pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 flex flex-col items-center text-center ${sectionBorder}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[920px] px-4"
      >
        <a
          href="#kio"
          className="group mb-7 inline-flex items-center gap-2.5 rounded-full border border-ink-120 py-1.5 pl-1.5 pr-3.5 text-body-sm text-fg-muted transition-colors duration-200 hover:border-ink-235 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-425 dark:border-ink-780 dark:hover:border-ink-710"
        >
          <KioMark size={20} className="shrink-0 text-fg" />
          <span className="sm:hidden">Meet Kio, the launcher that looks back</span>
          <span className="hidden sm:inline">Meet Kio, a chat launcher whose eyes follow your visitors</span>
          <span className="hidden font-medium text-fg underline decoration-ink-235 underline-offset-4 group-hover:decoration-current sm:inline dark:decoration-ink-710">
            See it
          </span>
        </a>
        <h1 className="text-[2.25rem] sm:text-[clamp(2.5rem,5vw,4rem)] font-display leading-[1.08] tracking-[-0.025em] [text-wrap:balance] text-fg mb-5">
          Answer customer questions.{" "}
          <br className="hidden sm:block" />
          Even when you’re away.
        </h1>
        <p className="text-fg-muted text-body-lg font-normal leading-relaxed max-w-[540px] mx-auto mb-7">
          Turn your FAQs into a chatbot that looks like your brand. Give visitors instant answers and capture leads, no coding needed.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full flex flex-col items-center justify-center gap-3 px-6 mb-10 sm:mb-14"
      >
        <MainCta>Create your chatbot</MainCta>
        <p className="text-caption text-ink-545 dark:text-ink-325">Free plan · No credit card needed</p>
      </motion.div>

      {/* Dashboard Screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-[1000px] px-4 relative isolate md:pb-6"
      >
        {/* A soft light on the page behind the screenshot: one wide, faint
            gradient, brightest at the top edge, so the image sits in light
            rather than on a coloured blob. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[70%] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(79,140,247,0.16),rgba(79,140,247,0.05)_45%,transparent_75%)] dark:bg-[radial-gradient(60%_60%_at_50%_30%,rgba(118,156,197,0.14),rgba(118,156,197,0.04)_45%,transparent_75%)]"
        />
        <div className="relative z-10 rounded-2xl border border-ink-120/80 bg-ink-25/60 p-1.5 sm:p-2 shadow-[0_16px_48px_-24px_rgba(16,23,35,0.25)] dark:border-ink-780 dark:bg-ink-850/70 dark:shadow-[0_16px_48px_-24px_rgba(0,0,0,0.5)]">
          {/* Below md, crop to the left of the dashboard so it stays legible */}
          <img
            src="/screenshot askio.png"
            alt="Askio dashboard for managing and customizing your chatbots"
            className="w-full aspect-[5/4] object-cover object-left-top md:aspect-auto md:h-auto rounded-xl"
            width={2560}
            height={1280}
            loading="eager"
          />
        </div>
        <aside
          aria-label="Example customer conversation"
          className="relative z-20 mx-auto -mt-20 w-[88%] max-w-[300px] overflow-hidden rounded-2xl border border-ink-120 bg-ink-25 text-left shadow-[0_12px_36px_-16px_rgba(16,23,35,0.3)] dark:border-ink-780 dark:bg-ink-850 md:absolute md:bottom-0 md:right-8 md:mt-0"
        >
          <div className="flex items-center gap-2.5 border-b border-ink-120/70 px-4 py-3 dark:border-ink-780">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-70 dark:bg-ink-805">
              <img src={brandLogo} alt="" className="h-6 w-6 dark:brightness-0 dark:invert" />
            </div>
            <div>
              <p className="text-sm font-medium text-fg">Your website assistant</p>
              <p className="mt-0.5 text-xs text-ink-545 dark:text-ink-325">Example conversation</p>
            </div>
          </div>
          <div className="space-y-3 p-4 text-[13px] leading-relaxed">
            <p className="ml-8 rounded-2xl rounded-br-md bg-ink-900 px-3 py-2.5 text-white dark:bg-ink-130 dark:text-ink-875">
              Where can I track my order?
            </p>
            <p className="mr-5 rounded-2xl rounded-bl-md bg-ink-70 px-3 py-2.5 text-ink-900 dark:bg-ink-805 dark:text-ink-130">
              You’ll find your tracking link in your shipping confirmation email.
            </p>
          </div>
          <div className="hidden sm:block border-t border-ink-120/70 px-4 py-2.5 text-center text-caption text-ink-545 dark:border-ink-780 dark:text-ink-325">
            Your answers. Your brand. Powered by Askio.
          </div>
        </aside>
      </motion.div>
    </section>
  );
}
