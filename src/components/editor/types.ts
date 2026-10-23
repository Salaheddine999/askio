import type { ChatbotProps } from "../Chatbot";

export interface ChatbotConfig extends ChatbotProps {
  name: string;
}

export type ConfigChange = <K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) => void;

export type Plan = "free" | "pro" | "enterprise";

export const LIMITS = {
  name: 60,
  title: 40,
  initialMessage: 300,
  placeholder: 60,
  question: 300,
  answer: 2000,
  persona: 1500,
} as const;
