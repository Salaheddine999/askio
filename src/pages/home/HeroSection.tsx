import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";

export default function HeroSection() {
  const sectionBorder = "border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]";

  return (
    <section className={`pt-20 lg:pt-28 pb-10 lg:pb-14 flex flex-col items-center text-center ${sectionBorder}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-[750px] px-4"
      >
        <h1 className="text-hero font-serif text-[#37322F] dark:text-[#F5F5F4] mb-6">
          Custom Chatbots,{" "}
          <br className="hidden sm:block" />
          Limitless Possibilities
        </h1>
        <p className="text-[rgba(55,50,47,0.80)] dark:text-[#A8A29E] text-body-lg font-medium max-w-[510px] mx-auto mb-8">
          Create custom chatbots tailored to your brand. Effortlessly integrate them into your website and engage visitors with smarter interactions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center gap-4 mb-12"
      >
        <Link
          to="/auth"
          className="h-11 px-10 bg-[#37322F] dark:bg-[#F5F5F4] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] rounded-full flex items-center text-white dark:text-[#1C1917] text-button font-medium hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] hover:scale-[1.03] hover:shadow-[0px_4px_20px_rgba(55,50,47,0.25)] transition-all duration-300"
          aria-label="Start using Askio for free"
        >
          Start for free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          to="https://github.com/Salaheddine999/askio"
          className="flex items-center gap-2 text-[rgba(49,45,43,0.80)] dark:text-[#A8A29E] text-body-sm font-medium hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group"
          aria-label="Star Askio on GitHub"
        >
          <FaGithub className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          Star on Github
        </Link>
      </motion.div>

      {/* Dashboard Screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="w-full max-w-[1000px] px-4 relative isolate"
      >
        {/* Glow Effect */}
        <div className="absolute top-[0%] left-1/2 -translate-x-1/2 w-[70%] h-[40%] bg-gradient-to-tr from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] opacity-20 blur-[60px] rounded-full -z-10 dark:opacity-10 pointer-events-none" />

        <div className="relative z-10 rounded-xl bg-[rgba(55,50,47,0.05)] dark:bg-[rgba(255,255,255,0.05)] p-2 sm:p-3 border border-[rgba(55,50,47,0.05)] dark:border-[rgba(255,255,255,0.08)]">
          <img
            src="/screenshot askio.png"
            alt="Askio Dashboard — manage and customize your chatbots"
            className="w-full h-auto rounded-lg shadow-2xl"
            loading="lazy"
          />
        </div>
      </motion.div>
    </section>
  );
}
