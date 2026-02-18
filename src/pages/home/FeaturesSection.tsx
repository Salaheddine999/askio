import { Paintbrush, Code, MessageCircle, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import HatchStrip from "./HatchStrip";
import Badge from "./Badge";

export default function FeaturesSection() {
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.section
      ref={featuresRef}
      initial={{ opacity: 0, y: 40 }}
      animate={featuresInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      id="features"
      className="border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]"
    >
      <div className="py-20 flex flex-col items-center text-center px-4">
        <Badge text="Features" />
        <h2 className="mt-5 text-display font-serif tracking-tight text-[#49423D] dark:text-[#F5F5F4]">
          Powerful features for your chatbots
        </h2>
        <p className="mt-3 text-[#57524F] dark:text-[#A8A29E] text-body max-w-md">
          Everything you need to create, customize, and deploy chatbots that engage your visitors.
        </p>
      </div>

      <div className="flex">
        <HatchStrip />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
          {/* Feature 1: Easy Customization */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Paintbrush className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Easy Customization</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Design every aspect from colors and fonts to conversation flows, all without coding.
            </p>
            <div className="mt-auto w-full h-[180px] rounded-[9px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex">
              <div className="w-20 border-r border-[#E0DEDB] dark:border-[#44403C] p-3 flex flex-col gap-3 bg-[#FAFAF9] dark:bg-[#1C1917]">
                <div className="w-full h-1.5 bg-[#37322F] dark:bg-[#F5F5F4] rounded-full" />
                <div className="w-10 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" />
                <div className="w-12 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" />
                <div className="w-8 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" />
                <div className="mt-auto flex gap-1.5">
                  {["#49423D","#605A57","#37322F","#E0DEDB"].map(c => (
                    <div key={c} className="w-3 h-3 rounded-full border border-[#E0DEDB] dark:border-[#44403C]" style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#37322F] dark:bg-[#F5F5F4]" />
                  <div className="flex flex-col gap-1">
                    <div className="w-16 h-1.5 bg-[#37322F] dark:bg-[#F5F5F4] rounded-full" />
                    <div className="w-10 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-7 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center">
                    <span className="text-[8px] text-white dark:text-[#1C1917] font-sans font-medium">Primary</span>
                  </div>
                  <div className="flex-1 h-7 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center">
                    <span className="text-[8px] text-[#57524F] dark:text-[#A8A29E] font-sans font-medium">Secondary</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="w-full h-1.5 bg-[#F7F5F3] dark:bg-[#1C1917] rounded-full" />
                  <div className="w-3/4 h-1.5 bg-[#F7F5F3] dark:bg-[#1C1917] rounded-full" />
                  <div className="w-5/6 h-1.5 bg-[#F7F5F3] dark:bg-[#1C1917] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Seamless Integration */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center">
                <Code className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Seamless Integration</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Add your chatbot to any website with just a few clicks using a simple embed code.
            </p>
            <div className="mt-auto w-full h-[180px] rounded-[9px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917]">
                <div className="w-2 h-2 rounded-full bg-[#E0DEDB] dark:bg-[#44403C]" />
                <div className="w-2 h-2 rounded-full bg-[#E0DEDB] dark:bg-[#44403C]" />
                <div className="w-2 h-2 rounded-full bg-[#E0DEDB] dark:bg-[#44403C]" />
                <div className="ml-3 flex gap-0">
                  <div className="px-3 py-0.5 bg-white dark:bg-[#292524] rounded-t-md border border-[#E0DEDB] dark:border-[#44403C] border-b-white dark:border-b-[#292524] -mb-px">
                    <span className="text-[9px] text-[#37322F] dark:text-[#F5F5F4] font-mono font-medium">index.html</span>
                  </div>
                  <div className="px-3 py-0.5">
                    <span className="text-[9px] text-[#9CA3AF] font-mono">style.css</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-3 font-mono text-[10px] leading-[20px] bg-white dark:bg-[#292524]">
                <div className="flex"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">1</span><span className="text-[#9CA3AF]">{'<!-- Add before </body> -->'}</span></div>
                <div className="flex"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">2</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script '}</span><span className="text-[#57524F] dark:text-[#D6D3D1]">src</span><span className="text-[#9CA3AF]">=</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"askio.js"</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'>'}</span></div>
                <div className="flex"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">3</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
                <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 px-3 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">4</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script>'}</span></div>
                <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 px-3 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">5</span><span className="text-[#9CA3AF]">  </span><span className="text-[#37322F] dark:text-[#F5F5F4] font-medium">Askio</span><span className="text-[#57524F] dark:text-[#D6D3D1]">.init(</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"your-bot-id"</span><span className="text-[#57524F] dark:text-[#D6D3D1]">)</span></div>
                <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 px-3 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">6</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
              </div>
            </div>
          </div>

          {/* Feature 3: Real-Time Engagement */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-r-0 md:border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Real-Time Engagement</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Engage visitors instantly with automated conversations tailored to your business needs.
            </p>
            <div className="mt-auto w-full h-[180px] rounded-[9px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-2 bg-[#FAFAF9] dark:bg-[#1C1917]">
                <div className="w-5 h-5 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-white dark:text-[#1C1917]" />
                </div>
                <span className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans">Askio Bot</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#49423D] dark:bg-[#A8A29E] ml-auto" />
              </div>
              <div className="flex-1 p-3 space-y-2">
                <div className="flex items-end gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] shrink-0 flex items-center justify-center"><span className="text-[6px] text-white dark:text-[#1C1917]">A</span></div>
                  <div className="bg-[#F7F5F3] dark:bg-[#44403C] rounded-lg rounded-bl-none px-2.5 py-1.5 max-w-[78%]"><p className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-sans leading-[14px]">Hi! How can I help you today?</p></div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#37322F] dark:bg-[#F5F5F4] rounded-lg rounded-br-none px-2.5 py-1.5 max-w-[78%]"><p className="text-[10px] text-white dark:text-[#1C1917] font-sans leading-[14px]">Do you have a return policy?</p></div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] shrink-0 flex items-center justify-center"><span className="text-[6px] text-white dark:text-[#1C1917]">A</span></div>
                  <div className="bg-[#F7F5F3] dark:bg-[#44403C] rounded-lg rounded-bl-none px-2.5 py-1.5 max-w-[78%]"><p className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-sans leading-[14px]">Yes! 30-day free returns on all items.</p></div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-4 h-4 shrink-0 opacity-0" />
                  <div className="bg-[#F7F5F3] dark:bg-[#44403C] rounded-lg rounded-bl-none px-2.5 py-1.5 flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#57524F] dark:bg-[#A8A29E] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 rounded-full bg-[#57524F] dark:bg-[#A8A29E] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-[#57524F] dark:bg-[#A8A29E] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Easy Configuration */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-[rgba(55,50,47,0.12)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center">
                <Settings className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
              </div>
              <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Easy Configuration</h3>
            </div>
            <p className="text-[#57524F] dark:text-[#A8A29E] text-body-sm leading-relaxed">
              Set up responses, behavior, and placement with our user-friendly interface.
            </p>
            <div className="mt-auto w-full h-[180px] rounded-[9px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-3 bg-[#FAFAF9] dark:bg-[#1C1917]">
                <span className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans border-b-2 border-[#37322F] dark:border-[#F5F5F4] pb-1">General</span>
                <span className="text-[10px] text-[#9CA3AF] font-medium font-sans pb-1">Appearance</span>
                <span className="text-[10px] text-[#9CA3AF] font-medium font-sans pb-1">Behavior</span>
              </div>
              <div className="flex-1 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Auto-reply</span><span className="text-[8px] text-[#9CA3AF] font-sans">Respond automatically</span></div>
                  <div className="w-8 h-[18px] rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-end px-0.5"><div className="w-3.5 h-3.5 rounded-full bg-white dark:bg-[#292524] shadow-sm" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Typing indicator</span><span className="text-[8px] text-[#9CA3AF] font-sans">Show animation while replying</span></div>
                  <div className="w-8 h-[18px] rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-end px-0.5"><div className="w-3.5 h-3.5 rounded-full bg-white dark:bg-[#292524] shadow-sm" /></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5"><span className="text-[10px] text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Sound alerts</span><span className="text-[8px] text-[#9CA3AF] font-sans">Play a sound on new messages</span></div>
                  <div className="w-8 h-[18px] rounded-full bg-[#E0DEDB] dark:bg-[#44403C] flex items-center justify-start px-0.5"><div className="w-3.5 h-3.5 rounded-full bg-white dark:bg-[#292524] shadow-sm" /></div>
                </div>
                <div className="flex gap-2 pt-0.5">
                  <div className="flex-1 h-6 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><span className="text-[8px] text-white dark:text-[#1C1917] font-sans font-medium">Bottom Right</span></div>
                  <div className="flex-1 h-6 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center"><span className="text-[8px] text-[#57524F] dark:text-[#A8A29E] font-sans font-medium">Bottom Left</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <HatchStrip />
      </div>
    </motion.section>
  );
}
