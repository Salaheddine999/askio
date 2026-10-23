import React, { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Check, Copy, RefreshCw } from "lucide-react";
import { format, isBefore, startOfDay, subDays } from "date-fns";
import ConfirmationModal from "../components/ConfirmationModal";
import { toast } from "react-hot-toast";
import { useModal } from "../hooks/useModal";
import Tabs from "../components/Tabs";
import { ActivityItem } from "../components/RecentActivity";
import { FeedbackSeries } from "../components/OverviewChart";
import { useCollection } from "react-firebase-hooks/firestore";
import { DUMMY_CHATBOTS, DUMMY_FEEDBACK_COUNTS, DUMMY_RECENT_ACTIVITY, DUMMY_NOTIFICATIONS } from "../utils/dummyData";
import { Helmet } from "react-helmet-async";
import OverviewTab from "./dashboard/OverviewTab";
import ChatbotsTab from "./dashboard/ChatbotsTab";
import ReportsTab from "./dashboard/ReportsTab";
import NotificationsTab from "./dashboard/NotificationsTab";
import { secondaryButton } from "./dashboard/ui";
import { downloadCsv, fetchOwnedByChatbots, fetchRecentOwned } from "./dashboard/data";
import { Chatbot, FeedbackCounts, NotificationItem, TrendData } from "./dashboard/types";

type TabId = "overview" | "chatbots" | "reports" | "notifications";
type Trends = Record<"chatbots" | "feedback" | "satisfaction" | "avgFeedback", TrendData>;

const NEUTRAL_TRENDS: Trends = {
  chatbots: { value: "0%", direction: "neutral" },
  feedback: { value: "0%", direction: "neutral" },
  satisfaction: { value: "0%", direction: "neutral" },
  avgFeedback: { value: "0", direction: "neutral" },
};

const LAST_SEEN_KEY = "askio_notifications_last_seen";
const RECENT_ACTIVITY_LIMIT = 5;
const NOTIFICATION_LIMIT = 200;

function readLastSeen() {
  try {
    const stored = localStorage.getItem(LAST_SEEN_KEY);
    return stored ? new Date(stored) : new Date(0);
  } catch {
    return new Date(0);
  }
}

const toTrend = (diff: number, unit: "%" | "", digits = 0): TrendData => ({
  value: `${diff >= 0 ? "+" : ""}${diff.toFixed(digits)}${unit}`,
  direction: diff > 0 ? "up" : diff < 0 ? "down" : "neutral",
});

// Growth versus 30 days ago; with nothing back then, any activity counts as +100%.
const growth = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

function computeTrends(chatbots: Chatbot[], feedback: { isPositive: boolean; date: Date | null }[]): Trends {
  const cutoff = subDays(new Date(), 30);
  const prevChatbots = chatbots.filter((c) => isBefore(c.createdAt, cutoff)).length;
  const prevFeedback = feedback.filter((f) => f.date && isBefore(f.date, cutoff));
  const prevPositive = prevFeedback.filter((f) => f.isPositive).length;
  const positive = feedback.filter((f) => f.isPositive).length;

  const rate = (pos: number, total: number) => (total > 0 ? (pos / total) * 100 : 0);
  const avg = (total: number, bots: number) => (bots > 0 ? total / bots : 0);

  return {
    chatbots: toTrend(growth(chatbots.length, prevChatbots), "%"),
    feedback: toTrend(growth(feedback.length, prevFeedback.length), "%"),
    satisfaction: toTrend(rate(positive, feedback.length) - rate(prevPositive, prevFeedback.length), "%"),
    avgFeedback: toTrend(avg(feedback.length, chatbots.length) - avg(prevFeedback.length, prevChatbots), "", 1),
  };
}

const CHART_DAYS = 30;

