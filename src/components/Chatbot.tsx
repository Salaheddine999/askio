import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, X, ThumbsUp, ThumbsDown } from "lucide-react";
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
  isPreview,
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
      } bg-white flex flex-col shadow-lg rounded-lg ${
        !isEmbedded && isPreview ? "" : ""
      } ${isEmbedded ? "w-[350px] h-[520px]" : ""}`}
    >
      <div
        className="text-white p-4 flex items-center justify-between rounded-t-lg"
        style={headerStyle}
      >
        <div className="flex items-center">
          <div className="relative mr-2">
            <Bot className="w-8 h-8" />
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full"></div>
          </div>

          <div className="flex flex-col">
            <h2 className="font-semibold text-lg">{title}</h2>
            <p className="text-sm text-white opacity-90">Ask me a question</p>
          </div>
        </div>

        {isEmbedded && (
          <button
            onClick={toggleChatbot}
            className="text-white hover:text-gray-200 transition-colors duration-200"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <span
                className={`inline-block p-2 rounded-lg max-w-[80%] ${
                  message.sender === "user"
                    ? "text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
                style={message.sender === "user" ? userMessageStyle : {}}
              >
                {message.text}
              </span>
            </motion.div>
          ))}
          {showSuggestions &&
            messages.length > 0 &&
            messages[messages.length - 1]?.sender === "bot" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <div className="flex flex-col space-y-2">
                  {suggestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleSuggestionClick(e, question)}
                      className="text-sm bg-gray-100 w-fit hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg transition-colors duration-200 border border-gray-300 text-left"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex justify-start"
          >
            <span className="inline-block p-2 rounded-lg bg-gray-200 text-gray-800">
              <div className="flex items-center h-5">
                <span className="h-1.5 w-1.5 bg-gray-600 rounded-full mr-1 animate-bounce"></span>
                <span
                  className="h-1.5 w-1.5 bg-gray-600 rounded-full mr-1 animate-bounce"
                  style={{ animationDelay: "-0.3s" }}
                ></span>
                <span
                  className="h-1.5 w-1.5 bg-gray-600 rounded-full animate-bounce"
                  style={{ animationDelay: "-0.15s" }}
                ></span>
              </div>
            </span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <form onSubmit={handleSend} className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow p-2 border rounded-l-lg focus:outline-none"
            placeholder={placeholder}
          />
          <motion.button
            type="submit"
            className="text-white p-2 rounded-r-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            style={buttonStyle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Send size={20} />
          </motion.button>
        </form>
      </div>
      {!hasFeedback && !showFeedback && messages.length > 1 && (
        <div className="p-2 border-t text-center">
          <button
            onClick={handleFeedbackClick}
            className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          >
            Was this conversation helpful? Provide feedback
          </button>
        </div>
      )}
      {showFeedback && !hasFeedback && (
        <div className="p-4 border-t flex justify-center items-center space-x-4">
          <button
            onClick={(e) => handleFeedback(true, e)}
            className="flex items-center text-green-500 hover:text-green-700 transition-colors duration-200"
          >
            <ThumbsUp size={20} className="mr-1" />
            <span>Helpful</span>
          </button>
          <button
            onClick={(e) => handleFeedback(false, e)}
            className="flex items-center text-red-500 hover:text-red-700 transition-colors duration-200"
          >
            <ThumbsDown size={20} className="mr-1" />
            <span>Not Helpful</span>
          </button>
        </div>
      )}
      <div className="p-2 border-t text-center text-xs font-semibold text-gray-500 bg-gray-50">
        Powered by{" "}
        <a
          href="https://askio.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-indigo-500 text-gray-600"
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
