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
    <div className="rounded-xl border border-[rgba(16,23,35,0.12)] dark:border-[#2B3646] bg-[#F9FCFF] dark:bg-[#1A2533] text-[#101723] dark:text-[#D7DFE5] shadow-sm">
      <div className="p-6 pb-4 border-b border-[#D8DFE9] dark:border-[#2B3646]">
        <h3 className="text-body-lg font-semibold font-sans tracking-tight">Recent Activity</h3>
        <p className="text-body-sm text-[#566273] dark:text-[#9BAABD]">
          Latest feedback from your users.
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-8">
          {activities.length > 0 ? (
            activities.map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full border border-[#D8DFE9] dark:border-[#2B3646] bg-[#F3F7FC] dark:bg-[#141D2B] flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-[#566273] dark:text-[#9BAABD]" />
                    </div>
                    <div className="ml-4 space-y-1">
                        <p className="text-body-sm font-medium leading-none font-sans line-clamp-1">
                        {activity.chatbotName}
                        </p>
                        <p className="text-body-sm text-[#566273] dark:text-[#9BAABD]">
                        received {activity.type} feedback
                        </p>
                    </div>
                </div>
                <div className="ml-14 sm:ml-auto font-medium text-caption text-[#566273] dark:text-[#9BAABD]">
                    {format(activity.date, "MMM d, h:mm a")}
                </div>
                </div>
            ))
          ) : (
             <p className="text-body-sm text-[#566273] dark:text-[#9BAABD]">No recent activity.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
