import React from "react";
import ChatbotConfigurator from "../components/ChatbotConfigurator";

const Configure: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Configure Your Chatbot</h1>
      <ChatbotConfigurator />
    </div>
  );
};

export default Configure;
