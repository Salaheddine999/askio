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
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { format, isBefore, startOfDay, subDays } from "date-fns";
import ConfirmationModal from "../components/ConfirmationModal";
import { toast } from "react-hot-toast";
import { useModal } from "../hooks/useModal";
import Tabs from "../components/Tabs";
import { ActivityItem } from "../components/RecentActivity";
import { FeedbackSeries } from "../components/OverviewChart";
import { useCollection } from "react-firebase-hooks/firestore";
import { DUMMY_CHATBOTS, DUMMY_FEEDBACK_COUNTS, DUMMY_RECENT_ACTIVITY } from "../utils/dummyData";
import { Helmet } from "react-helmet-async";
import { embedCodeFor } from "../utils/embedCode";
import { openNotifications } from "../utils/sidebarCounts";
import OverviewTab from "./dashboard/OverviewTab";
import ChatbotsTab from "./dashboard/ChatbotsTab";
import ReportsTab from "./dashboard/ReportsTab";
import { downloadCsv, fetchOwnedByChatbots } from "./dashboard/data";
import { Chatbot, FeedbackCounts, TrendData } from "./dashboard/types";
import { dateLocale, useT } from "../i18n";
import { dashboardMessages } from "../i18n/messages/dashboard";

type TabId = "overview" | "chatbots" | "reports";
type Trends = Record<"chatbots" | "feedback" | "satisfaction" | "avgFeedback", TrendData>;

const NEUTRAL_TRENDS: Trends = {
  chatbots: { value: "0%", direction: "neutral" },
  feedback: { value: "0%", direction: "neutral" },
  satisfaction: { value: "0%", direction: "neutral" },
  avgFeedback: { value: "0", direction: "neutral" },
};

const RECENT_ACTIVITY_LIMIT = 5;
// Ratings kept for the chart and recent activity.
const NOTIFICATION_LIMIT = 200;


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

/** The last CHART_DAYS days, oldest first. */
const chartDays = () => {
  const today = startOfDay(new Date());
  return Array.from({ length: CHART_DAYS }, (_, i) => subDays(today, CHART_DAYS - 1 - i));
};

/**
 * Daily positive/negative counts for the last CHART_DAYS days, oldest first.
 * Labels are left empty; they're formatted in the viewer's language at render.
 */
function dailySeries(feedback: { isPositive: boolean; date: Date | null }[]): FeedbackSeries {
  const days = chartDays();
  const index = new Map(days.map((d, i) => [d.getTime(), i]));
  const positive = new Array(CHART_DAYS).fill(0);
  const negative = new Array(CHART_DAYS).fill(0);
  feedback.forEach(({ isPositive, date }) => {
    const i = date ? index.get(startOfDay(date).getTime()) : undefined;
    if (i === undefined) return;
    (isPositive ? positive : negative)[i]++;
  });
  return { labels: [], positive, negative };
}

// Sample data for test mode: a gentle upward trend with some day-to-day noise.
function sampleDailySeries(): FeedbackSeries {
  const series = dailySeries([]);
  series.positive = series.positive.map((_, i) => Math.round(6 + i * 0.35 + 4 * Math.abs(Math.sin(i * 1.7))));
  series.negative = series.negative.map((_, i) => Math.round(1 + Math.abs(Math.cos(i * 2.3)) * 2));
  return series;
}

function greetingKey(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? "greetingMorning" : hour < 18 ? "greetingAfternoon" : "greetingEvening";
}

