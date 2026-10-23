import React from "react";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
  showBadge?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = "" }) => {
  return (
    <div className={`inline-flex h-9 items-center justify-center rounded-lg bg-[#F3F7FC] dark:bg-[#141D2B] p-1 text-[#566273] dark:text-[#9BAABD] ${className} border border-[#D8DFE9] dark:border-[#2B3646]`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              isActive
                ? "text-[#101723] dark:text-[#D7DFE5]"
                : "hover:text-[#101723] dark:hover:text-[#D7DFE5]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-[#F9FCFF] dark:bg-[#1A2533] rounded-md shadow-sm z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.label}
              {tab.showBadge && (
                <span className="inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
