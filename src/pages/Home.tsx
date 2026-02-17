import React, { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  MessageCircle,
  ArrowRight,
  Menu,
  X,
  Send,
  Star,
  ChevronDown,
  Settings,
  Paintbrush,
  Code,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Reusable Badge (Brillance-style) ─── */
function Badge({ text }: { text: string }) {
  return (
    <div className="px-4 py-1.5 bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] rounded-full flex items-center gap-2 border border-[rgba(2,6,23,0.08)]">
      <div className="w-2 h-2 rounded-full bg-[#37322F]" />
      <span className="text-[#37322F] text-caption font-medium">{text}</span>
    </div>
  );
}

/* ─── Decorative Hatched Strip (Brillance-style) ─── */
function HatchStrip({ count = 500 }: { count?: number }) {
  return (
    <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden shrink-0">
      <div className="w-[162px] left-[-58px] top-[-120px] absolute flex flex-col">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="self-stretch h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]" />
        ))}
      </div>
    </div>
  );
}

export default function ChatbotLanding() {
  const [chatMessages, setChatMessages] = useState<Array<{ type: string; content: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [displayedUserInput, setDisplayedUserInput] = useState("");
  const [displayedBotInput, setDisplayedBotInput] = useState("");
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const conversation = [
    { type: "bot", content: "Hi there! I'm Askio. How can I help you today?" },
    { type: "user", content: "Hello! I'm interested in creating a chatbot for my website." },
    { type: "bot", content: "That's great! Askio makes it easy to create and customize chatbots for your website. What kind of website do you have?" },
    { type: "user", content: "I have an e-commerce site selling handmade jewelry." },
    { type: "bot", content: "Perfect! A chatbot can really enhance the customer experience for your e-commerce site. It can help answer common questions about your products, shipping, and returns. Would you like to know how to get started?" },
    { type: "user", content: "Yes, please! How do I begin?" },
    { type: "bot", content: "It's simple! Just follow these steps:\n1. Sign up for a free Askio account\n2. Create a new chatbot and customize its appearance\n3. Add your frequently asked questions and responses\n4. Get your unique embed code\n5. Add the code to your website\nAnd that's it! Your chatbot will be up and running." },
  ];

  const conversationStarted = useRef(false);
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  useEffect(() => {
    if (conversationStarted.current) return;
    conversationStarted.current = true;
    const handleConversation = async () => {
      for (const message of conversation) {
        if (message.type === "bot") {
          setIsTyping(true);
          setDisplayedBotInput("");
          for (let i = 0; i < message.content.length; i++) {
            setDisplayedBotInput((prev) => prev + message.content[i]);
            await delay(50);
          }
          setChatMessages((prev) => [...prev, { type: "bot", content: message.content }]);
          setDisplayedBotInput("");
          setIsTyping(false);
        } else if (message.type === "user") {
          setIsUserTyping(true);
          setDisplayedUserInput("");
          for (let i = 0; i < message.content.length; i++) {
            setDisplayedUserInput((prev) => prev + message.content[i]);
            await delay(50);
          }
          setChatMessages((prev) => [...prev, message]);
          setIsUserTyping(false);
        }
      }
      setIsConversationComplete(true);
    };
    handleConversation();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConversationComplete) setUserInput(e.target.value);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && isConversationComplete) {
      setIsUserTyping(true);
      setDisplayedUserInput("");
      for (let i = 0; i < userInput.length; i++) {
        setDisplayedUserInput((prev) => prev + userInput[i]);
        await delay(50);
      }
      setChatMessages((prev) => [...prev, { type: "user", content: userInput }]);
      setIsUserTyping(false);
      setUserInput("");
      setIsTyping(true);
      setDisplayedBotInput("");
      const botReply = "Thank you for your message! Is there anything else I can help you with regarding Askio's chatbot creation process?";
      for (let i = 0; i < botReply.length; i++) {
        setDisplayedBotInput((prev) => prev + botReply[i]);
        await delay(50);
      }
      setChatMessages((prev) => [...prev, { type: "bot", content: botReply }]);
      setDisplayedBotInput("");
      setIsTyping(false);
    }
  };

  useEffect(() => {
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot-container";
    document.body.appendChild(chatbotContainer);
    const script = document.createElement("script");
    script.src = "https://askio.vercel.app/chatbot-embed.js";
    script.async = true;
    script.onload = () => {
      const initScript = document.createElement("script");
      initScript.text = `ChatbotEmbed.init("eh0qWjVhkPeBwzGxYLv6", "https://askio.vercel.app");`;
      document.body.appendChild(initScript);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(chatbotContainer);
      document.body.removeChild(script);
      const initScript = document.querySelector('script[text*="ChatbotEmbed.init"]');
      if (initScript) document.body.removeChild(initScript);
    };
  }, []);

  const testimonials = [
    { name: "Sarah L.", role: "Boutique Owner", quote: "I was honestly not sure if a chatbot would work for my small shop. But Askio surprised me. It took maybe ten minutes to set up and now it answers customer questions about shipping and returns all day long, even when I'm not around." },
    { name: "Mark L.", role: "E-commerce Entrepreneur", quote: "I run three different online stores so managing support was getting out of hand. Askio let me spin up a custom chatbot for each one in the same afternoon. Cart abandonment dropped 15% in the first month. Can't believe it's free." },
    { name: "Pat M.", role: "Freelance Designer", quote: "What sold me was the customization. I matched the chatbot to my portfolio's look and feel so it doesn't feel out of place at all. Clients get instant answers to common questions and I spend less time on repetitive emails. Win win." },
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const toggleFAQ = (index: number) => setActiveIndex(activeIndex === index ? null : index);

  // Testimonial carousel state (Brillance-style)
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 300);
    }, 12000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handleTestimonialNav = (index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTestimonial(index);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 300);
  };

  // How it Works step carousel state (Platform Features pattern)
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
        return prev + 2; // 2% every 100ms = 5 seconds total
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

  const useInViewSection = (threshold = 0.1) => useInView({ triggerOnce: true, threshold });
  const [featuresRef, featuresInView] = useInViewSection();
  const [howItWorksRef, howItWorksInView] = useInViewSection();
  const [testimonialsRef, testimonialsInView] = useInViewSection();
  const [faqRef, faqInView] = useInViewSection();
  const [ctaRef, ctaInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sectionBorder = "border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]";

  return (
    <div className="w-full min-h-screen bg-[#F7F5F3] dark:bg-[#1C1917] font-sans text-[#37322F] overflow-x-hidden">
      <Helmet>
        <title>Askio - Your Chatbot Builder</title>
        <meta name="description" content="Create custom chatbots tailored to your brand. Effortlessly integrate them into your website." />
      </Helmet>

      {/* ═══ VERTICAL LINES CONTAINER ═══ */}
      <div className="relative mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
        <div className="hidden lg:block w-[1px] h-full absolute left-0 top-0 bg-[rgba(55,50,47,0.12)] dark:bg-[#44403C]" />
        <div className="hidden lg:block w-[1px] h-full absolute right-0 top-0 bg-[rgba(55,50,47,0.12)] dark:bg-[#44403C]" />

        {/* ═══ NAVIGATION ═══ */}
        <header className="relative z-50 flex justify-center pt-3 pb-4">
          <div className="absolute left-0 right-0 top-[42px] h-0 border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C] hidden lg:block" />
          <nav className="relative z-30 w-full max-w-[700px] h-11 px-4 pr-2 bg-[#F7F5F3]/90 dark:bg-[#1C1917]/90 backdrop-blur-sm shadow-[0px_0px_0px_2px_white] dark:shadow-[0px_0px_0px_2px_#292524] rounded-full flex justify-between items-center border border-transparent dark:border-[#44403C]">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-1.5">
                <img src="./icon.svg" alt="Askio" className="w-6 h-6" />
                <span className="text-[#2F3037] dark:text-[#F5F5F4] text-body-lg font-medium">Askio</span>
              </Link>
              <div className="hidden sm:flex pl-5 gap-4">
                {["Features", "How it Works", "Testimonials", "FAQ"].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-[rgba(49,45,43,0.80)] dark:text-[#A8A29E] text-body-sm font-medium hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/auth" className="px-3.5 py-1.5 bg-white dark:bg-[#292524] shadow-[0px_1px_2px_rgba(55,50,47,0.12)] dark:shadow-none rounded-full text-[#37322F] dark:text-[#F5F5F4] text-button font-medium hover:shadow-md transition-shadow border border-transparent dark:border-[#44403C]">
                Log in
              </Link>
              <button className="sm:hidden text-[#37322F] dark:text-[#F5F5F4]" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </nav>
        </header>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="sm:hidden absolute top-16 left-4 right-4 bg-white dark:bg-[#292524] rounded-2xl shadow-xl z-50 p-4 border border-[#E0DEDB] dark:border-[#44403C]">
              <nav className="flex flex-col gap-3">
                {["Features", "How it Works", "Testimonials", "FAQ"].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-[#37322F] dark:text-[#F5F5F4] font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>{item}</a>
                ))}
                <Link to="/auth" className="bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] text-center py-2.5 rounded-full font-medium" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ HERO SECTION ═══ */}
        <section className={`pt-16 sm:pt-20 lg:pt-32 pb-12 lg:pb-20 flex flex-col items-center text-center ${sectionBorder}`}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-[750px] px-4">
            <h1 className="text-hero font-serif text-[#37322F] dark:text-[#F5F5F4] mb-6">
              Custom Chatbots,{" "}
              <br className="hidden sm:block" />
              Limitless Possibilities
            </h1>
            <p className="text-[rgba(55,50,47,0.80)] dark:text-[#A8A29E] text-body-lg font-medium max-w-[510px] mx-auto mb-8">
              Create custom chatbots tailored to your brand. Effortlessly integrate them into your website and engage visitors with smarter interactions.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Link to="/auth" className="h-11 px-10 bg-[#37322F] dark:bg-[#F5F5F4] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] rounded-full flex items-center text-white dark:text-[#1C1917] text-button font-medium hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] transition-colors">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="https://github.com/Salaheddine999/askio" className="flex items-center gap-2 text-[rgba(49,45,43,0.80)] dark:text-[#A8A29E] text-body-sm font-medium hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group">
              <FaGithub className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              Star on Github
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="flex items-baseline gap-2">
              <span className="text-h2 font-serif text-[#37322F] dark:text-[#F5F5F4]">1.2K+</span>
              <span className="text-body-sm text-[#605A57] dark:text-[#A8A29E]">Chatbots Created</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              <span className="text-body-sm text-[#605A57] dark:text-[#A8A29E] ml-1">500+ users</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-h2 font-serif text-[#37322F] dark:text-[#F5F5F4]">4.8/5</span>
              <span className="text-body-sm text-[#605A57] dark:text-[#A8A29E]">Rating</span>
            </div>
          </motion.div>

          {/* Chatbot Demo */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="w-full max-w-[500px] px-4">
            <div className="bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)] rounded-[9px] overflow-hidden">
              <div className="p-5">
                <div className="space-y-3 h-72 overflow-y-auto mb-4 pr-2" ref={chatContainerRef}>
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex items-start ${message.type === "user" ? "justify-end" : ""}`}>
                      {message.type === "bot" && (
                        <div className="w-7 h-7 bg-[#37322F] dark:bg-[#F5F5F4] rounded-full flex items-center justify-center mr-2 shrink-0">
                          <img src="./logo-transparent.svg" alt="Askio" className="w-8 h-8" />
                        </div>
                      )}
                      <div className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${message.type === "user" ? "bg-[#37322F] text-white dark:bg-[#F5F5F4] dark:text-[#1C1917]" : "bg-[#F7F5F3] text-[#37322F] dark:bg-[#44403C] dark:text-[#F5F5F4]"}`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-start">
                      <div className="w-7 h-7 bg-[#37322F] dark:bg-[#F5F5F4] rounded-full flex items-center justify-center mr-2 shrink-0">
                        <img src="./logo-transparent.svg" alt="Askio" className="w-8 h-8" />
                      </div>
                      <div className="rounded-lg px-3 py-2 text-sm bg-[#F7F5F3] text-[#37322F] dark:bg-[#44403C] dark:text-[#F5F5F4] max-w-[80%]">{displayedBotInput}</div>
                    </div>
                  )}
                  {isUserTyping && (
                    <div className="flex items-start justify-end">
                      <div className="rounded-lg px-3 py-2 text-sm bg-[#37322F] text-white dark:bg-[#F5F5F4] dark:text-[#1C1917] max-w-[80%]">{displayedUserInput}</div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChatSubmit} className="flex items-center gap-2 bg-[#F7F5F3] dark:bg-[#44403C] p-3 rounded-lg">
                  <input type="text" value={userInput} onChange={handleInputChange} placeholder="Type your message..." className="flex-grow border-0 bg-white dark:bg-[#292524] dark:text-[#F5F5F4] rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#37322F] dark:focus:ring-[#F5F5F4] focus:outline-none" disabled={!isConversationComplete} />
                  <button type="submit" className="bg-[#37322F] dark:bg-[#F5F5F4] text-white dark:text-[#1C1917] rounded-md p-2.5 hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] transition-colors" disabled={!isConversationComplete}>
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══ FEATURES SECTION ═══ */}
        <motion.section ref={featuresRef} initial={{ opacity: 0, y: 40 }} animate={featuresInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} id="features" className={sectionBorder}>
          <div className="py-16 flex flex-col items-center text-center px-4">
            <Badge text="Features" />
            <h2 className="mt-5 text-display font-serif tracking-tight text-[#49423D] dark:text-[#F5F5F4]">Powerful features for your chatbots</h2>
            <p className="mt-3 text-[#605A57] dark:text-[#A8A29E] text-body max-w-md">Everything you need to create, customize, and deploy chatbots that engage your visitors.</p>
          </div>

          <div className="flex">
            <HatchStrip />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
              {/* Feature 1: Easy Customization */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center"><Paintbrush className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" /></div>
                  <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Easy Customization</h3>
                </div>
                <p className="text-[#605A57] dark:text-[#A8A29E] text-body-sm leading-relaxed">Design every aspect from colors and fonts to conversation flows, all without coding.</p>
                <div className="mt-auto w-full h-[180px] rounded-[9px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex">
                  <div className="w-20 border-r border-[#E0DEDB] dark:border-[#44403C] p-3 flex flex-col gap-3 bg-[#FAFAF9] dark:bg-[#1C1917]">
                    <div className="w-full h-1.5 bg-[#37322F] dark:bg-[#F5F5F4] rounded-full" />
                    <div className="w-10 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" />
                    <div className="w-12 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" />
                    <div className="w-8 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" />
                    <div className="mt-auto flex gap-1.5">{["#49423D","#605A57","#37322F","#E0DEDB"].map(c=><div key={c} className="w-3 h-3 rounded-full border border-[#E0DEDB] dark:border-[#44403C]" style={{background:c}} />)}</div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#37322F] dark:bg-[#F5F5F4]" />
                      <div className="flex flex-col gap-1"><div className="w-16 h-1.5 bg-[#37322F] dark:bg-[#F5F5F4] rounded-full" /><div className="w-10 h-1 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full" /></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 h-7 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><span className="text-[8px] text-white dark:text-[#1C1917] font-sans font-medium">Primary</span></div>
                      <div className="flex-1 h-7 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center"><span className="text-[8px] text-[#605A57] dark:text-[#A8A29E] font-sans font-medium">Secondary</span></div>
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
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center"><Code className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" /></div>
                  <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Seamless Integration</h3>
                </div>
                <p className="text-[#605A57] dark:text-[#A8A29E] text-body-sm leading-relaxed">Add your chatbot to any website with just a few clicks using a simple embed code.</p>
                <div className="mt-auto w-full h-[180px] rounded-[9px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917]">
                    <div className="w-2 h-2 rounded-full bg-[#E0DEDB] dark:bg-[#44403C]" /><div className="w-2 h-2 rounded-full bg-[#E0DEDB] dark:bg-[#44403C]" /><div className="w-2 h-2 rounded-full bg-[#E0DEDB] dark:bg-[#44403C]" />
                    <div className="ml-3 flex gap-0">
                      <div className="px-3 py-0.5 bg-white dark:bg-[#292524] rounded-t-md border border-[#E0DEDB] dark:border-[#44403C] border-b-white dark:border-b-[#292524] -mb-px"><span className="text-[9px] text-[#37322F] dark:text-[#F5F5F4] font-mono font-medium">index.html</span></div>
                      <div className="px-3 py-0.5"><span className="text-[9px] text-[#9CA3AF] font-mono">style.css</span></div>
                    </div>
                  </div>
                  <div className="flex-1 p-3 font-mono text-[10px] leading-[20px] bg-white dark:bg-[#292524]">
                    <div className="flex"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">1</span><span className="text-[#9CA3AF]">{'<!-- Add before </body> -->'}</span></div>
                    <div className="flex"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">2</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script '}</span><span className="text-[#605A57] dark:text-[#D6D3D1]">src</span><span className="text-[#9CA3AF]">=</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"askio.js"</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'>'}</span></div>
                    <div className="flex"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">3</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
                    <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 px-3 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">4</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script>'}</span></div>
                    <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 px-3 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">5</span><span className="text-[#9CA3AF]">  </span><span className="text-[#37322F] dark:text-[#F5F5F4] font-medium">Askio</span><span className="text-[#605A57] dark:text-[#D6D3D1]">.init(</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"your-bot-id"</span><span className="text-[#605A57] dark:text-[#D6D3D1]">)</span></div>
                    <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-3 px-3 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-4 text-right mr-3 text-[#E0DEDB] dark:text-[#44403C]">6</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
                  </div>
                </div>
              </div>

              {/* Feature 3: Real-Time Engagement */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-r-0 md:border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center"><MessageCircle className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" /></div>
                  <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Real-Time Engagement</h3>
                </div>
                <p className="text-[#605A57] dark:text-[#A8A29E] text-body-sm leading-relaxed">Engage visitors instantly with automated conversations tailored to your business needs.</p>
                <div className="mt-auto w-full h-[180px] rounded-[9px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08),0px_2px_4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-2 bg-[#FAFAF9] dark:bg-[#1C1917]">
                    <div className="w-5 h-5 rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><MessageCircle className="w-3 h-3 text-white dark:text-[#1C1917]" /></div>
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
                        <div className="w-1 h-1 rounded-full bg-[#605A57] dark:bg-[#A8A29E] animate-bounce" style={{animationDelay:'0ms'}} />
                        <div className="w-1 h-1 rounded-full bg-[#605A57] dark:bg-[#A8A29E] animate-bounce" style={{animationDelay:'150ms'}} />
                        <div className="w-1 h-1 rounded-full bg-[#605A57] dark:bg-[#A8A29E] animate-bounce" style={{animationDelay:'300ms'}} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4: Easy Configuration */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col gap-4 border-[rgba(55,50,47,0.12)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(55,50,47,0.06)] dark:bg-[#44403C] flex items-center justify-center"><Settings className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" /></div>
                  <h3 className="text-[#37322F] dark:text-[#F5F5F4] text-h3 font-sans">Easy Configuration</h3>
                </div>
                <p className="text-[#605A57] dark:text-[#A8A29E] text-body-sm leading-relaxed">Set up responses, behavior, and placement with our user-friendly interface.</p>
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
                      <div className="flex-1 h-6 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center"><span className="text-[8px] text-[#605A57] dark:text-[#A8A29E] font-sans font-medium">Bottom Left</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <HatchStrip />
          </div>
        </motion.section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className={sectionBorder}>
          <div className="py-16 lg:py-20 flex flex-col items-center text-center px-4">
            <Badge text="How it Works" />
            <motion.div ref={howItWorksRef} initial={{ opacity: 0, y: 30 }} animate={howItWorksInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
              <h2 className="mt-5 text-display font-serif tracking-tight text-[#49423D] dark:text-[#F5F5F4]">Three simple steps to go live</h2>
              <p className="mt-3 text-[#605A57] dark:text-[#A8A29E] text-body max-w-md mx-auto">Create and deploy your custom chatbot in minutes — no coding required.</p>
            </motion.div>
          </div>

          {/* Content: Left cards + Right preview (Platform Features pattern) */}
          <div className="flex border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
            <HatchStrip />
          <div className="flex-1 px-4 sm:px-6 md:px-9 overflow-hidden flex justify-start items-center border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
            <div className="flex-1 py-8 md:py-11 flex flex-col md:flex-row justify-start items-center gap-6 md:gap-12">
              {/* Left Column - Step Cards */}
              <div className="w-full md:w-auto md:max-w-[400px] flex flex-col justify-center items-center gap-4 order-2 md:order-1">
                {[
                  { title: "Create & Configure", desc: "Set up your chatbot by adding custom Q&As, defining conversation flows, and configuring automatic responses." },
                  { title: "Customize Design", desc: "Tailor your bot's appearance to match your brand — colors, fonts, positioning, and layout options." },
                  { title: "Plug & Play", desc: "Copy your unique embed code and paste it into your website. Your chatbot goes live instantly." },
                ].map((step, index) => {
                  const isActive = index === activeStep;
                  return (
                    <div
                      key={index}
                      onClick={() => handleStepClick(index)}
                      className={`w-full overflow-hidden flex flex-col justify-start items-start transition-all duration-300 cursor-pointer ${
                        isActive
                          ? "bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.75px_#E0DEDB_inset] dark:shadow-[0px_0px_0px_0.75px_#44403C_inset]"
                          : "border border-[rgba(2,6,23,0.08)] dark:border-[#44403C]"
                      }`}
                    >
                      {/* Progress bar */}
                      <div className={`w-full h-0.5 bg-[rgba(50,45,43,0.08)] dark:bg-[rgba(255,255,255,0.08)] overflow-hidden ${isActive ? "opacity-100" : "opacity-0"}`}>
                        <div
                          className="h-0.5 bg-[#322D2B] dark:bg-[#F5F5F4] transition-all duration-100 ease-linear"
                          style={{ width: `${isActive ? stepProgress : 0}%` }}
                        />
                      </div>
                      <div className="px-6 py-5 w-full flex flex-col gap-2">
                        <div className="self-stretch flex justify-center flex-col text-[#49423D] dark:text-[#F5F5F4] text-body-sm font-semibold leading-6 font-sans">
                          {step.title}
                        </div>
                        <div className="self-stretch text-[#605A57] dark:text-[#A8A29E] text-body-sm font-normal leading-[22px] font-sans">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column - Preview Panel */}
              <div className="w-full md:w-auto rounded-lg flex flex-col justify-center items-center gap-2 order-1 md:order-2">
                <div className="w-full md:w-[580px] h-[300px] md:h-[420px] bg-white dark:bg-[#292524] shadow-[0px_0px_0px_0.9px_rgba(0,0,0,0.08)] dark:shadow-[0px_0px_0px_0.9px_rgba(255,255,255,0.08)] overflow-hidden rounded-[9px] flex flex-col justify-start items-start">
                  <div className="w-full h-full relative overflow-hidden">
                    {/* Step 1: Configuration panel */}
                    <div className={`absolute inset-0 transition-all duration-500 ease-in-out flex flex-col ${activeStep === 0 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"}`}>
                      <div className="px-4 py-2.5 border-b border-[#E0DEDB] dark:border-[#44403C] flex items-center gap-3 bg-[#FAFAF9] dark:bg-[#1C1917]">
                        <span className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans border-b-2 border-[#37322F] dark:border-[#F5F5F4] pb-1">General</span>
                        <span className="text-caption text-[#9CA3AF] font-medium font-sans pb-1">FAQ</span>
                        <span className="text-caption text-[#9CA3AF] font-medium font-sans pb-1">Embed</span>
                      </div>
                      <div className="flex-1 p-6 space-y-5">
                        <div className="space-y-2">
                          <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Chatbot Name</div>
                          <div className="h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center px-3"><span className="text-caption text-[#605A57] dark:text-[#A8A29E] font-sans">My Support Bot</span></div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Welcome Message</div>
                          <div className="h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center px-3"><span className="text-caption text-[#605A57] dark:text-[#A8A29E] font-sans">Hi! How can I help you today?</span></div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Placeholder Text</div>
                          <div className="h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center px-3"><span className="text-caption text-[#605A57] dark:text-[#A8A29E] font-sans">Type your message...</span></div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col gap-0.5"><span className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-medium font-sans">Auto-reply</span><span className="text-[10px] text-[#9CA3AF] font-sans">Respond automatically to visitors</span></div>
                          <div className="w-9 h-[20px] rounded-full bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-end px-0.5"><div className="w-4 h-4 rounded-full bg-white dark:bg-[#292524] shadow-sm" /></div>
                        </div>
                        <div className="flex gap-3 pt-2">
                          <div className="flex-1 h-9 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><span className="text-caption text-white dark:text-[#1C1917] font-sans font-medium">Save Changes</span></div>
                          <div className="flex-1 h-9 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center"><span className="text-caption text-[#605A57] dark:text-[#A8A29E] font-sans font-medium">Preview</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Design customizer */}
                    <div className={`absolute inset-0 transition-all duration-500 ease-in-out flex ${activeStep === 1 ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"}`}>
                      <div className="w-1/3 border-r border-[#E0DEDB] dark:border-[#44403C] p-5 flex flex-col gap-4 bg-[#FAFAF9] dark:bg-[#1C1917]">
                        <div className="text-caption text-[#37322F] dark:text-[#F5F5F4] font-semibold font-sans">Appearance</div>
                        <div className="space-y-3">
                          <div className="text-[10px] text-[#605A57] dark:text-[#A8A29E] font-medium font-sans">Theme Color</div>
                          <div className="grid grid-cols-4 gap-2">
                            {["#37322F","#605A57","#818CF8","#EF4444","#10B981","#F59E0B","#3B82F6","#EC4899"].map(c=><div key={c} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#292524] shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{background:c}} />)}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] text-[#605A57] dark:text-[#A8A29E] font-medium font-sans">Position</div>
                          <div className="flex gap-2">
                            <div className="flex-1 h-7 rounded-md bg-[#37322F] dark:bg-[#F5F5F4] flex items-center justify-center"><span className="text-[9px] text-white dark:text-[#1C1917] font-sans font-medium">Right</span></div>
                            <div className="flex-1 h-7 rounded-md border border-[#E0DEDB] dark:border-[#44403C] flex items-center justify-center"><span className="text-[9px] text-[#605A57] dark:text-[#A8A29E] font-sans font-medium">Left</span></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] text-[#605A57] dark:text-[#A8A29E] font-medium font-sans">Border Radius</div>
                          <div className="w-full h-1.5 bg-[#E0DEDB] dark:bg-[#44403C] rounded-full"><div className="w-3/4 h-full bg-[#37322F] dark:bg-[#F5F5F4] rounded-full" /></div>
                        </div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4 bg-[#F7F5F3] dark:bg-[#1C1917]">
                        <div className="text-[10px] text-[#9CA3AF] font-sans font-medium mb-2">PREVIEW</div>
                        <div className="w-full max-w-[220px] bg-white dark:bg-[#292524] rounded-xl shadow-lg p-4 space-y-3">
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
                      <div className="flex-1 px-5 py-4 font-mono text-[12px] leading-[22px] bg-white dark:bg-[#292524] space-y-0.5">
                        <div className="flex"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">1</span><span className="text-[#9CA3AF]">{'<!-- Add before </body> -->'}</span></div>
                        <div className="flex"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">2</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<div '}</span><span className="text-[#605A57] dark:text-[#D6D3D1]">id</span><span className="text-[#9CA3AF]">=</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"chatbot-container"</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'>'}</span></div>
                        <div className="flex"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">3</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</div>'}</span></div>
                        <div className="flex"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">4</span><span className="text-[#9CA3AF]"> </span></div>
                        <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-5 px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">5</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script '}</span><span className="text-[#605A57] dark:text-[#D6D3D1]">src</span><span className="text-[#9CA3AF]">=</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"askio.js"</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'>'}</span></div>
                        <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-5 px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">6</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
                        <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-5 px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">7</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'<script>'}</span></div>
                        <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-5 px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">8</span><span className="text-[#9CA3AF]">  </span><span className="text-[#37322F] dark:text-[#F5F5F4] font-medium">Askio</span><span className="text-[#605A57] dark:text-[#D6D3D1]">.init(</span><span className="text-[#37322F] dark:text-[#F5F5F4]">"your-bot-id"</span><span className="text-[#605A57] dark:text-[#D6D3D1]">)</span></div>
                        <div className="flex bg-[rgba(55,50,47,0.04)] dark:bg-[#44403C]/30 -mx-5 px-5 border-l-2 border-l-[#37322F] dark:border-l-[#F5F5F4]"><span className="w-5 text-right mr-4 text-[#E0DEDB] dark:text-[#44403C] select-none">9</span><span className="text-[#49423D] dark:text-[#A8A29E]">{'</script>'}</span></div>
                      </div>
                      <div className="px-5 py-3 border-t border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                          <span className="text-caption text-[#605A57] dark:text-[#A8A29E] font-sans">Ready to embed</span>
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

        {/* ═══ TESTIMONIALS (Brillance-style carousel) ═══ */}
        <motion.section ref={testimonialsRef} initial={{ opacity: 0, y: 40 }} animate={testimonialsInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} id="testimonials" className={`${sectionBorder} bg-white dark:bg-[#292524]`}>
          <div className="py-16 md:py-20 flex flex-col md:flex-row justify-center items-end gap-6 px-4 sm:px-6 md:px-12">

            {/* Quote + Name */}
            <div className="flex-1 flex flex-col gap-6">
              <div
                className="text-[#49423D] dark:text-[#F5F5F4] text-h2 md:text-[32px] font-medium leading-10 md:leading-[42px] font-sans tracking-tight min-h-[120px] md:min-h-[160px] transition-all duration-700 ease-in-out"
                style={{ filter: isTransitioning ? "blur(4px)" : "blur(0px)" }}
              >
                "{testimonials[activeTestimonial].quote}"
              </div>
              <div
                className="flex flex-col gap-1 transition-all duration-700 ease-in-out"
                style={{ filter: isTransitioning ? "blur(4px)" : "blur(0px)" }}
              >
                <div className="text-[rgba(73,66,61,0.90)] dark:text-[#D6D3D1] text-lg font-medium font-sans">
                  {testimonials[activeTestimonial].name}
                </div>
                <div className="text-[rgba(73,66,61,0.70)] dark:text-[#A8A29E] text-lg font-medium font-sans">
                  {testimonials[activeTestimonial].role}
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => handleTestimonialNav((activeTestimonial - 1 + testimonials.length) % testimonials.length)}
                className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] rounded-full border border-[rgba(0,0,0,0.15)] dark:border-[#57534E] flex items-center justify-center hover:bg-[rgba(55,50,47,0.04)] dark:hover:bg-[#44403C] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-[#46413E] dark:text-[#F5F5F4]" />
              </button>
              <button
                onClick={() => handleTestimonialNav((activeTestimonial + 1) % testimonials.length)}
                className="w-9 h-9 shadow-[0px_1px_2px_rgba(0,0,0,0.08)] rounded-full border border-[rgba(0,0,0,0.15)] dark:border-[#57534E] flex items-center justify-center hover:bg-[rgba(55,50,47,0.04)] dark:hover:bg-[#44403C] transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-[#46413E] dark:text-[#F5F5F4]" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* ═══ FAQ SECTION ═══ */}
        <motion.section ref={faqRef} initial={{ opacity: 0, y: 40 }} animate={faqInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} id="faq" className={sectionBorder}>
            <div className="flex-1">
              <div className="px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">

                {/* Left Column — Header */}
                <div className="w-full lg:w-[340px] shrink-0 flex flex-col justify-center items-start gap-4 lg:py-5">
                  <Badge text="FAQ" />
                  <div className="w-full flex flex-col justify-center text-[#49423D] dark:text-[#F5F5F4] font-semibold leading-tight md:leading-[44px] text-h2 sm:text-3xl lg:text-4xl tracking-tight">
                    Frequently Asked Questions
                  </div>
                  <div className="w-full text-[#605A57] dark:text-[#A8A29E] text-body font-normal leading-7 font-sans">
                    Everything you need to know about Askio.
                    <br className="hidden md:block" />
                    Can't find an answer? Reach out to us.
                  </div>
                </div>

                {/* Right Column — FAQ Items */}
                <div className="w-full flex-1 flex flex-col">
                  {[
                    { q: "What is Askio?", a: "Askio is a versatile, easy-to-use chatbot that can be added to any website to improve user engagement and provide instant responses to visitor queries." },
                    { q: "Is Askio really free to use?", a: "Yes, Askio is completely free to use. We believe in making technology accessible to everyone, so you can enjoy all of Askio's features without any cost." },
                    { q: "Do I have control over where the chatbot appears?", a: "Absolutely. You can choose where you want the chatbot to appear on your website, giving you full control over its placement and visibility." },
                    { q: "Do I need coding skills?", a: "No coding skills are required. The chatbot is designed to be easy to implement with a simple embed code, making it accessible for users of all technical levels." },
                    { q: "Can I create multiple chatbots?", a: "Yes, you can create multiple chatbots, allowing you to have different chatbots for your various websites or web pages, each tailored to specific needs." },
                  ].map((faq, index) => (
                    <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] dark:border-[#44403C] overflow-hidden">
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-200"
                        aria-expanded={activeIndex === index}
                      >
                        <div className="flex-1 text-[#49423D] dark:text-[#F5F5F4] text-body font-medium leading-6 font-sans">{faq.q}</div>
                        <motion.div animate={{ rotate: activeIndex === index ? 180 : 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="flex justify-center items-center">
                          <ChevronDown className="w-5 h-5 text-[rgba(73,66,61,0.60)] dark:text-[#78716C]" />
                        </motion.div>
                      </button>
                      <AnimatePresence initial={false}>
                        {activeIndex === index && (
                          <motion.div key={`a-${index}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }}>
                            <div className="px-5 pb-[18px] text-[#605A57] dark:text-[#A8A29E] text-body-sm font-normal leading-6 font-sans">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                </div>

              </div>
        </motion.section>

        {/* ═══ CTA SECTION ═══ */}
        <motion.section ref={ctaRef} initial={{ opacity: 0, y: 40 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className={sectionBorder}>
          <div className="flex">
            <HatchStrip />
          <div className="flex-1 py-20 sm:py-28 flex flex-col items-center text-center px-4 border-l border-r border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
            <h2 className="text-display font-serif text-[#37322F] dark:text-[#F5F5F4] mb-6">
              Ready to transform<br className="hidden sm:block" /> your website?
            </h2>
            <p className="text-[#605A57] dark:text-[#A8A29E] text-body-lg max-w-md mb-10 leading-relaxed">
              Join thousands of websites using Askio to provide instant support and enhance user experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/auth" className="h-12 px-12 bg-[#37322F] dark:bg-[#F5F5F4] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] rounded-full flex items-center text-white dark:text-[#1C1917] text-[15px] font-medium hover:bg-[#2a2522] dark:hover:bg-[#E7E5E4] transition-colors">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2 text-[#605A57] text-sm">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-[#E0DEDB] dark:bg-[#44403C] border-2 border-[#F7F5F3] dark:border-[#1C1917] flex items-center justify-center text-[#605A57] dark:text-[#A8A29E] text-xs font-medium">✓</div>
                  ))}
                </div>
                <span><strong className="text-[#37322F] dark:text-[#F5F5F4]">500+</strong> users already started</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              {["No Credit Card", "Easy Setup", "Full Customization"].map((t) => (
                <span key={t} className="px-4 py-1.5 bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] rounded-full text-xs font-medium text-[#605A57] dark:text-[#A8A29E]">{t}</span>
              ))}
            </div>
          </div>
            <HatchStrip />
          </div>
        </motion.section>

      {/* ═══ FOOTER (Brillance-style light) ═══ */}
      <footer className="w-full pt-10 border-t border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
        <div className="mx-auto max-w-[1060px] px-4 sm:px-6 lg:px-0">
          <div className="flex flex-col md:flex-row justify-between items-stretch pb-8 gap-8">
            {/* Brand */}
            <div className="p-4 md:p-8 flex flex-col gap-6">
              <Link to="/" className="flex items-center gap-2">
                <img src="./icon.svg" alt="Askio" className="w-7 h-7" />
                <span className="text-[#49423D] dark:text-[#F5F5F4] text-xl font-semibold font-sans">Askio</span>
              </Link>
              <p className="text-[rgba(73,66,61,0.90)] dark:text-[#A8A29E] text-sm font-medium leading-[18px] font-sans">Your chatbot, your way.</p>
              <div className="flex gap-4">
                <a href="https://github.com/Salaheddine999/askio" className="w-6 h-6 flex items-center justify-center" aria-label="GitHub">
                  <FaGithub className="w-4 h-4 text-[#49423D] dark:text-[#F5F5F4]" />
                </a>
              </div>
            </div>

            {/* Link Columns */}
            <div className="p-4 md:p-8 flex flex-col sm:flex-row flex-wrap gap-6 md:gap-12">
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[rgba(73,66,61,0.50)] dark:text-[#78716C] text-sm font-medium font-sans">Product</span>
                {["Features", "How it Works", "Testimonials", "FAQ"].map((item) => (
                  <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors">{item}</a>
                ))}
              </div>
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[rgba(73,66,61,0.50)] dark:text-[#78716C] text-sm font-medium font-sans">Resources</span>
                {["Documentation", "API Reference", "Support", "Community"].map((item) => (
                  <a key={item} href="#" className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors">{item}</a>
                ))}
              </div>
              <div className="flex flex-col gap-3 min-w-[120px]">
                <span className="text-[rgba(73,66,61,0.50)] dark:text-[#78716C] text-sm font-medium font-sans">Legal</span>
                {["Terms of Use", "Privacy Policy", "Cookie Policy"].map((item) => (
                  <a key={item} href="#" className="text-[#49423D] dark:text-[#D6D3D1] text-sm font-normal font-sans hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors">{item}</a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hatched bottom bar (Brillance-style) */}
        <div className="h-12 relative overflow-hidden border-t border-b border-[rgba(55,50,47,0.12)] dark:border-[#44403C]">
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 200 }).map((_, i) => (
              <div key={i} className="absolute w-[300px] h-16 border border-[rgba(3,7,18,0.08)] dark:border-[#44403C]/20" style={{ left: `${i * 300 - 600}px`, top: "-120px", transform: "rotate(-45deg)", transformOrigin: "top left" }} />
            ))}
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
