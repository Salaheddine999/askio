import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../utils/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  PlusCircle,
  Search,
  Grid,
  List,
  Filter,
  ChevronLeft,
  ChevronRight,
  Bot,
  Info,
  LoaderCircle,
  Download,
  RefreshCw,
  Check,
  ArrowUp,
  ArrowDown,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  UserPlus,
  HelpCircle,
  Clock
} from "lucide-react";
import { format, subDays, isBefore } from "date-fns";
import ConfirmationModal from "../components/ConfirmationModal";
import { toast } from "react-hot-toast";
import { Transition } from "@headlessui/react";
import { useModal } from "../hooks/useModal";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/Button";
import Input from "../components/Input";
import StatsCard from "../components/StatsCard";
import Tabs from "../components/Tabs";
import ChatbotCard from "../components/ChatbotCard";
import OverviewChart from "../components/OverviewChart";
import RecentActivity, { ActivityItem } from "../components/RecentActivity";
import { useCollection } from "react-firebase-hooks/firestore";
import { DUMMY_CHATBOTS, DUMMY_FEEDBACK_COUNTS, DUMMY_RECENT_ACTIVITY, DUMMY_NOTIFICATIONS } from "../utils/dummyData";
import { Helmet } from "react-helmet-async";

interface Chatbot {
  id: string;
  title: string;
  position: string;
  isActive?: boolean;
  aiEnabled?: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

interface FeedbackCounts {
  positive: number;
  negative: number;
}

interface TrendData {
  value: string;
  direction: "up" | "down" | "neutral";
}

interface NotificationItem {
  id: string;
  type: "lead" | "unanswered" | "positive_feedback" | "negative_feedback";
  title: string;
  description: string;
  timestamp: Date;
  chatbotName: string;
}

interface DashboardProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  testMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ toggleSidebar, testMode }) => {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deleteModal = useModal();
  const embedModal = useModal();
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(
    null
  );
  const [feedbackCounts, setFeedbackCounts] = useState<{
    [key: string]: FeedbackCounts;
  }>({});
  const [feedbackSnapshot] = useCollection(query(collection(db, "feedback")));
  const [totalFeedback, setTotalFeedback] = useState<number>(0);
  const [satisfactionRate, setSatisfactionRate] = useState<number>(0);
  const [trends, setTrends] = useState<{
    chatbots: TrendData;
    feedback: TrendData;
    satisfaction: TrendData;
    avgFeedback: TrendData;
  }>({
    chatbots: { value: "0%", direction: "neutral" },
    feedback: { value: "0%", direction: "neutral" },
    satisfaction: { value: "0%", direction: "neutral" },
    avgFeedback: { value: "0", direction: "neutral" },
  });
  const [activeTab, setActiveTab] = useState<"overview" | "chatbots" | "reports" | "notifications">(
    "overview"
  );
  const [sortBy, setSortBy] = useState<"title" | "createdAt" | "lastUpdated">(
    "title"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [chatbotsPerPage] = useState(6);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const [isGeneratingLeadReport, setIsGeneratingLeadReport] = useState(false);
  const [isGeneratingQueryReport, setIsGeneratingQueryReport] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsFetched, setNotificationsFetched] = useState(false);
  const [notificationsCurrentPage, setNotificationsCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);

  // Reset pagination when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (testMode) {
      // Load dummy data
      setChatbots(DUMMY_CHATBOTS);
      setFeedbackCounts(DUMMY_FEEDBACK_COUNTS);
      
      let totalPos = 0;
      let totalNeg = 0;
      Object.values(DUMMY_FEEDBACK_COUNTS).forEach((count: FeedbackCounts) => {
        totalPos += count.positive;
        totalNeg += count.negative;
      });
      
