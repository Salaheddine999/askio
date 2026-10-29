import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ConfigureIllustration, DesignIllustration, EmbedIllustration } from "./HowItWorksIllustrations";

export default function HowItWorks() {
  const [howItWorksRef, howItWorksInView] = useInView({ triggerOnce: true, rootMargin: "0px 0px 200px 0px" });
  const [activeStep, setActiveStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const stepMountedRef = useRef(true);

  useEffect(() => {
    stepMountedRef.current = true;
    const progressInterval = setInterval(() => {
      if (!stepMountedRef.current) return;
      setStepProgress((prev) => {
        if (prev >= 100) {
          if (stepMountedRef.current) {
            setActiveStep((current) => (current + 1) % 3);
          }
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => {
      clearInterval(progressInterval);
      stepMountedRef.current = false;
    };
  }, []);

  const handleStepClick = (index: number) => {
    if (!stepMountedRef.current) return;
    setActiveStep(index);
    setStepProgress(0);
  };

  const sectionBorder = "border-t border-[rgba(16,23,35,0.12)] dark:border-ink-780";

  const steps = [
    { title: "Add your answers", desc: "Write the questions your customers ask and your answers. On Pro, Askio can read your website and draft them for you." },
    { title: "Make it look like yours", desc: "Pick your colors, greeting, launcher style and which corner it sits in, and watch each change in the live preview." },
    { title: "Paste one line", desc: "Copy one line of code into your site, or use the WordPress plugin or Shopify app. It loads after your page, so it won't slow it down." },
  ];

  return (
    <section id="how-it-works" className={sectionBorder}>
      <div className="py-16 sm:py-20 flex flex-col items-center text-center px-4">
        <motion.div ref={howItWorksRef} initial={{ opacity: 0, y: 30 }} animate={howItWorksInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.35 }}>
          <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-display tracking-tight [text-wrap:balance] text-fg">Live on your site in three steps</h2>
          <p className="mt-3 text-fg-muted text-body max-w-md mx-auto">From your answers to a chatbot on your site.</p>
        </motion.div>
      </div>

      <div className="flex border-t border-[rgba(16,23,35,0.12)] dark:border-ink-780">
        <div className="flex-1 px-4 sm:px-6 md:px-9 overflow-hidden flex justify-start items-center">
          <div className="flex-1 py-8 md:py-11 flex flex-col lg:flex-row justify-start items-center gap-6 lg:gap-12">
            {/* Left Column - Step Cards */}
            <div className="w-full max-w-[580px] lg:max-w-none lg:w-[340px] lg:shrink-0 flex flex-col justify-center items-center gap-4 order-2 lg:order-1">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <div
                    key={index}
                    onClick={() => handleStepClick(index)}
                    // Every card keeps the same 1px border and only its colours change, so
                    // switching steps never changes the list's height (which used to nudge
                    // the whole page below it up and down).
                    className={`w-full overflow-hidden flex flex-col justify-start items-start border transition-colors duration-300 cursor-pointer ${
                      isActive
                        ? "bg-ink-25 border-[#D8DFE9] dark:bg-ink-820 dark:border-[#2B3646]"
                        : "border-[rgba(2,6,23,0.08)] dark:border-ink-780 hover:border-[rgba(2,6,23,0.15)] dark:hover:border-ink-605"
                    }`}
                  >
                    <div className={`w-full h-1 bg-[rgba(16,23,35,0.08)] dark:bg-[rgba(255,255,255,0.08)] overflow-hidden ${isActive ? "opacity-100" : "opacity-0"}`}>
                      <div
                        className="h-1 bg-ink-900 dark:bg-ink-130 transition-all duration-100 ease-linear"
                        style={{ width: `${isActive ? stepProgress : 0}%` }}
                      />
                    </div>
                    <div className="px-6 py-5 w-full flex flex-col gap-2">
                      <div className="self-stretch flex items-center gap-3 text-fg text-body-sm font-semibold leading-6 font-sans">
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-full pt-px text-caption font-semibold leading-none tabular-nums transition-colors duration-300 ${
                            isActive
                              ? "bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875"
                              : "bg-ink-70 text-ink-605 dark:bg-ink-805 dark:text-ink-325"
                          }`}
                        >
                          {index + 1}
                        </span>
                        {step.title}
                      </div>
                      <div className="self-stretch text-fg-muted text-body-sm font-normal leading-[22px] font-sans pl-8">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Preview Panel */}
            <div className="w-full lg:flex-1 lg:min-w-0 rounded-lg flex flex-col justify-center items-center gap-2 order-1 lg:order-2">
              <div className="w-full max-w-[580px] h-[260px] sm:h-[300px] md:h-[420px] bg-ink-25 dark:bg-ink-820 shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)] dark:shadow-[0px_0px_0px_0.9px_rgba(255,255,255,0.08)] overflow-hidden rounded-[9px] relative">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    {activeStep === 0 ? <ConfigureIllustration /> : activeStep === 1 ? <DesignIllustration /> : <EmbedIllustration />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
