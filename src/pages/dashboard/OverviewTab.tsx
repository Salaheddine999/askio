import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, MessageSquare, Plus, Smile, TrendingUp } from "lucide-react";
import StatsCard from "../../components/StatsCard";
import AiUsageMeter from "../../components/AiUsageMeter";
import OverviewChart, { FeedbackSeries } from "../../components/OverviewChart";
import RecentActivity, { ActivityItem } from "../../components/RecentActivity";
import ChatbotCard from "../../components/ChatbotCard";
import { ListSkeleton, Skeleton, SkeletonCard, StatTilesSkeleton } from "../../components/Skeleton";
import { ChatbotGridSkeleton, CreateChatbotLink, EmptyState, ErrorBanner, focusRing } from "./ui";
import { Chatbot, ChatbotActions, EMPTY_FEEDBACK, FeedbackCounts, TrendData } from "./types";
import { useT } from "../../i18n";
import { dashboardMessages } from "../../i18n/messages/dashboard";
import { commonMessages } from "../../i18n/messages/common";

const FEATURED_CHATBOTS = 3;

interface OverviewTabProps extends ChatbotActions {
  chatbots: Chatbot[];
  feedbackCounts: Record<string, FeedbackCounts>;
  dailyFeedback: FeedbackSeries;
  totalFeedback: number;
  satisfactionRate: number;
  trends: Record<"chatbots" | "feedback" | "satisfaction" | "avgFeedback", TrendData>;
  recentActivities: ActivityItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewChatbots: () => void;
  onViewNotifications: () => void;
}

// Flat trends add noise, so only real movement gets a chip.
const trendProps = (trend: TrendData) =>
  trend.direction === "neutral" ? {} : { trend: trend.value, trendDirection: trend.direction };

const statIcon = "h-3.5 w-3.5 text-[#566273] dark:text-[#9BAABD]";

const linkButton = `inline-flex shrink-0 items-center gap-1 rounded text-body-sm font-medium text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] ${focusRing}`;

const BAR_HEIGHTS = [55, 80, 35, 65, 90, 45, 70, 30, 60, 75, 40, 85];

const OverviewSkeleton: React.FC = () => {
  const t = useT(dashboardMessages);
  return (
  <div className="space-y-6" aria-busy="true" aria-label={t("loadingOverview")}>
    <StatTilesSkeleton />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <SkeletonCard className="p-5 xl:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-7 w-44 rounded-lg" />
        </div>
        <div className="mt-6 flex h-[280px] items-end gap-2 lg:h-[320px]">
          {BAR_HEIGHTS.map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
          ))}
        </div>
      </SkeletonCard>
      <SkeletonCard>
        <div className="space-y-2 px-5 pt-5 pb-4 sm:px-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <ListSkeleton rows={5} className="border-t border-[#E7EDF6] dark:border-[#2B3646]" />
      </SkeletonCard>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <ChatbotGridSkeleton count={FEATURED_CHATBOTS} />
    </div>
  </div>
  );
};

const OverviewTab: React.FC<OverviewTabProps> = ({
  chatbots,
  feedbackCounts,
  dailyFeedback,
  totalFeedback,
  satisfactionRate,
  trends,
  recentActivities,
  loading,
  error,
  onRetry,
  onViewChatbots,
  onViewNotifications,
  ...actions
}) => {
  const t = useT(dashboardMessages);
  const tc = useT(commonMessages);
  const activeCount = chatbots.filter((c) => c.isActive ?? true).length;

  const featured = useMemo(
    () =>
      [...chatbots]
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
        .slice(0, FEATURED_CHATBOTS),
    [chatbots]
  );

  const byChatbot = useMemo(
    () => ({
      labels: chatbots.map((c) => c.title),
      positive: chatbots.map((c) => feedbackCounts[c.id]?.positive || 0),
      negative: chatbots.map((c) => feedbackCounts[c.id]?.negative || 0),
    }),
    [chatbots, feedbackCounts]
  );

  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;
  if (loading) return <OverviewSkeleton />;

  if (chatbots.length === 0) {
    return (
      <div className="space-y-6">
        <AiUsageMeter />
        <div className="rounded-2xl border border-dashed border-[#C9D3E0] bg-[#F9FCFF]/60 dark:border-[#39485B] dark:bg-[#1A2533]/40">
          <EmptyState
            icon={Bot}
            title={t("firstChatbotTitle")}
            description={t("firstChatbotDesc")}
            action={<CreateChatbotLink label={t("createChatbot")} to="/start" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatsCard
          title={t("statChatbots")}
          value={chatbots.length.toLocaleString(t.lang)}
          description={t("statChatbotsDesc", {
            live: activeCount.toLocaleString(t.lang),
            paused: (chatbots.length - activeCount).toLocaleString(t.lang),
          })}
          icon={<Bot className={statIcon} />}
          {...trendProps(trends.chatbots)}
        />
        <StatsCard
          title={t("statRatings")}
          value={totalFeedback.toLocaleString(t.lang)}
          description={t("statRatingsDesc")}
          icon={<MessageSquare className={statIcon} />}
          {...trendProps(trends.feedback)}
        />
        <StatsCard
          title={t("statSatisfaction")}
          value={
            totalFeedback > 0
              ? (satisfactionRate / 100).toLocaleString(t.lang, { style: "percent", maximumFractionDigits: 0 })
              : "—"
          }
          description={t("statSatisfactionDesc")}
          icon={<Smile className={statIcon} />}
          {...trendProps(trends.satisfaction)}
        />
        <StatsCard
          title={t("statPerChatbot")}
          value={(totalFeedback / (chatbots.length || 1)).toLocaleString(t.lang, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          description={t("statPerChatbotDesc")}
          icon={<TrendingUp className={statIcon} />}
          {...trendProps(trends.avgFeedback)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OverviewChart byChatbot={byChatbot} overTime={dailyFeedback} />
        </div>
        <div className="flex flex-col gap-4">
          <AiUsageMeter />
          <div className="flex-1">
            <RecentActivity activities={recentActivities} onViewAll={onViewNotifications} />
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-h3 text-[#101723] dark:text-[#D7DFE5]">{t("yourChatbots")}</h2>
            <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">{t("recentChatbots")}</p>
          </div>
          <button onClick={onViewChatbots} className={linkButton}>
            {t("viewAllCount", { count: chatbots.length.toLocaleString(t.lang) })}
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((chatbot, index) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              feedback={feedbackCounts[chatbot.id] || EMPTY_FEEDBACK}
              viewMode="grid"
              onEdit={actions.onEdit}
              onEmbed={actions.onEmbed}
              onDelete={actions.onDelete}
              onToggleActive={() => actions.onToggleActive(chatbot)}
              index={index}
            />
          ))}
          {featured.length < FEATURED_CHATBOTS && (
            <Link
              to="/configure"
              className={`group flex min-h-[11rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#C9D3E0] text-center transition-colors hover:border-[#101723]/40 hover:bg-[#F9FCFF] dark:border-[#39485B] dark:hover:border-[#D7DFE5]/40 dark:hover:bg-[#1A2533] ${focusRing}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E7EDF6] text-[#243040] transition-transform group-hover:scale-105 dark:bg-[#243040] dark:text-[#D7DFE5]">
                <Plus size={20} />
              </span>
              <span>
                <span className="block text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">{tc("newChatbot")}</span>
                <span className="block text-caption text-[#647184] dark:text-[#87909D]">{t("newChatbotHint")}</span>
              </span>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
