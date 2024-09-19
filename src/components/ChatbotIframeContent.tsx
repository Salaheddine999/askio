import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import Chatbot, { ChatbotProps } from "./Chatbot";

const ChatbotIframeContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<ChatbotProps | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (id) {
        try {
          const docRef = doc(db, "chatbot_configs", id);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            throw new Error("No such document!");
          }

          setConfig({ id: docSnap.id, ...docSnap.data() } as ChatbotProps);
        } catch (error) {
          console.error("Error fetching chatbot config:", error);
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
