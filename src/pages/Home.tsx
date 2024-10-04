import React, { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  MessageCircle,
  ToyBrick,
  ArrowRight,
  Brush,
  Menu,
  X,
  Send,
  Star,
  Twitter,
  Facebook,
  Linkedin,
  Paintbrush,
  Zap,
  Settings,
  Paintbrush as PaintbrushIcon,
  Code as CodeIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";

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
      <header className="w-full mx-auto z-50 transition-all duration-300 pt-6 pb-4 relative">
        <div className="container mx-auto px-4 flex justify-between items-center">
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
                <span className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-to-r from-[#aab2ff] to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
            ))}
          </nav>
          <div className="hidden md:flex items-center">
            <Link
              to="/auth"
              className="bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white px-6 py-2 font-semibold rounded-full hover:shadow-lg transition-all duration-300 flex items-center group"
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
              <div className="container mx-auto px-4 py-4">
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
                    className="bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white px-6 py-2 font-semibold rounded-full hover:shadow-lg transition-all duration-300 text-center"
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

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="md:w-1/2 mb-10 md:mb-0"
              >
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Custom Chatbots, Limitless{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                    Possibilities
                  </span>
                </h1>
                <p className="text-xl mb-8 text-gray-700 max-w-lg">
                  Create custom chatbots tailored to your brand. Effortlessly
                  integrate them into your website and engage visitors with
                  smarter, personalized interactions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white px-8 py-3 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-300 group"
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#aab2ff] to-indigo-500 transform rotate-3 scale-105 opacity-25 blur-xl"></div>
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
                            <div className="w-8 h-8 bg-gradient-to-r from-[#aab2ff] to-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-2 shadow-md">
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
                          <div className="w-8 h-8 bg-gradient-to-r from-[#aab2ff] to-indigo-500 rounded-full flex items-center justify-center text-white font-bold mr-2 shadow-md">
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
                        className="bg-gradient-to-r from-[#aab2ff] to-indigo-500 hover:bg-indigo-700 text-white transition duration-300 shadow-md hover:shadow-lg rounded-md p-3"
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
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
              Powerful{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Features
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <Brush className="h-12 w-12 text-indigo-500" />,
                  title: "Easy Customization",
                  description:
                    "Create chatbots that perfectly match your brand identity with our intuitive customization tools.",
                },
                {
                  icon: <ToyBrick className="h-12 w-12 text-indigo-500" />,
                  title: "Seamless Integration",
                  description:
                    "Add your chatbot to any website with just a few clicks, no coding required.",
                },
                {
                  icon: <MessageCircle className="h-12 w-12 text-indigo-500" />,
                  title: "Real-Time Engagement",
                  description:
                    "Engage visitors instantly with automated conversations tailored to your business needs.",
                },
                {
                  icon: <Paintbrush className="h-12 w-12 text-indigo-500" />,
                  title: "Visual Customization",
                  description:
                    "Design your chatbot's appearance to perfectly match your website's look and feel.",
                },
                {
                  icon: <Zap className="h-12 w-12 text-indigo-500" />,
                  title: "Instant Deployment",
                  description:
                    "Deploy your chatbot instantly with a simple embed code, getting you up and running in no time.",
                },
                {
                  icon: <Settings className="h-12 w-12 text-indigo-500" />,
                  title: "Easy Configuration",
                  description:
                    "Set up your chatbot's responses and behavior quickly with our user-friendly configuration interface.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br from-[#f0f2ff] to-[#ffffff] p-4 rounded-full inline-block">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* How It Works Section */}
        <motion.section
          ref={howItWorksRef}
          initial={{ opacity: 0, y: 50 }}
          animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          id="how-it-works"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold text-center mb-16 text-gray-800">
              How It{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Works
              </span>
            </h2>
            <div className="max-w-6xl mx-auto space-y-20">
              {[
                {
                  step: 1,
                  title: "Create & Configure",
                  description:
                    "Craft your chatbot by inputting custom Q&As and selecting its placement on your website.",
                  icon: <Settings className="w-24 h-24 text-indigo-500" />,
                },
                {
                  step: 2,
                  title: "Customize",
                  description:
                    "Tailor your bot's appearance to match your brand and website design—all without any coding.",
                  icon: (
                    <PaintbrushIcon className="w-24 h-24 text-indigo-500" />
                  ),
                },
                {
                  step: 3,
                  title: "Plug & Play",
                  description:
                    "Obtain your unique embed code and effortlessly add the chatbot to your website.",
                  icon: <CodeIcon className="w-24 h-24 text-indigo-500" />,
                },
              ].map((item, index) => (
                // **Modify:** Replace Alpine.js attributes with Framer Motion
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.3 }}
                  className="relative bg-gradient-to-br from-white to-indigo-50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl group"
                >
                  <div className="md:flex justify-between items-center p-8 md:p-12">
                    <div className="shrink-0 md:w-2/3 pr-8">
                      <div className="md:max-w-xl">
                        <div className="flex items-center mb-4">
                          <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white text-2xl font-bold rounded-full mr-4">
                            {item.step}
                          </div>
                          <h3 className="text-3xl font-medium text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center md:w-1/3 p-8 bg-gradient-to-br from-[#f0f2ff] to-[#ffffff] rounded-2xl transform group-hover:scale-105 transition-transform duration-300">
                      {item.icon}
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 mt-4 mr-6 text-4xl font-bold text-indigo-200 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    0{item.step}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#aab2ff] to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          ref={testimonialsRef}
          initial={{ opacity: 0, y: 50 }}
          animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          id="testimonials"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
              User{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Stories
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#aab2ff] to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  <div className="relative mb-6">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-24 h-24 rounded-full border-4 border-[#aab2ff] shadow-md group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white rounded-full p-2">
                      <MessageCircle size={16} />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 italic text-lg relative">
                    <span className="text-5xl text-[#aab2ff] absolute -top-4 -left-2 opacity-20">
                      "
                    </span>
                    {testimonial.quote}
                    <span className="text-5xl text-[#aab2ff] absolute -bottom-8 -right-2 opacity-20">
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
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
              Frequently Asked{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Questions
              </span>
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
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
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <button
                      className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                      onClick={() => toggleFAQ(index)}
                      aria-expanded={activeIndex === index}
                      aria-controls={`faq-${index}`}
                    >
                      <span className="text-xl font-semibold text-gray-800">
                        {faq.question}
                      </span>
                      <motion.div
                        animate={{ rotate: activeIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-6 h-6 text-indigo-500" />
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
                          <div className="px-6 pb-4 text-gray-600">
                            <p className="text-lg">{faq.answer}</p>
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

        {/* Compact CTA Section with Animation */}
        <motion.section
          ref={ctaRef}
          initial={{ opacity: 0, y: 50 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="cta-section bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] py-16"
        >
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center max-w-5xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">
                Elevate Your Website's Engagement
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join thousands of websites using Askio to provide instant
                support and enhance user experience.
              </p>
              <Link
                to="/auth"
                className="inline-block bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      <footer className="bg-gradient-to-r from-gray-900 to-indigo-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="flex flex-col items-center md:items-start">
              <Link to="/" className="flex items-center mb-4">
                <img src="./icon.svg" alt="Askio" className="w-10 h-10 mr-2" />
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-400">
                  Askio
                </span>
              </Link>
              <p className="text-gray-300 text-center md:text-left mb-4">
                Elevate Your Website with Free AI-Powered Chatbots
              </p>
              <div className="flex space-x-4">
                {[Twitter, Facebook, Linkedin, FaGithub].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                    aria-label={`Follow us on ${Icon.name}`}
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {["Features", "How it Works", "Testimonials", "FAQ"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href={`#${item.toLowerCase().replace(" ", "-")}`}
                        className="text-gray-300 hover:text-white transition-colors duration-300"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            <div className="flex flex-col items-center md:items-start">
              <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
              <p className="text-gray-300 mb-4">
                Subscribe to our newsletter for the latest updates and features.
              </p>
              <form className="flex w-full max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow"
                />
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-r-md transition-colors duration-300"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Askio. All rights reserved.
            </p>
            <div className="flex space-x-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-300"
                  >
                    {item}
                  </a>
                )
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
