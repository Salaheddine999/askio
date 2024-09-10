import React, { useEffect, useRef } from "react";

interface IframeChatbotProps {
  chatbotId: string;
}

const IframeChatbot: React.FC<IframeChatbotProps> = ({ chatbotId }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "chatbotHeight") {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={`/chatbot/${chatbotId}`}
      style={{ width: "100%", border: "none", overflow: "hidden" }}
      title="Chatbot"
    />
  );
};

export default IframeChatbot;
