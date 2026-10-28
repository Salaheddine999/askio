import React from "react";
import { ArrowRight, Bot, ShieldCheck, UserPlus, Users } from "../../components/icons";
import StatsCard from "../../components/StatsCard";
import { Skeleton } from "../../components/Skeleton";
import { EmptyState, focusRing } from "../dashboard/ui";
import { AdminUser, LogEntry, Overview, UsageRow } from "./data";
import { Card, RowsLoading } from "./parts";
import { AccountRow } from "./AccountsTab";
import { UsageItem } from "./UsageTab";
import { LogItem } from "./ActivityTab";
import { AiIcon } from "../../components/icons";

export type AdminTab = "overview" | "accounts" | "usage" | "activity";

const statIcon = "h-3.5 w-3.5 text-fg-muted";
const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString());

const ViewAll: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-caption font-medium text-ink-900 transition-colors hover:bg-ink-70 dark:text-ink-130 dark:hover:bg-ink-790 ${focusRing}`}
  >
    View all
    <ArrowRight size={13} />
  </button>
);

interface Props {
  overview: Overview | null;
  newest: AdminUser[] | null;
  usage: UsageRow[] | null;
  log: LogEntry[] | null;
  onOpen: (uid: string) => void;
  onTab: (tab: AdminTab) => void;
}

const OverviewTab: React.FC<Props> = ({ overview, newest, usage, log, onOpen, onTab }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {overview === null ? (
        [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[118px] rounded-xl" />)
      ) : (
        <>
          <StatsCard
            title="Accounts"
            value={fmt(overview.accounts)}
            description={`${fmt(overview.signups7d)} this week · ${fmt(overview.signups30d)} in 30 days`}
            icon={<Users className={statIcon} />}
          />
          <StatsCard
            title="Paid accounts"
            value={fmt(overview.paid)}
            description={overview.suspended ? `${fmt(overview.suspended)} suspended` : "Pro and Enterprise"}
            icon={<UserPlus className={statIcon} />}
          />
          <StatsCard
            title="Chatbots"
            value={fmt(overview.chatbots)}
            description={`${fmt(overview.aiChatbots)} with AI replies on`}
            icon={<Bot className={statIcon} />}
          />
          <StatsCard
            title="AI replies this month"
            value={fmt(overview.aiRepliesThisMonth)}
            description="Across every account"
            icon={<AiIcon className={statIcon} />}
          />
        </>
      )}
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card title="Newest accounts" action={<ViewAll onClick={() => onTab("accounts")} />}>
        {newest === null ? (
          <RowsLoading rows={5} />
        ) : newest.length === 0 ? (
          <EmptyState compact icon={Users} title="No accounts yet" description="New sign-ups will show up here." />
        ) : (
          <ul className="divide-y divide-ink-70 dark:divide-ink-780">
            {newest.map((u) => (
              <AccountRow key={u.uid} user={u} onOpen={onOpen} compact />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Top AI usage this month" action={<ViewAll onClick={() => onTab("usage")} />}>
        {usage === null ? (
          <RowsLoading rows={5} height="h-10" />
        ) : usage.length === 0 ? (
          <EmptyState compact icon={AiIcon} title="No AI replies yet" description="Nobody has used AI replies this month." />
        ) : (
          <ul className="divide-y divide-ink-70 dark:divide-ink-780">
            {usage.map((row, i) => (
              <UsageItem key={row.uid} row={row} rank={i + 1} onOpen={onOpen} />
            ))}
          </ul>
        )}
      </Card>

      <Card title="Recent activity" action={<ViewAll onClick={() => onTab("activity")} />}>
        {log === null ? (
          <RowsLoading rows={5} />
        ) : log.length === 0 ? (
          <EmptyState compact icon={ShieldCheck} title="Nothing yet" description="Suspensions and deletions will show up here." />
        ) : (
          <ul className="divide-y divide-ink-70 dark:divide-ink-780">
            {log.map((entry) => (
              <LogItem key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  </div>
);

export default OverviewTab;
