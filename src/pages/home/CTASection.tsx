import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import HatchStrip from "./HatchStrip";

export default function CTASection() {
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.section
      ref={ctaRef}
      initial={{ opacity: 0, y: 40 }}
      animate={ctaInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C] bg-gradient-to-b from-[#F7F5F3] to-[#EDE9E3] dark:from-[#1C1917] dark:to-[#262220]"
    >
      <div className="flex">
        <HatchStrip />
        <div className="flex-1 py-20 sm:py-28 flex flex-col items-center text-center px-4 border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
          <h2 className="text-display font-serif text-[#37322F] dark:text-[#F5F5F4] mb-6">
            Ready to transform<br className="hidden sm:block" /> your website?
          </h2>
          <p className="text-[#57524F] dark:text-[#A8A29E] text-body-lg max-w-md mb-10 leading-relaxed">
            Join thousands of websites using Askio to provide instant support and enhance user experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/auth"
              className="h-12 px-12 bg-[#37322F] dark:bg-[#F5F5F4] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] rounded-full flex items-center text-white dark:text-[#1C1917] text-[15px] font-medium hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] hover:scale-[1.03] hover:shadow-[0px_4px_20px_rgba(55,50,47,0.25)] transition-all duration-300"
              aria-label="Get started with Askio for free"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-[#57524F] text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#E0DEDB] dark:bg-[#44403C] border-2 border-[#EDE9E3] dark:border-[#262220] flex items-center justify-center text-[#57524F] dark:text-[#A8A29E] text-xs font-medium">✓</div>
                ))}
              </div>
              <span><strong className="text-[#37322F] dark:text-[#F5F5F4]">500+</strong> users already started</span>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {["No Credit Card", "Easy Setup", "Full Customization"].map((t) => (
              <span key={t} className="px-4 py-1.5 bg-white/80 dark:bg-[#2A2522] border border-[#E0DEDB] dark:border-[#44403C] rounded-full text-xs font-medium text-[#57524F] dark:text-[#A8A29E] backdrop-blur-sm">{t}</span>
            ))}
          </div>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
