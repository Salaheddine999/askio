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
          <span className="text-[15px] sm:text-[17px] font-serif italic text-[#57524F] dark:text-[#A8A29E] whitespace-nowrap tracking-wide">
            {item}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(55,50,47,0.20)] dark:bg-[rgba(255,255,255,0.15)] shrink-0" />
        </span>
      ))}
    </>
  );
}

export default function MarqueeStrip() {
  return (
    <section
      className="border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C] overflow-hidden"
      aria-hidden="true"
    >
      <div className="py-4 sm:py-5 flex items-center overflow-hidden">
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
