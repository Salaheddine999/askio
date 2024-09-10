import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../utils/supabase";
import Chatbot, { ChatbotProps } from "../components/Chatbot";

const ChatbotEmbed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<ChatbotProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (id) {
        try {
          const { data, error } = await supabase
            .from("chatbot_configs")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;

          setConfig(data as ChatbotProps);
        } catch (err) {
          console.error("Error fetching chatbot config:", err);
          setError("Failed to load chatbot configuration");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchConfig();
  }, [id]);

  useEffect(() => {
    // Notify parent window that the chatbot is ready
    if (config) {
      window.parent.postMessage({ type: "chatbotReady", config }, "*");
    }
  }, [config]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!config) return <div>No configuration found</div>;

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Chatbot {...config} isEmbedded={true} />
    </div>
  );
};

export default ChatbotEmbed;
