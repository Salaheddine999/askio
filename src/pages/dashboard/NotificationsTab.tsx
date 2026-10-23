import React, { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { BellOff, HelpCircle, LucideIcon, ThumbsDown, ThumbsUp, UserPlus } from "lucide-react";
import { NotificationItem } from "./types";
import { Pagination, RowsSkeleton, SectionHeader, EmptyState, focusRing, surface } from "./ui";

const PER_PAGE = 10;

type Filter = "all" | "lead" | "unanswered" | "feedback";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lead", label: "Leads" },
  { id: "unanswered", label: "Unanswered" },
  { id: "feedback", label: "Feedback" },
];

const matchesFilter = (item: NotificationItem, filter: Filter) =>
  filter === "all" ||
  (filter === "feedback" ? item.type.endsWith("_feedback") : item.type === filter);

const TYPE_STYLE: Record<NotificationItem["type"], { Icon: LucideIcon; tone: string }> = {
  lead: {
    Icon: UserPlus,
    tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/25 dark:text-emerald-400",
  },
  unanswered: {
    Icon: HelpCircle,
    tone: "bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400",
  },
  positive_feedback: {
    Icon: ThumbsUp,
    tone: "bg-[#E7EDF6] text-[#243040] dark:bg-[#243040] dark:text-[#D7DFE5]",
  },
  negative_feedback: {
    Icon: ThumbsDown,
    tone: "bg-rose-50 text-rose-600 dark:bg-rose-900/25 dark:text-rose-400",
  },
};

function dayLabel(date: Date) {
  if (date.getTime() === 0) return "Undated";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

interface NotificationsTabProps {
  notifications: NotificationItem[];
  loading: boolean;
  lastSeen: Date;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ notifications, loading, lastSeen }) => {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [filter]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((f) => [f.id, notifications.filter((n) => matchesFilter(n, f.id)).length])
      ) as Record<Filter, number>,
    [notifications]
  );

  const filtered = useMemo(
    () => notifications.filter((n) => matchesFilter(n, filter)),
    [notifications, filter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Group the visible page by day, keeping the newest-first order.
  const groups = useMemo(() => {
    const result: { label: string; items: NotificationItem[] }[] = [];
    pageItems.forEach((item) => {
      const label = dayLabel(item.timestamp);
      const last = result[result.length - 1];
      if (last?.label === label) last.items.push(item);
      else result.push({ label, items: [item] });
    });
    return result;
  }, [pageItems]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Notifications"
        description="New leads, unanswered questions and ratings across your chatbots."
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
      <div
        className="flex flex-wrap gap-2 xl:sticky xl:top-6 xl:flex-col xl:flex-nowrap xl:gap-0.5 xl:rounded-xl xl:border xl:border-[#D8DFE9] xl:bg-[#F9FCFF] xl:p-1.5 dark:xl:border-[#2B3646] dark:xl:bg-[#1A2533]"
        role="group"
        aria-label="Filter notifications"
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-body-sm font-medium transition-colors xl:h-9 xl:w-full xl:justify-between xl:rounded-lg xl:border-0 xl:px-2.5 ${focusRing} ${
                active
                  ? "border-[#101723] bg-[#101723] text-white xl:bg-[#E7EDF6] xl:text-[#101723] dark:border-[#D7DFE5] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:xl:bg-[#273444] dark:xl:text-[#F3F7FC]"
                  : "border-[#D8DFE9] bg-[#F9FCFF] text-[#566273] hover:text-[#101723] xl:bg-transparent xl:hover:bg-[#F3F7FC] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] dark:xl:bg-transparent dark:xl:hover:bg-[#1F2B3A]"
              }`}
            >
              {f.label}
              <span className={`text-caption tabular-nums ${active ? "opacity-70" : "text-[#87909D]"}`}>
                {counts[f.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div className={`${surface} overflow-hidden`}>
        {loading ? (
          <RowsSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={filter === "all" ? "You're all caught up" : "Nothing here yet"}
            description="When your chatbots capture leads, miss a question or get rated, it shows up here."
          />
        ) : (
          <>
            {groups.map((group) => (
              <section key={group.label}>
                <h3 className="sticky top-0 z-10 border-b border-[#E7EDF6] bg-[#F3F7FC]/90 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-[#647184] backdrop-blur sm:px-6 dark:border-[#2B3646] dark:bg-[#141D2B]/90 dark:text-[#87909D]">
                  {group.label}
                </h3>
                <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
                  {group.items.map((item) => {
                    const { Icon, tone } = TYPE_STYLE[item.type];
                    const unseen = item.timestamp.getTime() > lastSeen.getTime();
                    return (
                      <li
                        key={`${item.type}-${item.id}`}
                        className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#F3F7FC]/70 sm:px-6 dark:hover:bg-[#1F2B3A]"
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-x-2 text-body-sm">
                            <span className="font-medium text-[#101723] dark:text-[#D7DFE5]">{item.title}</span>
                            <span className="text-caption text-[#647184] dark:text-[#87909D]">{item.chatbotName}</span>
                            {unseen && (
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-label="New" />
                            )}
                          </p>
                          <p className="mt-0.5 break-words text-body-sm text-[#566273] dark:text-[#9BAABD]">
                            {item.description}
                          </p>
                        </div>
                        {item.timestamp.getTime() !== 0 && (
                          <time
                            dateTime={item.timestamp.toISOString()}
                            title={format(item.timestamp, "MMM d, yyyy 'at' h:mm a")}
                            className="shrink-0 pt-0.5 text-caption tabular-nums text-[#647184] dark:text-[#87909D]"
                          >
                            {formatDistanceToNowStrict(item.timestamp, { addSuffix: true })}
                          </time>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            {totalPages > 1 && (
              <div className="border-t border-[#E7EDF6] px-5 py-3 sm:px-6 dark:border-[#2B3646]">
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onChange={setPage}
                  summary={`${filtered.length} notification${filtered.length === 1 ? "" : "s"}`}
                />
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
