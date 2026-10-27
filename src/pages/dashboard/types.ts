export interface Chatbot {
  id: string;
  title: string;
  position: string;
  isActive?: boolean;
  aiEnabled?: boolean;
  /** Solid hex or a CSS linear-gradient, as saved by the editor. */
  primaryColor?: string;
  /** The widget's launcher: the chat-bubble button ("classic", the default) or the Kio orb. */
  launcherStyle?: "classic" | "orb";
  initialMessage?: string;
  faqData?: unknown[];
  createdAt: Date;
  lastUpdated: Date;
  /** When the widget first loaded on a website; null until it has. */
  installedAt?: Date | null;
  /** The site it last loaded on, e.g. "shop.example". */
  lastSeenHost?: string;
}

export interface FeedbackCounts {
  positive: number;
  negative: number;
}

export interface TrendData {
  value: string;
  direction: "up" | "down" | "neutral";
}

export interface NotificationItem {
  id: string;
  type: "lead" | "unanswered" | "positive_feedback" | "negative_feedback";
  title: string;
  description: string;
  timestamp: Date;
  chatbotName: string;
}

export type SortKey = "title" | "createdAt" | "lastUpdated";
export type SortOrder = "asc" | "desc";

export interface ChatbotActions {
  onEdit: (id: string) => void;
  onEmbed: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (chatbot: Chatbot) => void;
}

export const EMPTY_FEEDBACK: FeedbackCounts = { positive: 0, negative: 0 };
