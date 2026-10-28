import React from "react";
import { motion } from "framer-motion";
import { useTabScroller } from "../hooks/useTabScroller";

interface Tab {
  id: string;
  label: string;
  showBadge?: boolean;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = "" }) => {
  const scroller = useTabScroller<HTMLDivElement>(activeTab);
  return (
    <div
      ref={scroller}
      className={`-mx-4 scrollbar-hide overflow-x-auto border-b border-ink-120 px-4 sm:mx-0 sm:px-0 dark:border-ink-780 ${className}`}
    >
      <div role="tablist" className="flex min-w-max items-center gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`group relative -mb-px flex h-11 items-center gap-2 px-3 text-body-sm font-medium transition-colors focus-visible:outline-none ${
                isActive
                  ? "text-ink-900 dark:text-ink-30"
                  : "text-ink-545 hover:text-ink-900 dark:text-ink-425 dark:hover:text-ink-130"
              }`}
            >
              <span className="rounded-md px-1 py-0.5 group-focus-visible:ring-2 group-focus-visible:ring-ink-900/25 dark:group-focus-visible:ring-ink-130/40">
                {tab.label}
              </span>
              {typeof tab.count === "number" && (
                <span
                  className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-caption font-semibold leading-none tabular-nums ${
                    isActive
                      ? "bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875"
                      : "bg-ink-85 text-ink-605 dark:bg-ink-805 dark:text-ink-325"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.showBadge && (
                <span className="relative flex h-2 w-2" aria-label="New">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="activeTabUnderline"
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ink-900 dark:bg-ink-30"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
