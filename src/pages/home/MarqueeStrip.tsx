import { motion } from "framer-motion";

const ITEMS = [
  "React",
  "Next.js",
  "WordPress",
  "Shopify",
  "Webflow",
  "HTML",
  "Vue",
  "Angular",
  "Wix",
  "Squarespace",
  "Custom Sites",
  "SaaS",
];

function MarqueeContent() {
  return (
    <>
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center gap-6 sm:gap-8 shrink-0">
          <span className="text-[15px] sm:text-[17px] font-serif italic text-[#566273] dark:text-[#9BAABD] whitespace-nowrap tracking-wide">
            {item}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(16,23,35,0.20)] dark:bg-[rgba(255,255,255,0.15)] shrink-0" />
        </span>
      ))}
    </>
  );
}

export default function MarqueeStrip() {
  return (
    <section
      className="border-b border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] overflow-hidden flex items-stretch"
      aria-label="Works with"
    >
      <p className="sr-only">Works with {ITEMS.join(", ")}.</p>
      <div
        className="shrink-0 flex items-center px-4 sm:px-6 border-r border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] text-[11px] sm:text-xs font-medium uppercase tracking-[0.08em] text-[#647184] dark:text-[#9BAABD] whitespace-nowrap"
        aria-hidden="true"
      >
        Works with
      </div>
      <div
        className="flex-1 min-w-0 py-4 sm:py-5 flex items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_32px,black_calc(100%-32px),transparent)]"
        aria-hidden="true"
      >
        <motion.div
          className="flex items-center gap-6 sm:gap-8"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: {
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            },
          }}
        >
          {/* Render the content twice for seamless looping */}
          <MarqueeContent />
          <MarqueeContent />
        </motion.div>
      </div>
    </section>
  );
}
