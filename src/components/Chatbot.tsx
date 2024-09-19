import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  text: string;
  sender: "user" | "bot";
};

export interface ChatbotProps {
  id: string;
  title: string;
  primaryColor: string; // This can now be either a hex color or a linear-gradient
  secondaryColor: string;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  initialMessage: string;
  placeholder: string;
  faqData: Array<{ question: string; answer: string }>;
  isEmbedded?: boolean;
  isPreview?: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({
  title,
  primaryColor,
  secondaryColor,
  position,
  initialMessage,
  placeholder,
  faqData,
  isEmbedded,
  isPreview,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { text: initialMessage, sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(!isEmbedded);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Initialize suggestions with all FAQ questions
    setSuggestions(faqData.map((faq) => faq.question));
  }, [faqData]);

  const handleSend = () => {
    if (input.trim() === "") return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setShowSuggestions(false);
    setInput("");

    const matchedFaq = faqData.find(
      (item) => item.question.toLowerCase() === input.toLowerCase()
    );

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
    "bottom-right": isEmbedded ? "bottom-0 right-0" : "bottom-4 right-4",
    "bottom-left": isEmbedded ? "bottom-0 left-0" : "bottom-4 left-4",
    "top-right": isEmbedded ? "top-0 right-0" : "top-4 right-4",
    "top-left": isEmbedded ? "top-0 left-0" : "top-4 left-4",
  };

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

  const chatbotButton = (
    <motion.button
      onClick={toggleChatbot}
      className={`fixed ${positionClasses[position]} z-50 w-16 h-16 flex items-center justify-center text-white rounded-full shadow-lg transition-all duration-300 overflow-hidden`}
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
      <MessageSquare size={24} className="text-white" />
    </motion.button>
  );

  const chatbotContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`${
        isEmbedded ? `fixed ${positionClasses[position]} z-50` : "w-full h-full"
      } bg-white flex flex-col shadow-lg rounded-lg ${
        !isEmbedded && isPreview ? "" : ""
      } ${isEmbedded ? "w-[320px] h-[450px]" : ""}`}
    >
      <div
        className="text-white p-4 flex items-center justify-between rounded-t-lg"
        style={headerStyle}
      >
        <div className="flex items-center">
          <MessageSquare className="mr-2" />
          <h2 className="font-bold">{title}</h2>
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
          {messages.length === 1 && showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <p className="text-sm text-gray-600 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleSuggestionClick(e, question)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded-lg transition-colors duration-200 border border-gray-300"
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={placeholder}
          />
          <motion.button
            type="submit"
            className="text-white p-2 rounded-r-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            style={buttonStyle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send size={20} />
          </motion.button>
        </form>
      </div>
      <div className="p-2 border-t text-center text-xs font-semibold text-gray-500 bg-gray-50">
        Powered by{" "}
        <a
          href="https://askio.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          style={{ color: primaryColor }}
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
