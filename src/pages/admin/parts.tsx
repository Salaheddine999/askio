import React from "react";
import { AdminUser } from "./data";

const tone = {
  free: "bg-[#E7EDF6] text-[#566273] ring-[#566273]/10 dark:bg-[#243040] dark:text-[#9BAABD] dark:ring-white/5",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-400/20",
  warn: "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-400/20",
  bad: "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-400/20",
};

const Pill: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset ${className}`}>
    {children}
  </span>
);

/** The plan, with the subscription state when it needs attention. */
export const PlanBadge: React.FC<{ user: AdminUser }> = ({ user }) => {
  const status = user.subscriptionStatus.toLowerCase();
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {user.suspended && <Pill className={tone.bad}>Suspended</Pill>}
      <Pill className={user.plan === "free" ? tone.free : tone.paid}>
        {user.plan === "pro" ? "Pro" : user.plan === "enterprise" ? "Enterprise" : "Free"}
      </Pill>
      {user.plan !== "free" && ["cancelled", "canceled"].includes(status) && <Pill className={tone.warn}>Cancelled</Pill>}
      {["past_due", "unpaid", "paused"].includes(status) && <Pill className={tone.warn}>{status === "past_due" ? "Past due" : status[0].toUpperCase() + status.slice(1)}</Pill>}
    </span>
  );
};

export const UsageBar: React.FC<{ used: number; limit: number }> = ({ used, limit }) => {
  const unlimited = !Number.isFinite(limit) || limit >= Number.MAX_SAFE_INTEGER;
  const ratio = unlimited || limit <= 0 ? 0 : Math.min(1, used / limit);
  const color = ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-[#101723] dark:bg-[#D7DFE5]";
  return (
    <div>
      <div className="flex items-baseline justify-between text-caption tabular-nums text-[#566273] dark:text-[#9BAABD]">
        <span>{used.toLocaleString()} used</span>
        <span>{unlimited ? "No limit" : limit <= 0 ? "No AI on this plan" : `of ${limit.toLocaleString()}`}</span>
      </div>
      {!unlimited && limit > 0 && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E7EDF6] dark:bg-[#273444]">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(ratio * 100, used > 0 ? 2 : 0)}%` }} />
        </div>
      )}
    </div>
  );
};
