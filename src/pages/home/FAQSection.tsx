import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "./Badge";

const faqs = [
  { q: "What is Askio?", a: "Askio is a versatile, easy-to-use chatbot that can be added to any website to improve user engagement and provide instant responses to visitor queries." },
  { q: "Does Askio have a free plan?", a: "Yes. Askio includes a free Starter plan with unlimited standard chatbots, a manual FAQ builder, lead capture flows, and basic analytics. If you need AI features, the Professional plan starts at $19/month, and Enterprise pricing is available for larger teams." },
  { q: "Do I have control over where the chatbot appears?", a: "Absolutely. You can choose where you want the chatbot to appear on your website, giving you full control over its placement and visibility." },
  { q: "Do I need coding skills?", a: "No coding skills are required. The chatbot is designed to be easy to implement with a simple embed code, making it accessible for users of all technical levels." },
  { q: "Can I create multiple chatbots?", a: "Yes, you can create multiple chatbots, allowing you to have different chatbots for your various websites or web pages, each tailored to specific needs." },
];

export default function FAQSection() {
  const [faqRef, faqInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const toggleFAQ = (index: number) => setActiveIndex(activeIndex === index ? null : index);

  return (
    <motion.section
      ref={faqRef}
      initial={{ opacity: 0, y: 40 }}
      animate={faqInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      id="faq"
      className="border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]"
      role="region"
      aria-labelledby="faq-heading"
    >
      <div className="flex-1">
        <div className="px-4 md:px-12 py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
          {/* Left Column — Header */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col justify-center items-start gap-4 lg:py-5">
            <Badge text="FAQ" />
            <h2 id="faq-heading" className="w-full flex flex-col justify-center text-[#49423D] dark:text-[#F5F5F4] font-semibold leading-tight md:leading-[44px] text-h2 sm:text-3xl lg:text-4xl tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="w-full text-[#57524F] dark:text-[#A8A29E] text-body font-normal leading-7 font-sans">
              Everything you need to know about Askio.
              <br className="hidden md:block" />
              Can't find an answer? Reach out to us.
            </p>
          </div>

          {/* Right Column — FAQ Items */}
          <div className="w-full flex-1 flex flex-col" role="list">
            {faqs.map((faq, index) => {
              const panelId = `faq-panel-${index}`;
              const buttonId = `faq-button-${index}`;
              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] dark:border-[#44403C] overflow-hidden" role="listitem">
                  <button
                    id={buttonId}
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-200"
                    aria-expanded={activeIndex === index}
                    aria-controls={panelId}
                  >
                    <div className="flex-1 text-[#49423D] dark:text-[#F5F5F4] text-body font-medium leading-6 font-sans">{faq.q}</div>
                    <motion.div animate={{ rotate: activeIndex === index ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="flex justify-center items-center">
                      <ChevronDown className="w-5 h-5 text-[rgba(73,66,61,0.60)] dark:text-[#78716C]" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {activeIndex === index && (
                      <motion.div
                        id={panelId}
                        key={`a-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        role="region"
                        aria-labelledby={buttonId}
                      >
                        <div className="px-5 pb-[18px] text-[#57524F] dark:text-[#A8A29E] text-body-sm font-normal leading-6 font-sans">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
