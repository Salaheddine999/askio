import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bot, SearchX } from "../../components/icons";
import ChatbotCard from "../../components/ChatbotCard";
import ChatbotTable from "./ChatbotTable";
import {
  ChatbotGridSkeleton,
  CreateChatbotLink,
  EmptyState,
  ErrorBanner,
  Pagination,
  SearchInput,
  SectionHeader,
  SortMenu,
  ViewToggle,
  secondaryButton,
} from "./ui";
import { Chatbot, ChatbotActions, EMPTY_FEEDBACK, FeedbackCounts, SortKey, SortOrder } from "./types";
import { useT } from "../../i18n";
import { dashboardMessages } from "../../i18n/messages/dashboard";
import { commonMessages } from "../../i18n/messages/common";

const PER_PAGE = 12;
const VIEW_MODE_KEY = "askio_dashboard_view";

function readViewMode(): "grid" | "list" {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function compareChatbots(a: Chatbot, b: Chatbot, sortBy: SortKey, sortOrder: SortOrder) {
  const dir = sortOrder === "asc" ? 1 : -1;
  if (sortBy === "title") return a.title.localeCompare(b.title) * dir;
  const timeA = new Date(a[sortBy]).getTime();
  const timeB = new Date(b[sortBy]).getTime();
  // Invalid dates sort last; identical dates fall back to the name.
  if (isNaN(timeA) || isNaN(timeB)) return isNaN(timeA) ? (isNaN(timeB) ? 0 : 1) : -1;
  return (timeA - timeB) * dir || a.title.localeCompare(b.title);
}

interface ChatbotsTabProps extends ChatbotActions {
  chatbots: Chatbot[];
  feedbackCounts: Record<string, FeedbackCounts>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const ChatbotsTab: React.FC<ChatbotsTabProps> = ({
  chatbots,
  feedbackCounts,
  loading,
  error,
  onRetry,
  ...actions
}) => {
  const t = useT(dashboardMessages);
  const tc = useT(commonMessages);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("lastUpdated");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">(readViewMode);
  // Cards fade in when the tab first shows them; after that, switching views,
  // pages or searching shows them at once.
  const firstShow = useRef(true);
  useEffect(() => {
    firstShow.current = false;
  }, []);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [searchTerm, sortBy, sortOrder]);

  const changeViewMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // Storage unavailable; the choice just won't be remembered.
    }
  };

  // Same column toggles direction; a new column starts A–Z for names and newest first for dates.
  const handleSort = (key: SortKey) => {
    if (key === sortBy) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder(key === "title" ? "asc" : "desc");
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return chatbots
      .filter((c) => c.title.toLowerCase().includes(term))
      .sort((a, b) => compareChatbots(a, b, sortBy, sortOrder));
  }, [chatbots, searchTerm, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const rangeStart = (currentPage - 1) * PER_PAGE + 1;
  const rangeEnd = Math.min(currentPage * PER_PAGE, filtered.length);

  const hasChatbots = chatbots.length > 0;

  return (
    <div className="space-y-5">
      <SectionHeader
        title={t("yourChatbots")}
        description={hasChatbots ? t.plural("chatbotsSummary", chatbots.length) : t("chatbotsEmptySummary")}
        actions={
          hasChatbots && (
            <>
              <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={t("searchChatbots")} />
              <SortMenu sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
              <ViewToggle value={viewMode} onChange={changeViewMode} />
            </>
          )
        }
      />

      {error ? (
        <ErrorBanner message={error} onRetry={onRetry} />
      ) : loading ? (
        <ChatbotGridSkeleton count={8} />
      ) : !hasChatbots ? (
        <div className="rounded-xl border border-dashed border-ink-165 dark:border-ink-710">
          <EmptyState
            kio
            icon={Bot}
            title={t("noChatbotsTitle")}
            description={t("noChatbotsDesc")}
            action={<CreateChatbotLink label={t("createChatbot")} to="/start" />}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-165 dark:border-ink-710">
          <EmptyState
            icon={SearchX}
            title={t("noMatchesTitle")}
            description={t("noMatchesDesc", { term: searchTerm.trim() })}
            action={
              <button onClick={() => setSearchTerm("")} className={secondaryButton}>
                {tc("clearSearch")}
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Switching views swaps at once: a cross-fade left the area blank
              between the two, which read as a flicker. */}
          {viewMode === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,24rem),1fr))] gap-4">
                {pageItems.map((chatbot, index) => (
                  <ChatbotCard
                    key={chatbot.id}
                    chatbot={chatbot}
                    feedback={feedbackCounts[chatbot.id] || EMPTY_FEEDBACK}
                    viewMode="grid"
                    onEdit={actions.onEdit}
                    onEmbed={actions.onEmbed}
                    onDelete={actions.onDelete}
                    onToggleActive={() => actions.onToggleActive(chatbot)}
                    index={index}
                    appear={firstShow.current}
                  />
                ))}
              </div>
            ) : (
                <ChatbotTable
                  chatbots={pageItems}
                  feedbackCounts={feedbackCounts}
                  sort={{ sortBy, sortOrder, onSort: handleSort }}
                  {...actions}
                />
            )}

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
            summary={t("showingRange", {
              start: rangeStart.toLocaleString(t.lang),
              end: rangeEnd.toLocaleString(t.lang),
              total: filtered.length.toLocaleString(t.lang),
            })}
          />
        </>
      )}
    </div>
  );
};

export default ChatbotsTab;
