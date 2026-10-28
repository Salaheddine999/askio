import { useState, useEffect } from "react";
import { Menu, Star, X } from "../../components/icons";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import BrandLogo from "../../components/BrandLogo";

export default function LandingNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-425";
  const githubUrl = "https://github.com/Salaheddine999/askio";

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Pricing", href: "#plans" },
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
    // Sticks to the top as the page scrolls. The empty space around the pill
    // lets clicks through to the page; the line it sits on fades away.
    <header className="pointer-events-none sticky top-0 z-50 flex justify-center pt-3 pb-4">
      <div
        className={`absolute left-0 right-0 top-[36px] h-0 border-t border-[rgba(16,23,35,0.10)] transition-opacity duration-200 dark:border-ink-780 hidden lg:block ${
          scrolled ? "opacity-0" : ""
        }`}
      />
      <nav
        aria-label="Main navigation"
        className={`pointer-events-auto relative z-30 flex w-full max-w-[720px] items-center justify-between h-12 pl-4 pr-2 rounded-full border border-ink-120 dark:border-ink-780 bg-ink-30 dark:bg-ink-875 transition-[background-color,box-shadow] duration-200 motion-reduce:transition-none md:grid md:grid-cols-[1fr_auto_1fr] ${
          scrolled
            ? "shadow-sm"
            : "shadow-none"
        }`}
      >
        <div className="flex items-center justify-self-start">
          <Link to="/" className={`flex items-center rounded-full ${focusRing}`} aria-label="Askio home">
            <BrandLogo size={18} label="" className="text-fg" />
          </Link>
        </div>
        <div className="hidden md:flex items-center justify-center gap-0.5 justify-self-center">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-2.5 text-fg-muted text-body-sm font-medium hover:bg-ink-70/80 hover:text-ink-900 dark:hover:bg-ink-805 dark:hover:text-ink-130 transition-colors duration-150 motion-reduce:transition-none ${focusRing}`}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0 md:justify-self-end">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star Askio on GitHub"
            title="Star Askio on GitHub"
            className={`group inline-flex h-8 items-center gap-1 rounded-full px-2 text-ink-605 hover:bg-ink-70/80 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-805 dark:hover:text-ink-130 transition-colors duration-150 motion-reduce:transition-none ${focusRing}`}
          >
            <FaGithub className="h-[18px] w-[18px]" />
            <Star className="h-3.5 w-3.5 transition-colors group-hover:fill-[#E3A008] group-hover:text-[#E3A008]" />
          </a>
          <Link
            to="/auth"
            className="inline-flex h-8 items-center justify-center px-4 bg-ink-25 dark:bg-ink-850 shadow-[0_1px_2px_rgba(16,23,35,0.06)] dark:shadow-none rounded-full text-fg text-button font-medium hover:bg-ink-70 dark:hover:bg-ink-805 transition-colors duration-200 border border-ink-120/70 dark:border-ink-780 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-425"
          >
            Log in
          </Link>
          <button
            id="landing-menu-toggle"
            className={`md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-fg hover:bg-ink-70 dark:hover:bg-ink-805 transition-colors ${focusRing}`}
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
            className="pointer-events-auto md:hidden absolute top-[68px] left-0 right-0 bg-ink-25 dark:bg-ink-850 rounded-2xl shadow-[0_12px_32px_-16px_rgba(16,23,35,0.25)] z-50 p-2 border border-ink-120 dark:border-ink-780"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`rounded-xl px-3 py-2.5 text-body-sm text-fg font-medium hover:bg-ink-70 dark:hover:bg-ink-805 transition-colors ${focusRing}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/auth"
                className={`mt-1 bg-ink-900 dark:bg-ink-130 text-white dark:text-ink-875 text-center text-button py-3 rounded-full font-medium ${focusRing}`}
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
