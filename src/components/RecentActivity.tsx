import React from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { MessageSquareHeart, ThumbsDown, ThumbsUp } from "lucide-react";
import { dateLocale, useT } from "../i18n";
import { dashboardMessages } from "../i18n/messages/dashboard";
import { commonMessages } from "../i18n/messages/common";

export interface ActivityItem {
  id: string;
  chatbotName: string;
  type: "positive" | "negative";
  date: Date;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll?: () => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewAll }) => {
  const t = useT(dashboardMessages);
  const tc = useT(commonMessages);
  const locale = dateLocale(t.lang);
  return (
    <div className="flex h-full flex-col rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] text-[#101723] shadow-[0_1px_2px_rgba(16,23,35,0.04)] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5]">
      <div className="flex items-start justify-between gap-3 border-b border-[#E7EDF6] px-5 pt-5 pb-4 sm:px-6 dark:border-[#2B3646]">
        <div>
          <h3 className="text-body font-semibold tracking-tight">{t("recentTitle")}</h3>
          <p className="mt-0.5 text-body-sm text-[#566273] dark:text-[#9BAABD]">
            {t("recentDesc")}
          </p>
        </div>
        {onViewAll && activities.length > 0 && (
          <button
            onClick={onViewAll}
            className="shrink-0 rounded text-body-sm font-medium text-[#566273] underline-offset-4 hover:text-[#101723] hover:underline dark:text-[#9BAABD] dark:hover:text-[#D7DFE5]"
          >
            {t("viewAll")}
          </button>
        )}
      </div>
      {activities.length > 0 ? (
        <ul className="flex-1 divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
          {activities.map((activity) => {
            const positive = activity.type === "positive";
            const Icon = positive ? ThumbsUp : ThumbsDown;
            return (
              <li key={activity.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    positive
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-400"
                  }`}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-medium">{activity.chatbotName}</p>
                  <p className="text-caption text-[#647184] dark:text-[#87909D]">
                    {positive ? t("positiveRating") : t("negativeRating")}
                  </p>
                </div>
                <time
                  dateTime={activity.date.toISOString()}
                  title={format(activity.date, tc("dateTimeFormat"), { locale })}
                  className="shrink-0 text-caption tabular-nums text-[#647184] dark:text-[#87909D]"
                >
                  {activity.date.getTime() === 0
                    ? "—"
                    : formatDistanceToNowStrict(activity.date, { addSuffix: true, locale })}
                </time>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <MessageSquareHeart size={26} className="text-[#87909D]" strokeWidth={1.5} />
          <p className="mt-3 text-body-sm font-medium">{t("noActivityTitle")}</p>
          <p className="mt-1 max-w-xs text-caption text-[#647184] dark:text-[#87909D]">
            {t("noActivityDesc")}
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