      setTotalFeedback(totalPos + totalNeg);
      setSatisfactionRate(
        (totalPos + totalNeg) > 0 ? (totalPos / (totalPos + totalNeg)) * 100 : 0
      );
      setRecentActivities(DUMMY_RECENT_ACTIVITY);
      setNotifications(DUMMY_NOTIFICATIONS);
      setNotificationsFetched(true);
      setHasUnseenNotifications(true);
      setLoading(false);
    } else {
      // Fetch real data
      fetchChatbots();
    }
  }, [testMode]);

  // Fetch notifications when chatbots are loaded (eager, so badge works on all tabs)
  useEffect(() => {
    if (!notificationsFetched && chatbots.length > 0) {
        fetchNotifications();
    }
  }, [chatbots, notificationsFetched]);

  const fetchNotifications = async () => {
     if (testMode || chatbots.length === 0) return;
     setLoadingNotifications(true);
     try {
        const user = auth.currentUser;
        if (!user) return;

        const chatbotIds = chatbots.map(c => c.id);
        const chatbotMap = new Map(chatbots.map(c => [c.id, c.title]));

        let allNotifications: NotificationItem[] = [];
        const batchSize = 10;
        
        // Fetch in batches to respect Firestore "in" limit
        for (let i = 0; i < chatbotIds.length; i += batchSize) {
           const batchIds = chatbotIds.slice(i, i + batchSize);
           
           // Fetch Leads
           const leadsQuery = query(collection(db, "leads"), where("chatbotId", "in", batchIds));
           const leadsSnap = await getDocs(leadsQuery);

           const leads = leadsSnap.docs.map(d => {
              const data = d.data();
              return {
                 id: d.id,
                 type: "lead" as const,
                 title: "New Lead Captured",
                 description: `Email provided: ${data.email}`,
                 timestamp: data.timestamp?.toDate?.() || data.createdAt?.toDate?.() || new Date(0),
                 chatbotName: chatbotMap.get(data.chatbotId) || "Unknown Bot"
              };
           });

           // Fetch Unanswered Queries
           const queryQuery = query(collection(db, "unanswered_queries"), where("chatbotId", "in", batchIds));
           const querySnap = await getDocs(queryQuery);

           const queries = querySnap.docs.map(d => {
              const data = d.data();
              return {
                 id: d.id,
                 type: "unanswered" as const,
                 title: "Unanswered Query",
                 description: `Failed to answer: "${data.query}"`,
                 timestamp: data.timestamp?.toDate?.() || data.createdAt?.toDate?.() || new Date(0),
                 chatbotName: chatbotMap.get(data.chatbotId) || "Unknown Bot"
              };
           });

           allNotifications = [...allNotifications, ...leads, ...queries];
        }

        // Add feedback activities if they exist in state
        const feedbackNotifs = recentActivities.map(act => ({
           id: act.id,
           type: act.type === "positive" ? "positive_feedback" as const : "negative_feedback" as const,
           title: act.type === "positive" ? "Positive Feedback" : "Negative Feedback",
           description: `Received a ${act.type} rating.`,
           timestamp: act.date,
           chatbotName: act.chatbotName
        }));

        allNotifications = [...allNotifications, ...feedbackNotifs];

        // Sort by newest first
        allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Cap at 200 to prevent massive memory usage, but we'll paginate them
        setNotifications(allNotifications.slice(0, 200));
        setNotificationsFetched(true);
        setNotificationsCurrentPage(1); // Reset to first page on fetch

        // Check for unseen notifications
        const lastSeenStr = localStorage.getItem('askio_notifications_last_seen');
        const lastSeen = lastSeenStr ? new Date(lastSeenStr) : new Date(0);
        const hasUnseen = allNotifications.some(n => n.timestamp.getTime() > lastSeen.getTime());
        setHasUnseenNotifications(hasUnseen);
     } catch (error) {
        console.error("Error fetching notifications:", error);
        toast.error("Failed to load notifications.");
     } finally {
        setLoadingNotifications(false);
     }
  };

  // Calculate notifications pagination
  const indexOfLastNotification = notificationsCurrentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = notifications.slice(
    indexOfFirstNotification,
    indexOfLastNotification
  );

  const paginateNotifications = (pageNumber: number) => setNotificationsCurrentPage(pageNumber);

  useEffect(() => {
    if (testMode) return; // Skip real data processing in test mode

    if (feedbackSnapshot && chatbots.length > 0) {
      const newFeedbackCounts: { [key: string]: FeedbackCounts } = {};
      let totalPositive = 0;
      let totalNegative = 0;
      const activities: ActivityItem[] = [];

      // Sort feedback by date descending
      const sortedDocs = [...feedbackSnapshot.docs].sort((a, b) => {
          const dateA = a.data().timestamp?.toDate() || new Date(0);
          const dateB = b.data().timestamp?.toDate() || new Date(0);
          return dateB.getTime() - dateA.getTime();
      });

      sortedDocs.forEach((doc) => {
        const data = doc.data();
        const chatbot = chatbots.find((c) => c.id === data.chatbotId);

        // Only process feedback for current user's chatbots
        if (chatbot) {
          if (!newFeedbackCounts[data.chatbotId]) {
            newFeedbackCounts[data.chatbotId] = { positive: 0, negative: 0 };
          }
          if (data.isPositive) {
            newFeedbackCounts[data.chatbotId].positive++;
            totalPositive++;
          } else {
            newFeedbackCounts[data.chatbotId].negative++;
            totalNegative++;
          }

          // Add to recent activities (limit to 5)
          if (activities.length < 5) {
              activities.push({
                  id: doc.id,
                  chatbotName: chatbot.title,
                  type: data.isPositive ? "positive" : "negative",
                  date: data.timestamp?.toDate() || new Date(0),
              });
          }
        }
      });

      setFeedbackCounts(newFeedbackCounts);
      setTotalFeedback(totalPositive + totalNegative);
      setSatisfactionRate(
        totalPositive + totalNegative > 0
          ? (totalPositive / (totalPositive + totalNegative)) * 100
          : 0
      );
      setRecentActivities(activities);

      // --- Trend Calculations ---
      const thirtyDaysAgo = subDays(new Date(), 30);

      // 1. Chatbots Trend
      const previousChatbotsCount = chatbots.filter(c => isBefore(c.createdAt, thirtyDaysAgo)).length;
      const currentChatbotsCount = chatbots.length;
      // For "Total", typical trend is growth rate: (Current - Prev) / Prev
      // If Prev is 0, we can't divide. If Current > 0, it's 100% growth (effectively).
      let chatbotsTrendValue = 0;
      if (previousChatbotsCount > 0) {
        chatbotsTrendValue = ((currentChatbotsCount - previousChatbotsCount) / previousChatbotsCount) * 100;
      } else if (currentChatbotsCount > 0) {
        chatbotsTrendValue = 100;
      }

      // 2. Feedback Trend
      // We need to filter feedback snapshot for previous period
      const previousPeriodFeedback = sortedDocs.filter(doc => {
          const ts = doc.data().timestamp?.toDate();
          return ts && isBefore(ts, thirtyDaysAgo);
      });
      const previousTotalFeedback = previousPeriodFeedback.length;
      const currentTotalFeedback = totalPositive + totalNegative;
      
      let feedbackTrendValue = 0;
      if (previousTotalFeedback > 0) {
        feedbackTrendValue = ((currentTotalFeedback - previousTotalFeedback) / previousTotalFeedback) * 100;
      } else if (currentTotalFeedback > 0) {
        feedbackTrendValue = 100;
      }

      // 3. Satisfaction Trend
      let previousPos = 0;
      let previousNeg = 0;
      previousPeriodFeedback.forEach(doc => {
           if (doc.data().isPositive) previousPos++;
           else previousNeg++;
      });
      const previousSatisfaction = (previousPos + previousNeg) > 0 
        ? (previousPos / (previousPos + previousNeg)) * 100 
        : 0;
      const currentSatisfaction = (totalPositive + totalNegative) > 0
          ? (totalPositive / (totalPositive + totalNegative)) * 100
          : 0;
      const satisfactionTrendDiff = currentSatisfaction - previousSatisfaction; // Absolute percentage point difference

      // 4. Avg Feedback Trend
      const previousAvg = previousChatbotsCount > 0 ? (previousTotalFeedback / previousChatbotsCount) : 0;
      const currentAvg = currentChatbotsCount > 0 ? (currentTotalFeedback / currentChatbotsCount) : 0;
      const avgDiff = currentAvg - previousAvg;

      setTrends({
        chatbots: {
            value: `${chatbotsTrendValue >= 0 ? "+" : ""}${chatbotsTrendValue.toFixed(0)}%`,
            direction: chatbotsTrendValue > 0 ? "up" : chatbotsTrendValue < 0 ? "down" : "neutral"
        },
        feedback: {
            value: `${feedbackTrendValue >= 0 ? "+" : ""}${feedbackTrendValue.toFixed(0)}%`,
            direction: feedbackTrendValue > 0 ? "up" : feedbackTrendValue < 0 ? "down" : "neutral"
        },
        satisfaction: {
            value: `${satisfactionTrendDiff >= 0 ? "+" : ""}${satisfactionTrendDiff.toFixed(0)}%`,
            direction: satisfactionTrendDiff > 0 ? "up" : satisfactionTrendDiff < 0 ? "down" : "neutral"
        },
        avgFeedback: {
            value: `${avgDiff >= 0 ? "+" : ""}${avgDiff.toFixed(1)}`,
            direction: avgDiff > 0 ? "up" : avgDiff < 0 ? "down" : "neutral"
        }
      });
    }
  }, [feedbackSnapshot, chatbots, testMode]);

  const fetchChatbots = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const q = query(
        collection(db, "chatbot_configs"),
        where("user_id", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const chatbotData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as Chatbot;
      });
      setChatbots(chatbotData);
    } catch (error) {
      console.error("Error fetching chatbots:", error);
      setError(
        `Failed to fetch chatbots: ${
          (error as Error).message
        }. Please try refreshing the page or contact support if the issue persists.`
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleChatbotStatus = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      // Optimistic update
      setChatbots(chatbots.map(c => 
        c.id === id ? { ...c, isActive: newStatus } : c
      ));

      if (!testMode) {
        // Update Firestore only if not in test mode
        await updateDoc(doc(db, "chatbot_configs", id), {
          isActive: newStatus,
          lastUpdated: new Date()
        });
      } else {
         toast.success(`(Test Mode) Chatbot ${newStatus ? 'activated' : 'deactivated'}`);
         return;
      }
      
      toast.success(`Chatbot ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error("Error toggling chatbot status:", error);
      toast.error("Failed to update chatbot status");
      // Revert on error
      setChatbots(chatbots.map(c => 
        c.id === id ? { ...c, isActive: currentStatus } : c
      ));
    }
  };

  const openDeleteModal = (id: string) => {
    setChatbotToDelete(id);
    deleteModal.openModal();
  };

  const deleteChatbot = async () => {
    if (!chatbotToDelete) return;

    try {
      await deleteDoc(doc(db, "chatbot_configs", chatbotToDelete));
      setChatbots(chatbots.filter((chatbot) => chatbot.id !== chatbotToDelete));
      toast.success("Chatbot deleted successfully");
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      setError(`Failed to delete chatbot: ${(error as Error).message}`);
    } finally {
      deleteModal.closeModal();
    }
  };

  const openEmbedModal = (id: string) => {
    setSelectedChatbotId(id);
    embedModal.openModal();
  };

  const generateEmbedCode = (id: string) => {
    const scriptSrc = `${window.location.origin}/chatbot-embed.js`;
    return `<div id="chatbot-container"></div>
<script src="${scriptSrc}"></script>
<script>
  ChatbotEmbed.init("${id}", "${window.location.origin}");
</script>`;
  };

  const copyEmbedCode = () => {
    if (selectedChatbotId) {
      const embedCode = generateEmbedCode(selectedChatbotId);
      navigator.clipboard.writeText(embedCode).then(
        () => {
          toast.success("Embed code copied to clipboard!");
          embedModal.closeModal();
        },
        () => {
          toast.error("Failed to copy embed code.");
        }
      );
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Remove useMemo to ensure fresh calculation every render
  const sortedChatbots = [...chatbots].sort((a, b) => {
    if (sortBy === "title") {
      return sortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else {
      // Safely handle dates, ensuring we don't return NaN which breaks sort
      const valA = a[sortBy];
      const valB = b[sortBy];
      
      const dateA = valA instanceof Date ? valA.getTime() : new Date(valA).getTime();
      const dateB = valB instanceof Date ? valB.getTime() : new Date(valB).getTime();

      // Handle invalid dates (NaN) by pushing them to the end
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;

      const diff = sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      
      // Tie-breaker: If dates are identical (common in bulk imports), sort by Title
      if (diff === 0) {
         return a.title.localeCompare(b.title);
      }
      
      return diff;
    }
  });

  const filteredChatbots = useMemo(() => {
    return sortedChatbots.filter((chatbot) =>
      chatbot.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedChatbots, searchTerm]);

  // Calculate chart data
  const chartData = useMemo(() => {
    const labels = chatbots.map((c) => c.title);
    const positiveData = chatbots.map(
      (c) => feedbackCounts[c.id]?.positive || 0
    );
    const negativeData = chatbots.map(
      (c) => feedbackCounts[c.id]?.negative || 0
    );

    return {
      labels,
      datasets: [
        {
          label: "Positive",
          data: positiveData,
          backgroundColor: "#37322F",
        },
        {
            label: "Negative",
            data: negativeData,
            backgroundColor: "#E0DEDB",
        }
      ],
    };
  }, [chatbots, feedbackCounts]);

  const handleSort = (newSortBy: "title" | "createdAt" | "lastUpdated") => {
    let newOrder: "asc" | "desc" = "asc";
    
    if (sortBy === newSortBy) {
      // Toggle logic
      newOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      // Smart default logic:
      // Title -> Asc (A-Z)
      // Dates -> Desc (Newest First)
      if (newSortBy === "title") {
          newOrder = "asc";
      } else {
          newOrder = "desc";
      }
      setSortBy(newSortBy);
    }
    setSortOrder(newOrder);
  };

  const refreshDashboard = () => {
    fetchChatbots();
    if (activeTab === "notifications") {
       fetchNotifications();
    } else {
       setNotificationsFetched(false); // Force refetch next time tab is opened
    }
    toast.success("Dashboard refreshed");
  };

  const downloadReport = () => {
    try {
      const headers = ["Chatbot Name", "Positive Feedback", "Negative Feedback", "Created At", "Last Updated"];
      const csvContent = [
        headers.join(","),
        ...chatbots.map(chatbot => {
          const stats = feedbackCounts[chatbot.id] || { positive: 0, negative: 0 };
          return [
            `"${chatbot.title.replace(/"/g, '""')}"`,
            stats.positive,
            stats.negative,
            `"${chatbot.createdAt.toISOString()}"`,
            `"${chatbot.lastUpdated.toISOString()}"`
          ].join(",");
        })
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `askio_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Report downloaded successfully");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report");
    }
  };

  const downloadLeadsReport = async () => {
    setIsGeneratingLeadReport(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const chatbotIds = chatbots.map(c => c.id);
      if (chatbotIds.length === 0) {
        toast.error("No chatbots found to evaluate leads from.");
        setIsGeneratingLeadReport(false);
        return;
      }

      // Fetch leads
      // Firebase 'in' queries support max 10 values, batch if > 10
      let allLeads: any[] = [];
      const batchSize = 10;
      for (let i = 0; i < chatbotIds.length; i += batchSize) {
        const batchIds = chatbotIds.slice(i, i + batchSize);
        const leadsQuery = query(collection(db, "leads"), where("chatbotId", "in", batchIds));
        const leadsSnap = await getDocs(leadsQuery);
        allLeads = [...allLeads, ...leadsSnap.docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
           timestamp: doc.data().timestamp?.toDate() || new Date()
        }))];
      }

      const headers = ["Email", "Chatbot Name", "Timestamp"];
      const csvContent = [
        headers.join(","),
        ...allLeads.map(lead => {
          const chatbotName = chatbots.find(c => c.id === lead.chatbotId)?.title || "Unknown Bot";
          return [
            `"${lead.email.replace(/"/g, '""')}"`,
            `"${chatbotName.replace(/"/g, '""')}"`,
             `"${lead.timestamp.toISOString()}"`
          ].join(",");
        })
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `askio_leads_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Lead report downloaded successfully");
      }
    } catch (error) {
      console.error("Error downloading leads report:", error);
      toast.error("Failed to download leads report");
    } finally {
      setIsGeneratingLeadReport(false);
    }
  };

  const downloadUnansweredQueriesReport = async () => {
    setIsGeneratingQueryReport(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const chatbotIds = chatbots.map(c => c.id);
      if (chatbotIds.length === 0) {
        toast.error("No chatbots found to evaluate queries from.");
        setIsGeneratingQueryReport(false);
        return;
      }

      // Fetch queries
      // Firebase 'in' queries support max 10 values, batch if > 10
      let allQueries: any[] = [];
      const batchSize = 10;
      for (let i = 0; i < chatbotIds.length; i += batchSize) {
        const batchIds = chatbotIds.slice(i, i + batchSize);
        const queryQuery = query(collection(db, "unanswered_queries"), where("chatbotId", "in", batchIds));
        const queriesSnap = await getDocs(queryQuery);
        allQueries = [...allQueries, ...queriesSnap.docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
           timestamp: doc.data().timestamp?.toDate() || new Date()
        }))];
      }

      const headers = ["Query", "Chatbot Name", "Timestamp"];
      const csvContent = [
        headers.join(","),
        ...allQueries.map(q => {
          const chatbotName = chatbots.find(c => c.id === q.chatbotId)?.title || "Unknown Bot";
          return [
            `"${(q.query || "").replace(/"/g, '""')}"`,
            `"${chatbotName.replace(/"/g, '""')}"`,
             `"${q.timestamp.toISOString()}"`
          ].join(",");
        })
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `askio_unanswered_queries_report_${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Unanswered queries report downloaded successfully");
      }
    } catch (error) {
       console.error("Error downloading queries report:", error);
       toast.error("Failed to download queries report");
    } finally {
       setIsGeneratingQueryReport(false);
    }
  };

  const toggleSortDropdown = () => {
    setIsSortDropdownOpen(!isSortDropdownOpen);
  };

  // Calculate pagination
  const indexOfLastChatbot = currentPage * chatbotsPerPage;
  const indexOfFirstChatbot = indexOfLastChatbot - chatbotsPerPage;
  const currentChatbots = filteredChatbots.slice(
    indexOfFirstChatbot,
    indexOfLastChatbot
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="bg-[#F7F5F3] dark:bg-[#1C1917] min-h-screen font-sans text-[#37322F]">
      <Helmet>
        <title>Dashboard | Askio Chatbot</title>
        <meta
          name="description"
          content="Manage and optimize your chatbots with Askio's dashboard."
        />
      </Helmet>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between space-y-2">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden text-[#605A57] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:text-[#F5F5F4]"
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-h1 font-medium tracking-tight font-serif text-[#37322F] dark:text-[#F5F5F4]">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-2">
                 <Link
                    to="/configure"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#37322F] hover:bg-[#2a2522] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#37322F] transition-all duration-200 shadow-sm dark:bg-[#F5F5F4] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
                >
                    <PlusCircle size={16} className="mr-2" />
                    Quick Create
                </Link>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6">
            <Tabs
                tabs={[
                { id: "overview", label: "Overview" },
                { id: "chatbots", label: "Chatbots" },
                { id: "reports", label: "Reports" },
                { id: "notifications", label: "Notifications", showBadge: hasUnseenNotifications },
                ]}
                activeTab={activeTab}
                onChange={(id) => {
                  setActiveTab(id as any);
                  if (id === 'notifications') {
                    localStorage.setItem('askio_notifications_last_seen', new Date().toISOString());
                    setHasUnseenNotifications(false);
                  }
                }}
                className="w-fit"
            />

            <div className="flex items-center gap-2">
                <Button
                    onClick={refreshDashboard}
                    className="bg-white text-[#605A57] border border-[#E0DEDB] hover:bg-[#FAFAF9] hover:text-[#37322F] shadow-sm dark:bg-[#292524] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4]"
                    icon={RefreshCw}
                >
                    Refresh
                </Button>
                <Button
                    onClick={downloadReport}
                    className="bg-white text-[#605A57] border border-[#E0DEDB] hover:bg-[#FAFAF9] hover:text-[#37322F] shadow-sm dark:bg-[#292524] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4]"
                    icon={Download}
                >
                    Download Report
                </Button>
            </div>
        </div>

        {activeTab === "overview" && (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Chatbots"
                        value={chatbots.length.toString()}
                        trend={trends.chatbots.value}
                        trendDirection={trends.chatbots.direction}
                    />
                    <StatsCard
                        title="Total Feedback"
                        value={totalFeedback.toString()}
                        trend={trends.feedback.value}
                        trendDirection={trends.feedback.direction}
                    />
                    <StatsCard
                        title="Satisfaction Rate"
                        value={`${satisfactionRate.toFixed(0)}%`}
                        trend={trends.satisfaction.value}
                        trendDirection={trends.satisfaction.direction}
                    />
                    <StatsCard
                        title="Avg. Feedback"
                        value={(totalFeedback / (chatbots.length || 1)).toFixed(1)}
                        trend={trends.avgFeedback.value}
                        trendDirection={trends.avgFeedback.direction}
                    />
                </div>

                <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                     <div className="lg:col-span-4">
                        <OverviewChart 
                            data={chartData}
                        />
                     </div>
                     <div className="lg:col-span-3 h-full">
                        <RecentActivity activities={recentActivities} />
                     </div>
                </div>

                <div className="mt-8">
                     <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0 mb-6">
                        <h2 className="text-h3 font-medium text-[#37322F] dark:text-[#F5F5F4]">
                            Your Chatbots
                        </h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-grow md:flex-grow-0 md:w-64">
                            <Input
                                type="text"
                                placeholder="Search chatbots..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full bg-white border border-[#E0DEDB] text-[#37322F] placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] rounded-md shadow-sm"
                            />
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]"
                                size={18}
                            />
                            </div>
                            
                             <div className="relative">
                                <Button
                                    onClick={toggleSortDropdown}
                                    className="bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] shadow-sm dark:bg-[#292524] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4]"
                                    icon={Filter}
                                >
                                    Sort: {sortBy === "title" ? "Name" : sortBy === "createdAt" ? "Created" : "Updated"}
                                </Button>
                                {isSortDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#292524] rounded-md shadow-lg py-1 z-50 border border-[#E0DEDB] dark:border-[#44403C]">
                                    <button
                                        onClick={() => {
                                        handleSort("title");
                                        setIsSortDropdownOpen(false);
                                        }}
                                        className="flex items-center justify-between px-4 py-2 text-sm text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4] w-full text-left cursor-pointer"
                                    >
                                        <span>Sort by Title</span>
                                        {sortBy === "title" && (
                                            <div className="flex items-center">
                                                {sortOrder === "asc" ? <ArrowUp size={14} className="mr-1"/> : <ArrowDown size={14} className="mr-1"/>}
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                        handleSort("createdAt");
                                        setIsSortDropdownOpen(false);
                                        }}
                                        className="flex items-center justify-between px-4 py-2 text-sm text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4] w-full text-left cursor-pointer"
                                    >
                                        <span>Sort by Creation Date</span>
                                        {sortBy === "createdAt" && (
                                            <div className="flex items-center">
                                                {sortOrder === "asc" ? <ArrowUp size={14} className="mr-1"/> : <ArrowDown size={14} className="mr-1"/>}
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                        handleSort("lastUpdated");
                                        setIsSortDropdownOpen(false);
                                        }}
                                        className="flex items-center justify-between px-4 py-2 text-sm text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4] w-full text-left cursor-pointer"
                                    >
                                        <span>Sort by Last Updated</span>
                                        {sortBy === "lastUpdated" && (
                                            <div className="flex items-center">
                                                {sortOrder === "asc" ? <ArrowUp size={14} className="mr-1"/> : <ArrowDown size={14} className="mr-1"/>}
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </button>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>

                    {/* Chatbot Cards Grid/List */}
                     <div className="p-4 sm:p-0">
                        <Transition
                        show={loading}
                        enter="transition-opacity duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        >
                        <div className="flex justify-center items-center h-64">
                            <LoaderCircle
                            className="animate-spin text-indigo-500 dark:text-indigo-400"
                            size={48}
                            />
                        </div>
                        </Transition>
                        {error && (
                        <div
                            className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 p-4 mb-4 rounded-md"
                            role="alert"
                        >
                            <div className="flex">
                            <div className="flex-shrink-0">
                                <Info
                                className="h-5 w-5 text-red-400"
                                aria-hidden="true"
                                />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 dark:text-red-200">
                                {error}
                                </p>
                            </div>
                            </div>
                            <button
                            onClick={() => fetchChatbots()}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                            Retry
                            </button>
                        </div>
                        )}
                        <AnimatePresence>
                        {!loading && !error && (
                            <div className="bg-white dark:bg-[#1C1917] rounded-lg border border-[#E0DEDB] dark:border-[#44403C] overflow-hidden shadow-sm overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#E0DEDB] dark:divide-[#44403C]">
                                    <thead className="bg-[#FAFAF9] dark:bg-[#292524]">
                                        <tr>
                                            <th 
                                                scope="col" 
                                                className="px-6 py-3 text-left text-caption font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans cursor-pointer hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group"
                                                onClick={() => handleSort("title")}
                                            >
                                                <div className="flex items-center">
                                                    Name
                                                    {sortBy === "title" && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-caption font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans">
                                                Feedback
                                            </th>
                                            <th 
                                                scope="col" 
                                                className="hidden sm:table-cell px-6 py-3 text-left text-caption font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans cursor-pointer hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group"
                                                onClick={() => handleSort("createdAt")}
                                            >
                                                <div className="flex items-center">
                                                    Created
                                                    {sortBy === "createdAt" && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th 
                                                scope="col" 
                                                className="hidden md:table-cell px-6 py-3 text-left text-caption font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans cursor-pointer hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group"
                                                onClick={() => handleSort("lastUpdated")}
                                            >
                                                <div className="flex items-center">
                                                    Last Updated
                                                    {sortBy === "lastUpdated" && (
                                                        <span className="ml-1">
                                                            {sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-[#1C1917] divide-y divide-[#E0DEDB] dark:divide-[#44403C]">
                                        {currentChatbots.map((chatbot, index) => {
                                             const fb = feedbackCounts[chatbot.id] || { positive: 0, negative: 0 };
                                            return (
                                                <ChatbotCard
                                                    key={chatbot.id}
                                                    chatbot={chatbot}
                                                    feedback={fb}
                                                    viewMode="list"
                                                    onEdit={() => navigate(`/configure/${chatbot.id}`)}
                                                    onEmbed={() => openEmbedModal(chatbot.id)}
                                                    onDelete={() => openDeleteModal(chatbot.id)}
                                                    onToggleActive={() => toggleChatbotStatus(chatbot.id, chatbot.isActive ?? true)}
                                                    index={index}
                                                />
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        </AnimatePresence>
                        {!loading && !error && filteredChatbots.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="w-16 h-16 bg-[#FAFAF9] dark:bg-[#292524] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#E0DEDB] dark:border-[#44403C]">
                                <Bot className="w-8 h-8 text-[#605A57] dark:text-[#A8A29E]" />
                            </div>
                            <h3 className="text-h3 font-medium text-[#37322F] dark:text-[#F5F5F4] mb-2 font-sans">
                            {searchTerm ? "No chatbots found" : "No chatbots yet"}
                            </h3>
                            <p className="text-body text-[#605A57] dark:text-[#A8A29E] max-w-sm mb-8">
                            {searchTerm
                                ? `We couldn't find any chatbots matching "${searchTerm}". Try a different search term.`
                                : "Create your first chatbot to start engaging with your visitors automatically."}
                            </p>
                            {!searchTerm && (
                            <Link
                                to="/configure"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full text-white bg-[#37322F] hover:bg-[#2a2522] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#37322F] transition-all duration-200 shadow-lg hover:shadow-xl dark:bg-[#F5F5F4] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
                            >
                                <PlusCircle size={18} className="mr-2" />
                                Create Chatbot
                            </Link>
                            )}
                        </div>
                        )}
                        {!loading &&
                        !error &&
                        filteredChatbots.length > chatbotsPerPage && (
                            <div className="mt-8 flex justify-center">
                            <nav
                                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                aria-label="Pagination"
                            >
                                <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#292524] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#44403C]"
                                >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                {Array.from({
                                length: Math.ceil(
                                    filteredChatbots.length / chatbotsPerPage
                                ),
                                }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => paginate(index + 1)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === index + 1
                                        ? "z-10 bg-[#37322F] border-[#37322F] text-white dark:bg-[#F5F5F4] dark:border-[#F5F5F4] dark:text-[#1C1917]"
                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-[#292524] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#44403C]"
                                    }`}
                                >
                                    {index + 1}
                                </button>
                                ))}
                                <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={
                                    currentPage ===
                                    Math.ceil(filteredChatbots.length / chatbotsPerPage)
                                }
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#292524] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#44403C]"
                                >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}

          {activeTab === "chatbots" && (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
                  <h2 className="text-h2 font-bold text-[#37322F] dark:text-[#F5F5F4]">
                    Your Chatbots
                  </h2>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow md:flex-grow-0 md:w-64">
                      <Input
                        type="text"
                        placeholder="Search chatbots..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full bg-white border border-[#E0DEDB] text-[#37322F] placeholder-[#9CA3AF] focus:ring-[#37322F] focus:border-[#37322F] dark:bg-[#44403C] dark:text-[#F5F5F4] dark:border-[#57534E] rounded-md shadow-sm"
                      />
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9CA3AF]"
                        size={18}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleViewMode}
                        className={`p-2 rounded-md transition-colors duration-200 border ${
                          viewMode === "grid"
                            ? "bg-[#37322F] border-[#37322F] text-white"
                            : "bg-white border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] dark:bg-[#292524] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#44403C]"
                        }`}
                      >
                        <Grid size={20} />
                      </button>
                      <button
                        onClick={toggleViewMode}
                        className={`p-2 rounded-md transition-colors duration-200 border ${
                          viewMode === "list"
                            ? "bg-[#37322F] border-[#37322F] text-white"
                            : "bg-white border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] dark:bg-[#292524] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#44403C]"
                        }`}
                      >
                        <List size={20} />
                      </button>
                    </div>
                    <div className="relative">
                        <Button
                            onClick={toggleSortDropdown}
                            className="bg-white border border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] shadow-sm dark:bg-[#292524] dark:text-[#A8A29E] dark:border-[#44403C] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4]"
                            icon={Filter}
                        >
                            Sort: {sortBy === "title" ? "Name" : sortBy === "createdAt" ? "Created" : "Updated"}
                        </Button>
                        {isSortDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#292524] rounded-md shadow-lg py-1 z-50 border border-[#E0DEDB] dark:border-[#44403C]">
                            <button
                                onClick={() => {
                                handleSort("title");
                                setIsSortDropdownOpen(false);
                                }}
                                className="flex items-center justify-between px-4 py-2 text-sm text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4] w-full text-left cursor-pointer"
                            >
                                <span>Sort by Title</span>
                                {sortBy === "title" && (
                                    <div className="flex items-center">
                                        {sortOrder === "asc" ? <ArrowUp size={14} className="mr-1"/> : <ArrowDown size={14} className="mr-1"/>}
                                        <Check size={14} />
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                handleSort("createdAt");
                                setIsSortDropdownOpen(false);
                                }}
                                className="flex items-center justify-between px-4 py-2 text-sm text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4] w-full text-left cursor-pointer"
                            >
                                <span>Sort by Creation Date</span>
                                {sortBy === "createdAt" && (
                                    <div className="flex items-center">
                                        {sortOrder === "asc" ? <ArrowUp size={14} className="mr-1"/> : <ArrowDown size={14} className="mr-1"/>}
                                        <Check size={14} />
                                    </div>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                handleSort("lastUpdated");
                                setIsSortDropdownOpen(false);
                                }}
                                className="flex items-center justify-between px-4 py-2 text-sm text-[#605A57] hover:bg-[#FAFAF9] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C] dark:hover:text-[#F5F5F4] w-full text-left cursor-pointer"
                            >
                                <span>Sort by Last Updated</span>
                                {sortBy === "lastUpdated" && (
                                    <div className="flex items-center">
                                        {sortOrder === "asc" ? <ArrowUp size={14} className="mr-1"/> : <ArrowDown size={14} className="mr-1"/>}
                                        <Check size={14} />
                                    </div>
                                )}
                            </button>
                            </div>
                        )}
                        </div>
                    <Button
                    onClick={() => navigate("/configure")}
                    className="bg-[#37322F] hover:bg-[#2a2522] text-white shadow-md dark:text-white"
                    icon={PlusCircle}
                    >
                    Create New Chatbot
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-0">
                    <Transition
                        show={loading}
                        enter="transition-opacity duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="flex justify-center items-center h-64">
                            <LoaderCircle
                            className="animate-spin text-indigo-500 dark:text-indigo-400"
                            size={48}
                            />
                        </div>
                    </Transition>
                    {error && (
                    <div
                        className="bg-red-50 dark:bg-red-900 border-l-4 border-red-400 p-4 mb-4 rounded-md"
                        role="alert"
                    >
                        <div className="flex">
                        <div className="flex-shrink-0">
                            <Info
                            className="h-5 w-5 text-red-400"
                            aria-hidden="true"
                            />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 dark:text-red-200">
                            {error}
                            </p>
                        </div>
                        </div>
                        <button
                        onClick={() => fetchChatbots()}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                        Retry
                        </button>
                    </div>
                    )}
                    <AnimatePresence>
                    {!loading && !error && (
                        <>
                        {viewMode === "grid" ? (
                            <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                            >
                            {currentChatbots.map((chatbot, index) => (
                                <ChatbotCard
                                key={chatbot.id}
                                chatbot={chatbot}
                                feedback={
                                    feedbackCounts[chatbot.id] || {
                                    positive: 0,
                                    negative: 0,
                                    }
                                }
                                viewMode="grid"
                                onEdit={(id) => navigate(`/configure/${id}`)}
                                onEmbed={openEmbedModal}
                                onDelete={openDeleteModal}
                                onToggleActive={() => toggleChatbotStatus(chatbot.id, chatbot.isActive ?? true)}
                                index={index}
                                />
                            ))}
                            </motion.div>
                        ) : (
                            <>
                                {/* Mobile List View (rendered as cards) */}
                                <div className="block md:hidden space-y-4">
                                    {currentChatbots.map((chatbot, index) => (
                                        <ChatbotCard
                                        key={chatbot.id}
                                        chatbot={chatbot}
                                        feedback={
                                            feedbackCounts[chatbot.id] || {
                                            positive: 0,
                                            negative: 0,
                                            }
                                        }
                                        viewMode="grid" // Re-use grid card for mobile list
                                        onEdit={(id) => navigate(`/configure/${id}`)}
                                        onEmbed={openEmbedModal}
                                        onDelete={openDeleteModal}
                                        onToggleActive={() => toggleChatbotStatus(chatbot.id, chatbot.isActive ?? true)}
                                        index={index}
                                        />
                                    ))}
                                </div>

                                {/* Desktop List View (Table) */}
                                <div className="hidden md:block bg-white dark:bg-[#1C1917] rounded-lg border border-[#E0DEDB] dark:border-[#44403C] overflow-hidden shadow-sm overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#E0DEDB] dark:divide-[#44403C]">
                                        <thead className="bg-[#FAFAF9] dark:bg-[#292524]">
                                            <tr>
                                                <th 
                                                    scope="col" 
                                                    className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans cursor-pointer hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group"
                                                    onClick={() => handleSort("title")}
                                                >
                                                    <div className="flex items-center">
                                                        Name
                                                        {sortBy === "title" && (
                                                            <span className="ml-1">
                                                                {sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans">
                                                    Feedback
                                                </th>
                                                <th 
                                                    scope="col" 
                                                    className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans cursor-pointer hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group"
                                                    onClick={() => handleSort("createdAt")}
                                                >
                                                    <div className="flex items-center">
                                                        Created
                                                        {sortBy === "createdAt" && (
                                                            <span className="ml-1">
                                                                {sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th 
                                                    scope="col" 
                                                    className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-[#605A57] dark:text-[#A8A29E] uppercase tracking-wider font-sans cursor-pointer hover:text-[#37322F] dark:hover:text-[#F5F5F4] transition-colors group"
                                                    onClick={() => handleSort("lastUpdated")}
                                                >
                                                    <div className="flex items-center">
                                                        Last Updated
                                                        {sortBy === "lastUpdated" && (
                                                            <span className="ml-1">
                                                                {sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th scope="col" className="relative px-4 sm:px-6 py-3">
                                                    <span className="sr-only">Actions</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-[#1C1917] divide-y divide-[#E0DEDB] dark:divide-[#44403C]">
                                            {currentChatbots.map((chatbot, index) => (
                                                <ChatbotCard
                                                    key={chatbot.id}
                                                    chatbot={chatbot}
                                                    feedback={
                                                        feedbackCounts[chatbot.id] || {
                                                        positive: 0,
                                                        negative: 0,
                                                        }
                                                    }
                                                    viewMode="list"
                                                    onEdit={(id) => navigate(`/configure/${id}`)}
                                                    onEmbed={openEmbedModal}
                                                    onDelete={openDeleteModal}
                                                    onToggleActive={() => toggleChatbotStatus(chatbot.id, chatbot.isActive ?? true)}
                                                    index={index}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                        </>
                    )}
                    </AnimatePresence>
                    {!loading && !error && filteredChatbots.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="w-16 h-16 bg-[#FAFAF9] dark:bg-[#292524] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#E0DEDB] dark:border-[#44403C]">
                                <Bot className="w-8 h-8 text-[#605A57] dark:text-[#A8A29E]" />
                            </div>
                            <h3 className="text-xl font-medium text-[#37322F] dark:text-[#F5F5F4] mb-2 font-serif">
                            {searchTerm ? "No chatbots found" : "No chatbots yet"}
                            </h3>
                            <p className="text-[#605A57] dark:text-[#A8A29E] max-w-sm mb-8">
                            {searchTerm
                                ? `We couldn't find any chatbots matching "${searchTerm}". Try a different search term.`
                                : "Create your first chatbot to start engaging with your visitors automatically."}
                            </p>
                            {!searchTerm && (
                            <Link
                                to="/configure"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full text-white bg-[#37322F] hover:bg-[#2a2522] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#37322F] transition-all duration-200 shadow-lg hover:shadow-xl dark:bg-[#F5F5F4] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
                            >
                                <PlusCircle size={18} className="mr-2" />
                                Create Chatbot
                            </Link>
                            )}
                        </div>
                    )}
                    {!loading &&
                        !error &&
                        filteredChatbots.length > chatbotsPerPage && (
                            <div className="mt-8 flex justify-center">
                            <nav
                                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                aria-label="Pagination"
                            >
                                <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#292524] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#44403C]"
                                >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                {Array.from({
                                length: Math.ceil(
                                    filteredChatbots.length / chatbotsPerPage
                                ),
                                }).map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => paginate(index + 1)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === index + 1
                                        ? "z-10 bg-[#37322F] border-[#37322F] text-white dark:bg-[#F5F5F4] dark:border-[#F5F5F4] dark:text-[#1C1917]"
                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-[#292524] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#44403C]"
                                    }`}
                                >
                                    {index + 1}
                                </button>
                                ))}
                                <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={
                                    currentPage ===
                                    Math.ceil(filteredChatbots.length / chatbotsPerPage)
                                }
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#292524] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#44403C]"
                                >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                            </div>
                        )}
                </div>
            </div>
          )}

          {activeTab === "reports" && (
             <div className="space-y-6">
                <div>
                  <h2 className="text-h2 font-bold text-[#37322F] dark:text-[#F5F5F4]">
                    Data Reports
                  </h2>
                  <p className="text-[#605A57] dark:text-[#A8A29E] mt-1">
                    Download actionable insights and raw data across all your chatbots.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Performance Report */}
                  <div className="bg-white dark:bg-[#1C1917] flex flex-col justify-between p-6 rounded-xl border border-[#E0DEDB] dark:border-[#44403C] shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-800">
                        <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-2">
                        Chatbot Performance
                      </h3>
                      <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mb-6 line-clamp-3">
                        A comprehensive overview of all your chatbots, including positive and negative feedback counts, creation dates, and last updated timestamps.
                      </p>
                    </div>
                    <Button
                      onClick={downloadReport}
                      className="w-full justify-center bg-white border border-[#E0DEDB] text-[#37322F] hover:bg-[#FAFAF9] dark:bg-[#292524] dark:border-[#44403C] dark:text-[#F5F5F4] dark:hover:bg-[#44403C]"
                      icon={Download}
                    >
                      Download CSV
                    </Button>
                  </div>

                  {/* Leads Report */}
                  <div className="bg-white dark:bg-[#1C1917] flex flex-col justify-between p-6 rounded-xl border border-[#E0DEDB] dark:border-[#44403C] shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-800">
                        <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-2">
                        Lead Export
                      </h3>
                      <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mb-6 line-clamp-3">
                        Download all captured email leads from visitors who interacted with your chatbots. Includes which bot they used and when they provided their email.
                      </p>
                    </div>
                    <Button
                      onClick={downloadLeadsReport}
                      disabled={isGeneratingLeadReport}
                      className="w-full justify-center bg-white border border-[#E0DEDB] text-[#37322F] hover:bg-[#FAFAF9] dark:bg-[#292524] dark:border-[#44403C] dark:text-[#F5F5F4] dark:hover:bg-[#44403C]"
                      icon={isGeneratingLeadReport ? LoaderCircle : Download}
                    >
                      {isGeneratingLeadReport ? "Generating..." : "Download CSV"}
                    </Button>
                  </div>

                  {/* Unanswered Queries Report */}
                  <div className="bg-white dark:bg-[#1C1917] flex flex-col justify-between p-6 rounded-xl border border-[#E0DEDB] dark:border-[#44403C] shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-lg flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-800">
                        <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-2">
                        Unanswered Queries
                      </h3>
                      <p className="text-sm text-[#605A57] dark:text-[#A8A29E] mb-6 line-clamp-3">
                        Identify holes in your chatbot's knowledge base. Download a list of questions that your bots failed to answer, perfect for training and adding new FAQs.
                      </p>
                    </div>
                    <Button
                      onClick={downloadUnansweredQueriesReport}
                      disabled={isGeneratingQueryReport}
                      className="w-full justify-center bg-white border border-[#E0DEDB] text-[#37322F] hover:bg-[#FAFAF9] dark:bg-[#292524] dark:border-[#44403C] dark:text-[#F5F5F4] dark:hover:bg-[#44403C]"
                      icon={isGeneratingQueryReport ? LoaderCircle : Download}
                    >
                      {isGeneratingQueryReport ? "Generating..." : "Download CSV"}
                    </Button>
                  </div>
                </div>
             </div>
          )}

          {activeTab === "notifications" && (
             <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                  <h2 className="text-h2 font-bold text-[#37322F] dark:text-[#F5F5F4]">
                    Notifications
                  </h2>
                  <p className="text-[#605A57] dark:text-[#A8A29E] mt-1">
                    Stay updated on new leads, unanswered queries, and recent feedback across your chatbots.
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E0DEDB] dark:border-[#44403C] shadow-sm overflow-hidden">
                   {loadingNotifications ? (
                       <div className="flex justify-center items-center h-64">
                          <LoaderCircle className="animate-spin text-[#37322F] dark:text-[#F5F5F4]" size={32} />
                       </div>
                   ) : notifications.length === 0 ? (
                       <div className="flex flex-col items-center justify-center p-12 text-center">
                          <div className="w-16 h-16 bg-[#FAFAF9] dark:bg-[#292524] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#E0DEDB] dark:border-[#44403C]">
                              <Clock className="w-8 h-8 text-[#605A57] dark:text-[#A8A29E]" />
                          </div>
                          <h3 className="text-lg font-medium text-[#37322F] dark:text-[#F5F5F4] mb-2">No new notifications</h3>
                          <p className="text-[#605A57] dark:text-[#A8A29E] max-w-sm">
                             When your chatbots capture leads or face unanswered queries, they will appear here.
                          </p>
                       </div>
                   ) : (
                       <div className="flex flex-col">
                           <ul className="divide-y divide-[#E0DEDB] dark:divide-[#44403C]">
                              {currentNotifications.map((item) => (
                                  <li key={item.id} className="p-4 hover:bg-[#FAFAF9] dark:hover:bg-[#292524] transition-colors flex items-start sm:items-center gap-4">
                                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${
                                         item.type === "lead" ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400" :
                                         item.type === "unanswered" ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400" :
                                         item.type === "positive_feedback" ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" :
                                         "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400"
                                      }`}>
                                         {item.type === "lead" && <UserPlus size={18} />}
                                         {item.type === "unanswered" && <HelpCircle size={18} />}
                                         {item.type === "positive_feedback" && <ArrowUp size={18} />}
                                         {item.type === "negative_feedback" && <ArrowDown size={18} />}
                                      </div>
                                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                                         <div>
                                            <p className="text-sm font-medium text-[#37322F] dark:text-[#F5F5F4] truncate">
                                                {item.title} <span className="font-normal text-[#605A57] dark:text-[#A8A29E] mx-1">•</span> <span className="text-xs font-normal text-[#605A57] dark:text-[#A8A29E]">{item.chatbotName}</span>
                                            </p>
                                            <p className="text-sm text-[#605A57] dark:text-[#A8A29E] truncate">
                                                {item.description}
                                            </p>
                                         </div>
                                         <div className="text-xs text-[#A8A29E] dark:text-[#78716C] whitespace-nowrap flex-shrink-0">
                                             {item.timestamp.getTime() === 0 ? "No date" : format(item.timestamp, "MMM d, yyyy 'at' h:mm a")}
                                         </div>
                                      </div>
                                  </li>
                              ))}
                           </ul>
                           
                           {/* Pagination Controls */}
                           {notifications.length > notificationsPerPage && (
                               <div className="p-4 border-t border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#292524] flex justify-center">
                                   <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                       <button
                                           onClick={() => paginateNotifications(notificationsCurrentPage - 1)}
                                           disabled={notificationsCurrentPage === 1}
                                           className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#E0DEDB] bg-white text-sm font-medium text-[#605A57] hover:bg-[#FAFAF9] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#1C1917] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#292524]"
                                       >
                                           <span className="sr-only">Previous</span>
                                           <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                       </button>
                                       {Array.from({ length: Math.ceil(notifications.length / notificationsPerPage) }).map((_, index) => {
                                           // Basic logic to not show too many page buttons
                                           const totalPages = Math.ceil(notifications.length / notificationsPerPage);
                                           const pageNum = index + 1;
                                           if (
                                               pageNum === 1 ||
                                               pageNum === totalPages ||
                                               (pageNum >= notificationsCurrentPage - 1 && pageNum <= notificationsCurrentPage + 1)
                                           ) {
                                               return (
                                                   <button
                                                       key={index}
                                                       onClick={() => paginateNotifications(pageNum)}
                                                       className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                       notificationsCurrentPage === pageNum
                                                           ? "z-10 bg-[#37322F] border-[#37322F] text-white dark:bg-[#F5F5F4] dark:border-[#F5F5F4] dark:text-[#1C1917]"
                                                           : "bg-white border-[#E0DEDB] text-[#605A57] hover:bg-[#FAFAF9] dark:bg-[#1C1917] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#292524]"
                                                       }`}
                                                   >
                                                       {pageNum}
                                                   </button>
                                               );
                                           } else if (
                                               (pageNum === notificationsCurrentPage - 2 && pageNum > 1) ||
                                               (pageNum === notificationsCurrentPage + 2 && pageNum < totalPages)
                                           ) {
                                              return <span key={index} className="relative inline-flex items-center px-4 py-2 border border-[#E0DEDB] bg-white text-sm font-medium text-[#605A57] dark:bg-[#1C1917] dark:border-[#44403C] dark:text-[#A8A29E]">...</span>;
                                           }
                                           return null;
                                       })}
                                       <button
                                           onClick={() => paginateNotifications(notificationsCurrentPage + 1)}
                                           disabled={notificationsCurrentPage === Math.ceil(notifications.length / notificationsPerPage)}
                                           className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#E0DEDB] bg-white text-sm font-medium text-[#605A57] hover:bg-[#FAFAF9] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#1C1917] dark:border-[#44403C] dark:text-[#A8A29E] dark:hover:bg-[#292524]"
                                       >
                                           <span className="sr-only">Next</span>
                                           <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                       </button>
                                   </nav>
                               </div>
                           )}
                       </div>
                   )}
                </div>
             </div>
          )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={deleteChatbot}
        title="Delete Chatbot"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500 dark:focus:ring-red-400"
      >
        <p className="text-[#605A57] dark:text-gray-300">
          Are you sure you want to delete this chatbot? This action cannot be
          undone.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={embedModal.isOpen}
        onClose={embedModal.closeModal}
        title="Embed Code"
        confirmText="Copy to Clipboard"
        cancelText="Close"
        onConfirm={copyEmbedCode}
        confirmButtonClass="bg-[#37322F] text-white hover:bg-[#2a2522] shadow-md dark:bg-[#F5F5F4] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4] focus:ring-[#37322F] dark:focus:ring-[#F5F5F4]"
      >
        <p className="text-sm text-[#605A57] dark:text-gray-400 mb-4">
          Copy and paste this code into your website to embed the chatbot.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FAFAF9] border border-[#E0DEDB] dark:bg-[#44403C] dark:border-[#57534E] p-3 rounded-md overflow-x-auto"
        >
          <pre className="text-sm text-[#37322F] dark:text-[#F5F5F4] whitespace-pre-wrap font-mono">
            {selectedChatbotId && generateEmbedCode(selectedChatbotId)}
          </pre>
        </motion.div>
      </ConfirmationModal>
    </div>
  );
};

export default Dashboard;