interface DashboardProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  testMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ testMode }) => {
  const t = useT(dashboardMessages);
  const locale = dateLocale(t.lang);
  const navigate = useNavigate();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deleteModal = useModal();
  const embedModal = useModal();
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);
  const [embedCopied, setEmbedCopied] = useState(false);
  // The tab lives in the address (?tab=chatbots), so coming back from the
  // editor, or with the browser's back button, lands on the same tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: TabId = tabParam === "chatbots" || tabParam === "reports" ? tabParam : "overview";
  const location = useLocation();

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
            installedAt: data.installedAt?.toDate?.() ?? null,
          } as Chatbot;
        })
      );
    } catch (err) {
      console.error("Error fetching chatbots:", err);
      setError(t("loadError", { message: (err as Error).message }));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      setError(null);
      setLoading(false);
    } else {
      fetchChatbots();
    }
  }, [testMode, fetchChatbots]);

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

  const changeTab = (id: TabId) => {
    setSearchParams(id === "overview" ? {} : { tab: id }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleChatbotStatus = async (chatbot: Chatbot) => {
    const current = chatbot.isActive ?? true;
    const setStatus = (isActive: boolean) =>
      setChatbots((prev) => prev.map((c) => (c.id === chatbot.id ? { ...c, isActive } : c)));

    setStatus(!current);
    if (testMode) {
      toast.success(t(current ? "toastTestPaused" : "toastTestLive", { name: chatbot.title }));
      return;
    }
    try {
      await updateDoc(doc(db, "chatbot_configs", chatbot.id), {
        isActive: !current,
        lastUpdated: new Date(),
      });
      toast.success(t(current ? "toastPaused" : "toastLive", { name: chatbot.title }));
    } catch (err) {
      console.error("Error toggling chatbot status:", err);
      toast.error(t("toggleFailed"));
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
      toast.success(t("chatbotDeleted"));
    } catch (err) {
      console.error("Error deleting chatbot:", err);
      toast.error(t("deleteFailed", { message: (err as Error).message }));
    } finally {
      deleteModal.closeModal();
    }
  };

  const openEmbedModal = (id: string) => {
    setSelectedChatbotId(id);
    setEmbedCopied(false);
    embedModal.openModal();
  };

  const generateEmbedCode = (id: string) => embedCodeFor(id);

  const copyEmbedCode = () => {
    if (!selectedChatbotId) return;
    navigator.clipboard.writeText(generateEmbedCode(selectedChatbotId)).then(
      () => {
        setEmbedCopied(true);
        toast.success(t("embedCopied"));
      },
      () => toast.error(t("embedCopyFailed"))
    );
  };

  // Coming back to the tab reloads the data, at most once a minute, so it's
  // never stale and there's nothing to refresh by hand.
  useEffect(() => {
    if (testMode) return;
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 60_000) return;
      last = Date.now();
      void fetchChatbots();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [testMode, fetchChatbots]);

  const downloadReport = () => {
    try {
      downloadCsv(
        "askio_report",
        [t("csvChatbotName"), t("csvPositive"), t("csvNegative"), t("csvCreatedAt"), t("csvLastUpdated")],
        chatbots.map((c) => {
          const stats = feedbackCounts[c.id] || { positive: 0, negative: 0 };
          return [c.title, stats.positive, stats.negative, c.createdAt.toISOString(), c.lastUpdated.toISOString()];
        })
      );
      toast.success(t("reportDownloaded"));
    } catch (err) {
      console.error("Error downloading report:", err);
      toast.error(t("reportFailed"));
    }
  };

  const chatbotName = (id: string) => chatbots.find((c) => c.id === id)?.title || t("unknownChatbot");

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
          [t("csvEmail"), t("csvChatbotName"), t("csvTimestamp")],
          rows.map((r) => [r.email || "", chatbotName(r.chatbotId), r.timestamp.toISOString()])
        );
      } else {
        downloadCsv(
          "askio_unanswered_queries_report",
          [t("csvQuery"), t("csvChatbotName"), t("csvTimestamp")],
          rows.map((r) => [r.query || "", chatbotName(r.chatbotId), r.timestamp.toISOString()])
        );
      }
      toast.success(rows.length > 0 ? t.plural("exportedRows", rows.length) : t("exportedEmpty"));
    } catch (err) {
      console.error(`Error downloading ${kind} report:`, err);
      toast.error(t("reportFailed"));
    } finally {
      setBusy(false);
    }
  };

  const chatbotActions = {
    // The editor's back link returns here, to this tab.
    onEdit: (id: string) => navigate(`/configure/${id}`, { state: { from: location.pathname + location.search } }),
    onEmbed: openEmbedModal,
    onDelete: openDeleteModal,
    onToggleActive: toggleChatbotStatus,
  };

  const firstName = auth.currentUser?.displayName?.split(" ")[0];
  const deleteTarget = chatbots.find((c) => c.id === chatbotToDelete);
  const chartFeedback = useMemo(
    () => ({ ...dailyFeedback, labels: chartDays().map((d) => format(d, t("chartDayFormat"), { locale })) }),
    [dailyFeedback, t, locale]
  );

  return (
    <div className="min-h-screen bg-ink-30 font-sans text-ink-900 dark:bg-ink-875">
      <Helmet>
        <title>{t("metaTitle")}</title>
        <meta name="description" content={t("metaDescription")} />
      </Helmet>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-caption font-medium text-fg-subtle">
              {format(new Date(), t("dateLineFormat"), { locale })}
            </p>
            <h1 className="mt-1 font-display text-h2 tracking-tight text-ink-900 sm:text-h1 dark:text-ink-130">
              {firstName ? t(`${greetingKey()}Name`, { name: firstName }) : t(greetingKey())}
            </h1>
            <p className="mt-1 text-body-sm text-fg-muted">
              {t("subtitle")}
            </p>
          </div>
        </header>

        <Tabs
          tabs={[
            { id: "overview", label: t("tabOverview") },
            { id: "chatbots", label: t("tabChatbots"), count: loading ? undefined : chatbots.length },
            { id: "reports", label: t("tabReports") },
          ]}
          activeTab={activeTab}
          onChange={(id) => changeTab(id as TabId)}
        />

        {activeTab === "overview" && (
          <OverviewTab
            chatbots={chatbots}
            feedbackCounts={feedbackCounts}
            dailyFeedback={chartFeedback}
            totalFeedback={totalFeedback}
            satisfactionRate={satisfactionRate}
            trends={trends}
            recentActivities={feedbackEvents.slice(0, RECENT_ACTIVITY_LIMIT)}
            onViewNotifications={openNotifications}
            loading={loading}
            error={error}
            onRetry={fetchChatbots}
            onViewChatbots={() => changeTab("chatbots")}
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

      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        onConfirm={deleteChatbot}
        title={t("deleteTitle")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        confirmButtonClass="bg-red-600 text-white hover:bg-red-700 shadow-md dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500 dark:focus:ring-red-400"
      >
        <p className="text-body-sm text-ink-605 dark:text-ink-130">
          {deleteTarget ? (
            <>
              {t("deleteNamedBefore")}
              <span className="font-medium text-ink-900 dark:text-white">{deleteTarget.title}</span>
              {t("deleteNamedAfter")}
            </>
          ) : (
            t("deleteUnnamed")
          )}{" "}
          {t("cannotUndo")}
        </p>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={embedModal.isOpen}
        onClose={embedModal.closeModal}
        title={t("embedTitle")}
        confirmText={embedCopied ? t("copied") : t("copyCode")}
        cancelText={t("close")}
        onConfirm={copyEmbedCode}
        confirmButtonClass="bg-ink-900 text-white hover:bg-ink-805 shadow-md dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70 focus:ring-ink-900 dark:focus:ring-ink-130"
      >
        <p className="mb-3 text-body-sm text-fg-muted">
          {t("embedHintBefore")} <code className="font-mono text-[13px]">&lt;/body&gt;</code>
          {t("embedHintAfter")}
        </p>
        {/* The whole snippet, wrapped, so it's readable without scrolling;
            the Copy button below is the one way to copy it. */}
        <pre className="whitespace-pre-wrap break-all rounded-lg bg-ink-900 px-4 py-3 font-mono text-[12.5px] leading-relaxed text-ink-130 dark:bg-ink-925">
          {selectedChatbotId && generateEmbedCode(selectedChatbotId)}
        </pre>
        <p className="mt-3 text-body-sm text-fg-muted">
          {t("embedOtherWays")}{" "}
          <Link
            to="/integrations"
            className="font-medium text-fg underline underline-offset-2 hover:no-underline"
          >
            {t("embedOtherLink")}
          </Link>
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default Dashboard;
