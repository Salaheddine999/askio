import React, { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  MessageCircle,
  ArrowRight,
  Brush,
  Menu,
  X,
  Send,
  Star,
  Twitter,
  Facebook,
  Linkedin,
  Settings,
  Paintbrush as PaintbrushIcon,
  Code as CodeIcon,
  Palette,
  Blocks,
  Sparkles,
  Rocket,
  Sliders,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { Helmet } from "react-helmet-async";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// Stack Card Component with scroll animations
function StackCard({ item, index }: { item: any; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start start"]
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.6, 1]);

  return (
    <motion.div
      ref={cardRef}
      style={{
        position: "sticky",
        top: `${80 + index * 40}px`,
        zIndex: index + 1,
        scale,
        opacity,
      }}
      className="mb-8"
    >
      <div
        className={`relative bg-gradient-to-br ${item.color} rounded-3xl overflow-hidden shadow-2xl group border-2 border-gray-100 hover:border-indigo-200`}
        style={{
          transformOrigin: "top center",
        }}
      >
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-300/60 to-transparent"></div>

        {/* Card Content */}
        <div className="relative z-10 p-10 md:p-14">
          {/* Header with step badge */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-300 text-white text-2xl font-bold rounded-2xl shadow-xl">
                  {item.step}
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-400 rounded-full shadow-lg"></div>
              </div>
              <div>
                <div className="text-indigo-500 text-sm font-medium uppercase tracking-wider mb-1">
                  Step {item.step}
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-gray-800">
                  {item.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-[1fr,auto] gap-8 items-center">
            {/* Description */}
            <div className="space-y-6">
              <p className="text-gray-700 text-xl leading-relaxed">
                {item.description}
              </p>
              
              {/* Feature tags */}
              {item.features && (
                <div className="flex flex-wrap gap-3">
                  {item.features.map((feature: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-white/80 backdrop-blur-sm text-indigo-500 text-sm font-medium rounded-full border border-indigo-200 hover:bg-white hover:border-indigo-300 transition-colors shadow-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Icon Container */}
            <div className="shrink-0 flex justify-center md:justify-end">
              <div className="relative">
                <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center bg-white backdrop-blur-md rounded-3xl shadow-2xl border-2 border-indigo-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  {item.icon}
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-indigo-300/30 rounded-3xl blur-xl scale-90 opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl translate-y-36 -translate-x-36"></div>
        
        {/* Large Step Number Background */}
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-10 text-[140px] md:text-[200px] font-black text-indigo-200/20 leading-none select-none pointer-events-none">
          {item.step}
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
          <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-indigo-200/20 to-transparent skew-x-12"></div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatbotLanding() {
  const [chatMessages, setChatMessages] = useState<
    Array<{ type: string; content: string }>
  >([]);
  const [userInput, setUserInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [displayedUserInput, setDisplayedUserInput] = useState("");
  const [displayedBotInput, setDisplayedBotInput] = useState("");

  // **Add:** Define chatContainerRef
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const conversation = [
    {
      type: "bot",
      content: "Hi there! I'm Askio. How can I help you today?",
    },
    {
      type: "user",
      content: "Hello! I'm interested in creating a chatbot for my website.",
    },
    {
      type: "bot",
      content:
        "That's great! Askio makes it easy to create and customize chatbots for your website. What kind of website do you have?",
    },
    {
      type: "user",
      content: "I have an e-commerce site selling handmade jewelry.",
    },
    {
      type: "bot",
      content:
        "Perfect! A chatbot can really enhance the customer experience for your e-commerce site. It can help answer common questions about your products, shipping, and returns. Would you like to know how to get started?",
    },
    { type: "user", content: "Yes, please! How do I begin?" },
    {
      type: "bot",
      content:
        "It's simple! Just follow these steps:\n1. Sign up for a free Askio account\n2. Create a new chatbot and customize its appearance\n3. Add your frequently asked questions and responses\n4. Get your unique embed code\n5. Add the code to your website\nAnd that's it! Your chatbot will be up and running.",
    },
  ];

  // **Add:** Ref to track if the conversation has started to prevent duplication
  const conversationStarted = useRef(false);

  // **Add:** Corrected helper function to handle delays
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // **Modify:** Update useEffect to handle initial conversation with bot typing animation
  useEffect(() => {
    if (conversationStarted.current) return; // Prevents the conversation from starting multiple times
    conversationStarted.current = true;

    const handleConversation = async () => {
      for (const message of conversation) {
        if (message.type === "bot") {
          setIsTyping(true);
          setDisplayedBotInput("");
          for (let i = 0; i < message.content.length; i++) {
            setDisplayedBotInput((prev) => prev + message.content[i]);
            await delay(50); // Simulate bot typing speed
          }
          setChatMessages((prev) => [
            ...prev,
            { type: "bot", content: message.content },
          ]);
          setDisplayedBotInput("");
          setIsTyping(false);
        } else if (message.type === "user") {
          setIsUserTyping(true);
          setDisplayedUserInput("");
          for (let i = 0; i < message.content.length; i++) {
            setDisplayedUserInput((prev) => prev + message.content[i]);
            await delay(50); // Simulate user typing speed
          }
          setChatMessages((prev) => [...prev, message]);
          setIsUserTyping(false);
        }
      }
      setIsConversationComplete(true);
    };

    handleConversation();
  }, []);

  // **Add:** New useEffect to handle internal scrolling when chatMessages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConversationComplete) {
      setUserInput(e.target.value);
    }
  };

  // **Modify:** Update handleChatSubmit to handle bot's typed response correctly
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && isConversationComplete) {
      setIsUserTyping(true);
      setDisplayedUserInput("");
      for (let i = 0; i < userInput.length; i++) {
        setDisplayedUserInput((prev) => prev + userInput[i]);
        await delay(50); // Simulate user typing speed
      }
      setChatMessages((prev) => [
        ...prev,
        { type: "user", content: userInput },
      ]);
      setIsUserTyping(false);
      setUserInput("");

      // Bot starts typing after user finishes
      setIsTyping(true);
      setDisplayedBotInput("");
      const botReplyContent =
        "Thank you for your message! Is there anything else I can help you with regarding Askio's chatbot creation process?";
      for (let i = 0; i < botReplyContent.length; i++) {
        setDisplayedBotInput((prev) => prev + botReplyContent[i]);
        await delay(50); // Simulate bot typing speed
      }
      setChatMessages((prev) => [
        ...prev,
        { type: "bot", content: botReplyContent },
      ]);
      setDisplayedBotInput("");
      setIsTyping(false);
    }
  };

  useEffect(() => {
    // Create the chatbot container
    const chatbotContainer = document.createElement("div");
    chatbotContainer.id = "chatbot-container";
    document.body.appendChild(chatbotContainer);

    // Load the chatbot script
    const script = document.createElement("script");
    script.src = "https://askio.vercel.app/chatbot-embed.js";
    script.async = true;

    script.onload = () => {
      // Initialize the chatbot after the script has loaded
      const initScript = document.createElement("script");
      initScript.text = `
        ChatbotEmbed.init("eh0qWjVhkPeBwzGxYLv6", "https://askio.vercel.app");
      `;
      document.body.appendChild(initScript);
    };

    document.body.appendChild(script);

    return () => {
      // Clean up
      document.body.removeChild(chatbotContainer);
      document.body.removeChild(script);
      const initScript = document.querySelector(
        'script[text*="ChatbotEmbed.init"]'
      );
      if (initScript) document.body.removeChild(initScript);
    };
  }, []);

  const testimonials = [
    {
      name: "Sarah L.",
      role: "Boutique Owner",
      quote:
        "As a small business owner, I was skeptical about chatbots. But this free tool changed everything! It's like having a 24/7 customer service rep.",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    },
    {
      name: "Mark L.",
      role: "E-commerce Entrepreneur",
      quote:
        "Multiple sites, one solution. Cart abandonment down 15%. Best free tool ever!",
      avatar: "https://randomuser.me/api/portraits/men/79.jpg",
    },
    {
      name: "Pat M.",
      role: "Freelance Designer",
      quote:
        "Easy to customize, easier to use. It's like having a tireless assistant.",
      avatar: "https://randomuser.me/api/portraits/women/42.jpg",
    },
  ];

  // {{ Add: State to manage active FAQ index }}
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // {{ Add: Function to toggle FAQ items }}
  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Helper function to create useInView hook with default options
  const useInViewSection = (threshold = 0.1) => {
    return useInView({
      triggerOnce: true,
      threshold,
    });
  };

  // Create refs for each section
  const [featuresRef, featuresInView] = useInViewSection();
  const [howItWorksRef, howItWorksInView] = useInViewSection();
  const [testimonialsRef, testimonialsInView] = useInViewSection();
  const [faqRef, faqInView] = useInViewSection();

  // Add this near your other useInView hooks
  const [ctaRef, ctaInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Add this state for managing the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] min-h-screen">
      <Helmet>
        <title>Askio - Your Chatbot Builder</title>
        <meta
          name="description"
          content="Manage and optimize your chatbots with Askio's dashboard."
        />
      </Helmet>
      <header className="w-full mx-auto z-50 transition-all duration-300 pt-6 pb-4 relative max-w-7xl px-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold flex items-center transition-transform duration-300 hover:scale-105"
          >
            <img src="./icon.svg" alt="Askio" className="w-10 h-10 mr-2" />
            <span className="text-gray-800 bg-clip-text text-black text-2xl">
              Askio
            </span>
          </Link>
          <nav className="hidden md:flex space-x-8 text-gray-700 text-lg">
            {["Features", "How it Works", "Testimonials", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="hover:text-indigo-500 transition-colors duration-300 relative group py-2"
              >
                {item}
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-indigo-300 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center">
            <Link
              to="/auth"
              className="bg-gradient-to-r from-indigo-300 to-indigo-400 text-white px-6 py-2 font-semibold rounded-full hover:shadow-lg transition-all duration-300 flex items-center group"
            >
              <span className="transition-all duration-300">Get Started</span>
              <ArrowRight className="ml-2 h-5 w-5 opacity-100 transition-all duration-300" />
            </Link>
          </div>
          <button
            className="md:hidden text-gray-700 hover:text-[#3b82f6] transition-colors duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] shadow-lg z-50"
            >
              <div className="container mx-auto px-4 py-4 max-w-7xl">
                <nav className="flex flex-col space-y-4">
                  {["Features", "How it Works", "Testimonials", "FAQ"].map(
                    (item) => (
                      <a
                        key={item}
                        href={`#${item.toLowerCase().replace(" ", "-")}`}
                        className="text-gray-700 hover:text-indigo-500 transition-colors duration-300"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item}
                      </a>
                    )
                  )}
                  <Link
                    to="/auth"
                    className="bg-gradient-to-r from-indigo-300 to-indigo-400 text-white px-6 py-2 font-semibold rounded-full hover:shadow-lg transition-all duration-300 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-0 sm:pt-12">
        <section className="py-12 sm:py-20 overflow-hidden relative bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]">
          {/* Futuristic background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-full h-full bg-[url('/circuit-pattern.png')] opacity-10"></div>
            <motion.div
              className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full opacity-20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            ></motion.div>
          </div>

          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="md:w-1/2 mb-10 md:mb-0"
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                  Custom Chatbots, Limitless{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-400">
                    Possibilities
                  </span>
                </h1>
                <p className="text-xl mb-8 text-gray-700 max-w-lg">
                  Create custom chatbots tailored to your brand. Effortlessly
                  integrate them into your website and engage visitors with
                  smarter, personalized interactions.
                </p>
                
                {/* Statistics & Social Proof */}
                <div className="mb-8 space-y-4">
                  {/* Star Rating */}
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-gray-700 font-medium">
                      Loved by 500+ users
                    </span>
                  </div>
                  
                  {/* Statistics Grid */}
                  <div className="flex flex-wrap items-center gap-6 md:gap-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="flex items-baseline gap-2"
                    >
                      <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-500">1.2K+</div>
                      <div className="text-sm text-gray-600">Chatbots Created</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="flex items-baseline gap-2"
                    >
                      <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-500">4.8/5</div>
                      <div className="text-sm text-gray-600">Average Rating</div>
                    </motion.div>

                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-indigo-300 to-indigo-400 text-white px-8 py-3 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-300 group"
                  >
                    <Link
                      to="/auth"
                      className="flex items-center justify-center"
                    >
                      <span className="group-hover:mr-2 transition-all duration-300">
                        Try it now
                      </span>
                      <ArrowRight className="inline ml-2 opacity-100 group-hover:opacity-100 transition-all duration-300" />
                    </Link>
                  </motion.button>
                  <Link
                    to="https://github.com/Salaheddine999/askio"
                    className="flex items-center justify-center text-gray-700 px-6 py-3 rounded-full text-lg font-medium border-2 border-gray-700 hover:bg-[#f0f4ff] transition-colors duration-300 group"
                  >
                    <FaGithub className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="group-hover:mr-2 transition-all duration-300">
                      Star on Github
                    </span>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:w-1/2 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-300 to-indigo-400 transform rotate-3 scale-105 opacity-25 blur-xl"></div>
                <div className="relative rounded-2xl shadow-lg max-w-md mx-auto transform hover:scale-105 transition-transform duration-300 overflow-hidden border-2 border-indigo-400">
                  {/* <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#8b5cf6_50%,#3b82f6_100%)]" /> */}
                  <div className="bg-white rounded-2xl p-6 relative z-10 ">
                    <div
                      className="space-y-4 h-80 overflow-y-auto mb-4 pr-2 scrollbar-thin scrollbar-thumb-indigo-500 scrollbar-track-gray-100"
                      ref={chatContainerRef}
                    >
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex items-start ${
                            message.type === "user" ? "justify-end" : ""
                          }`}
                        >
                          {message.type === "bot" && (
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-300 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold mr-2 shadow-md">
                              <img
                                src="./logo-transparent.svg"
                                alt="Askio"
                                className="w-10 h-10"
                              />
                            </div>
                          )}
                          <div
                            className={`rounded-lg p-3 text-sm ${
                              message.type === "user"
                                ? "bg-indigo-500 text-white"
                                : "bg-gray-100 text-gray-800"
                            } max-w-[80%] shadow-md`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}

                      {/* **Add:** Render bot's typed message */}
                      {isTyping && (
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-300 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold mr-2 shadow-md">
                            <img
                              src="./logo-transparent.svg"
                              alt="Askio"
                              className="w-10 h-10"
                            />
                          </div>
                          <div className="rounded-lg p-3 text-sm bg-gray-100 text-gray-800 max-w-[80%] shadow-md">
                            {displayedBotInput}
                          </div>
                        </div>
                      )}

                      {/* **Existing:** Render user typing */}
                      {isUserTyping && (
                        <div className="flex items-start justify-end">
                          <div className="rounded-lg p-3 text-sm bg-indigo-500 text-white max-w-[80%] shadow-md">
                            {displayedUserInput}
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <form
                      onSubmit={handleChatSubmit}
                      className="flex items-center bg-gray-100 p-4 rounded-lg shadow-inner"
                    >
                      <input
                        type="text"
                        value={userInput}
                        onChange={handleInputChange}
                        placeholder={
                          isConversationComplete
                            ? "Type your message..."
                            : "Type your message..."
                        }
                        className="flex-grow mr-2 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 rounded-md px-4 py-2 bg-white"
                        disabled={!isConversationComplete}
                      />
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-indigo-300 to-indigo-400 hover:bg-indigo-700 text-white transition duration-300 shadow-md hover:shadow-lg rounded-md p-3"
                        disabled={!isConversationComplete}
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <motion.section
          ref={featuresRef}
          initial={{ opacity: 0, y: 50 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          id="features"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-indigo-200 to-indigo-100 rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-indigo-100 to-indigo-200 rounded-full opacity-10 blur-3xl"></div>
          </div>

          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                  Powerful{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-400">
                    Features
                  </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Everything you need to create, customize, and deploy chatbots that engage your visitors
                </p>
              </motion.div>
            </div>

            {/* Bento-style grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">
              {/* Large feature card - spans 2 rows */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="md:col-span-7 md:row-span-2 bg-white rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden border-2 border-gray-100 hover:border-indigo-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#f0f2ff]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-8 inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-300 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                    <Palette className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-6 text-gray-800 group-hover:text-indigo-400 transition-colors duration-300">
                    Easy Customization
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    Create chatbots that perfectly match your brand identity with our intuitive customization tools. Design every aspect from colors to conversation flows.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-4 py-2 bg-gradient-to-r from-[#f0f2ff] to-white rounded-full text-sm font-medium text-indigo-400 border border-indigo-200 hover:border-indigo-300 transition-colors">
                      Brand Colors
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-[#f0f2ff] to-white rounded-full text-sm font-medium text-indigo-400 border border-indigo-200 hover:border-indigo-300 transition-colors">
                      Custom Fonts
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-[#f0f2ff] to-white rounded-full text-sm font-medium text-indigo-400 border border-indigo-200 hover:border-indigo-300 transition-colors">
                      Flexible Layout
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Medium feature card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="md:col-span-5 bg-gradient-to-br from-white to-[#f0f2ff] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden border-2 border-indigo-100 hover:border-indigo-200"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-300 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <Blocks className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-indigo-400 transition-colors duration-300">
                    Seamless Integration
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Add your chatbot to any website with just a few clicks, no coding required.
                  </p>
                </div>
              </motion.div>

              {/* Medium feature card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="md:col-span-5 bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden border-2 border-gray-100 hover:border-indigo-200"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#f0f2ff]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-300 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-indigo-400 transition-colors duration-300">
                    Real-Time Engagement
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Engage visitors instantly with automated conversations tailored to your business needs.
                  </p>
                </div>
              </motion.div>

              {/* Small feature cards row */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="md:col-span-4 bg-gradient-to-br from-indigo-400 to-indigo-300 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <Brush className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">
                    Visual Customization
                  </h3>
                  <p className="text-base text-white/90 leading-relaxed">
                    Design your chatbot's appearance to match your website perfectly.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="md:col-span-4 bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden border-2 border-gray-100 hover:border-indigo-200 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-bl from-[#f0f2ff]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-300 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-indigo-400 transition-colors duration-300">
                    Instant Deployment
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Deploy instantly with a simple embed code.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="md:col-span-4 bg-gradient-to-br from-white to-[#f0f2ff] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden border-2 border-indigo-100 hover:border-indigo-200 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-300 shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <Sliders className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800 group-hover:text-indigo-400 transition-colors duration-300">
                    Easy Configuration
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed">
                    Set up responses and behavior with our user-friendly interface.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] relative"
        >
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div
              ref={howItWorksRef}
              initial={{ opacity: 0, y: 50 }}
              animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-32"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                How It{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-400">
                  Works
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Three simple steps to create and deploy your custom chatbot
              </p>
            </motion.div>

            {/* Scroll Stack Cards */}
            <div className="relative">
              {[
                {
                  step: 1,
                  title: "Create & Configure",
                  description:
                    "Craft your chatbot by inputting custom Q&As and selecting its placement on your website. Define conversation flows and set up automated responses.",
                  icon: <Settings className="w-14 h-14 md:w-16 md:h-16 text-indigo-500" />,
                  color: "from-white to-indigo-50",
                  features: ["Q&A Builder", "Flow Designer", "Auto-Responses"],
                },
                {
                  step: 2,
                  title: "Customize",
                  description:
                    "Tailor your bot's appearance to match your brand and website design—all without any coding. Choose colors, fonts, and positioning.",
                  icon: <PaintbrushIcon className="w-14 h-14 md:w-16 md:h-16 text-indigo-500" />,
                  color: "from-indigo-50 to-white",
                  features: ["Brand Colors", "Custom Fonts", "Positioning"],
                },
                {
                  step: 3,
                  title: "Plug & Play",
                  description:
                    "Obtain your unique embed code and effortlessly add the chatbot to your website. Go live in seconds with a simple copy-paste.",
                  icon: <CodeIcon className="w-14 h-14 md:w-16 md:h-16 text-indigo-500" />,
                  color: "from-white via-indigo-50 to-white",
                  features: ["Embed Code", "One-Click Deploy", "Instant Live"],
                },
              ].map((item, index) => {
                return <StackCard key={index} item={item} index={index} />;
              })}
            </div>

            {/* Spacer for scroll effect */}
            <div className="h-32"></div>
          </div>
        </section>

        {/* Testimonials Section */}
        <motion.section
          ref={testimonialsRef}
          initial={{ opacity: 0, y: 50 }}
          animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          id="testimonials"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]"
        >
          <div className="container mx-auto px-6 max-w-7xl">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800">
              User{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-400">
                Stories
              </span>
            </h2>
            
            {/* Grid Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-300 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  <div className="relative mb-6">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-24 h-24 rounded-full border-4 border-indigo-300 shadow-md group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-300 to-indigo-400 text-white rounded-full p-2">
                      <MessageCircle size={16} />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 italic text-lg relative">
                    <span className="text-5xl text-indigo-300 absolute -top-4 -left-2 opacity-20">
                      "
                    </span>
                    {testimonial.quote}
                    <span className="text-5xl text-indigo-300 absolute -bottom-8 -right-2 opacity-20">
                      "
                    </span>
                  </p>
                  <div className="mt-auto">
                    <div className="font-semibold text-gray-800 text-xl mb-1">
                      {testimonial.name}
                    </div>
                    <div className="text-indigo-500 font-medium">
                      {testimonial.role}
                    </div>
                  </div>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="text-yellow-400 fill-current"
                        size={20}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section
          ref={faqRef}
          initial={{ opacity: 0, y: 50 }}
          animate={faqInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          id="faq"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-indigo-200 to-indigo-100 rounded-full opacity-10 blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-tl from-indigo-100 to-indigo-200 rounded-full opacity-10 blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-800">
                  Frequently Asked{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-400">
                    Questions
                  </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Everything you need to know about Askio
                </p>
              </motion.div>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {[
                {
                  question: "What is Askio?",
                  answer:
                    "Askio is a versatile, easy-to-use chatbot that can be added to any website to improve user engagement and provide instant responses to visitor queries.",
                },
                {
                  question: "Is Askio really free to use?",
                  answer:
                    "Yes, Askio is completely free to use. We believe in making technology accessible to everyone, so you can enjoy all of Askio's features without any cost.",
                },
                {
                  question:
                    "Do I have control over where the chatbot appears on my website?",
                  answer:
                    "Absolutely. You can choose where you want the chatbot to appear on your website, giving you full control over its placement and visibility.",
                },
                {
                  question:
                    "Do I need coding skills to implement this chatbot?",
                  answer:
                    "No coding skills are required. The chatbot is designed to be easy to implement with a simple embed code, making it accessible for users of all technical levels.",
                },
                {
                  question:
                    "Can I create multiple chatbots for different websites?",
                  answer:
                    "Yes, you can create multiple chatbots, allowing you to have different chatbots for your various websites or web pages, each tailored to specific needs.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-indigo-200 group">
                    <button
                      className="w-full px-8 py-6 text-left flex justify-between items-center focus:outline-none group-hover:bg-gradient-to-r group-hover:from-indigo-50/50 group-hover:to-transparent transition-all duration-300"
                      onClick={() => toggleFAQ(index)}
                      aria-expanded={activeIndex === index}
                      aria-controls={`faq-${index}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeIndex === index 
                            ? 'bg-gradient-to-br from-indigo-400 to-indigo-300' 
                            : 'bg-gradient-to-br from-indigo-100 to-indigo-50'
                        }`}>
                          <span className={`text-lg font-bold ${
                            activeIndex === index ? 'text-white' : 'text-indigo-500'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-xl font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
                          {faq.question}
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: activeIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={`ml-4 ${activeIndex === index ? 'text-indigo-500' : 'text-gray-400'}`}
                      >
                        <ChevronDown className="w-6 h-6" />
                      </motion.div>
                    </button>
                    <AnimatePresence initial={false}>
                      {activeIndex === index && (
                        <motion.div
                          key={`answer-${index}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="px-8 pb-6">
                            <div className="border-l-4 border-indigo-300 pl-6 py-2">
                              <p className="text-lg text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Enhanced CTA Section with Modern Design */}
        <motion.section
          ref={ctaRef}
          initial={{ opacity: 0, y: 50 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="cta-section bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] py-20 relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200 to-indigo-100 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-indigo-100 to-indigo-200 rounded-full opacity-20 blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="relative bg-gradient-to-br from-white via-white to-indigo-50/30 rounded-3xl shadow-2xl overflow-hidden max-w-5xl mx-auto border-2 border-indigo-100 group">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 via-transparent to-indigo-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Top decorative line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>

              {/* Content */}
              <div className="relative z-10 p-10 sm:p-16 text-center">
                {/* Icon badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={ctaInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.4, type: "spring" }}
                  className="inline-flex mb-8"
                >
                  <div className="relative">
                    <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-300 rounded-2xl shadow-xl">
                      <Rocket className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-400 rounded-full shadow-lg"></div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-indigo-400/40 rounded-2xl blur-xl scale-110 opacity-60"></div>
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-gray-800"
                >
                  Ready to{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-indigo-300">
                    Transform
                  </span>{" "}
                  Your Website?
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                  Join thousands of websites using Askio to provide instant
                  support and enhance user experience. Start building your custom chatbot today.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <Link
                    to="/auth"
                    className="group/btn relative inline-flex items-center bg-gradient-to-r from-indigo-400 to-indigo-300 text-white px-10 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </span>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-300 border-2 border-white flex items-center justify-center text-white font-semibold text-xs"
                        >
                          ✓
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium">
                      <span className="font-bold text-indigo-400">500+</span> users already started
                    </span>
                  </div>
                </motion.div>

                {/* Feature badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={ctaInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="flex flex-wrap justify-center gap-4 mt-10"
                >
                  {[
                    { icon: Sparkles, text: "No Credit Card" },
                    { icon: Sliders, text: "Easy Setup" },
                    { icon: Settings, text: "Full Customization" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300"
                    >
                      <item.icon className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Decorative corner elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-200/20 to-transparent rounded-full blur-2xl -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-200/20 to-transparent rounded-full blur-2xl translate-y-32 -translate-x-32"></div>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="relative bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 text-white py-16 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            {/* Brand section */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start">
              <Link to="/" className="flex items-center mb-6 group">
                <div className="relative">
                  <img src="./icon.svg" alt="Askio" className="w-12 h-12 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-indigo-400">
                  Askio
                </span>
              </Link>
              <p className="text-gray-400 text-center md:text-left mb-6 leading-relaxed max-w-sm">
                Elevate your website with intelligent, customizable chatbots. Engage visitors and provide instant support effortlessly.
              </p>
              <div className="flex space-x-3">
                {[
                  { Icon: Twitter, href: "#", label: "Twitter" },
                  { Icon: Facebook, href: "#", label: "Facebook" },
                  { Icon: Linkedin, href: "#", label: "LinkedIn" },
                  { Icon: FaGithub, href: "https://github.com/Salaheddine999/askio", label: "GitHub" },
                ].map(({ Icon, href, label }, index) => (
                  <a
                    key={index}
                    href={href}
                    className="w-10 h-10 flex items-center justify-center bg-gray-800/50 hover:bg-indigo-500/20 border border-gray-700 hover:border-indigo-500/50 rounded-lg transition-all duration-300 hover:scale-110 group"
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 flex flex-col items-center md:items-start">
              <h3 className="text-lg font-bold mb-6 text-white relative">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-indigo-400 to-transparent"></span>
              </h3>
              <ul className="space-y-3">
                {["Features", "How it Works", "Testimonials", "FAQ"].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase().replace(" ", "-")}`}
                      className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 flex items-center group"
                    >
                      <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{item}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2 flex flex-col items-center md:items-start">
              <h3 className="text-lg font-bold mb-6 text-white relative">
                Resources
                <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-indigo-400 to-transparent"></span>
              </h3>
              <ul className="space-y-3">
                {["Documentation", "API", "Support", "Blog"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 flex items-center group"
                    >
                      <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{item}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="md:col-span-3 flex flex-col items-center md:items-start">
              <h3 className="text-lg font-bold mb-6 text-white relative">
                Stay Updated
                <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-indigo-400 to-transparent"></span>
              </h3>
              <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                Get the latest updates and features delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800/50 border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex-grow placeholder:text-gray-500 transition-all duration-300"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 text-white px-6 py-2.5 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-indigo-500/25 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Askio. All rights reserved. Built with ❤️ for better conversations.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-500 hover:text-indigo-400 text-sm transition-colors duration-300 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-400 group-hover:w-full transition-all duration-300"></span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
