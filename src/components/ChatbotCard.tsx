import React from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Sparkles,
  Edit2,
  Code,
  Trash2,
  MoreHorizontal,
  ArrowRight,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  MessageSquareText,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { Menu } from "@headlessui/react";
import BotAvatar from "./BotAvatar";
import { dateLocale, useT } from "../i18n";
import { dashboardMessages } from "../i18n/messages/dashboard";
import { commonMessages } from "../i18n/messages/common";

interface ChatbotCardProps {
  chatbot: {
    id: string;
    title: string;
    createdAt: Date;
    lastUpdated: Date;
    isActive?: boolean;
    aiEnabled?: boolean;
    primaryColor?: string;
    launcherStyle?: string;
    initialMessage?: string;
    faqData?: unknown[];
    installedAt?: Date | null;
    lastSeenHost?: string;
  };
  feedback: {
    positive: number;
    negative: number;
  };
  viewMode: "grid" | "list";
  onEdit: (id: string) => void;
  onEmbed: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  index: number;
}


const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#101723]/25 dark:focus-visible:ring-[#D7DFE5]/40";

const iconButton = `rounded-md p-1.5 text-[#566273] transition-colors hover:bg-[#E7EDF6] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`;

const StatusSwitch: React.FC<{ active: boolean; title: string; onToggle: () => void }> = ({
  active,
  title,
  onToggle,
}) => {
  const t = useT(dashboardMessages);
  return (
  <button
    role="switch"
    aria-checked={active}
    aria-label={t(active ? "statusLiveAria" : "statusPausedAria", { name: title })}
    onClick={onToggle}
    className={`inline-flex shrink-0 items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2.5 text-[11px] font-medium ring-1 ring-inset transition-colors ${focusRing} ${
      active
        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-400/25"
        : "bg-[#E7EDF6] text-[#566273] ring-[#566273]/15 dark:bg-[#243040] dark:text-[#9BAABD] dark:ring-white/10"
    }`}
  >
    <span
      className={`relative h-4 w-7 rounded-full transition-colors ${
        active ? "bg-emerald-500" : "bg-[#B8C3D1] dark:bg-[#4A5A6E]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-[left] duration-200 ${
          active ? "left-[14px]" : "left-0.5"
        }`}
      />
    </span>
    {active ? t("live") : t("paused")}
  </button>
  );
};

const satisfactionTone = (rate: number) =>
  rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500";