/** Daily positive/negative counts for the last CHART_DAYS days, oldest first. */
function dailySeries(feedback: { isPositive: boolean; date: Date | null }[]): FeedbackSeries {
  const today = startOfDay(new Date());
  const days = Array.from({ length: CHART_DAYS }, (_, i) => subDays(today, CHART_DAYS - 1 - i));
  const index = new Map(days.map((d, i) => [d.getTime(), i]));
  const positive = new Array(CHART_DAYS).fill(0);
  const negative = new Array(CHART_DAYS).fill(0);
  feedback.forEach(({ isPositive, date }) => {
    const i = date ? index.get(startOfDay(date).getTime()) : undefined;
    if (i === undefined) return;
    (isPositive ? positive : negative)[i]++;
  });
  return { labels: days.map((d) => format(d, "MMM d")), positive, negative };
}

// Sample data for test mode: a gentle upward trend with some day-to-day noise.
function sampleDailySeries(): FeedbackSeries {
  const series = dailySeries([]);
  series.positive = series.positive.map((_, i) => Math.round(6 + i * 0.35 + 4 * Math.abs(Math.sin(i * 1.7))));
  series.negative = series.negative.map((_, i) => Math.round(1 + Math.abs(Math.cos(i * 2.3)) * 2));
  return series;
}

function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

interface DashboardProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  testMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ testMode }) => {
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteModal = useModal();
  const embedModal = useModal();
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Only this owner's ratings; test mode uses sample data and reads nothing.
  const ownerUid = testMode ? null : auth.currentUser?.uid ?? null;
  const feedbackQuery = useMemo(
    () => (ownerUid ? query(collection(db, "feedback"), where("ownerId", "==", ownerUid)) : null),
    [ownerUid]
  );
  const [feedbackSnapshot] = useCollection(feedbackQuery);
  const [feedbackCounts, setFeedbackCounts] = useState<Record<string, FeedbackCounts>>({});
  const [totalFeedback, setTotalFeedback] = useState(0);
  const [satisfactionRate, setSatisfactionRate] = useState(0);
  const [trends, setTrends] = useState<Trends>(NEUTRAL_TRENDS);
  const [feedbackEvents, setFeedbackEvents] = useState<ActivityItem[]>([]);
  const [dailyFeedback, setDailyFeedback] = useState<FeedbackSeries>(() => dailySeries([]));

  const [isGeneratingLeadReport, setIsGeneratingLeadReport] = useState(false);
  const [isGeneratingQueryReport, setIsGeneratingQueryReport] = useState(false);

