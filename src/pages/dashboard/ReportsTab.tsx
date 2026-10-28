import React from "react";
import { Download, FileSpreadsheet, HelpCircle, LoaderCircle, LucideIcon, UserPlus } from "../../components/icons";
import { SectionHeader, secondaryButton, surface } from "./ui";
import { useT } from "../../i18n";
import { dashboardMessages } from "../../i18n/messages/dashboard";

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
}) => {
  const t = useT(dashboardMessages);
  return (
  <div className={`${surface} flex flex-col p-5`}>
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${tone}`}>
      <Icon size={19} strokeWidth={1.75} />
    </span>
    <h3 className="mt-4 text-body font-semibold tracking-tight text-fg">
      {title}
    </h3>
    <p className="mt-1 flex-1 text-body-sm text-fg-muted">{description}</p>
    <div className="mt-4 flex flex-wrap gap-1.5">
      {columns.map((column) => (
        <span
          key={column}
          className="rounded-md bg-ink-30 px-1.5 py-0.5 font-mono text-caption text-ink-605 ring-1 ring-inset ring-ink-120 dark:bg-ink-875 dark:text-ink-325 dark:ring-ink-780"
        >
          {column}
        </span>
      ))}
    </div>
    <button
      onClick={onDownload}
      disabled={generating || disabled}
      className={`${secondaryButton} mt-5 w-full text-fg`}
    >
      {generating ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}
      {generating ? t("preparing") : t("downloadCsv")}
    </button>
  </div>
  );
};

const ReportsTab: React.FC<ReportsTabProps> = ({
  hasChatbots,
  onDownloadPerformance,
  onDownloadLeads,
  onDownloadQueries,
  generatingLeads,
  generatingQueries,
}) => {
  const t = useT(dashboardMessages);
  return (
  <div className="space-y-5">
    <SectionHeader
      title={t("reportsTitle")}
      description={hasChatbots ? t("reportsDesc") : t("reportsDescEmpty")}
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ReportCard
        icon={FileSpreadsheet}
        tone="bg-ink-70 text-ink-805 ring-ink-120 dark:bg-ink-805 dark:text-ink-130 dark:ring-ink-710"
        title={t("perfTitle")}
        description={t("perfDesc")}
        columns={[t("chipName"), t("chipPositive"), t("chipNegative"), t("chipCreated"), t("chipUpdated")]}
        onDownload={onDownloadPerformance}
        disabled={!hasChatbots}
      />
      <ReportCard
        icon={UserPlus}
        tone="bg-emerald-50 text-emerald-600 ring-emerald-600/15 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-400/20"
        title={t("leadsTitle")}
        description={t("leadsDesc")}
        columns={[t("chipEmail"), t("chipChatbot"), t("chipTimestamp")]}
        onDownload={onDownloadLeads}
        generating={generatingLeads}
        disabled={!hasChatbots}
      />
      <ReportCard
        icon={HelpCircle}
        tone="bg-amber-50 text-amber-600 ring-amber-600/15 dark:bg-amber-900/25 dark:text-amber-400 dark:ring-amber-400/20"
        title={t("queriesTitle")}
        description={t("queriesDesc")}
        columns={[t("chipQuestion"), t("chipChatbot"), t("chipTimestamp")]}
        onDownload={onDownloadQueries}
        generating={generatingQueries}
        disabled={!hasChatbots}
      />
    </div>
  </div>
  );
};

export default ReportsTab;
