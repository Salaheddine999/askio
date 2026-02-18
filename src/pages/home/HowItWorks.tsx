import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import HatchStrip from "./HatchStrip";
import Badge from "./Badge";

export default function HowItWorks() {
  const [howItWorksRef, howItWorksInView] = useInView({ triggerOnce: true, threshold: 0.1 });
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

  const sectionBorder = "border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]";

  const steps = [
    { title: "Create & Configure", desc: "Set up your chatbot by adding custom Q&As, defining conversation flows, and configuring automatic responses." },
    { title: "Customize Design", desc: "Tailor your bot's appearance to match your brand — colors, fonts, positioning, and layout options." },
    { title: "Plug & Play", desc: "Copy your unique embed code and paste it into your website. Your chatbot goes live instantly." },
  ];

  return (
    <section id="how-it-works" className={sectionBorder}>
      <div className="py-20 flex flex-col items-center text-center px-4">
        <Badge text="How it Works" />
        <motion.div ref={howItWorksRef} initial={{ opacity: 0, y: 30 }} animate={howItWorksInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
          <h2 className="mt-5 text-display font-serif tracking-tight text-[#49423D] dark:text-[#F5F5F4]">Three simple steps to go live</h2>
          <p className="mt-3 text-[#57524F] dark:text-[#A8A29E] text-body max-w-md mx-auto">Create and deploy your custom chatbot in minutes — no coding required.</p>
        </motion.div>
      </div>

      <div className="flex border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
        <HatchStrip />
        <div className="flex-1 px-4 sm:px-6 md:px-9 overflow-hidden flex justify-start items-center border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
          <div className="flex-1 py-8 md:py-11 flex flex-col md:flex-row justify-start items-center gap-6 md:gap-12">
            {/* Left Column - Step Cards */}
            <div className="w-full md:w-auto md:max-w-[400px] flex flex-col justify-center items-center gap-4 order-2 md:order-1">
              {steps.map((step, index) => {
                const isActive = index === activeStep;
                return (
                  <div
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={`w-full overflow-hidden flex flex-col justify-start items-start transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-white dark:bg-[#2A2522] shadow-[0px_0px_0px_0.75px_#E0DEDB_inset] dark:shadow-[0px_0px_0px_0.75px_#44403C_inset]"
                        : "border border-[rgba(2,6,23,0.08)] dark:border-[#44403C] hover:border-[rgba(2,6,23,0.15)] dark:hover:border-[#57534E]"
                    }`}
                  >
                    <div className={`w-full h-1 bg-[rgba(50,45,43,0.08)] dark:bg-[rgba(255,255,255,0.08)] overflow-hidden ${isActive ? "opacity-100" : "opacity-0"}`}>
                      <div
                        className="h-1 bg-[#37322F] dark:bg-[#F5F5F4] transition-all duration-100 ease-linear"
                        style={{ width: `${isActive ? stepProgress : 0}%` }}
                      />
                    </div>
                    <div className="px-6 py-5 w-full flex flex-col gap-2">
                      <div className="self-stretch flex items-center gap-3 text-[#49423D] dark:text-[#F5F5F4] text-body-sm font-semibold leading-6 font-sans">
                        <span className="text-[#57524F] dark:text-[#A8A29E] text-xs font-mono font-bold tracking-wider">{String(index + 1).padStart(2, '0')}</span>
                        {step.title}
                      </div>
                      <div className="self-stretch text-[#57524F] dark:text-[#A8A29E] text-body-sm font-normal leading-[22px] font-sans pl-8">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Preview Panel */}
            <div className="w-full md:w-auto rounded-lg flex flex-col justify-center items-center gap-2 order-1 md:order-2">
              <div className="w-full md:w-[580px] h-[260px] sm:h-[300px] md:h-[420px] bg-white dark:bg-[#2A2522] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)] dark:shadow-[0px_0px_0px_0.9px_rgba(255,255,255,0.08)] overflow-hidden rounded-[9px] flex flex-col justify-start items-start hover:scale-[1.01] transition-transform duration-500">
                <div className="w-full h-full relative overflow-hidden">
                  {/* Step 1: Configuration panel */}
                  <div className={`absolute inset-0 transition-all duration-500 ease-in-out flex flex-col ${activeStep === 0 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"}`}>
                    <div className="px-4 py-2.5 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-3 bg-[#FAFAF9] dark:bg-[#1C1917]">
                      <span className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans border-b-2 border-[#37322F] dark:border-[#F5F5F4] pb-1">General</span>
                      <span className="text-caption text-[#9CA3AF] font-medium font-sans pb-1">FAQ</span>
                      <span className="text-caption text-[#9CA3AF] font-medium font-sans pb-1">Embed</span>
                    </div>
                    <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
                      <div className="space-y-2">
                        <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Chatbot Name</div>
                        <div className="h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center px-3"><span className="text-caption text-[#57524F] dark:text-[#A8A29E] font-sans">My Support Bot</span></div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Welcome Message</div>
                        <div className="h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center px-3"><span className="text-caption text-[#57524F] dark:text-[#A8A29E] font-sans">Hi! How can I help you today?</span></div>
                      </div>
                      <div className="space-y-2 hidden sm:block">
                        <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Placeholder Text</div>
                        <div className="h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center px-3"><span className="text-caption text-[#57524F] dark:text-[#A8A29E] font-sans">Type your message...</span></div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col gap-0.5"><span className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Auto-reply</span><span className="text-[10px] text-[#9CA3AF] font-sans hidden sm:inline">Respond automatically to visitors</span></div>
                        <div className="w-9 h-[20px] rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-end px-0.5"><div className="w-4 h-4 rounded-full bg-white dark:bg-[#292524] shadow-sm" /></div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <div className="flex-1 h-9 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><span className="text-caption text-white dark:text-[#1C1917] font-sans font-medium">Save Changes</span></div>
                        <div className="flex-1 h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center"><span className="text-caption text-[#57524F] dark:text-[#A8A29E] font-sans font-medium">Preview</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Design customizer */}
                  <div className={`absolute inset-0 transition-all duration-500 ease-in-out flex ${activeStep === 1 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"}`}>
                    <div className="w-1/3 border-r border-[#E0DEDB] dark:border-[#44403C] p-3 sm:p-5 flex flex-col gap-4 bg-[#FAFAF9] dark:bg-[#1C1917] overflow-y-auto">
                      <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans">Appearance</div>
                      <div className="space-y-3">
                        <div className="text-[10px] text-[#57524F] dark:text-[#A8A29E] font-medium font-sans">Theme Color</div>
                        <div className="grid grid-cols-4 gap-2">
                          {["#37322F","#605A57","#818CF8","#EF4444","#10B981","#F59E0B","#3B82F6","#EC4899"].map(c => (
                            <div key={c} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white dark:border-[#292524] shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#57524F] dark:text-[#A8A29E] font-medium font-sans">Position</div>
                        <div className="flex gap-2">
                          <div className="flex-1 h-7 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><span className="text-[9px] text-white dark:text-[#1C1917] font-sans font-medium">Right</span></div>
                          <div className="flex-1 h-7 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center"><span className="text-[9px] text-[#57524F] dark:text-[#A8A29E] font-sans font-medium">Left</span></div>
                        </div>
                      </div>
                      <div className="space-y-2 hidden sm:block">
                        <div className="text-[10px] text-[#57524F] dark:text-[#A8A29E] font-medium font-sans">Border Radius</div>
                        <div className="w-full h-1.5 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full"><div className="w-3/4 h-full bg-[#37322F] dark:bg-[#F5F5F4] rounded-full" /></div>
                      </div>
                    </div>
                    <div className="flex-1 p-4 sm:p-6 flex flex-col items-center justify-center gap-4 bg-[#F7F5F3] dark:bg-[#1C1917]">
                      <div className="text-[10px] text-[#9CA3AF] font-sans font-medium mb-2">PREVIEW</div>
                      <div className="w-full max-w-[220px] bg-white dark:bg-[#292524] rounded-xl shadow-lg p-3 sm:p-4 space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-[#E0DEDB] dark:border-[#44403C]">
                          <div className="w-7 h-7 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><MessageCircle className="w-3.5 h-3.5 text-white dark:text-[#1C1917]" /></div>
                          <span className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans">Askio Bot</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-auto" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-end gap-2"><div className="w-5 h-5 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] shrink-0" /><div className="bg-[#F7F5F3] dark:bg-[#44403C] rounded-lg rounded-bl-none px-3 py-2"><p className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-sans">Hi there! 👋</p></div></div>
                          <div className="flex justify-end"><div className="bg-[#37322F] dark:bg-[#F5F5F4] rounded-lg rounded-br-none px-3 py-2"><p className="text-[10px] text-white dark:text-[#1C1917] font-sans">Hello!</p></div></div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#F7F5F3] dark:bg-[#44403C] rounded-lg p-2">
                          <div className="flex-1 h-6 bg-white dark:bg-[#292524] rounded px-2 flex items-center"><span className="text-[9px] text-[#9CA3AF]">Type a message...</span></div>
                          <div className="w-6 h-6 rounded bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><Send className="w-3 h-3 text-white dark:text-[#1C1917]" /></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Embed code */}
                  <div className={`absolute inset-0 transition-all duration-500 ease-in-out flex flex-col ${activeStep === 2 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"}`}>
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917]">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" /><div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" /><div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/60" />
                      <div className="ml-4 flex gap-0">
                        <div className="px-4 py-1 bg-white dark:bg-[#292524] rounded-t-md border border-[#E0DEDB] dark:border-[#44403C] border-b-white dark:border-b-[#292524] -mb-px"><span className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-mono font-medium">index.html</span></div>
                        <div className="px-4 py-1"><span className="text-caption text-[#9CA3AF] font-mono">style.css</span></div>
                      </div>
                    </div>
                    <div className="flex-1 px-3 sm:px-5 py-4 font-mono text-[10px] sm:text-[12px] leading-[20px] sm:leading-[22px] bg-white dark:bg-[#292524] space-y-0.5 overflow-x-auto">
                      <div className="flex whitespace-nowrap"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">1</span><span className="text-[#9CA3AF]">{'<!-- Add before </body> -->'}</span></div>
                      <div className="flex whitespace-nowrap"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">2</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<div '}</span><span className="text-[#57524F] dark:text-[#D6D3D1]">id</span><span className="text-[#9CA3AF]">=</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"chatbot-container"</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'>'}</span></div>
                      <div className="flex whitespace-nowrap"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">3</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</div>'}</span></div>
                      <div className="flex whitespace-nowrap"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">4</span><span className="text-[#9CA3AF]"> </span></div>
                      <div className="flex whitespace-nowrap bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 sm:-mx-5 px-3 sm:px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">5</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script '}</span><span className="text-[#57524F] dark:text-[#D6D3D1]">src</span><span className="text-[#9CA3AF]">=</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"askio.js"</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'>'}</span></div>
                      <div className="flex whitespace-nowrap bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 sm:-mx-5 px-3 sm:px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">6</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
                      <div className="flex whitespace-nowrap bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 sm:-mx-5 px-3 sm:px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">7</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script>'}</span></div>
                      <div className="flex whitespace-nowrap bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 sm:-mx-5 px-3 sm:px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">8</span><span className="text-[#9CA3AF]">  </span><span className="text-[#37322F] dark:text-[#F5F5F4] font-medium">Askio</span><span className="text-[#57524F] dark:text-[#D6D3D1]">.init(</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"your-bot-id"</span><span className="text-[#57524F] dark:text-[#D6D3D1]">)</span></div>
                      <div className="flex whitespace-nowrap bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 sm:-mx-5 px-3 sm:px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">9</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
                    </div>
                    <div className="px-3 sm:px-5 py-3 border-t border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <span className="text-caption text-[#57524F] dark:text-[#A8A29E] font-sans">Ready to embed</span>
                      </div>
                      <div className="px-4 py-1.5 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><span className="text-caption text-white dark:text-[#1C1917] font-sans font-medium">Copy Code</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <HatchStrip />
      </div>
    </section>
  );
}
