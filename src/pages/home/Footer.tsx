import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { ArrowUpRight } from "lucide-react";
import logoHome from "../../assets/logo.svg";

const GITHUB_URL = "https://github.com/Salaheddine999/askio";

type FooterLink = { label: string; href: string; route?: boolean; external?: boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#plans" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Get started", href: "/auth", route: true },
      { label: "Testimonials", href: "#testimonials" },
      { label: "GitHub", href: GITHUB_URL, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/privacy", route: true },
      { label: "Terms of service", href: "/terms", route: true },
    ],
  },
];

const linkClass =
  "group inline-flex items-center gap-1 rounded-sm text-sm text-[#566273] transition-colors duration-150 hover:text-[#101723] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87909D] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5]";

function FooterNavLink({ link }: { link: FooterLink }) {
  if (link.route) {
    return (
      <Link to={link.href} className={linkClass}>
        {link.label}
      </Link>
    );
  }
  return (
    <a
      href={link.href}
      className={linkClass}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {link.label}
      {link.external ? (
        <ArrowUpRight className="h-3.5 w-3.5 opacity-60 transition-transform duration-150 group-hover:-translate-y-px group-hover:translate-x-px" />
      ) : null}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="w-full border-t border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
      <div className="grid gap-10 px-4 pt-12 pb-10 sm:px-8 md:grid-cols-[1.2fr_2fr] md:gap-16 md:pt-14 lg:px-12">
        <div className="flex flex-col items-start gap-5">
          <Link to="/" className="flex items-center gap-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87909D]">
            <img src={logoHome} alt="" className="h-7 w-7 dark:brightness-0 dark:invert" />
            <span className="font-sans text-xl font-semibold text-[#101723] dark:text-[#D7DFE5]">Askio</span>
          </Link>
          <p className="max-w-[300px] text-sm leading-relaxed text-[#566273] dark:text-[#9BAABD]">
            Turn your FAQs into a chatbot that looks like your brand and answers visitors around the clock.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[#D8DFE9] bg-[#F9FCFF] px-3.5 text-[13px] font-medium text-[#101723] transition-colors duration-150 hover:border-[#B8C2CF] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87909D] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5] dark:hover:border-[#566273]"
          >
            <FaGithub className="h-4 w-4" />
            Star on GitHub
          </a>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-[#87909D] dark:text-[#647184]">
                {column.title}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterNavLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex flex-col-reverse items-start gap-3 border-t border-[rgba(16,23,35,0.12)] px-4 py-5 text-xs text-[#647184] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 dark:border-[#2B3646] dark:text-[#87909D]">
        <p>© {new Date().getFullYear()} Askio. All rights reserved.</p>
        <p className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[#10B981]" />
          Answering questions, day and night
        </p>
      </div>

      {/* Oversized wordmark closing the page */}
      <div className="relative h-[clamp(5rem,18vw,12rem)] overflow-hidden border-t border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]" aria-hidden="true">
        <span className="absolute inset-x-0 top-[0.06em] select-none text-center font-serif text-[clamp(6rem,24vw,16rem)] font-semibold leading-none tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-b from-[rgba(16,23,35,0.10)] to-[rgba(16,23,35,0)] dark:from-[rgba(215,223,229,0.10)] dark:to-[rgba(215,223,229,0)]">
          Askio
        </span>
      </div>
    </footer>
  );
}
