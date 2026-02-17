import React from "react";
import ChatbotConfigurator from "../components/ChatbotConfigurator";

const Configure: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-[#F7F5F3] dark:bg-[#1C1917] min-h-screen">
      <h1 className="text-4xl font-bold mb-4 text-[#37322F] dark:text-[#F5F5F4] font-serif">Configure Your Chatbot</h1>
      <ChatbotConfigurator />
    </div>
  );
};

export default Configure;
