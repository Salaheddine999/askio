import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

export default function LandingNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Pricing", href: "#plans" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="relative z-50 flex justify-center pt-3 pb-4">
      <div className="absolute left-0 right-0 top-[34px] h-0 border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C] hidden lg:block" />
      <nav
        className={`relative z-30 w-full max-w-[700px] h-11 px-4 backdrop-blur-sm rounded-full grid grid-cols-[1fr_auto_1fr] items-center border transition-all duration-300 ${
          scrolled
            ? "bg-[#F7F5F3]/95 dark:bg-[#1C1917]/95 shadow-md border-[rgba(55,50,47,0.12)] dark:border-[#44403C]"
            : "bg-[#F7F5F3]/90 dark:bg-[#1C1917]/90 shadow-[0px_0px_0px_2px_white] dark:shadow-[0px_0px_0px_2px_#292524] border-transparent dark:border-[#44403C]"
        }`}
      >
        <div className="flex items-center justify-self-start">
          <Link to="/" className="flex items-center gap-1.5">
            <img src="./logo.svg" alt="Askio" className="w-6 h-6" />
            <span className="text-[#2F3037] dark:text-[#F5F5F4] text-body font-medium">Askio</span>
          </Link>
        </div>
        <div className="hidden sm:flex items-center justify-center gap-4 justify-self-center">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[rgba(49,45,43,0.80)] dark:text-[#A8A29E] text-body-sm font-medium hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <Link
            to="/auth"
            className="px-3.5 py-1.5 bg-white dark:bg-[#292524] shadow-[0px_1px_2px_rgba(55,50,47,0.12)] dark:shadow-none rounded-full text-[#37322F] dark:text-[#F5F5F4] text-button font-medium hover:shadow-md hover:scale-105 transition-all duration-200 border border-transparent dark:border-[#44403C]"
          >
            Log in
          </Link>
          <button
            className="sm:hidden text-[#37322F] dark:text-[#F5F5F4]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sm:hidden absolute top-16 left-4 right-4 bg-white dark:bg-[#292524] rounded-2xl shadow-xl z-50 p-4 border border-[#E0DEDB] dark:border-[#44403C]"
          >
            <nav className="flex flex-col gap-3">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[#37322F] dark:text-[#F5F5F4] font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/auth"
                className="bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] text-center py-2.5 rounded-full font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
