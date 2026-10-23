import React from "react";
import ChatbotConfigurator from "../components/ChatbotConfigurator";

const Configure: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 bg-[#F3F7FC] dark:bg-[#141D2B] min-h-screen">
      <h1 className="text-h1 font-bold mb-4 text-[#101723] dark:text-[#D7DFE5] font-serif">Configure Your Chatbot</h1>
      <ChatbotConfigurator />
    </div>
  );
};

export default Configure;
