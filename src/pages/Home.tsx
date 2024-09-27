import React, { useState, useRef, useEffect } from "react";
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
  Instagram,
  Paintbrush,
  ChevronRight,
  Zap,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";

export default function ChatbotLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <div className="bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] min-h-screen">
      <header className="w-full mx-auto z-50 transition-all duration-300 pt-6 pb-4">
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
              <span className=" transition-all duration-300">Get Started</span>
              <ArrowRight className="ml-2 h-5 w-5 opacity-100 transition-all duration-300" />
            </Link>
          </div>
          <button
            className="md:hidden text-gray-700 hover:text-[#3b82f6] transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed top-[72px] left-0 right-0 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff] backdrop-blur-md py-6 px-4 shadow-md z-40"
          >
            <nav className="flex flex-col space-y-4">
              {["Features", "How it Works", "Testimonials", "FAQ"].map(
                (item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="text-gray-700 hover:text-[#3b82f6] transition-colors duration-300 text-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                )
              )}
              <Link
                to="/auth"
                className="bg-gradient-to-r from-[#aab2ff] to-indigo-500 text-white px-4 py-2 rounded-full font-semibold hover:shadow-md transition-all duration-300 text-center flex items-center justify-center group"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="group-hover:mr-2 transition-all duration-300">
                  Get Started
                </span>
                <ArrowRight className="ml-2 h-5 w-5 opacity-100 group-hover:opacity-100 transition-all duration-300" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

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

        <section
          id="features"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              Powerful{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Features
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: <Brush className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Easy Customization",
                  description:
                    "Create chatbots that perfectly match your brand identity with our intuitive customization tools.",
                },
                {
                  icon: <ToyBrick className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Seamless Integration",
                  description:
                    "Add your chatbot to any website with just a few clicks, no coding required.",
                },
                {
                  icon: <MessageCircle className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Real-Time Engagement",
                  description:
                    "Engage visitors instantly with automated conversations tailored to your business needs.",
                },
                {
                  icon: <Paintbrush className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Visual Customization",
                  description:
                    "Design your chatbot's appearance to perfectly match your website's look and feel.",
                },
                {
                  icon: <Zap className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Instant Deployment",
                  description:
                    "Deploy your chatbot instantly with a simple embed code, getting you up and running in no time.",
                },
                {
                  icon: <Settings className="h-12 w-12 text-[#aab2ff]" />,
                  title: "Easy Configuration",
                  description:
                    "Set up your chatbot's responses and behavior quickly with our user-friendly configuration interface.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group"
                >
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="py-20 bg-gradient-to-r from-[#f0f2ff] to-[#ffffff]"
        >
          <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              How It{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#aab2ff] to-indigo-500">
                Works
              </span>
            </h2>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 relative">
              {[
                {
                  step: 1,
                  title: "Create & Configure",
                  description:
                    "Craft your chatbot by inputting custom Q&As and selecting its placement on your website.",
                },
                {
                  step: 2,
                  title: "Customize",
                  description:
                    "Tailor your bot's appearance to match your brand and website design—all without any coding.",
                },
                {
                  step: 3,
                  title: "Plug & Play",
                  description:
                    "Obtain your unique embed code and effortlessly add the chatbot to your website.",
                },
              ].map((item, index) => (
                <React.Fragment key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-center text-center w-full md:w-1/3 relative z-10"
                  >
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-[#aab2ff] text-white rounded-full flex items-center justify-center text-2xl font-bold">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </motion.div>
                  {index < 2 && (
                    <svg
                      className="hidden md:block w-12 h-12 text-indigo-500 mx-2 transform translate-y-1/2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        <section
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              {[
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
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#aab2ff] to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  <div className="relative">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-24 h-24 rounded-full mb-6 border-4 border-[#aab2ff] shadow-md group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute -top-2 -right-2 bg-[#aab2ff] text-white rounded-full p-2">
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
        </section>

        {/* New FAQ section */}
        <section
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
            <div className="max-w-3xl mx-auto">
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
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="mb-6"
                >
                  <details className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none p-6">
                      <span className="text-lg text-gray-800 font-semibold">
                        {item.question}
                      </span>
                      <div className="transition-transform duration-300 group-open:rotate-180">
                        <ChevronRight size={24} className="text-[#aab2ff]" />
                      </div>
                    </summary>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-gray-600"
                    >
                      <div className="bg-[#f8f9ff] rounded-xl p-4 shadow-inner">
                        {item.answer}
                      </div>
                    </motion.div>
                  </details>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-gradient-to-r from-[#aab2ff] to-[#c2c8ff] text-gray-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Boost Your Website's Engagement Today!
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Enhance customer support and engagement on all your websites -
              instantly and effortlessly, with no coding needed.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/auth"
                className="bg-white text-[#aab2ff] px-8 py-4 rounded-full text-lg font-semibold hover:bg-[#f0f2ff] transition-colors duration-300 inline-flex items-center"
              >
                Start Building Now
                <ArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Askio</div>
              <p className="text-gray-400">
                Elevate Your Website - Free Chatbot!
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {["Features", "How it Works", "Testimonials"].map((item) => (
                  <li key={item}>
                    <a
                      href={`#${item.toLowerCase().replace(" ", "-")}`}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                {[Twitter, Facebook, Linkedin, Instagram].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            © 2024 Askio. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
