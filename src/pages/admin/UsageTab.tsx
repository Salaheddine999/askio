import React, { useEffect, useState } from "react";
import {  } from "../../components/icons";
import { EmptyState, focusRing } from "../dashboard/ui";
import { UsageRow, toUsageRow, usageMonth, usageQuery } from "./data";
import { Card, FilterChips, Pager, PlanBadge, RowsLoading, UsageBar } from "./parts";
import { PAGE_SIZE, rangeSummary, usePaged } from "../../hooks/usePaged";
import { AiIcon } from "../../components/icons";

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export const UsageItem: React.FC<{ row: UsageRow; rank?: number; onOpen: (uid: string) => void }> = ({ row, rank, onOpen }) => (
  <li>
    <button
      type="button"
      onClick={() => onOpen(row.uid)}
      className={`flex w-full items-center gap-4 px-5 py-3 text-start transition-colors hover:bg-ink-30 sm:px-6 dark:hover:bg-ink-875 ${focusRing}`}
    >
      {rank !== undefined && (
        <span className="w-6 shrink-0 text-end text-caption tabular-nums text-ink-425">{rank}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex min-w-0 items-center gap-2">
          <span className="truncate text-body-sm font-medium text-fg" title={row.user?.email}>
            {row.user?.email || row.uid}
          </span>
          {row.user && <PlanBadge user={row.user} />}
        </span>
        <UsageBar used={row.replies} limit={row.user?.aiReplyLimit ?? 0} />
      </span>
    </button>
  </li>
);

const UsageTab: React.FC<{ onOpen: (uid: string) => void; version: number }> = ({ onOpen, version }) => {
  const [monthsAgo, setMonthsAgo] = useState<"0" | "1" | "2">("0");
  const month = usageMonth(Number(monthsAgo));
  const list = usePaged(month, () => usageQuery(month), toUsageRow);

  useEffect(() => {
    if (version > 0) void list.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <Card
      title="AI usage"
      description="Accounts by AI replies used, most first. Each reply costs you; watch who's near their limit."
      action={
        <FilterChips
          label="Month"
          value={monthsAgo}
          onChange={setMonthsAgo}
          options={(["0", "1", "2"] as const).map((v) => ({ value: v, label: monthLabel(usageMonth(Number(v))) }))}
        />
      }
    >
      {list.error ? (
        <p role="alert" className="px-6 py-8 text-center text-body-sm text-red-600 dark:text-red-400">
          Couldn't load AI usage: {list.error}
        </p>
      ) : list.items === null ? (
        <RowsLoading rows={6} height="h-10" />
      ) : list.items.length === 0 ? (
        <EmptyState compact icon={AiIcon} title="No AI replies" description={`Nobody used AI replies in ${monthLabel(month)}.`} />
      ) : (
        <div className={`transition-opacity ${list.loading ? "opacity-60" : ""}`}>
          <ul className="divide-y divide-ink-70 dark:divide-ink-780">
            {list.items.map((row, i) => (
              <UsageItem key={row.uid} row={row} rank={(list.page - 1) * PAGE_SIZE + i + 1} onOpen={onOpen} />
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

export default UsageTab;
