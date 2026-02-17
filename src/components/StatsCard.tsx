import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend,
  trendDirection = "neutral",
}) => {
  return (
    <div className="rounded-xl border border-[#E0DEDB] dark:border-[#44403C] bg-white dark:bg-[#121212] text-[#37322F] dark:text-[#F5F5F4] shadow-sm p-6 flex flex-col justify-between h-full">
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <h3 className="tracking-tight text-body-sm font-medium text-[#605A57] dark:text-[#A8A29E] font-sans">
          {title}
        </h3>
        {trend && (
             <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                 trendDirection === "up" 
                 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                 : trendDirection === "down"
                 ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                 : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
             }`}>
                {trendDirection === "up" && "↗"}
                {trendDirection === "down" && "↘"}
                <span className="ml-1">{trend}</span>
             </div>
        )}
      </div>
      <div>
        <div className="text-h2 font-bold font-sans text-[#37322F] dark:text-[#F5F5F4] mb-2 truncate" title={String(value)}>
          {value}
        </div>
        <p className="text-caption text-[#605A57] dark:text-[#666] font-medium break-words">
            {title === "Total Chatbots" && "Active across all platforms"}
            {title === "Total Feedback" && "Collected from users"}
            {title === "Satisfaction Rate" && "Based on positive rating"}
            {title === "Avg. Feedback" && "Per active chatbot"}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;
