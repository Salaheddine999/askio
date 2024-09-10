import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Chatbot, { ChatbotProps } from "./Chatbot";
import { supabase } from "../utils/supabase";

const ChatbotIframeContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<ChatbotProps | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (id) {
        const { data, error } = await supabase
          .from("chatbot_configs")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching chatbot config:", error);
        } else {
          setConfig(data);
        }
      }
    };

    fetchConfig();
  }, [id]);

  useEffect(() => {
    const sendHeight = () => {
      window.parent.postMessage(
        { type: "chatbotHeight", height: document.body.scrollHeight },
        "*"
      );
    };

    window.addEventListener("resize", sendHeight);
    sendHeight();

    return () => window.removeEventListener("resize", sendHeight);
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  return <Chatbot {...config} />;
};

export default ChatbotIframeContent;
