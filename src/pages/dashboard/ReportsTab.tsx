import React from "react";
import { Download, FileSpreadsheet, HelpCircle, LoaderCircle, LucideIcon, UserPlus } from "lucide-react";
import { SectionHeader, secondaryButton, surface } from "./ui";

interface ReportsTabProps {
  hasChatbots: boolean;
  onDownloadPerformance: () => void;
  onDownloadLeads: () => void;
  onDownloadQueries: () => void;
  generatingLeads: boolean;
  generatingQueries: boolean;
}

interface ReportCardProps {
  icon: LucideIcon;
  tone: string;
  title: string;
  description: string;
  columns: string[];
  onDownload: () => void;
  generating?: boolean;
  disabled?: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({
  icon: Icon,
  tone,
  title,
  description,
  columns,
  onDownload,
  generating,
  disabled,
}) => (
  <div className={`${surface} flex flex-col p-5`}>
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${tone}`}>
      <Icon size={19} strokeWidth={1.75} />
    </span>
    <h3 className="mt-4 text-body font-semibold tracking-tight text-[#101723] dark:text-[#D7DFE5]">
      {title}
    </h3>
    <p className="mt-1 flex-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">{description}</p>
    <div className="mt-4 flex flex-wrap gap-1.5">
      {columns.map((column) => (
        <span
          key={column}
          className="rounded-md bg-[#F3F7FC] px-1.5 py-0.5 font-mono text-[11px] text-[#566273] ring-1 ring-inset ring-[#D8DFE9] dark:bg-[#141D2B] dark:text-[#9BAABD] dark:ring-[#2B3646]"
        >
          {column}
        </span>
      ))}
    </div>
    <button
      onClick={onDownload}
      disabled={generating || disabled}
      className={`${secondaryButton} mt-5 w-full text-[#101723] dark:text-[#D7DFE5]`}
    >
      {generating ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}
      {generating ? "Preparing…" : "Download CSV"}
    </button>
  </div>
);

const ReportsTab: React.FC<ReportsTabProps> = ({
  hasChatbots,
  onDownloadPerformance,
  onDownloadLeads,
  onDownloadQueries,
  generatingLeads,
  generatingQueries,
}) => (
  <div className="space-y-5">
    <SectionHeader
      title="Reports"
      description={
        hasChatbots
          ? "Export raw data from all your chatbots as CSV, ready for a spreadsheet."
          : "Reports become available once you have a chatbot."
      }
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ReportCard
        icon={FileSpreadsheet}
        tone="bg-[#E7EDF6] text-[#243040] ring-[#D8DFE9] dark:bg-[#243040] dark:text-[#D7DFE5] dark:ring-[#39485B]"
        title="Chatbot performance"
        description="Every chatbot with its positive and negative ratings, plus when it was created and last updated."
        columns={["name", "positive", "negative", "created", "updated"]}
        onDownload={onDownloadPerformance}
        disabled={!hasChatbots}
      />
      <ReportCard
        icon={UserPlus}
        tone="bg-emerald-50 text-emerald-600 ring-emerald-600/15 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-400/20"
        title="Captured leads"
        description="Email addresses visitors left in your chatbots, with which chatbot collected them and when."
        columns={["email", "chatbot", "timestamp"]}
        onDownload={onDownloadLeads}
        generating={generatingLeads}
        disabled={!hasChatbots}
      />
      <ReportCard
        icon={HelpCircle}
        tone="bg-amber-50 text-amber-600 ring-amber-600/15 dark:bg-amber-900/25 dark:text-amber-400 dark:ring-amber-400/20"
        title="Unanswered questions"
        description="Questions your chatbots couldn't answer. Use them to add FAQs and close gaps in their knowledge."
        columns={["question", "chatbot", "timestamp"]}
        onDownload={onDownloadQueries}
        generating={generatingQueries}
        disabled={!hasChatbots}
      />
    </div>
  </div>
);

export default ReportsTab;
