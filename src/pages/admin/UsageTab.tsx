import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { EmptyState, focusRing } from "../dashboard/ui";
import { UsageRow, toUsageRow, usageMonth, usageQuery } from "./data";
import { Card, FilterChips, Pager, PlanBadge, RowsLoading, UsageBar } from "./parts";
import { PAGE_SIZE, rangeSummary, usePaged } from "./usePaged";

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

export const UsageItem: React.FC<{ row: UsageRow; rank?: number; onOpen: (uid: string) => void }> = ({ row, rank, onOpen }) => (
  <li>
    <button
      type="button"
      onClick={() => onOpen(row.uid)}
      className={`flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-[#F3F7FC] sm:px-6 dark:hover:bg-[#141D2B] ${focusRing}`}
    >
      {rank !== undefined && (
        <span className="w-6 shrink-0 text-right text-caption tabular-nums text-[#87909D]">{rank}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex min-w-0 items-center gap-2">
          <span className="truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]" title={row.user?.email}>
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
        <EmptyState compact icon={Sparkles} title="No AI replies" description={`Nobody used AI replies in ${monthLabel(month)}.`} />
      ) : (
        <div className={`transition-opacity ${list.loading ? "opacity-60" : ""}`}>
          <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
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
