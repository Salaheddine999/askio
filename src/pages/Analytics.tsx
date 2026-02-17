import React from "react";
import { BarChart2 } from "lucide-react";

export default function Analytics() {
  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#FAFAF9] dark:bg-[#292524] flex items-center justify-center border border-[#E0DEDB] dark:border-[#44403C]">
          <BarChart2 className="w-5 h-5 text-[#37322F] dark:text-[#F5F5F4]" />
        </div>
        <div>
          <h1 className="text-h1 font-serif text-[#37322F] dark:text-[#F5F5F4]">Analytics</h1>
          <p className="text-body text-[#605A57] dark:text-[#A8A29E]">Track your chatbots' performance.</p>
        </div>
      </div>
      
      <div className="rounded-xl border border-[rgba(55,50,47,0.12)] dark:border-[#44403C] bg-white dark:bg-[#292524] p-12 text-center">
        <h2 className="text-h3 font-sans font-semibold text-[#37322F] dark:text-[#F5F5F4] mb-2">Coming Soon</h2>
        <p className="text-body text-[#605A57] dark:text-[#A8A29E]">
          Detailed analytics and insights are currently under development.
        </p>
      </div>
    </div>
  );
}
