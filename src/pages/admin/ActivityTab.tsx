import React, { useEffect, useState } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Ban, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { EmptyState } from "../dashboard/ui";
import { LogEntry, LogFilter, logQuery, toLogEntry } from "./data";
import { Card, FilterChips, Pager, RowsLoading } from "./parts";
import { rangeSummary, usePaged } from "./usePaged";

const ACTIONS: Record<string, { label: string; icon: typeof Ban; tone: string }> = {
  suspend: { label: "Suspended", icon: Ban, tone: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300" },
  unsuspend: { label: "Unsuspended", icon: RotateCcw, tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300" },
  delete: { label: "Deleted", icon: Trash2, tone: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300" },
};

const FILTERS: { value: LogFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "suspend", label: "Suspensions" },
  { value: "unsuspend", label: "Unsuspensions" },
  { value: "delete", label: "Deletions" },
];

export const LogItem: React.FC<{ entry: LogEntry; showAdmin?: boolean }> = ({ entry, showAdmin }) => {
  const action = ACTIONS[entry.action] ?? { label: entry.action, icon: ShieldCheck, tone: "bg-[#E7EDF6] text-[#566273]" };
  const Icon = action.icon;
  return (
    <li className="flex items-start gap-3 px-5 py-3 sm:px-6">
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${action.tone}`}>
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm text-[#101723] dark:text-[#D7DFE5]" title={entry.targetEmail || undefined}>
          <span className="font-medium">{action.label}</span> {entry.targetEmail || "an account"}
        </p>
        {entry.reason && (
          <p className="mt-0.5 line-clamp-2 text-caption text-[#647184] dark:text-[#87909D]" title={entry.reason}>
            “{entry.reason}”
          </p>
        )}
        {showAdmin && entry.adminEmail && (
          <p className="mt-0.5 truncate text-caption text-[#87909D]">by {entry.adminEmail}</p>
        )}
      </div>
      <span
        className="shrink-0 whitespace-nowrap text-caption text-[#87909D]"
        title={entry.at ? format(entry.at, "PPpp") : undefined}
      >
        {!entry.at ? "" : Date.now() - entry.at.getTime() < 60_000 ? "just now" : formatDistanceToNowStrict(entry.at, { addSuffix: true })}
      </span>
    </li>
  );
};

const ActivityTab: React.FC<{ version: number }> = ({ version }) => {
  const [filter, setFilter] = useState<LogFilter>("all");
  const list = usePaged(filter, () => logQuery(filter), toLogEntry);

  useEffect(() => {
    if (version > 0) void list.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <Card title="Activity" description="Every suspension and deletion by an admin, newest first.">
      <div className="border-b border-[#E7EDF6] px-5 py-3 sm:px-6 dark:border-[#2B3646]">
        <FilterChips label="Filter activity" value={filter} onChange={setFilter} options={FILTERS} />
      </div>
      {list.error ? (
        <p role="alert" className="px-6 py-8 text-center text-body-sm text-red-600 dark:text-red-400">
          Couldn't load activity: {list.error}
        </p>
      ) : list.items === null ? (
        <RowsLoading rows={6} />
      ) : list.items.length === 0 ? (
        <EmptyState compact icon={ShieldCheck} title="Nothing here yet" description="Admin actions will be listed here." />
      ) : (
        <div className={`transition-opacity ${list.loading ? "opacity-60" : ""}`}>
          <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
            {list.items.map((entry) => (
              <LogItem key={entry.id} entry={entry} showAdmin />
            ))}
          </ul>
          <Pager
            page={list.page}
            totalPages={list.totalPages}
            onChange={(p) => void list.goTo(p)}
            summary={rangeSummary(list.page, list.total, list.items.length)}
          />
        </div>
      )}
    </Card>
  );
};

export default ActivityTab;
