import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { EmptyState, SearchInput, focusRing } from "../dashboard/ui";
import { AccountFilter, AdminUser, accountsQuery, toAccount } from "./data";
import { Card, FilterChips, Pager, PlanBadge, RowsLoading } from "./parts";
import { rangeSummary, usePaged } from "./usePaged";

const FILTERS: { value: AccountFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Pro & Enterprise" },
  { value: "suspended", label: "Suspended" },
];

const COLUMNS = "md:grid-cols-[minmax(0,1fr)_220px_110px]";

/** One account. `compact` stacks it for narrow cards, like the overview's. */
export const AccountRow: React.FC<{ user: AdminUser; onOpen: (uid: string) => void; compact?: boolean }> = ({
  user,
  onOpen,
  compact,
}) => (
  <li>
    <button
      type="button"
      onClick={() => onOpen(user.uid)}
      className={`grid w-full gap-1.5 px-5 py-3 text-left transition-colors hover:bg-[#F3F7FC] sm:px-6 dark:hover:bg-[#141D2B] ${
        compact ? "grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3" : `grid-cols-1 md:items-center md:gap-4 ${COLUMNS}`
      } ${focusRing}`}
    >
      <span className="min-w-0">
        <span className="block truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]" title={user.email}>
          {user.email || user.uid}
        </span>
        {user.displayName && (
          <span className="block truncate text-caption text-[#647184] dark:text-[#87909D]">{user.displayName}</span>
        )}
      </span>
      {compact ? (
        <span className="text-right text-caption tabular-nums text-[#647184] dark:text-[#87909D]">
          {user.createdAt ? format(user.createdAt, "MMM d") : "—"}
        </span>
      ) : (
        <>
          <PlanBadge user={user} />
          <span className="text-caption tabular-nums text-[#647184] md:text-right dark:text-[#87909D]">
            {user.createdAt ? format(user.createdAt, "MMM d, yyyy") : "—"}
          </span>
        </>
      )}
    </button>
  </li>
);

const AccountsTab: React.FC<{ onOpen: (uid: string) => void; version: number }> = ({ onOpen, version }) => {
  const [filter, setFilter] = useState<AccountFilter>("all");
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");

  // Search after a short pause, not on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(search.trim().toLowerCase()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const list = usePaged(`${filter}|${term}`, () => accountsQuery(filter, term), toAccount);

  // After an action in the account panel, refresh what's on screen.
  useEffect(() => {
    if (version > 0) void list.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const label = FILTERS.find((f) => f.value === filter)?.label.toLowerCase();

  return (
    <Card
      title="Accounts"
      description={
        term
          ? "Emails starting with your search."
          : filter === "all"
            ? "Newest first. Open one for details and actions."
            : `${FILTERS.find((f) => f.value === filter)?.label} accounts, newest first.`
      }
      action={<SearchInput value={search} onChange={setSearch} placeholder="Search by email" />}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EDF6] px-5 py-3 sm:px-6 dark:border-[#2B3646]">
        <FilterChips label="Filter accounts" value={filter} onChange={setFilter} options={FILTERS} />
        {list.total !== null && (
          <span className="text-caption tabular-nums text-[#647184] dark:text-[#87909D]">
            {list.total.toLocaleString()} {list.total === 1 ? "account" : "accounts"}
          </span>
        )}
      </div>

      {list.error ? (
        <p role="alert" className="px-6 py-8 text-center text-body-sm text-red-600 dark:text-red-400">
          Couldn't load accounts: {list.error}
        </p>
      ) : list.items === null ? (
        <RowsLoading rows={8} />
      ) : list.items.length === 0 ? (
        <EmptyState
          compact
          icon={Users}
          title={term ? "No matching accounts" : filter === "all" ? "No accounts yet" : `No ${label} accounts`}
          description={term ? "Emails are matched from the start, like “sara@”." : "They'll show up here when there are some."}
        />
      ) : (
        <div className={`transition-opacity ${list.loading ? "opacity-60" : ""}`}>
          <div
            className={`sticky top-0 z-10 hidden gap-4 border-b border-[#E7EDF6] bg-[#F9FCFF] px-6 py-2 text-caption font-medium uppercase tracking-wider text-[#87909D] md:grid dark:border-[#2B3646] dark:bg-[#1A2533] ${COLUMNS}`}
          >
            <span>Account</span>
            <span>Plan</span>
            <span className="text-right">Joined</span>
          </div>
          <ul className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
            {list.items.map((u) => (
              <AccountRow key={u.uid} user={u} onOpen={onOpen} />
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

export default AccountsTab;
