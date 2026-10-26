import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import ChatbotCard from "../../components/ChatbotCard";
import { Chatbot, ChatbotActions, EMPTY_FEEDBACK, FeedbackCounts, SortKey, SortOrder } from "./types";
import { useT } from "../../i18n";
import { dashboardMessages } from "../../i18n/messages/dashboard";
import { commonMessages } from "../../i18n/messages/common";

interface ChatbotTableProps extends ChatbotActions {
  chatbots: Chatbot[];
  feedbackCounts: Record<string, FeedbackCounts>;
  sort?: { sortBy: SortKey; sortOrder: SortOrder; onSort: (key: SortKey) => void };
  bare?: boolean;
}

const headerCell =
  "py-2.5 pl-3 pr-2 text-left text-[11px] font-medium uppercase tracking-wider text-[#647184] sm:px-6 dark:text-[#87909D]";

const ChatbotTable: React.FC<ChatbotTableProps> = ({
  chatbots,
  feedbackCounts,
  sort,
  bare,
  onEdit,
  onEmbed,
  onDelete,
  onToggleActive,
}) => {
  const t = useT(dashboardMessages);
  const tc = useT(commonMessages);
  const sortableHeader = (column: SortKey, label: string, className = "") => {
    if (!sort) {
      return (
        <th scope="col" className={`${headerCell} ${className}`}>
          {label}
        </th>
      );
    }
    const active = sort.sortBy === column;
    return (
      <th
        scope="col"
        className={`${headerCell} ${className}`}
        aria-sort={active ? (sort.sortOrder === "asc" ? "ascending" : "descending") : "none"}
      >
        <button
          onClick={() => sort.onSort(column)}
          className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-[#101723] dark:hover:text-[#D7DFE5] ${
            active ? "text-[#101723] dark:text-[#D7DFE5]" : ""
          }`}
        >
          {label}
          {active && (sort.sortOrder === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
        </button>
      </th>
    );
  };

  return (
    <div
      className={
        bare
          ? "overflow-x-auto"
          : "overflow-x-auto rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] shadow-[0_1px_2px_rgba(16,23,35,0.04)] dark:border-[#2B3646] dark:bg-[#1A2533]"
      }
    >
      <table className="min-w-full">
        <thead className="border-b border-[#E7EDF6] bg-[#F3F7FC]/70 dark:border-[#2B3646] dark:bg-[#141D2B]/60">
          <tr>
            {sortableHeader("title", tc("sortName"))}
            <th scope="col" className={`${headerCell} hidden sm:table-cell`}>
              {t("colSatisfaction")}
            </th>
            <th scope="col" className={`${headerCell} hidden lg:table-cell`}>
              {t("colFaqs")}
            </th>
            {sortableHeader("lastUpdated", t("colUpdated"), "hidden xl:table-cell")}
            <th scope="col" className={headerCell}>
              <span className="sr-only">{t("colActions")}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
          {chatbots.map((chatbot, index) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              feedback={feedbackCounts[chatbot.id] || EMPTY_FEEDBACK}
              viewMode="list"
              onEdit={onEdit}
              onEmbed={onEmbed}
              onDelete={onDelete}
              onToggleActive={() => onToggleActive(chatbot)}
              index={index}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChatbotTable;
