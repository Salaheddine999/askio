import React, { useState, useEffect, useRef } from "react";
import { Send, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { db } from "../utils/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import bot1 from "../assets/chat1.svg";

type Message = {
  text: string;
  sender: "user" | "bot";
};

export interface ChatbotProps {
  id: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialMessage: string;
  placeholder: string;
  faqData: Array<{ question: string; answer: string }>;
  isEmbedded?: boolean;
  isPreview?: boolean;
  isActive?: boolean;
  customPositionClass?: string;
  gradientStart?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({
  id,
  title,
  primaryColor,
  secondaryColor,
  position,
  initialMessage,
  placeholder,
  faqData,
  isEmbedded,
  customPositionClass,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(!isEmbedded);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [fuse, setFuse] = useState<Fuse<{
    question: string;
    answer: string;
  }> | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [anonymousToken, setAnonymousToken] = useState<string | null>(null);

  const isGradient = primaryColor.startsWith("linear-gradient");

  const headerStyle = {
    backgroundColor: isGradient ? "transparent" : primaryColor,
    backgroundImage: isGradient ? primaryColor : "none",
  };

  const buttonStyle = {
    backgroundColor: isGradient ? "transparent" : secondaryColor,
    backgroundImage: isGradient ? secondaryColor : "none",
  };

  const userMessageStyle = {
    backgroundColor: isGradient ? "transparent" : secondaryColor,
    backgroundImage: isGradient ? secondaryColor : "none",
  };

  useEffect(() => {
    setMessages([{ text: initialMessage, sender: "bot" }]);
  }, [initialMessage]);

  useEffect(() => {
    // Initialize suggestions with all FAQ questions
    setSuggestions(faqData.map((faq) => faq.question));
  }, [faqData]);

  useEffect(() => {
    const fuseInstance = new Fuse(faqData, {
      keys: ["question"],
      threshold: 0.4, // Adjusts the sensitivity of the matching
    });
    setFuse(fuseInstance);
  }, [faqData]);

  useEffect(() => {
    // Generate or retrieve the anonymous token
    const storedToken = localStorage.getItem("anonymousToken");
    if (storedToken) {
      setAnonymousToken(storedToken);
    } else {
      const newToken = generateAnonymousToken();
      localStorage.setItem("anonymousToken", newToken);
      setAnonymousToken(newToken);
    }
  }, []);

  const generateAnonymousToken = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  useEffect(() => {
    const checkPreviousFeedback = async () => {
      if (!anonymousToken || !id) return;

      const feedbackKey = `feedback_${id}`;
      const storedFeedback = localStorage.getItem(feedbackKey);
      if (storedFeedback) {
        setHasFeedback(true);
        return;
      }

      try {
        const feedbackDoc = await getDoc(
          doc(db, "feedback", `${id}_${anonymousToken}`)
        );
        if (feedbackDoc.exists()) {
          setHasFeedback(true);
          localStorage.setItem(feedbackKey, "true");
        }
      } catch (error) {
        console.error("Error checking previous feedback:", error);
      }
    };

    checkPreviousFeedback();
  }, [id, anonymousToken]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (input.trim() === "") return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setShowSuggestions(false);
    setInput("");

    let matchedFaq: { question: string; answer: string } | undefined;

    if (fuse) {
      const result = fuse.search(input.trim());
      if (result.length > 0) {
        matchedFaq = result[0].item;
      }
    } else {
      matchedFaq = faqData.find(
        (item) => item.question.toLowerCase() === input.toLowerCase()
      );
    }

    setIsTyping(true);

    setTimeout(() => {
      if (matchedFaq) {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot" },
        ]);
        setIsTyping(false);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            text: "I'm sorry, I don't have an answer for that. Here are some related questions:",
            sender: "bot",
          },
        ]);
        setIsTyping(false);
        setTimeout(() => {
          setShowSuggestions(true);
          updateSuggestions(input);
        }, 100);
      }
    }, 1500); // Simulate typing delay
  };

  const updateSuggestions = (userInput: string) => {
    // Filter suggestions based on user input
    const filteredSuggestions = faqData
      .filter((faq) =>
        faq.question.toLowerCase().includes(userInput.toLowerCase())
      )
      .map((faq) => faq.question);

    setSuggestions(
      filteredSuggestions.length > 0
        ? filteredSuggestions
        : faqData.map((faq) => faq.question)
    );
  };

  const handleSuggestionClick = (event: React.MouseEvent, question: string) => {
    event.preventDefault();
    event.stopPropagation();
    setMessages((prev) => [...prev, { text: question, sender: "user" }]);
    const matchedFaq = faqData.find((faq) => faq.question === question);
    if (matchedFaq) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot" },
        ]);
        setShowSuggestions(false);
        setIsTyping(false);
      }, 1500); // Simulate typing delay
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const positionClasses = {
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
  };

  const combinedPositionClass = customPositionClass
    ? customPositionClass
    : positionClasses[position];

  useEffect(() => {
    if (isEmbedded) {
      window.parent.postMessage({ type: "chatbotState", isOpen }, "*");
    }
  }, [isOpen, isEmbedded]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "toggleChatbot") {
        setIsOpen(event.data.isOpen);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleFeedbackClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from propagating
    setShowFeedback(true);
  };

  const handleFeedback = async (isPositive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasFeedback) {
      toast.error("You have already provided feedback for this chatbot.");
      return;
    }

    if (!id || !anonymousToken) {
      console.error("Chatbot ID or anonymous token is missing");
      toast.error("Unable to submit feedback. Please try again later.");
      return;
    }

    try {
      const feedbackId = `${id}_${anonymousToken}`;
      const feedbackRef = doc(db, "feedback", feedbackId);

      await setDoc(feedbackRef, {
        chatbotId: id,
        isPositive: isPositive,
        timestamp: serverTimestamp(),
        anonymousToken: anonymousToken,
      });

      localStorage.setItem(`feedback_${id}`, "true");
      setHasFeedback(true);
      toast.success("Thank you for your feedback!");
      setShowFeedback(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      if (error instanceof Error) {
        toast.error(`Failed to submit feedback: ${error.message}`);
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    }
  };

  const chatbotButton = (
    <motion.button
      onClick={toggleChatbot}
      className={`fixed ${combinedPositionClass} z-50 w-16 h-16 flex items-center justify-center text-white rounded-full shadow-lg transition-all duration-300 overflow-hidden`}
      style={{
        background: isGradient
          ? primaryColor
          : `linear-gradient(145deg, ${primaryColor}, ${primaryColor}cc)`,
        boxShadow: `0 4px 10px rgba(0, 0, 0, 0.1), inset 0 -4px 4px rgba(0, 0, 0, 0.1), inset 0 4px 4px rgba(255, 255, 255, 0.2)`,
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 6px 15px rgba(0, 0, 0, 0.15), inset 0 -6px 6px rgba(0, 0, 0, 0.15), inset 0 6px 6px rgba(255, 255, 255, 0.25)`,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <img src={bot1} alt="bot" className="w-8 h-8" />
      </div>
    </motion.button>
  );

  const chatbotContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`${
        isEmbedded ? `fixed ${combinedPositionClass} z-50` : "w-full h-full"
      } bg-white dark:bg-[#1C1917] flex flex-col rounded-2xl overflow-hidden ${
        isEmbedded ? "w-[370px] h-[540px] shadow-2xl shadow-black/10 dark:shadow-black/30 border border-[#E0DEDB]/50 dark:border-[#44403C]/50" : "shadow-lg"
      }`}
    >
      {/* Header */}
      <div
        className="text-white px-5 py-5 flex items-center justify-between relative overflow-hidden"
        style={headerStyle}
      >
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-black/10" />
        
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-sm shadow-black/10">
              <img src="/logo.svg" alt="Askio" className="w-6 h-6 brightness-0 invert" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-sm">
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight tracking-[-0.01em]">{title || "Askio Assistant"}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-white/60 font-medium">Online</span>
              <span className="text-white/30">·</span>
              <span className="text-[11px] text-white/50">Ready to chat</span>
            </div>
          </div>
        </div>

        {isEmbedded && (
          <button
            onClick={toggleChatbot}
            className="relative z-10 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all duration-200 hover:scale-105"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`inline-block px-3.5 py-2.5 max-w-[80%] text-[13px] leading-relaxed ${
                  message.sender === "user"
                    ? "text-white rounded-2xl rounded-br-md"
                    : "bg-[#F5F5F4] dark:bg-[#292524] text-[#37322F] dark:text-[#F5F5F4] rounded-2xl rounded-bl-md"
                }`}
                style={message.sender === "user" ? userMessageStyle : {}}
              >
                {message.text}
              </div>
            </motion.div>
          ))}

          {/* Suggestion Chips */}
          {showSuggestions &&
            messages.length > 0 &&
            messages[messages.length - 1]?.sender === "bot" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="pt-1"
              >
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((question, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleSuggestionClick(e, question)}
                      className="text-[12px] bg-white dark:bg-[#292524] hover:bg-[#F5F5F4] dark:hover:bg-[#44403C] text-[#37322F] dark:text-[#F5F5F4] py-1.5 px-3 rounded-full transition-colors duration-150 border border-[#E0DEDB] dark:border-[#44403C] text-left shadow-sm hover:shadow"
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="inline-flex items-center gap-1 px-3.5 py-3 rounded-2xl rounded-bl-md bg-[#F5F5F4] dark:bg-[#292524]">
              <span className="h-1.5 w-1.5 bg-[#A8A29E] dark:bg-[#78716C] rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
              <span className="h-1.5 w-1.5 bg-[#A8A29E] dark:bg-[#78716C] rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
              <span className="h-1.5 w-1.5 bg-[#A8A29E] dark:bg-[#78716C] rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-[#E0DEDB]/60 dark:border-[#44403C]/60 bg-[#FAFAF9] dark:bg-[#1C1917]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow px-3.5 py-2 rounded-full bg-white dark:bg-[#292524] border border-[#E0DEDB] dark:border-[#44403C] text-[13px] text-[#37322F] dark:text-[#F5F5F4] placeholder-[#A8A29E] dark:placeholder-[#78716C] focus:outline-none focus:border-[#37322F]/30 dark:focus:border-[#A8A29E]/30 transition-colors"
            placeholder={placeholder}
          />
          <motion.button
            type="submit"
            className="w-9 h-9 rounded-full text-white flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-90"
            style={buttonStyle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Send size={15} className="-translate-x-[1px]" />
          </motion.button>
        </form>
      </div>

      {/* Feedback prompt */}
      {!hasFeedback && !showFeedback && messages.length > 1 && (
        <div className="px-4 py-2 border-t border-[#E0DEDB]/60 dark:border-[#44403C]/60 text-center">
          <button
            onClick={handleFeedbackClick}
            className="text-[11px] text-[#A8A29E] dark:text-[#78716C] hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors duration-200"
          >
            Was this helpful? Give feedback
          </button>
        </div>
      )}
      {showFeedback && !hasFeedback && (
        <div className="px-4 py-2.5 border-t border-[#E0DEDB]/60 dark:border-[#44403C]/60 flex justify-center items-center gap-4">
          <button
            onClick={(e) => handleFeedback(true, e)}
            className="flex items-center gap-1 text-[12px] text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200"
          >
            <ThumbsUp size={14} />
            <span>Helpful</span>
          </button>
          <div className="w-px h-4 bg-[#E0DEDB] dark:bg-[#44403C]"></div>
          <button
            onClick={(e) => handleFeedback(false, e)}
            className="flex items-center gap-1 text-[12px] text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
          >
            <ThumbsDown size={14} />
            <span>Not helpful</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="py-2 border-t border-[#E0DEDB]/60 dark:border-[#44403C]/60 text-center text-[10px] text-[#A8A29E] dark:text-[#78716C] bg-[#FAFAF9] dark:bg-[#1C1917] rounded-b-2xl">
        Powered by{" "}
        <a
          href="https://askio.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#605A57] dark:text-[#A8A29E] hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors"
        >
          Askio
        </a>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {isEmbedded ? (isOpen ? chatbotContent : chatbotButton) : chatbotContent}
    </AnimatePresence>
  );
};

export default Chatbot;
