import { useState } from "react";
import { ChevronDown } from "../../components/icons";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "framer-motion";
import { COMPANY } from "../legal/company";
import { PRO_PRICE } from "../../utils/pricing";

const faqs = [
  { q: "What is Askio?", a: "A chat window for your website that answers visitors from the questions and answers you write. On Pro it can also reply with AI, and you can step in and chat with visitors yourself." },
  { q: "Does Askio have a free plan?", a: `Yes. Starter is free, with as many chatbots as you like that answer from your own FAQs, plus lead capture and basic analytics. Pro adds AI replies and live chat for $${PRO_PRICE.monthly} a month, or $${PRO_PRICE.yearly} a year.` },
  { q: "Can I choose where the chatbot appears?", a: "Yes. Put it in any corner of the page, and choose a classic chat button or Kio as the launcher." },
  { q: "Do I need to write code?", a: "No. You paste one line into your site, or use the WordPress plugin or the Shopify app. If someone else looks after your site, Askio can email them the line and the steps." },
  { q: "Which languages does Askio speak?", a: "Your chatbot's built-in text, like the message box and email form, comes in English, French, Dutch, German and Spanish, and you pick the language per chatbot. With AI replies on, it answers each visitor in the language they write in. The Askio dashboard is available in the same five languages." },
  { q: "Can I chat with visitors myself?", a: "Yes, on Pro. Turn on live chat for a chatbot and switch yourself online in the dashboard. When a visitor asks for a person, or the chatbot can't answer, you get an alert on your computer or phone and can reply right there. When you're offline, the chatbot keeps answering and can collect an email instead." },
  { q: "Can I read my chatbot's conversations?", a: "Yes, on Pro. Turn on \"Save conversations\" for a chatbot and every chat appears in your Conversations page, so you can see what visitors ask and improve your answers. Visitors see a short notice that chats are saved, and each conversation is deleted automatically after 90 days." },
  { q: "Can I have more than one chatbot?", a: "Yes. Make one per website or per page, each with its own answers and look. Starter has no limit, and Pro includes up to 10 with AI." },
];

export default function FAQSection() {
  const [faqRef, faqInView] = useInView({ triggerOnce: true, rootMargin: "0px 0px 200px 0px" });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const toggleFAQ = (index: number) => setActiveIndex(activeIndex === index ? null : index);

  return (
    <motion.section
      ref={faqRef}
      initial={{ opacity: 0, y: 40 }}
      animate={faqInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35 }}
      id="faq"
      className="border-b border-[rgba(16,23,35,0.12)] dark:border-ink-780"
      role="region"
      aria-labelledby="faq-heading"
    >
      <div className="flex-1">
        <div className="px-4 md:px-12 py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
          {/* Left Column — Header */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col justify-center items-start gap-4 lg:py-5">
            <h2 id="faq-heading" className="w-full flex flex-col justify-center text-fg font-semibold leading-tight md:leading-[44px] text-h2 sm:text-3xl lg:text-4xl tracking-tight">
              Questions about Askio
            </h2>
            <p className="w-full text-fg-muted text-body font-normal leading-7 font-sans">
              Something else? Email{" "}
              <a href={`mailto:${COMPANY.contactEmail}`} className="font-medium text-fg underline underline-offset-4">
                {COMPANY.contactEmail}
              </a>
              .
            </p>
          </div>

          {/* Right Column — FAQ Items */}
          <div className="w-full flex-1 flex flex-col" role="list">
            {faqs.map((faq, index) => {
              const panelId = `faq-panel-${index}`;
              const buttonId = `faq-button-${index}`;
              return (
                <div key={index} className="w-full border-b border-[rgba(16,23,35,0.16)] dark:border-ink-780 overflow-hidden" role="listitem">
                  <button
                    id={buttonId}
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(16,23,35,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-200"
                    aria-expanded={activeIndex === index}
                    aria-controls={panelId}
                  >
                    <div className="flex-1 text-fg text-body font-medium leading-6 font-sans">{faq.q}</div>
                    <motion.div animate={{ rotate: activeIndex === index ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="flex justify-center items-center">
                      <ChevronDown className="w-5 h-5 text-[rgba(16,23,35,0.60)] dark:text-ink-545" />
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
                        <div className="px-5 pb-[18px] text-fg-muted text-body-sm font-normal leading-6 font-sans">
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
