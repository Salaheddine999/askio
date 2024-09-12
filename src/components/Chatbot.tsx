import React, { useState, useEffect } from "react";
import { MessageSquare, Send, X } from "lucide-react";

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

  useEffect(() => {
    // Initialize suggestions with all FAQ questions
    setSuggestions(faqData.map((faq) => faq.question));
  }, [faqData]);

  const handleSend = () => {
    if (input.trim() === "") return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setShowSuggestions(false);

    const matchedFaq = faqData.find(
      (item) => item.question.toLowerCase() === input.toLowerCase()
    );

    if (matchedFaq) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot" },
        ]);
      }, 500);
    } else {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: "I'm sorry, I don't have an answer for that. Here are some related questions:",
            sender: "bot",
          },
        ]);
        setTimeout(() => {
          setShowSuggestions(true);
          updateSuggestions(input);
        }, 100);
      }, 500);
    }

    setInput("");
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
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { text: matchedFaq.answer, sender: "bot" },
        ]);
        setShowSuggestions(false);
      }, 500);
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

  const chatbotButton = (
    <button
      onClick={toggleChatbot}
      className={`fixed ${positionClasses[position]} z-50 w-14 h-14 flex items-center justify-center bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200`}
      style={{ backgroundColor: primaryColor }}
    >
      <MessageSquare size={20} />
    </button>
  );

  const chatbotContent = (
    <div
      className={`${
        isEmbedded ? `fixed ${positionClasses[position]} z-50` : "w-full h-full"
      } bg-white flex flex-col shadow-lg rounded-[10px] ${
        !isEmbedded && isPreview ? "" : ""
      } ${isEmbedded ? "w-[370px] h-[520px] max-w-[370px] max-h-[520px]" : ""}`}
    >
      <div
        className="text-white p-4 flex items-center justify-between rounded-t-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center">
          <MessageSquare className="mr-2" />
          <h2 className="font-bold">{title}</h2>
        </div>
        {isEmbedded && (
          <button onClick={toggleChatbot} className="text-white">
            <X size={20} />
          </button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <div
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <span
                className={`inline-block p-2 rounded-[10px] max-w-[80%] ${
                  message.sender === "user"
                    ? "text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
                style={
                  message.sender === "user"
                    ? { backgroundColor: secondaryColor }
                    : {}
                }
              >
                {message.text}
              </span>
            </div>
            {index === messages.length - 1 && showSuggestions && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  Here are some suggestions:
                </p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {suggestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleSuggestionClick(e, question)}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded-[10px] transition-colors duration-200 border border-gray-300"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-grow p-2 border rounded-l-lg focus:outline-none"
            placeholder={placeholder}
          />
          <button
            onClick={handleSend}
            className="text-white p-2 rounded-r-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            style={{ backgroundColor: secondaryColor }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      <div className="p-2 border-t text-center text-xs font-semibold text-gray-500 bg-gray-50">
        Powered by{" "}
        <a href="https://askio.vercel.app/" style={{ color: primaryColor }}>
          Askio
        </a>
      </div>
    </div>
  );

  return isEmbedded
    ? isOpen
      ? chatbotContent
      : chatbotButton
    : chatbotContent;
};

export default Chatbot;