const ChatbotCard: React.FC<ChatbotCardProps> = ({
  chatbot,
  feedback,
  viewMode,
  onEdit,
  onEmbed,
  onDelete,
  onToggleActive,
  index,
}) => {
  const t = useT(dashboardMessages);
  const tc = useT(commonMessages);
  const locale = dateLocale(t.lang);
  const isActive = chatbot.isActive ?? true;
  const isAiEnabled = chatbot.aiEnabled === true;
  const faqCount = Array.isArray(chatbot.faqData) ? chatbot.faqData.length : 0;
  const totalFeedback = feedback.positive + feedback.negative;
  const satisfactionRate =
    totalFeedback > 0 ? Math.round((feedback.positive / totalFeedback) * 100) : null;
  const updatedLabel = formatDistanceToNowStrict(chatbot.lastUpdated, { addSuffix: true, locale });
  const updatedTitle = format(chatbot.lastUpdated, tc("dateTimeFormat"), { locale });
  // Not loaded on any website yet: point the owner at the embed code.
  const installed = Boolean(chatbot.installedAt);

  if (viewMode === "list") {
    return (
      <tr className="group transition-colors hover:bg-[#F3F7FC] dark:hover:bg-[#1F2B3A]">
        <td className="py-3 pl-3 pr-2 sm:px-6">
          <button onClick={() => onEdit(chatbot.id)} className={`flex items-center gap-3 rounded text-left ${focusRing}`}>
            <BotAvatar color={chatbot.primaryColor} launcherStyle={chatbot.launcherStyle} size={34} muted={!isActive} />
            <span className="min-w-0">
              <span className="block max-w-[8.5rem] truncate text-body-sm font-medium text-[#101723] sm:max-w-[16rem] dark:text-[#D7DFE5]">
                {chatbot.title}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-caption text-[#647184] dark:text-[#87909D]">
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-[#87909D]"}`} />
                  {isActive ? t("live") : t("paused")}
                </span>
                {isAiEnabled && (
                  <span className="flex items-center gap-0.5 text-violet-600 dark:text-violet-300">
                    <Sparkles size={10} />
                    {t("ai")}
                  </span>
                )}
                {!installed && (
                  <span className="truncate text-amber-700 dark:text-amber-300" title={t("notOnSiteHint")}>
                    {t("notOnSite")}
                  </span>
                )}
              </span>
            </span>
          </button>
        </td>
        <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6">
          {satisfactionRate === null ? (
            <span className="text-caption text-[#87909D]">{t("noRatingsYet")}</span>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E7EDF6] dark:bg-[#243040]">
                <div
                  className={`h-full rounded-full ${satisfactionTone(satisfactionRate)}`}
                  style={{ width: `${satisfactionRate}%` }}
                />
              </div>
              <span className="text-body-sm font-medium tabular-nums text-[#101723] dark:text-[#D7DFE5]">
                {satisfactionRate}%
              </span>
              <span className="text-caption tabular-nums text-[#647184] dark:text-[#87909D]">
                {t.plural("ratingCount", totalFeedback)}
              </span>
            </div>
          )}
        </td>
        <td className="hidden whitespace-nowrap px-6 py-3 text-body-sm tabular-nums text-[#566273] lg:table-cell dark:text-[#9BAABD]">
          {faqCount}
        </td>
        <td className="hidden whitespace-nowrap px-6 py-3 text-body-sm text-[#566273] xl:table-cell dark:text-[#9BAABD]">
          <span title={updatedTitle}>{updatedLabel}</span>
        </td>
        <td className="whitespace-nowrap py-3 pl-1 pr-2 text-right sm:px-6">
          <div className="flex items-center justify-end gap-0.5">
            <button
              onClick={() => onToggleActive(chatbot.id)}
              className={iconButton}
              title={isActive ? t("pause") : t("goLive")}
              aria-label={t(isActive ? "pauseNamed" : "activateNamed", { name: chatbot.title })}
            >
              {isActive ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <button onClick={() => onEdit(chatbot.id)} className={iconButton} title={t("edit")} aria-label={t("editNamed", { name: chatbot.title })}>
              <Edit2 size={15} />
            </button>
            <button
              onClick={() => onEmbed(chatbot.id)}
              className={iconButton}
              title={t("embedTitle")}
              aria-label={t("embedCodeNamed", { name: chatbot.title })}
            >
              <Code size={15} />
            </button>
            <button
              onClick={() => onDelete(chatbot.id)}
              className={`${iconButton} hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/30 dark:hover:!text-red-400`}
              title={t("delete")}
              aria-label={t("deleteNamed", { name: chatbot.title })}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const menuItem = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm ${
      active
        ? "bg-[#F3F7FC] text-[#101723] dark:bg-[#273444] dark:text-[#D7DFE5]"
        : "text-[#566273] dark:text-[#9BAABD]"
    }`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className="group relative flex flex-col rounded-2xl border border-[#D8DFE9] bg-[#F9FCFF] shadow-[0_1px_2px_rgba(16,23,35,0.04)] transition-colors duration-200 hover:border-[#C9D3E0] dark:border-[#2B3646] dark:bg-[#1A2533] dark:hover:border-[#39485B]"
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <BotAvatar color={chatbot.primaryColor} launcherStyle={chatbot.launcherStyle} size={40} muted={!isActive} />
          <div className="min-w-0 flex-1">
            <button
              onClick={() => onEdit(chatbot.id)}
              className={`block max-w-full truncate rounded text-left text-body font-semibold tracking-tight text-[#101723] hover:underline hover:underline-offset-4 dark:text-[#F3F7FC] ${focusRing}`}
              title={chatbot.title}
            >
              {chatbot.title}
            </button>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-[#647184] dark:text-[#87909D]">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <MessageSquareText size={12} />
                {t.plural("faqCount", faqCount)}
              </span>
              {isAiEnabled && (
                <span className="flex items-center gap-1 whitespace-nowrap text-violet-600 dark:text-violet-300">
                  <Sparkles size={11} />
                  {t("aiReplies")}
                </span>
              )}
              {installed && chatbot.lastSeenHost && (
                <span className="flex min-w-0 items-center gap-1" title={chatbot.lastSeenHost}>
                  <Globe size={11} className="shrink-0" />
                  <span className="truncate">{t("onSite", { host: chatbot.lastSeenHost })}</span>
                </span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
          <StatusSwitch active={isActive} title={chatbot.title} onToggle={() => onToggleActive(chatbot.id)} />
          <Menu as="div" className="relative -mr-1.5">
            <Menu.Button className={iconButton} aria-label={t("moreActionsNamed", { name: chatbot.title })}>
              <MoreHorizontal size={18} />
            </Menu.Button>
            <Menu.Items anchor="bottom end" modal={false} transition className="z-50 w-44 origin-top-right rounded-xl [--anchor-gap:6px] transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 border border-[#D8DFE9] bg-[#F9FCFF] p-1.5 shadow-xl focus:outline-none dark:border-[#2B3646] dark:bg-[#1A2533]">
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => onEdit(chatbot.id)} className={menuItem(active)}>
                      <Edit2 size={15} />
                      {t("edit")}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={() => onEmbed(chatbot.id)} className={menuItem(active)}>
                      <Code size={15} />
                      {t("embedTitle")}
                    </button>
                  )}
                </Menu.Item>
                <div className="my-1 h-px bg-[#E7EDF6] dark:bg-[#2B3646]" />
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onDelete(chatbot.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm text-red-600 dark:text-red-400 ${
                        active ? "bg-red-50 dark:bg-red-950/30" : ""
                      }`}
                    >
                      <Trash2 size={15} />
                      {t("delete")}
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
          </Menu>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-caption font-medium text-[#566273] dark:text-[#9BAABD]">{t("satisfaction")}</span>
            <span className="font-serif text-body-lg leading-none tabular-nums text-[#101723] dark:text-[#F3F7FC]">
              {satisfactionRate === null ? "—" : `${satisfactionRate}%`}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7EDF6] dark:bg-[#243040]">
            {satisfactionRate !== null && (
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${satisfactionTone(satisfactionRate)}`}
                style={{ width: `${satisfactionRate}%` }}
              />
            )}
          </div>
          <div className="mt-2 flex items-center gap-3 text-caption tabular-nums text-[#647184] dark:text-[#87909D]">
            {totalFeedback > 0 ? (
              <>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={11} className="text-emerald-600 dark:text-emerald-400" />
                  {feedback.positive}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsDown size={11} className="text-rose-600 dark:text-rose-400" />
                  {feedback.negative}
                </span>
                <span className="ml-auto">{t.plural("ratingCount", totalFeedback)}</span>
              </>
            ) : (
              <span>{t("noRatingsYet")}</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-[#E7EDF6] pt-3 dark:border-[#2B3646]">
          {installed ? (
            <span className="mr-auto truncate text-caption text-[#647184] dark:text-[#87909D]" title={updatedTitle}>
              {t("updatedAgo", { time: updatedLabel })}
            </span>
          ) : (
            <button
              onClick={() => onEmbed(chatbot.id)}
              title={t("notOnSiteHint")}
              className={`mr-auto flex min-w-0 items-center gap-1.5 rounded text-caption font-medium text-amber-700 hover:underline hover:underline-offset-2 dark:text-amber-300 ${focusRing}`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
              <span className="truncate">{t("notOnSite")}</span>
            </button>
          )}
          <button
            onClick={() => onEmbed(chatbot.id)}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#D8DFE9] text-[#566273] transition-colors hover:bg-[#F3F7FC] hover:text-[#101723] dark:border-[#2B3646] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
            title={t("embedTitle")}
            aria-label={t("embedCodeNamed", { name: chatbot.title })}
          >
            <Code size={14} />
          </button>
          <button
            onClick={() => onEdit(chatbot.id)}
            className={`group/btn inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#101723] px-3 text-button text-white shadow-sm transition-colors hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6] ${focusRing}`}
          >
            {t("manage")}
            <ArrowRight size={14} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ChatbotCard;
