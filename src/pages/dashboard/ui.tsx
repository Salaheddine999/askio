import React from "react";
import { Link } from "react-router-dom";
import { Menu } from "@headlessui/react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  LucideIcon,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { SortKey, SortOrder } from "./types";
import { ListSkeleton, Skeleton } from "../../components/Skeleton";
import { useT } from "../../i18n";
import { commonMessages } from "../../i18n/messages/common";

import { focusRing, primaryButton, secondaryButton, surface } from "./styles";

export { focusRing, primaryButton, secondaryButton, surface };

export const SectionHeader: React.FC<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="min-w-0">
      <h2 className="text-h3 font-serif text-[#101723] dark:text-[#D7DFE5]">{title}</h2>
      {description && (
        <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">{actions}</div>}
  </div>
);

export const CardHeader: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
    <div className="min-w-0">
      <h3 className="text-body font-semibold tracking-tight text-[#101723] dark:text-[#D7DFE5]">
        {title}
      </h3>
      {description && (
        <p className="mt-0.5 text-body-sm text-[#566273] dark:text-[#9BAABD]">{description}</p>
      )}
    </div>
    {action}
  </div>
);

export const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder: placeholderProp }) => {
  const t = useT(commonMessages);
  const placeholder = placeholderProp ?? t("search");
  return (
  <div className="relative w-full sm:w-64">
    <Search
      size={16}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#647184] dark:text-[#87909D]"
    />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-9 w-full rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] pl-9 pr-8 text-body-sm text-[#101723] placeholder:text-[#647184] focus:border-[#101723] focus:outline-none focus:ring-2 focus:ring-[#101723]/10 dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5] dark:placeholder:text-[#87909D] dark:focus:border-[#9BAABD] dark:focus:ring-[#D7DFE5]/10 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange("")}
        aria-label={t("clearSearch")}
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#647184] hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5] ${focusRing}`}
      >
        <X size={14} />
      </button>
    )}
  </div>
  );
};

const SORT_OPTIONS = [
  { key: "title", label: "sortName" },
  { key: "lastUpdated", label: "sortLastUpdated" },
  { key: "createdAt", label: "sortDateCreated" },
] as const satisfies readonly { key: SortKey; label: keyof typeof commonMessages.en }[];