  // Leads and unanswered queries; feedback notifications are derived from feedbackEvents.
  const [inboxItems, setInboxItems] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsFetched, setNotificationsFetched] = useState(false);
  const [lastSeen, setLastSeen] = useState<Date>(readLastSeen);
  const [seenBeforeOpen, setSeenBeforeOpen] = useState<Date>(lastSeen);

  const fetchChatbots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const snapshot = await getDocs(
        query(collection(db, "chatbot_configs"), where("user_id", "==", user.uid))
      );
      setChatbots(
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
          } as Chatbot;
        })
      );
    } catch (err) {
      console.error("Error fetching chatbots:", err);
      setError(`We couldn't load your chatbots (${(err as Error).message}). Try again, or contact support if it keeps happening.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (testMode) {
      const counts = Object.values(DUMMY_FEEDBACK_COUNTS) as FeedbackCounts[];
      const positive = counts.reduce((sum, c) => sum + c.positive, 0);
      const total = counts.reduce((sum, c) => sum + c.positive + c.negative, 0);
      setChatbots(DUMMY_CHATBOTS);
      setFeedbackCounts(DUMMY_FEEDBACK_COUNTS);
      setTotalFeedback(total);
      setSatisfactionRate(total > 0 ? (positive / total) * 100 : 0);
      setTrends(NEUTRAL_TRENDS);
      setFeedbackEvents(DUMMY_RECENT_ACTIVITY);
      setDailyFeedback(sampleDailySeries());
      setInboxItems(DUMMY_NOTIFICATIONS.filter((n) => !n.type.endsWith("_feedback")));
      setNotificationsFetched(true);
      setError(null);
      setLoading(false);
    } else {
      setNotificationsFetched(false);
      fetchChatbots();
    }
  }, [testMode, fetchChatbots]);

  const fetchNotifications = useCallback(async () => {
    const user = auth.currentUser;
    if (testMode || !user || chatbots.length === 0) return;
    setLoadingNotifications(true);
    try {
      const names = new Map(chatbots.map((c) => [c.id, c.title]));
      const [leads, queries] = await Promise.all([
        fetchRecentOwned("leads", user.uid, NOTIFICATION_LIMIT),
        fetchRecentOwned("unanswered_queries", user.uid, NOTIFICATION_LIMIT),
      ]);
      setInboxItems([
        ...leads.map((l) => ({
          id: l.id,
          type: "lead" as const,
          title: "New lead captured",
          description: l.email,
          timestamp: l.timestamp,
          chatbotName: names.get(l.chatbotId) || "Unknown chatbot",
        })),
        ...queries.map((q) => ({
          id: q.id,
          type: "unanswered" as const,
          title: "Unanswered question",
          description: `“${q.query}”`,
          timestamp: q.timestamp,
          chatbotName: names.get(q.chatbotId) || "Unknown chatbot",
        })),
      ]);
      setNotificationsFetched(true);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      toast.error("Failed to load notifications.");
    } finally {
      setLoadingNotifications(false);
    }
  }, [testMode, chatbots]);

  // Fetched eagerly so the unseen badge works from any tab.
  useEffect(() => {
    if (!notificationsFetched && chatbots.length > 0) fetchNotifications();
  }, [chatbots, notificationsFetched, fetchNotifications]);

  useEffect(() => {
    if (testMode || !feedbackSnapshot || chatbots.length === 0) return;

    const names = new Map(chatbots.map((c) => [c.id, c.title]));
    const counts: Record<string, FeedbackCounts> = {};
    const events: (ActivityItem & { dated: boolean })[] = [];

    // Only feedback for this user's chatbots counts.
    feedbackSnapshot.docs.forEach((d: QueryDocumentSnapshot) => {
      const data = d.data();
      const name = names.get(data.chatbotId);
      if (!name) return;
      counts[data.chatbotId] ??= { positive: 0, negative: 0 };
      counts[data.chatbotId][data.isPositive ? "positive" : "negative"]++;
      const date: Date | undefined = data.timestamp?.toDate();
      events.push({
        id: d.id,
        chatbotName: name,
        type: data.isPositive ? "positive" : "negative",
        date: date || new Date(0),
        dated: !!date,
      });
    });
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    const positive = events.filter((e) => e.type === "positive").length;
    setFeedbackCounts(counts);
    setTotalFeedback(events.length);
    setSatisfactionRate(events.length > 0 ? (positive / events.length) * 100 : 0);
    setFeedbackEvents(events.slice(0, NOTIFICATION_LIMIT));
    const ratings = events.map((e) => ({ isPositive: e.type === "positive", date: e.dated ? e.date : null }));
    setTrends(computeTrends(chatbots, ratings));
    setDailyFeedback(dailySeries(ratings));
  }, [feedbackSnapshot, chatbots, testMode]);

  const notifications = useMemo(() => {
    const feedback: NotificationItem[] = feedbackEvents.map((e) => ({
      id: e.id,
      type: e.type === "positive" ? "positive_feedback" : "negative_feedback",
      title: e.type === "positive" ? "Positive rating" : "Negative rating",
      description: e.type === "positive" ? "A visitor found an answer helpful." : "A visitor found an answer unhelpful.",
      timestamp: e.date,
      chatbotName: e.chatbotName,
    }));
    return [...inboxItems, ...feedback]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, NOTIFICATION_LIMIT);
  }, [inboxItems, feedbackEvents]);

  const hasUnseenNotifications =
    activeTab !== "notifications" && notifications.some((n) => n.timestamp.getTime() > lastSeen.getTime());

  const changeTab = (id: TabId) => {
    if (id === "notifications" && activeTab !== "notifications") {
      const now = new Date();
      setSeenBeforeOpen(lastSeen);
      setLastSeen(now);
      try {
        localStorage.setItem(LAST_SEEN_KEY, now.toISOString());
      } catch {
        // Without storage the badge just reappears next visit.
      }
    }
    setActiveTab(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleChatbotStatus = async (chatbot: Chatbot) => {
    const current = chatbot.isActive ?? true;
    const setStatus = (isActive: boolean) =>
      setChatbots((prev) => prev.map((c) => (c.id === chatbot.id ? { ...c, isActive } : c)));

    setStatus(!current);
    if (testMode) {
      toast.success(`(Test mode) ${chatbot.title} ${current ? "paused" : "is live"}`);
      return;
    }
    try {
      await updateDoc(doc(db, "chatbot_configs", chatbot.id), {
        isActive: !current,
        lastUpdated: new Date(),
      });
      toast.success(`${chatbot.title} ${current ? "paused" : "is live"}`);
    } catch (err) {
      console.error("Error toggling chatbot status:", err);
      toast.error("Couldn't update the chatbot. Please try again.");
      setStatus(current);
    }
  };

  const openDeleteModal = (id: string) => {
    setChatbotToDelete(id);
    deleteModal.openModal();
  };

  const deleteChatbot = async () => {
    if (!chatbotToDelete) return;
    try {
      if (!testMode) await deleteDoc(doc(db, "chatbot_configs", chatbotToDelete));
      setChatbots((prev) => prev.filter((c) => c.id !== chatbotToDelete));
      toast.success("Chatbot deleted");
    } catch (err) {
      console.error("Error deleting chatbot:", err);
      toast.error(`Couldn't delete the chatbot: ${(err as Error).message}`);
    } finally {
      deleteModal.closeModal();
    }
  };

  const openEmbedModal = (id: string) => {
    setSelectedChatbotId(id);
    setEmbedCopied(false);
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
    if (!selectedChatbotId) return;
    navigator.clipboard.writeText(generateEmbedCode(selectedChatbotId)).then(
      () => {
        setEmbedCopied(true);
        toast.success("Embed code copied");
      },
      () => toast.error("Couldn't copy the embed code.")
    );
  };

  const refreshDashboard = async () => {
    if (testMode) {
      toast.success("(Test mode) Nothing to refresh");
      return;
    }
    setRefreshing(true);
    await fetchChatbots();
    setNotificationsFetched(false);
    setRefreshing(false);
  };

  const downloadReport = () => {
    try {
      downloadCsv(
        "askio_report",
        ["Chatbot Name", "Positive Feedback", "Negative Feedback", "Created At", "Last Updated"],
        chatbots.map((c) => {
          const stats = feedbackCounts[c.id] || { positive: 0, negative: 0 };
          return [c.title, stats.positive, stats.negative, c.createdAt.toISOString(), c.lastUpdated.toISOString()];
        })
      );
      toast.success("Report downloaded");
    } catch (err) {
      console.error("Error downloading report:", err);
      toast.error("Failed to download report");
    }
  };

  const chatbotName = (id: string) => chatbots.find((c) => c.id === id)?.title || "Unknown chatbot";

  const downloadOwnedReport = async (
    kind: "leads" | "unanswered_queries",
    setBusy: (busy: boolean) => void
  ) => {
    const user = auth.currentUser;
    if (!user) return;
    setBusy(true);
    try {
      const rows = await fetchOwnedByChatbots(kind, user.uid, chatbots.map((c) => c.id));
      if (kind === "leads") {
        downloadCsv(
          "askio_leads_report",
          ["Email", "Chatbot Name", "Timestamp"],
          rows.map((r) => [r.email || "", chatbotName(r.chatbotId), r.timestamp.toISOString()])
        );
      } else {
        downloadCsv(
          "askio_unanswered_queries_report",
          ["Query", "Chatbot Name", "Timestamp"],
          rows.map((r) => [r.query || "", chatbotName(r.chatbotId), r.timestamp.toISOString()])
        );
      }
      toast.success(rows.length > 0 ? `Exported ${rows.length} row${rows.length === 1 ? "" : "s"}` : "Exported an empty report");
    } catch (err) {
      console.error(`Error downloading ${kind} report:`, err);
      toast.error("Failed to download report");
    } finally {
      setBusy(false);
    }
  };

  const chatbotActions = {
    onEdit: (id: string) => navigate(`/configure/${id}`),
    onEmbed: openEmbedModal,
    onDelete: openDeleteModal,
    onToggleActive: toggleChatbotStatus,
  };

  const firstName = auth.currentUser?.displayName?.split(" ")[0];
  const deleteTarget = chatbots.find((c) => c.id === chatbotToDelete);

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>Dashboard | Askio Chatbot</title>
        <meta name="description" content="Manage and optimize your chatbots with Askio's dashboard." />
      </Helmet>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-caption font-medium uppercase tracking-wider text-[#647184] dark:text-[#87909D]">
              {format(new Date(), "EEEE, MMMM d")}
            </p>
            <h1 className="mt-1 font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">
              {greeting()}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">
              Here's how your chatbots are doing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className={secondaryButton}
              aria-label="Refresh dashboard"
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <Tabs
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "chatbots", label: "Chatbots", count: loading ? undefined : chatbots.length },
            { id: "reports", label: "Reports" },
            { id: "notifications", label: "Notifications", showBadge: hasUnseenNotifications },
          ]}
          activeTab={activeTab}
          onChange={(id) => changeTab(id as TabId)}
        />

        {activeTab === "overview" && (
          <OverviewTab
            chatbots={chatbots}
            feedbackCounts={feedbackCounts}
            dailyFeedback={dailyFeedback}
            totalFeedback={totalFeedback}
            satisfactionRate={satisfactionRate}
            trends={trends}
            recentActivities={feedbackEvents.slice(0, RECENT_ACTIVITY_LIMIT)}
            loading={loading}
            error={error}
            onRetry={fetchChatbots}
            onViewChatbots={() => changeTab("chatbots")}
            onViewNotifications={() => changeTab("notifications")}
            {...chatbotActions}
          />
        )}

        {activeTab === "chatbots" && (
          <ChatbotsTab
            chatbots={chatbots}
            feedbackCounts={feedbackCounts}
            loading={loading}
            error={error}
            onRetry={fetchChatbots}
            {...chatbotActions}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            hasChatbots={chatbots.length > 0}
            onDownloadPerformance={downloadReport}
            onDownloadLeads={() => downloadOwnedReport("leads", setIsGeneratingLeadReport)}
            onDownloadQueries={() => downloadOwnedReport("unanswered_queries", setIsGeneratingQueryReport)}
            generatingLeads={isGeneratingLeadReport}
            generatingQueries={isGeneratingQueryReport}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            loading={loadingNotifications && notifications.length === 0}
            lastSeen={seenBeforeOpen}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={deleteChatbot}
        title="Delete chatbot"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500 dark:focus:ring-red-400"
      >
        <p className="text-body-sm text-[#566273] dark:text-[#D7DFE5]">
          {deleteTarget ? (
            <>
              <span className="font-medium text-[#101723] dark:text-white">{deleteTarget.title}</span> will be
              removed from every site it's embedded on.
            </>
          ) : (
            "This chatbot will be removed from every site it's embedded on."
          )}{" "}
          This can't be undone.
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={embedModal.isOpen}
        onClose={embedModal.closeModal}
        title="Embed code"
        confirmText={embedCopied ? "Copied" : "Copy code"}
        cancelText="Close"
        onConfirm={copyEmbedCode}
        confirmButtonClass="bg-[#101723] text-white hover:bg-[#243040] shadow-md dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6] focus:ring-[#101723] dark:focus:ring-[#D7DFE5]"
      >
        <p className="mb-3 text-body-sm text-[#566273] dark:text-[#9BAABD]">
          Paste this just before the closing <code className="font-mono text-[13px]">&lt;/body&gt;</code> tag on
          your site.
        </p>
        <div className="relative rounded-lg border border-[#D8DFE9] bg-[#101723] p-3 pr-10 dark:border-[#39485B]">
          <button
            onClick={copyEmbedCode}
            aria-label="Copy embed code"
            className="absolute right-2 top-2 rounded-md p-1.5 text-[#9BAABD] transition-colors hover:bg-white/10 hover:text-white"
          >
            {embedCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <pre className="overflow-x-auto whitespace-pre font-mono text-[12.5px] leading-relaxed text-[#D7DFE5]">
            {selectedChatbotId && generateEmbedCode(selectedChatbotId)}
          </pre>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default Dashboard;
