import React from "react";
import { motion } from "framer-motion";

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
  return (
    <div
      className={`-mx-4 overflow-x-auto border-b border-[#D8DFE9] px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 dark:border-[#2B3646] ${className}`}
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
                  ? "text-[#101723] dark:text-[#F3F7FC]"
                  : "text-[#647184] hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5]"
              }`}
            >
              <span className="rounded-md px-1 py-0.5 group-focus-visible:ring-2 group-focus-visible:ring-[#101723]/25 dark:group-focus-visible:ring-[#D7DFE5]/40">
                {tab.label}
              </span>
              {typeof tab.count === "number" && (
                <span
                  className={`rounded-full px-1.5 py-px text-[11px] tabular-nums ${
                    isActive
                      ? "bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]"
                      : "bg-[#E2E8F1] text-[#566273] dark:bg-[#243040] dark:text-[#9BAABD]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.showBadge && (
                <span className="relative flex h-2 w-2" aria-label="New">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="activeTabUnderline"
                  className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#101723] dark:bg-[#F3F7FC]"
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
