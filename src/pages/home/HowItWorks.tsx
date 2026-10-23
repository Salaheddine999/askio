import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import HatchStrip from "./HatchStrip";
import Badge from "./Badge";
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

  const sectionBorder = "border-b border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]";

  const steps = [
    { title: "Create & Configure", desc: "Set up your chatbot by adding custom Q&As, defining conversation flows, and configuring automatic responses." },
    { title: "Customize Design", desc: "Tailor your bot's appearance to match your brand: colors, fonts, positioning, and layout options." },
    { title: "Plug & Play", desc: "Copy your unique embed code and paste it into your website. Your chatbot goes live instantly." },
  ];

  return (
    <section id="how-it-works" className={sectionBorder}>
      <div className="py-16 sm:py-20 flex flex-col items-center text-center px-4">
        <Badge text="How it Works" />
        <motion.div ref={howItWorksRef} initial={{ opacity: 0, y: 30 }} animate={howItWorksInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.35 }}>
          <h2 className="mt-5 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-serif tracking-tight [text-wrap:balance] text-[#101723] dark:text-[#D7DFE5]">Three simple steps to go live</h2>
          <p className="mt-3 text-[#566273] dark:text-[#9BAABD] text-body max-w-md mx-auto">Create and deploy your custom chatbot in minutes. No coding required.</p>
        </motion.div>
      </div>

      <div className="flex border-t border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
        <HatchStrip />
        <div className="flex-1 px-4 sm:px-6 md:px-9 overflow-hidden flex justify-start items-center border-l border-r border-[rgba(16,23,35,0.12)] dark:border-[#2B3646]">
          <div className="flex-1 py-8 md:py-11 flex flex-col lg:flex-row justify-start items-center gap-6 lg:gap-12">
            {/* Left Column - Step Cards */}
            <div className="w-full max-w-[580px] lg:max-w-none lg:w-[340px] lg:shrink-0 flex flex-col justify-center items-center gap-4 order-2 lg:order-1">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <div
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={`w-full overflow-hidden flex flex-col justify-start items-start transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-[#F9FCFF] dark:bg-[#202C3C] shadow-[0px_0px_0px_0.75px_#D8DFE9_inset] dark:shadow-[0px_0px_0px_0.75px_#2B3646_inset]"
                        : "border border-[rgba(2,6,23,0.08)] dark:border-[#2B3646] hover:border-[rgba(2,6,23,0.15)] dark:hover:border-[#566273]"
                    }`}
                  >
                    <div className={`w-full h-1 bg-[rgba(16,23,35,0.08)] dark:bg-[rgba(255,255,255,0.08)] overflow-hidden ${isActive ? "opacity-100" : "opacity-0"}`}>
                      <div
                        className="h-1 bg-[#101723] dark:bg-[#D7DFE5] transition-all duration-100 ease-linear"
                        style={{ width: `${isActive ? stepProgress : 0}%` }}
                      />
                    </div>
                    <div className="px-6 py-5 w-full flex flex-col gap-2">
                      <div className="self-stretch flex items-center gap-3 text-[#101723] dark:text-[#D7DFE5] text-body-sm font-semibold leading-6 font-sans">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors duration-300 ${
                            isActive
                              ? "bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]"
                              : "bg-[#E7EDF6] text-[#566273] dark:bg-[#243040] dark:text-[#9BAABD]"
                          }`}
                        >
                          {index + 1}
                        </span>
                        {step.title}
                      </div>
                      <div className="self-stretch text-[#566273] dark:text-[#9BAABD] text-body-sm font-normal leading-[22px] font-sans pl-8">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Preview Panel */}
            <div className="w-full lg:flex-1 lg:min-w-0 rounded-lg flex flex-col justify-center items-center gap-2 order-1 lg:order-2">
              <div className="w-full max-w-[580px] h-[260px] sm:h-[300px] md:h-[420px] bg-[#F9FCFF] dark:bg-[#202C3C] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)] dark:shadow-[0px_0px_0px_0.9px_rgba(255,255,255,0.08)] overflow-hidden rounded-[9px] relative">
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
        <HatchStrip />
      </div>
    </section>
  );
}
