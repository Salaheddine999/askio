import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { PageSkeleton } from "../components/Skeleton";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { EmptyState, focusRing, secondaryButton } from "./dashboard/ui";
import {
  AdminUser,
  LogEntry,
  Overview,
  UsageRow,
  fetchLog,
  fetchNewestAccounts,
  fetchOverview,
  fetchTopUsage,
} from "./admin/data";
import AccountPanel from "./admin/AccountPanel";
import OverviewTab, { type AdminTab } from "./admin/OverviewTab";
import AccountsTab from "./admin/AccountsTab";
import UsageTab from "./admin/UsageTab";
import ActivityTab from "./admin/ActivityTab";
import { useTabScroller } from "../hooks/useTabScroller";

const TABS: { key: AdminTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "accounts", label: "Accounts" },
  { key: "usage", label: "AI usage" },
  { key: "activity", label: "Activity" },
];

const Admin: React.FC = () => {
  const isAdmin = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab") as AdminTab | null;
  const tab: AdminTab = requested && TABS.some((t) => t.key === requested) ? requested : "overview";
  const tabScroller = useTabScroller<HTMLElement>(tab);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [newest, setNewest] = useState<AdminUser[] | null>(null);
  const [usage, setUsage] = useState<UsageRow[] | null>(null);
  const [log, setLog] = useState<LogEntry[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Bumped after an action or a refresh; the list tabs reload when it changes.
  const [version, setVersion] = useState(0);

  const setTab = (next: AdminTab) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === "overview") params.delete("tab");
        else params.set("tab", next);
        return params;
      },
      { replace: true }
    );

  const loadOverview = useCallback(async () => {
    const [o, n, u, l] = await Promise.allSettled([fetchOverview(), fetchNewestAccounts(), fetchTopUsage(), fetchLog()]);
    setOverview(o.status === "fulfilled" ? o.value : null);
    setNewest(n.status === "fulfilled" ? n.value : []);
    setUsage(u.status === "fulfilled" ? u.value : []);
    setLog(l.status === "fulfilled" ? l.value : []);
    [n, u, l].forEach((r) => r.status === "rejected" && console.warn("Admin overview section failed:", r.reason));
  }, []);

  useEffect(() => {
    if (isAdmin) void loadOverview();
  }, [isAdmin, loadOverview]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      setVersion((v) => v + 1);
      await loadOverview();
    } finally {
      setRefreshing(false);
    }
  };

  const handleChanged = () => {
    setVersion((v) => v + 1);
    void loadOverview();
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

      <div className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
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

        <nav
          ref={tabScroller}
          role="tablist"
          aria-label="Admin sections"
          className="scrollbar-hide -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-[#D8DFE9] px-4 sm:mx-0 sm:px-0 dark:border-[#2B3646]"
        >
          {TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.key)}
                className={`relative -mb-px shrink-0 whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-body-sm font-medium transition-colors ${focusRing} ${
                  isActive
                    ? "border-[#101723] text-[#101723] dark:border-[#D7DFE5] dark:text-[#E7EDF6]"
                    : "border-transparent text-[#647184] hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        <div role="tabpanel" className={`mt-6 transition-opacity ${refreshing ? "opacity-60" : ""}`}>
          {tab === "overview" && (
            <OverviewTab overview={overview} newest={newest} usage={usage} log={log} onOpen={setSelected} onTab={setTab} />
          )}
          {tab === "accounts" && <AccountsTab onOpen={setSelected} version={version} />}
          {tab === "usage" && <UsageTab onOpen={setSelected} version={version} />}
          {tab === "activity" && <ActivityTab version={version} />}
        </div>
      </div>

      <AccountPanel uid={selected} onClose={() => setSelected(null)} onChanged={handleChanged} />
    </div>
  );
};

export default Admin;
