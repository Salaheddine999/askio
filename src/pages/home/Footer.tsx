import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="w-full pt-10 border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
      <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
        <div className="flex flex-col md:flex-row justify-between items-stretch pb-8 gap-8">
          <div className="p-4 md:p-8 flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="./logo.svg" alt="Askio" className="w-7 h-7" />
              <span className="text-[#49423D] dark:text-[#F5F5F4] text-xl font-semibold font-sans">
                Askio
              </span>
            </Link>
            <p className="text-[rgba(73,66,61,0.90)] dark:text-[#A8A29E] text-sm font-medium leading-[18px] font-sans">
              Your chatbot, your way.
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/Salaheddine999/askio"
                className="w-6 h-6 flex items-center justify-center"
                aria-label="Askio on GitHub"
              >
                <FaGithub className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </a>
            </div>
          </div>

          <div className="p-4 md:p-8 flex flex-col sm:flex-row flex-wrap gap-6 md:gap-12">
            <div className="flex flex-col gap-3 min-w-[120px]">
              <span className="text-[rgba(73,66,61,0.50)] dark:text-[#78716C] text-sm font-medium font-sans">
                Product
              </span>
              {["Features", "How it Works", "Testimonials", "FAQ"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 min-w-[120px]">
              <span className="text-[rgba(73,66,61,0.50)] dark:text-[#78716C] text-sm font-medium font-sans">
                Resources
              </span>
              <Link
                to="/auth"
                className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
              >
                Get Started
              </Link>
              <a
                href="https://github.com/Salaheddine999/askio"
                className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
              >
                GitHub
              </a>
              <Link
                to="/privacy"
                className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C] py-6 text-center">
          <p className="text-[#9CA3AF] dark:text-[#78716C] text-xs font-sans">
            Copyright {new Date().getFullYear()} Askio. All rights reserved.
          </p>
        </div>
      </div>

      <div className="h-12 relative overflow-hidden border-t border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 200 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-[300px] h-16 border border-[rgba(3,7,18,0.08)] dark:border-[#44403C]/20"
              style={{
                left: `${i * 300 - 600}px`,
                top: "-120px",
                transform: "rotate(-45deg)",
                transformOrigin: "top left",
              }}
            />
          ))}
        </div>
      </div>
    </footer>
  );
}
