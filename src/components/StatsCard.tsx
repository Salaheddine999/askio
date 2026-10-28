import React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "./icons";

interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  description?: string;
  /** Which direction is good news. For counts like "unanswered", going down is good. */
  goodWhen?: "up" | "down";
}

const trendTones = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-400/20",
  bad: "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-900/25 dark:text-rose-400 dark:ring-rose-400/20",
  neutral: "bg-ink-70 text-ink-605 ring-ink-605/10 dark:bg-ink-805 dark:text-ink-325 dark:ring-white/5",
};

const TrendIcon = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus };

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  trend,
  trendDirection = "neutral",
  icon,
  description,
  goodWhen = "up",
}) => {
  const Arrow = TrendIcon[trendDirection];
  const tone = trendDirection === "neutral" ? "neutral" : trendDirection === goodWhen ? "good" : "bad";
  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-ink-120 bg-ink-25 p-4 text-ink-900 sm:p-5 shadow-[0_1px_2px_rgba(16,23,35,0.04)] dark:border-ink-780 dark:bg-ink-850 dark:text-ink-130">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3 className="flex min-w-0 items-center gap-2 text-body-sm font-medium text-fg-muted">
          {icon && (
            <span className="hidden h-7 w-7 shrink-0 sm:flex items-center justify-center rounded-lg border border-ink-120 bg-ink-30 dark:border-ink-780 dark:bg-ink-875">
              {icon}
            </span>
          )}
          <span className="line-clamp-2 sm:truncate">{title}</span>
        </h3>
        {trend && (
          <span
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-caption font-medium tabular-nums ring-1 ring-inset ${trendTones[tone]}`}
          >
            <Arrow size={12} strokeWidth={2.25} />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-3 sm:mt-4">
        <div
          className="truncate font-display text-h3 tabular-nums sm:text-h2 text-fg"
          title={String(value)}
        >
          {value}
        </div>
        {description && (
          <p className="mt-1 text-caption text-fg-subtle">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
