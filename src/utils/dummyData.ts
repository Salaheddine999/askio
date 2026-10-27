const daysAgo = (days: number, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000);

const faqs = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ question: `Question ${i + 1}`, answer: "Answer" }));

export const DUMMY_CHATBOTS = [
  {
    id: "dummy-1",
    title: "Customer Support Bot",
    position: "bottom-right",
    isActive: true,
    aiEnabled: true,
    primaryColor: "#101723",
    launcherStyle: "orb" as const,
    initialMessage: "Hi there! Ask me anything about your order.",
    faqData: faqs(24),
    createdAt: daysAgo(96),
    lastUpdated: daysAgo(0, 2),
    installedAt: daysAgo(30),
  },
  {
    id: "dummy-2",
    title: "Sales Assistant",
    position: "bottom-right",
    isActive: true,
    primaryColor: "#2563EB",
    launcherStyle: "classic" as const,
    initialMessage: "Looking for the right plan? I can help you compare.",
    faqData: faqs(12),
    createdAt: daysAgo(80),
    lastUpdated: daysAgo(1, 4),
    installedAt: daysAgo(30),
  },
  {
    id: "dummy-3",
    title: "Onboarding Helper",
    position: "bottom-left",
    isActive: false,
    primaryColor: "linear-gradient(135deg, #7C6AF7, #E8B4D4)",
    launcherStyle: "orb" as const,
    initialMessage: "Welcome aboard! Let's get you set up.",
    faqData: faqs(8),
    createdAt: daysAgo(54),
    lastUpdated: daysAgo(6),
    installedAt: daysAgo(30),
  },
  {
    id: "dummy-4",
    title: "Product Recommender",
    position: "bottom-right",
    isActive: true,
    aiEnabled: true,
    primaryColor: "#0F766E",
    launcherStyle: "classic" as const,
    initialMessage: "Tell me what you need and I'll suggest a product.",
    faqData: faqs(31),
    createdAt: daysAgo(40),
    lastUpdated: daysAgo(2),
    installedAt: daysAgo(30),
  },
  {
    id: "dummy-5",
    title: "Lead Gen Bot",
    position: "bottom-right",
    isActive: true,
    primaryColor: "#EA580C",
    launcherStyle: "classic" as const,
    initialMessage: "Want a free demo? Leave your email and we'll reach out.",
    faqData: faqs(5),
    createdAt: daysAgo(21),
    lastUpdated: daysAgo(9),
    installedAt: daysAgo(30),
  },
  {
    id: "dummy-6",
    title: "Feedback Collector",
    position: "bottom-left",
    isActive: true,
    primaryColor: "#E8EDF4",
    launcherStyle: "orb" as const,
    initialMessage: "How was your experience today?",
    faqData: [],
    createdAt: daysAgo(12),
    lastUpdated: daysAgo(0, 20),
  },
];

export const DUMMY_FEEDBACK_COUNTS = {
  "dummy-1": { positive: 150, negative: 12 },
  "dummy-2": { positive: 85, negative: 5 },
  "dummy-3": { positive: 45, negative: 2 },
  "dummy-4": { positive: 120, negative: 18 },
  "dummy-5": { positive: 60, negative: 8 },
  "dummy-6": { positive: 30, negative: 1 },
};

export const DUMMY_RECENT_ACTIVITY = [
  {
    id: "act-1",
    chatbotName: "Customer Support Bot",
    type: "positive" as const,
    date: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
  },
  {
    id: "act-2",
    chatbotName: "Sales Assistant",
    type: "positive" as const,
    date: new Date(Date.now() - 1000 * 60 * 25), // 25 mins ago
  },
  {
    id: "act-3",
    chatbotName: "Product Recommender",
    type: "negative" as const,
    date: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: "act-4",
    chatbotName: "Lead Gen Bot",
    type: "positive" as const,
    date: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
  },
  {
    id: "act-5",
    chatbotName: "Customer Support Bot",
    type: "positive" as const,
    date: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
  },
];

export const DUMMY_NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "lead" as const,
    title: "New Lead Captured",
    description: "Email provided: sarah@company.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 3), // 3 mins ago
    chatbotName: "Sales Assistant",
  },
  {
    id: "notif-2",
    type: "unanswered" as const,
    title: "Unanswered Query",
    description: 'Failed to answer: "Do you offer bulk pricing?"',
    timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12 mins ago
    chatbotName: "Customer Support Bot",
  },
  {
    id: "notif-3",
    type: "positive_feedback" as const,
    title: "Positive Feedback",
    description: "Received a positive rating.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    chatbotName: "Product Recommender",
  },
  {
    id: "notif-4",
    type: "lead" as const,
    title: "New Lead Captured",
    description: "Email provided: john.doe@example.com",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    chatbotName: "Lead Gen Bot",
  },
  {
    id: "notif-5",
    type: "negative_feedback" as const,
    title: "Negative Feedback",
    description: "Received a negative rating.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    chatbotName: "Onboarding Helper",
  },
  {
    id: "notif-6",
    type: "unanswered" as const,
    title: "Unanswered Query",
    description: 'Failed to answer: "How do I reset my password?"',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    chatbotName: "Customer Support Bot",
  },
  {
    id: "notif-7",
    type: "lead" as const,
    title: "New Lead Captured",
    description: "Email provided: mike@startup.io",
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    chatbotName: "Sales Assistant",
  },
  {
    id: "notif-8",
    type: "positive_feedback" as const,
    title: "Positive Feedback",
    description: "Received a positive rating.",
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    chatbotName: "Customer Support Bot",
  },
  {
    id: "notif-9",
    type: "unanswered" as const,
    title: "Unanswered Query",
    description: 'Failed to answer: "What integrations do you support?"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    chatbotName: "Sales Assistant",
  },
  {
    id: "notif-10",
    type: "lead" as const,
    title: "New Lead Captured",
    description: "Email provided: emma@design.co",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    chatbotName: "Feedback Collector",
  },
  {
    id: "notif-11",
    type: "unanswered" as const,
    title: "Unanswered Query",
    description: 'Failed to answer: "Can I export my data?"',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    chatbotName: "Product Recommender",
  },
  {
    id: "notif-12",
    type: "positive_feedback" as const,
    title: "Positive Feedback",
    description: "Received a positive rating.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    chatbotName: "Lead Gen Bot",
  },
];
