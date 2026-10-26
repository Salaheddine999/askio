import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";
import brandLogo from "../../assets/logo.svg";
import { ghostCta, primaryCta } from "./buttonStyles";

export default function HeroSection() {
  const sectionBorder = "border-b border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]";

  return (
    <section className={`pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 flex flex-col items-center text-center ${sectionBorder}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[920px] px-4"
      >
        <a
          href="#plans"
          className="group mb-6 inline-flex items-center gap-2 rounded-full border border-[#D8DFE9] bg-[#F9FCFF]/80 py-1 pl-1 pr-3 text-xs font-medium text-[#566273] transition-colors duration-200 hover:border-[#B8C2CF] hover:text-[#101723] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87909D] dark:border-[#2B3646] dark:bg-[#1A2533]/80 dark:text-[#9BAABD] dark:hover:text-[#D7DFE5]"
        >
          <span className="rounded-full bg-[#101723] px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">New</span>
          <span className="sm:hidden">Build your chatbot from your website</span>
          <span className="hidden sm:inline">Scan your website, get a chatbot that knows your business</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />
        </a>
        <h1 className="text-[2.25rem] sm:text-[clamp(2.5rem,5vw,4rem)] font-serif leading-[1.08] tracking-[-0.025em] [text-wrap:balance] text-[#101723] dark:text-[#D7DFE5] mb-5">
          Answer customer questions.{" "}
          <br className="hidden sm:block" />
          Even when you’re away.
        </h1>
        <p className="text-[#566273] dark:text-[#9BAABD] text-body-lg font-normal leading-relaxed max-w-[540px] mx-auto mb-7">
          Turn your FAQs into a chatbot that looks like your brand. Give visitors instant answers and capture leads, no coding needed.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 px-6 mb-10 sm:mb-14"
      >
        <Link
          to="/auth"
          className={`${primaryCta} w-full max-w-[264px] sm:w-auto`}
          aria-label="Start using Askio for free"
        >
          Start for free
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="https://github.com/Salaheddine999/askio"
          className={ghostCta}
          aria-label="Star Askio on GitHub"
        >
          <FaGithub className="h-4 w-4" />
          Star on GitHub
        </Link>
      </motion.div>

      {/* Dashboard Screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-[1000px] px-4 relative isolate md:pb-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 left-1/2 -z-10 h-[55%] w-[85%] -translate-x-1/2 rounded-full bg-[#93B5D9]/40 blur-[72px] dark:bg-[#769CC5]/20"
        />
        <div className="relative z-10 rounded-2xl border border-[#D8DFE9]/80 bg-[#F9FCFF]/60 p-1.5 sm:p-2 shadow-[0_16px_48px_-24px_rgba(16,23,35,0.25)] dark:border-[#2B3646] dark:bg-[#1A2533]/70 dark:shadow-[0_16px_48px_-24px_rgba(0,0,0,0.5)]">
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
          className="relative z-20 mx-auto -mt-20 w-[88%] max-w-[300px] overflow-hidden rounded-2xl border border-[#D8DFE9] bg-[#F9FCFF] text-left shadow-[0_12px_36px_-16px_rgba(16,23,35,0.3)] dark:border-[#2B3646] dark:bg-[#1A2533] md:absolute md:bottom-0 md:right-8 md:mt-0"
        >
          <div className="flex items-center gap-2.5 border-b border-[#D8DFE9]/70 px-4 py-3 dark:border-[#2B3646]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7EDF6] dark:bg-[#243040]">
              <img src={brandLogo} alt="" className="h-6 w-6 dark:brightness-0 dark:invert" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#101723] dark:text-[#D7DFE5]">Your website assistant</p>
              <p className="mt-0.5 text-xs text-[#647184] dark:text-[#9BAABD]">Example conversation</p>
            </div>
          </div>
          <div className="space-y-3 p-4 text-[13px] leading-relaxed">
            <p className="ml-8 rounded-2xl rounded-br-md bg-[#101723] px-3 py-2.5 text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]">
              Where can I track my order?
            </p>
            <p className="mr-5 rounded-2xl rounded-bl-md bg-[#E7EDF6] px-3 py-2.5 text-[#101723] dark:bg-[#243040] dark:text-[#D7DFE5]">
              You’ll find your tracking link in your shipping confirmation email.
            </p>
          </div>
          <div className="hidden sm:block border-t border-[#D8DFE9]/70 px-4 py-2.5 text-center text-[11px] text-[#647184] dark:border-[#2B3646] dark:text-[#9BAABD]">
            Your answers. Your brand. Powered by Askio.
          </div>
        </aside>
      </motion.div>
    </section>
  );
}