export const SortMenu: React.FC<{
  sortBy: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
}> = ({ sortBy, sortOrder, onSort }) => {
  const t = useT(commonMessages);
  const current = SORT_OPTIONS.find((o) => o.key === sortBy)!;
  const OrderIcon = sortOrder === "asc" ? ArrowUp : ArrowDown;
  return (
    <Menu as="div" className="relative">
      <Menu.Button className={secondaryButton}>
        <ArrowUpDown size={15} />
        <span className="hidden sm:inline">{t("sortBy")}</span>
        <span className="text-[#101723] dark:text-[#D7DFE5]">{t(current.label)}</span>
      </Menu.Button>
      <Menu.Items anchor="bottom end" modal={false} transition className="z-50 w-52 origin-top-right rounded-xl [--anchor-gap:8px] transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 border border-[#D8DFE9] bg-[#F9FCFF] p-1.5 shadow-xl focus:outline-none dark:border-[#2B3646] dark:bg-[#1A2533]">
          {SORT_OPTIONS.map((option) => (
            <Menu.Item key={option.key}>
              {({ active }) => (
                <button
                  onClick={() => onSort(option.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-body-sm ${
                    active
                      ? "bg-[#F3F7FC] text-[#101723] dark:bg-[#273444] dark:text-[#D7DFE5]"
                      : "text-[#566273] dark:text-[#9BAABD]"
                  }`}
                >
                  {t(option.label)}
                  {sortBy === option.key && (
                    <span className="flex items-center gap-1 text-[#101723] dark:text-[#D7DFE5]">
                      <OrderIcon size={13} />
                      <Check size={14} />
                    </span>
                  )}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
    </Menu>
  );
};

export const ViewToggle: React.FC<{
  value: "grid" | "list";
  onChange: (value: "grid" | "list") => void;
}> = ({ value, onChange }) => {
  const t = useT(commonMessages);
  const options: { id: "grid" | "list"; label: string; Icon: LucideIcon }[] = [
    { id: "grid", label: t("gridView"), Icon: LayoutGrid },
    { id: "list", label: t("listView"), Icon: List },
  ];
  return (
    <div
      role="group"
      aria-label={t("viewMode")}
      className="inline-flex h-9 items-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] p-0.5 dark:border-[#2B3646] dark:bg-[#141D2B]"
    >
      {options.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-label={label}
          aria-pressed={value === id}
          title={label}
          className={`flex h-full items-center rounded-md px-2.5 transition-colors ${focusRing} ${
            value === id
              ? "bg-[#F9FCFF] text-[#101723] shadow-sm dark:bg-[#273444] dark:text-[#D7DFE5]"
              : "text-[#647184] hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5]"
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
};

/** Page numbers to show: first, last, and a window around the current page. */
function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  const pages: (number | "gap")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }
  return pages;
}

export const Pagination: React.FC<{
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  summary?: string;
}> = ({ page, totalPages, onChange, summary }) => {
  const t = useT(commonMessages);
  if (totalPages <= 1) return null;
  const pageButton = `inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-body-sm transition-colors ${focusRing}`;
  return (
    <nav
      aria-label={t("pagination")}
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-caption text-[#647184] dark:text-[#87909D]">{summary}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label={t("previousPage")}
          className={`${pageButton} text-[#566273] hover:bg-[#E7EDF6] disabled:pointer-events-none disabled:opacity-40 dark:text-[#9BAABD] dark:hover:bg-[#273444]`}
        >
          <ChevronLeft size={16} />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-body-sm text-[#87909D]">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={`${pageButton} ${
                p === page
                  ? "bg-[#101723] font-medium text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]"
                  : "text-[#566273] hover:bg-[#E7EDF6] dark:text-[#9BAABD] dark:hover:bg-[#273444]"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label={t("nextPage")}
          className={`${pageButton} text-[#566273] hover:bg-[#E7EDF6] disabled:pointer-events-none disabled:opacity-40 dark:text-[#9BAABD] dark:hover:bg-[#273444]`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
};

export const EmptyState: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}> = ({ icon: Icon, title, description, action, compact }) => (
  <div
    className={`flex flex-col items-center justify-center px-6 text-center ${
      compact ? "py-10" : "py-16"
    }`}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D8DFE9] bg-[#F3F7FC] dark:border-[#2B3646] dark:bg-[#141D2B]">
      <Icon size={22} className="text-[#566273] dark:text-[#9BAABD]" strokeWidth={1.75} />
    </div>
    <h3 className="text-body font-semibold text-[#101723] dark:text-[#D7DFE5]">{title}</h3>
    <p className="mt-1 max-w-sm text-body-sm text-[#566273] dark:text-[#9BAABD]">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const CreateChatbotLink: React.FC<{ label?: string; to?: string }> = ({ label, to = "/configure" }) => {
  const t = useT(commonMessages);
  return (
    <Link to={to} className={primaryButton}>
      <Plus size={16} />
      {label ?? t("newChatbot")}
    </Link>
  );
};

export const ErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => {
  const t = useT(commonMessages);
  return (
  <div
    role="alert"
    className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center dark:border-red-900/60 dark:bg-red-950/30"
  >
    <AlertTriangle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
    <p className="flex-1 text-body-sm text-red-800 dark:text-red-200">{message}</p>
    <button
      onClick={onRetry}
      className={`inline-flex h-8 items-center gap-1.5 self-start rounded-lg bg-red-600 px-3 text-button text-white hover:bg-red-700 sm:self-auto ${focusRing}`}
    >
      <RefreshCw size={14} />
      {t("retry")}
    </button>
  </div>
  );
};

export const ChatbotGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-busy="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-2xl border border-[#D8DFE9] bg-[#F9FCFF] dark:border-[#2B3646] dark:bg-[#1A2533]">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-5 h-3 w-full" />
          <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
          <div className="mt-5 flex items-center justify-between border-t border-[#E7EDF6] pt-3 dark:border-[#2B3646]">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const RowsSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <ListSkeleton rows={rows} />
);
