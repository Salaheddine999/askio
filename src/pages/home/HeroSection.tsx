import { useState, useEffect, useRef } from "react";
import { ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

/* ─── Animated counter hook ─── */
function useCountUp(target: number, duration = 1800, inView: boolean) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return count;
}

export default function HeroSection() {
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.5 });
  const chatbots = useCountUp(1200, 1800, statsInView);
  const users = useCountUp(500, 1600, statsInView);
  const rating = useCountUp(48, 1400, statsInView); // 4.8 × 10

  const sectionBorder = "border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]";

  return (
    <section className={`py-20 lg:py-28 flex flex-col items-center text-center ${sectionBorder}`}>
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

      {/* Stats Capsule */}
      <motion.div
        ref={statsRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-center mt-12 mb-4"
      >
        <div className="inline-flex items-center justify-center gap-6 px-8 py-3 bg-white/60 dark:bg-[#1C1917]/60 backdrop-blur-sm border border-[rgba(55,50,47,0.08)] dark:border-[#44403C] rounded-full shadow-[0px_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col items-center" aria-label="Over 1200 chatbots created">
            <span className="text-2xl font-serif text-[#37322F] dark:text-[#F5F5F4]">
              {chatbots >= 1000 ? `${(chatbots / 1000).toFixed(1)}K` : chatbots}+
            </span>
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#57524F] dark:text-[#A8A29E]">
              Chatbots
            </span>
          </div>

          <div className="w-px h-8 bg-[rgba(55,50,47,0.12)] dark:bg-[#44403C]" />

          <div className="flex flex-col items-center" aria-label="Over 500 users">
            <span className="text-2xl font-serif text-[#37322F] dark:text-[#F5F5F4]">{users}+</span>
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#57524F] dark:text-[#A8A29E]">
              Users
            </span>
          </div>

          <div className="w-px h-8 bg-[rgba(55,50,47,0.12)] dark:bg-[#44403C]" />

          <div className="flex flex-col items-center" aria-label="4.8 out of 5 star rating">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-serif text-[#37322F] dark:text-[#F5F5F4]">
                {(rating / 10).toFixed(1)}
              </span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mb-1" />
            </div>
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#57524F] dark:text-[#A8A29E]">
              Rating
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
