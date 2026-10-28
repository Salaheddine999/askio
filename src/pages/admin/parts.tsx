import React from "react";
import { Skeleton } from "../../components/Skeleton";
import { Pagination, focusRing, surface } from "../dashboard/ui";
import { AdminUser } from "./data";

const tone = {
  free: "bg-ink-70 text-ink-605 ring-ink-605/10 dark:bg-ink-805 dark:text-ink-325 dark:ring-white/5",
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
  const color = ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-ink-900 dark:bg-ink-130";
  return (
    <div>
      <div className="flex items-baseline justify-between text-caption tabular-nums text-fg-muted">
        <span>{used.toLocaleString()} used</span>
        <span>{unlimited ? "No limit" : limit <= 0 ? "No AI on this plan" : `of ${limit.toLocaleString()}`}</span>
      </div>
      {!unlimited && limit > 0 && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-70 dark:bg-ink-790">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(ratio * 100, used > 0 ? 2 : 0)}%` }} />
        </div>
      )}
    </div>
  );
};

export const Card: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, action, children }) => (
  <section className={surface}>
    <div className="flex flex-col gap-3 border-b border-ink-70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 dark:border-ink-780">
      <div className="min-w-0">
        <h2 className="text-body font-semibold text-ink-900 dark:text-ink-70">{title}</h2>
        {description && <p className="mt-0.5 text-body-sm text-fg-subtle">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
    {children}
  </section>
);

/** Placeholder rows while a list loads. */
export const RowsLoading: React.FC<{ rows?: number; height?: string }> = ({ rows = 5, height = "h-8" }) => (
  <div className="space-y-3 p-5 sm:p-6" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className={`${height} w-full`} />
    ))}
  </div>
);

/** A row of filter chips; the selected one is filled. */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-full border px-3 text-caption font-medium transition-colors ${focusRing} ${
              selected
                ? "border-ink-900 bg-ink-900 text-white dark:border-ink-130 dark:bg-ink-130 dark:text-ink-875"
                : "border-ink-120 text-ink-605 hover:border-ink-230 hover:text-ink-900 dark:border-ink-780 dark:text-ink-325 dark:hover:text-ink-130"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** The numbered pager under a paged list, hidden when everything fits on one page. */
export const Pager: React.FC<{
  page: number;
  totalPages: number;
  summary: string;
  onChange: (page: number) => void;
}> = ({ page, totalPages, summary, onChange }) =>
  totalPages > 1 ? (
    <div className="border-t border-ink-70 px-5 py-3 sm:px-6 dark:border-ink-780">
      <Pagination page={page} totalPages={totalPages} onChange={onChange} summary={summary} />
    </div>
  ) : null;
