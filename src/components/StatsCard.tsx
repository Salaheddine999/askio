import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend,
  trendDirection = "neutral",
  icon,
}) => {
  return (
    <div className="rounded-xl border border-[#D8DFE9] dark:border-[#2B3646] bg-[#F9FCFF] dark:bg-[#1A2533] text-[#101723] dark:text-[#D7DFE5] shadow-sm p-6 flex flex-col justify-between h-full">
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <h3 className="tracking-tight text-body-sm font-medium text-[#566273] dark:text-[#9BAABD] font-sans flex items-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {title}
        </h3>
        {trend && (
             <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                 trendDirection === "up" 
                 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                 : trendDirection === "down"
                 ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                 : "bg-[#E7EDF6] text-[#1A2533] dark:bg-[#1A2533] dark:text-[#D7DFE5]"
             }`}>
                {trendDirection === "up" && "↗"}
                {trendDirection === "down" && "↘"}
                <span className="ml-1">{trend}</span>
             </div>
        )}
      </div>
      <div>
        <div className="text-h2 font-bold font-sans text-[#101723] dark:text-[#D7DFE5] mb-2 truncate" title={String(value)}>
          {value}
        </div>
        <p className="text-caption text-[#566273] dark:text-[#9BAABD] font-medium break-words">
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
