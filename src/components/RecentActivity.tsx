import React from "react";
import { format } from "date-fns";
import { Bot } from "lucide-react";

export interface ActivityItem {
  id: string;
  chatbotName: string;
  type: "positive" | "negative";
  date: Date;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="rounded-xl border border-[rgba(55,50,47,0.12)] dark:border-[#44403C] bg-white dark:bg-[#292524] text-[#37322F] dark:text-[#F5F5F4] shadow-sm">
      <div className="p-6 pb-4 border-b border-[#E0DEDB] dark:border-[#44403C]">
        <h3 className="text-lg font-semibold font-sans tracking-tight">Recent Activity</h3>
        <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">
          Latest feedback from your users.
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-8">
          {activities.length > 0 ? (
            activities.map((activity) => (
                <div key={activity.id} className="flex items-center">
                <div className="h-9 w-9 rounded-full border border-[#E0DEDB] dark:border-[#44403C] bg-[#FAFAF9] dark:bg-[#1C1917] flex items-center justify-center">
                    <Bot className="h-4 w-4 text-[#605A57] dark:text-[#A8A29E]" />
                </div>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none font-sans">
                    {activity.chatbotName}
                    </p>
                    <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">
                    received {activity.type} feedback
                    </p>
                </div>
                <div className="ml-auto font-medium text-xs text-[#605A57] dark:text-[#A8A29E]">
                    {format(activity.date, "MMM d, h:mm a")}
                </div>
                </div>
            ))
          ) : (
             <p className="text-sm text-[#605A57] dark:text-[#A8A29E]">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
