import React from "react";
import { motion } from "framer-motion";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = "" }) => {
  return (
    <div className={`inline-flex h-9 items-center justify-center rounded-lg bg-[#FAFAF9] dark:bg-[#1C1917] p-1 text-[#605A57] dark:text-[#A8A29E] ${className} border border-[#E0DEDB] dark:border-[#44403C]`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              isActive
                ? "text-[#37322F] dark:text-[#F5F5F4]"
                : "hover:text-[#37322F] dark:hover:text-[#F5F5F4]"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-white dark:bg-[#292524] rounded-md shadow-sm z-0"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
