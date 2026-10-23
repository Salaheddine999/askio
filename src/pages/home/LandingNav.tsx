import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import logoHome from "../../assets/logo.svg";

export default function LandingNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87909D]";

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Pricing", href: "#plans" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        document.getElementById("landing-menu-toggle")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <header className="relative z-50 flex justify-center pt-3 pb-4">
      <div className="absolute left-0 right-0 top-[36px] h-0 border-t border-[rgba(16,23,35,0.10)] dark:border-[#2B3646] hidden lg:block" />
      <nav
        aria-label="Main navigation"
        className={`relative z-30 flex w-full max-w-[720px] items-center justify-between h-12 pl-4 pr-2 backdrop-blur-xl rounded-full border border-white/90 dark:border-[#2B3646] ring-1 ring-[#D8DFE9]/40 dark:ring-white/5 transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none md:grid md:grid-cols-[1fr_auto_1fr] ${
          scrolled
            ? "bg-[#F3F7FC]/95 dark:bg-[#141D2B]/95 shadow-[0_6px_20px_-12px_rgba(16,23,35,0.22)]"
            : "bg-[#F3F7FC]/90 dark:bg-[#141D2B]/90 shadow-[0_2px_8px_-4px_rgba(16,23,35,0.12),inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-none"
        }`}
      >
        <div className="flex items-center justify-self-start">
          <Link to="/" className={`flex items-center gap-2 rounded-full ${focusRing}`} aria-label="Askio home">
            <img src={logoHome} alt="" className="w-6 h-6 dark:brightness-0 dark:invert" />
            <span className="text-[#101723] dark:text-[#D7DFE5] text-body font-medium tracking-[-0.02em]">Askio</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center justify-center gap-0.5 justify-self-center">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-2.5 text-[#566273] dark:text-[#9BAABD] text-body-sm font-medium hover:bg-[#E7EDF6]/80 hover:text-[#101723] dark:hover:bg-[#243040] dark:hover:text-[#D7DFE5] transition-colors duration-150 motion-reduce:transition-none ${focusRing}`}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0 md:justify-self-end">
          <Link
            to="/auth"
            className="inline-flex h-8 items-center justify-center px-4 bg-[#F9FCFF] dark:bg-[#1A2533] shadow-[0_1px_2px_rgba(16,23,35,0.06)] dark:shadow-none rounded-full text-[#101723] dark:text-[#D7DFE5] text-button font-medium hover:bg-[#E7EDF6] dark:hover:bg-[#243040] transition-colors duration-200 border border-[#D8DFE9]/70 dark:border-[#2B3646] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87909D]"
          >
            Log in
          </Link>
          <button
            id="landing-menu-toggle"
            className={`md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-[#101723] dark:text-[#D7DFE5] hover:bg-[#E7EDF6] dark:hover:bg-[#243040] transition-colors ${focusRing}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="landing-mobile-menu"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
            className="md:hidden absolute top-[68px] left-0 right-0 bg-[#F9FCFF]/95 dark:bg-[#1A2533]/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_32px_-16px_rgba(16,23,35,0.25)] z-50 p-2 border border-[#D8DFE9] dark:border-[#2B3646]"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`rounded-xl px-3 py-2.5 text-body-sm text-[#101723] dark:text-[#D7DFE5] font-medium hover:bg-[#E7EDF6] dark:hover:bg-[#243040] transition-colors ${focusRing}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/auth"
                className={`mt-1 bg-[#101723] dark:bg-[#D7DFE5] text-white dark:text-[#141D2B] text-center text-button py-3 rounded-full font-medium ${focusRing}`}
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
