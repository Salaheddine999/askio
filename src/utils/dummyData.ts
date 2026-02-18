export const DUMMY_CHATBOTS = [
  {
    id: "dummy-1",
    title: "Customer Support Bot",
    position: "bottom-right",
    isActive: true,
    createdAt: new Date("2023-01-15T10:00:00"),
    lastUpdated: new Date("2023-02-10T14:30:00"),
  },
  {
    id: "dummy-2",
    title: "Sales Assistant",
    position: "bottom-right",
    isActive: true,
    createdAt: new Date("2023-01-20T09:00:00"),
    lastUpdated: new Date("2023-02-12T11:15:00"),
  },
  {
    id: "dummy-3",
    title: "Onboarding Helper",
    position: "bottom-left",
    isActive: false,
    createdAt: new Date("2023-02-01T15:45:00"),
    lastUpdated: new Date("2023-02-14T16:20:00"),
  },
  {
    id: "dummy-4",
    title: "Product Recommender",
    position: "bottom-right",
    isActive: true,
    createdAt: new Date("2023-02-05T11:30:00"),
    lastUpdated: new Date("2023-02-15T10:00:00"),
  },
  {
    id: "dummy-5",
    title: "Lead Gen Bot",
    position: "bottom-right",
    isActive: true,
    createdAt: new Date("2023-02-08T13:00:00"),
    lastUpdated: new Date("2023-02-16T09:45:00"),
  },
  {
    id: "dummy-6",
    title: "Feedback Collector",
    position: "bottom-left",
    isActive: true,
    createdAt: new Date("2023-02-10T14:00:00"),
    lastUpdated: new Date("2023-02-17T11:00:00"),
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
