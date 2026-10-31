import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../utils/db";
import { doc, getDoc } from "firebase/firestore";
import Chatbot, { ChatbotProps } from "../components/Chatbot";
import { isLauncherStyle } from "../utils/orbColors";
import { useLeftToRight } from "../i18n";

const ChatbotEmbed: React.FC = () => {
  // The widget keeps the corner the owner chose; its text sets its own direction.
  useLeftToRight();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  // The embed code can override saved settings with ?launcher= and ?greeting=.
  const launcherOverride = searchParams.get("launcher");
  const greetingOverride = searchParams.get("greeting");
  const [config, setConfig] = useState<ChatbotProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (id) {
        try {
          const docRef = doc(db, "chatbot_configs", id);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            throw new Error("No such document!");
          }

          const saved = { id: docSnap.id, ...docSnap.data() } as ChatbotProps;
          setConfig({
            ...saved,
            launcherStyle: isLauncherStyle(launcherOverride)
              ? launcherOverride
              : isLauncherStyle(saved.launcherStyle)
                ? saved.launcherStyle
                : "classic",
            greetingBubble:
              greetingOverride === "1" ? true : greetingOverride === "0" ? false : saved.greetingBubble === true,
          });
        } catch (err) {
          console.error("Error fetching chatbot config:", err);
          setError("Failed to load chatbot configuration");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchConfig();
  }, [id, launcherOverride, greetingOverride]);

  useEffect(() => {
    // Tell the embedding page the chatbot is ready, with only what it needs
    // to place the launcher. The page is any website, so nothing else is sent.
    if (config) {
      const { isActive, suspended, position, launcherStyle } = config;
      window.parent.postMessage({ type: "chatbotReady", config: { isActive, suspended, position, launcherStyle } }, "*");
    }
  }, [config]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!config) return <div>No configuration found</div>;

  if (config.isActive === false || config.suspended === true) return null;

  return (
    <div style={{ width: "100%", height: "100%", background: "transparent" }}>
      <Chatbot {...config} isEmbedded={true} />
    </div>
  );
};

export default ChatbotEmbed;
