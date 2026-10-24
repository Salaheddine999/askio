import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { format, formatDistanceToNowStrict } from "date-fns";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { Bot, Ban, RefreshCw, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import StatsCard from "../components/StatsCard";
import { PageSkeleton, Skeleton } from "../components/Skeleton";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { EmptyState, SearchInput, focusRing, secondaryButton, surface } from "./dashboard/ui";
import {
  AdminUser,
  LogEntry,
  Overview,
  UsageRow,
  fetchLog,
  fetchOverview,
  fetchTopUsage,
  fetchUsers,
} from "./admin/data";
import AccountPanel from "./admin/AccountPanel";
import { PlanBadge, UsageBar } from "./admin/parts";

const statIcon = "h-3.5 w-3.5 text-[#566273] dark:text-[#9BAABD]";
const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString());

const LOG_LABELS: Record<string, string> = { suspend: "Suspended", unsuspend: "Unsuspended", delete: "Deleted" };

const Card: React.FC<{ title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  description,
  action,
  children,
}) => (
  <section className={surface}>
    <div className="flex items-start justify-between gap-4 border-b border-[#E7EDF6] px-5 py-4 sm:px-6 dark:border-[#2B3646]">
      <div className="min-w-0">
        <h2 className="text-body font-semibold text-[#101723] dark:text-[#E7EDF6]">{title}</h2>
        {description && <p className="mt-0.5 text-body-sm text-[#647184] dark:text-[#87909D]">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const Admin: React.FC = () => {
  const isAdmin = useIsAdmin();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [usage, setUsage] = useState<UsageRow[] | null>(null);
  const [log, setLog] = useState<LogEntry[] | null>(null);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(async () => {
    const [o, u, l] = await Promise.allSettled([fetchOverview(), fetchTopUsage(), fetchLog()]);
    setOverview(o.status === "fulfilled" ? o.value : null);
    setUsage(u.status === "fulfilled" ? u.value : []);
    setLog(l.status === "fulfilled" ? l.value : []);
    [u, l].forEach((r) => r.status === "rejected" && console.warn("Admin section failed:", r.reason));
  }, []);

  useEffect(() => {
    if (isAdmin) void loadSummary();
  }, [isAdmin, loadSummary]);

  // Searches as you type, after a short pause.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const page = await fetchUsers(search);
        if (cancelled) return;
        setUsers(page.users);
        setCursor(page.last);
        setHasMore(page.hasMore);
      } catch (error) {
        console.error("Failed to load accounts:", error);
        if (!cancelled) setUsers([]);
      }
    }, search ? 250 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isAdmin, search]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const page = await fetchUsers(search, cursor);
      setUsers((prev) => [...(prev || []), ...page.users]);
      setCursor(page.last);
      setHasMore(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadSummary();
      const page = await fetchUsers(search);
      setUsers(page.users);
      setCursor(page.last);
      setHasMore(page.hasMore);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChanged = (uid: string, user: AdminUser | null) => {
    setUsers((prev) => (prev || []).flatMap((u) => (u.uid !== uid ? [u] : user ? [user] : [])));
    setUsage((prev) => (prev || []).map((row) => (row.uid === uid ? { ...row, user } : row)));
    void fetchLog().then(setLog, () => undefined);
    void fetchOverview().then(setOverview, () => undefined);
  };

  if (isAdmin === null) return <PageSkeleton tiles={4} />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F3F7FC] px-4 py-16 dark:bg-[#141D2B]">
        <EmptyState
          icon={ShieldCheck}
          title="This page isn't available"
          description="It's only for Askio's admins."
          action={
            <Link to="/dashboard" className={secondaryButton}>
              Back to your dashboard
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>Admin | Askio</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className={`w-full space-y-6 px-4 py-6 transition-opacity sm:px-6 sm:py-8 lg:px-8 xl:px-10 ${refreshing ? "opacity-60" : ""}`}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">Admin</h1>
            <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">
              Every account on Askio. Only admins can see this page.
            </p>
          </div>
          <button type="button" onClick={refresh} disabled={refreshing} className={`${secondaryButton} self-start sm:self-auto`}>
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

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
                icon={<Sparkles className={statIcon} />}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Top AI usage this month" description="Each AI reply costs you; watch who's near their limit.">
            {usage === null ? (
              <div className="space-y-3 p-6">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : usage.length === 0 ? (
              <EmptyState compact icon={Sparkles} title="No AI replies yet" description="Nobody has used AI replies this month." />
            ) : (
              <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
                {usage.map((row) => (
                  <li key={row.uid}>
                    <button
                      type="button"
                      onClick={() => setSelected(row.uid)}
                      className={`w-full px-5 py-3 text-left transition-colors hover:bg-[#F3F7FC] sm:px-6 dark:hover:bg-[#141D2B] ${focusRing}`}
                    >
                      <p className="mb-1.5 truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                        {row.user?.email || row.uid}
                      </p>
                      <UsageBar used={row.replies} limit={row.user?.aiReplyLimit ?? 0} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Admin log" description="Every suspension and deletion, newest first.">
            {log === null ? (
              <div className="space-y-3 p-6">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : log.length === 0 ? (
              <EmptyState compact icon={Ban} title="Nothing yet" description="Suspensions and deletions will be listed here." />
            ) : (
              <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
                {log.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-4 px-5 py-3 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate text-body-sm text-[#101723] dark:text-[#D7DFE5]">
                        <span className="font-medium">{LOG_LABELS[entry.action] || entry.action}</span>{" "}
                        {entry.targetEmail || "an account"}
                      </p>
                      {entry.reason && (
                        <p className="mt-0.5 truncate text-caption text-[#647184] dark:text-[#87909D]">“{entry.reason}”</p>
                      )}
                    </div>
                    <span className="shrink-0 text-caption text-[#87909D]" title={entry.at ? format(entry.at, "PPpp") : undefined}>
                      {entry.at ? formatDistanceToNowStrict(entry.at, { addSuffix: true }) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card
          title="Accounts"
          description={search ? "Matching emails that start with your search." : "Newest first. Click one for details and actions."}
          action={<SearchInput value={search} onChange={setSearch} placeholder="Search by email" />}
        >
          {users === null ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              compact
              icon={Users}
              title={search ? "No matching accounts" : "No accounts yet"}
              description={search ? "Emails are matched from the start, e.g. “sara@”." : "New sign-ups will show up here."}
            />
          ) : (
            <>
              <div className="hidden grid-cols-[minmax(0,1fr)_200px_120px] gap-4 border-b border-[#E7EDF6] px-6 py-2 text-caption font-medium uppercase tracking-wider text-[#87909D] md:grid dark:border-[#2B3646]">
                <span>Email</span>
                <span>Plan</span>
                <span className="text-right">Joined</span>
              </div>
              <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
                {users.map((u) => (
                  <li key={u.uid}>
                    <button
                      type="button"
                      onClick={() => setSelected(u.uid)}
                      className={`grid w-full grid-cols-1 gap-1.5 px-5 py-3 text-left transition-colors hover:bg-[#F3F7FC] sm:px-6 md:grid-cols-[minmax(0,1fr)_200px_120px] md:items-center md:gap-4 dark:hover:bg-[#141D2B] ${focusRing}`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                          {u.email || u.uid}
                        </span>
                        {u.displayName && (
                          <span className="block truncate text-caption text-[#647184] dark:text-[#87909D]">{u.displayName}</span>
                        )}
                      </span>
                      <PlanBadge user={u} />
                      <span className="text-caption text-[#647184] md:text-right dark:text-[#87909D]">
                        {u.createdAt ? format(u.createdAt, "MMM d, yyyy") : "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {hasMore && (
                <div className="border-t border-[#E7EDF6] px-6 py-3 text-center dark:border-[#2B3646]">
                  <button type="button" onClick={loadMore} disabled={loadingMore} className={secondaryButton}>
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <AccountPanel uid={selected} onClose={() => setSelected(null)} onChanged={handleChanged} />
    </div>
  );
};

export default Admin;
