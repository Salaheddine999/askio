import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  description?: string;
}

const trendStyles = {
  up: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-400/20",
  down: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-900/25 dark:text-rose-400 dark:ring-rose-400/20",
  neutral: "bg-[#E7EDF6] text-[#566273] ring-[#566273]/10 dark:bg-[#243040] dark:text-[#9BAABD] dark:ring-white/5",
};

const TrendIcon = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus };

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend,
  trendDirection = "neutral",
  icon,
  description,
}) => {
  const Arrow = TrendIcon[trendDirection];
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-4 text-[#101723] sm:p-5 shadow-[0_1px_2px_rgba(16,23,35,0.04)] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5]">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3 className="flex min-w-0 items-center gap-2 text-body-sm font-medium text-[#566273] dark:text-[#9BAABD]">
          {icon && (
            <span className="hidden h-7 w-7 shrink-0 sm:flex items-center justify-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] dark:border-[#2B3646] dark:bg-[#141D2B]">
              {icon}
            </span>
          )}
          <span className="truncate">{title}</span>
        </h3>
        {trend && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-caption font-medium tabular-nums ring-1 ring-inset ${trendStyles[trendDirection]}`}
          >
            <Arrow size={12} strokeWidth={2.25} />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <div
          className="truncate font-serif text-h3 tabular-nums sm:text-h2 text-[#101723] dark:text-[#D7DFE5]"
          title={String(value)}
        >
          {value}
        </div>
        {description && (
          <p className="mt-1 text-caption text-[#647184] dark:text-[#87909D]">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
