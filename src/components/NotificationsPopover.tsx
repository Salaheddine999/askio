import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Popover, PopoverButton, PopoverPanel, type PopoverPanelProps } from "@headlessui/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format, formatDistanceToNowStrict } from "date-fns";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import { DUMMY_NOTIFICATIONS } from "../utils/dummyData";
import { markNotificationsSeen, NOTIFICATIONS_SEEN_KEY, OPEN_NOTIFICATIONS_EVENT } from "../utils/sidebarCounts";
import { fetchRecentOwned } from "../pages/dashboard/data";
import type { NotificationItem } from "../pages/dashboard/types";
import { Archive, Bell, HelpCircle, Inbox, LoaderCircle, LucideIcon, Settings, ThumbsDown, ThumbsUp, UserPlus } from "./icons";
import { dateLocale, useT } from "../i18n";
import { dashboardMessages } from "../i18n/messages/dashboard";
import { commonMessages } from "../i18n/messages/common";

// What the popover lists, newest first, per source.
const LIMIT = 30;
// Archived ids, per browser. Old ones fall off once the list is full.
const ARCHIVED_KEY = "askio_notifications_archived";
const MAX_ARCHIVED = 500;
// Opening the popover again within a minute shows what it already loaded.
const FRESH_MS = 60_000;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/25 dark:focus-visible:ring-ink-130/40";

const TYPE_ICON: Record<NotificationItem["type"], { Icon: LucideIcon; tone: string }> = {
  lead: { Icon: UserPlus, tone: "text-emerald-600 dark:text-emerald-400" },
  unanswered: { Icon: HelpCircle, tone: "text-amber-600 dark:text-amber-400" },
  positive_feedback: { Icon: ThumbsUp, tone: "text-ink-605 dark:text-ink-325" },
  negative_feedback: { Icon: ThumbsDown, tone: "text-rose-600 dark:text-rose-400" },
};

const keyOf = (item: NotificationItem) => `${item.type}-${item.id}`;

function readArchived(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ARCHIVED_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeArchived(keys: string[]) {
  try {
    localStorage.setItem(ARCHIVED_KEY, JSON.stringify(keys.slice(-MAX_ARCHIVED)));
  } catch {
    // Without storage, archiving lasts until the page reloads.
  }
}

function readLastSeen() {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_SEEN_KEY);
    return stored ? new Date(stored) : new Date(0);
  } catch {
    return new Date(0);
  }
}

let cache: { uid: string; at: number; items: NotificationItem[] } | null = null;

type DashboardT = ReturnType<typeof useT<typeof dashboardMessages.en>>;

/** New leads, unanswered questions and ratings across the owner's chatbots. */
async function loadNotifications(uid: string, t: DashboardT): Promise<NotificationItem[]> {
  if (cache && cache.uid === uid && Date.now() - cache.at < FRESH_MS) return cache.items;
  const [bots, leads, queries, ratings] = await Promise.all([
    getDocs(query(collection(db, "chatbot_configs"), where("user_id", "==", uid))),
    fetchRecentOwned("leads", uid, LIMIT),
    fetchRecentOwned("unanswered_queries", uid, LIMIT),
    getDocs(query(collection(db, "feedback"), where("ownerId", "==", uid))),
  ]);
  const names = new Map(bots.docs.map((d) => [d.id, String(d.data().title || "")]));
  const name = (id: string) => names.get(id) || t("unknownChatbot");
  const items: NotificationItem[] = [
    ...leads.map((l) => ({
      id: l.id,
      type: "lead" as const,
      title: t("newLeadCaptured"),
      description: l.email,
      timestamp: l.timestamp,
      chatbotName: name(l.chatbotId),
    })),
    ...queries.map((q) => ({
      id: q.id,
      type: "unanswered" as const,
      title: t("unansweredQuestion"),
      description: `“${q.query}”`,
      timestamp: q.timestamp,
      chatbotName: name(q.chatbotId),
    })),
    ...ratings.docs
      // Only ratings for chatbots this owner still has.
      .filter((d) => names.has(d.data().chatbotId))
      .map((d) => {
        const data = d.data();
        const positive = data.isPositive === true;
        return {
          id: d.id,
          type: positive ? ("positive_feedback" as const) : ("negative_feedback" as const),
          title: t(positive ? "positiveRating" : "negativeRating"),
          description: t(positive ? "positiveRatingDesc" : "negativeRatingDesc"),
          timestamp: data.timestamp?.toDate?.() ?? new Date(0),
          chatbotName: name(data.chatbotId),
        };
      }),
  ];
  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const result = items.slice(0, LIMIT * 2);
  cache = { uid, at: Date.now(), items: result };
  return result;
}

type Tab = "inbox" | "archive";

/** The popover's contents. Mounted only while it's open, so it loads then. */
const Panel: React.FC<{ testMode: boolean; close: () => void }> = ({ testMode, close }) => {
  const t = useT(dashboardMessages);
  const tc = useT(commonMessages);
  const locale = dateLocale(t.lang);
  const [tab, setTab] = useState<Tab>("inbox");
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [archived, setArchived] = useState<string[]>(readArchived);
  // What arrived since the last look keeps its dot while the popover is
  // open; opening it counts as seeing it, so the bell's dot clears.
  const [lastSeen] = useState(readLastSeen);

  useEffect(() => {
    markNotificationsSeen();
  }, []);

  useEffect(() => {
    if (testMode) {
      setItems(DUMMY_NOTIFICATIONS as NotificationItem[]);
      setLoading(false);
      return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    let cancelled = false;
    loadNotifications(uid, t)
      .then((next) => !cancelled && setItems(next))
      .catch((err) => {
        console.error("Error fetching notifications:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [testMode, t]);

  const archivedSet = useMemo(() => new Set(archived), [archived]);
  const inbox = items.filter((item) => !archivedSet.has(keyOf(item)));
  const shown = tab === "inbox" ? inbox : items.filter((item) => archivedSet.has(keyOf(item)));

  const update = (next: string[]) => {
    setArchived(next);
    writeArchived(next);
  };
  const toggleArchived = (item: NotificationItem) => {
    const key = keyOf(item);
    update(archivedSet.has(key) ? archived.filter((k) => k !== key) : [...archived, key]);
  };

  const tabClass = (active: boolean) =>
    `relative -mb-px flex h-11 items-center gap-1.5 border-b-2 text-body-sm font-medium transition-colors ${focusRing} ${
      active ? "border-ink-900 text-fg dark:border-ink-130" : "border-transparent text-fg-subtle hover:text-fg"
    }`;

  return (
    <>
      <div className="flex shrink-0 items-center gap-5 border-b border-ink-120 pl-4 pr-2 dark:border-ink-780">
        <button onClick={() => setTab("inbox")} className={tabClass(tab === "inbox")} aria-pressed={tab === "inbox"}>
          {t("notificationsInbox")}
          {inbox.length > 0 && (
            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-caption font-semibold leading-none tabular-nums bg-ink-70 text-fg-muted dark:bg-ink-790">
              {inbox.length.toLocaleString(t.lang)}
            </span>
          )}
        </button>
        <button onClick={() => setTab("archive")} className={tabClass(tab === "archive")} aria-pressed={tab === "archive"}>
          {t("notificationsArchive")}
        </button>
        <Link
          to="/settings#emails"
          onClick={close}
          title={t("notificationSettings")}
          aria-label={t("notificationSettings")}
          className={`ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-ink-55 hover:text-fg dark:hover:bg-ink-820 ${focusRing}`}
        >
          <Settings size={16} />
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-fg-subtle">
            <LoaderCircle size={18} className="animate-spin" />
          </div>
        ) : error ? (
          <p className="flex h-full items-center justify-center px-4 text-center text-body-sm text-fg-muted">{t("notificationsLoadFailed")}</p>
        ) : shown.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-55 text-fg-subtle dark:bg-ink-820">
              <Inbox size={20} />
            </span>
            <p className="text-body-sm font-medium text-fg">
              {tab === "inbox" ? t("noNewNotifications") : t("noArchivedNotifications")}
            </p>
            {tab === "inbox" && (
              <p className="mt-1 max-w-[260px] text-caption text-fg-subtle">{t("notificationsEmptyDesc")}</p>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-ink-70 dark:divide-ink-780">
            {shown.map((item) => {
              const { Icon, tone } = TYPE_ICON[item.type];
              const unseen = tab === "inbox" && item.timestamp.getTime() > lastSeen.getTime();
              const isArchived = tab === "archive";
              return (
                <li key={keyOf(item)} className="group relative flex gap-3 px-4 py-3 transition-colors hover:bg-ink-30 dark:hover:bg-ink-825">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-120 bg-ink-25 dark:border-ink-780 dark:bg-ink-850">
                    <Icon size={14} className={tone} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 pr-6 text-body-sm">
                      <span className="truncate font-medium text-fg">{item.title}</span>
                      {unseen && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-label={t("newBadge")} />}
                    </p>
                    <p className="mt-0.5 line-clamp-2 break-words text-body-sm text-fg-muted">{item.description}</p>
                    <p className="mt-1 truncate text-caption text-fg-subtle">
                      {item.chatbotName}
                      {item.timestamp.getTime() !== 0 && (
                        <>
                          {" · "}
                          <time dateTime={item.timestamp.toISOString()} title={format(item.timestamp, tc("dateTimeFormat"), { locale })}>
                            {formatDistanceToNowStrict(item.timestamp, { addSuffix: true, locale })}
                          </time>
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleArchived(item)}
                    title={isArchived ? t("moveToInbox") : t("archiveNotification")}
                    aria-label={isArchived ? t("moveToInbox") : t("archiveNotification")}
                    className={`absolute right-3 top-2.5 flex h-7 w-7 items-center justify-center rounded-md text-fg-subtle opacity-0 transition hover:bg-ink-70 hover:text-fg focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-ink-790 ${focusRing} [@media(hover:none)]:opacity-100`}
                  >
                    {isArchived ? <Inbox size={15} /> : <Archive size={15} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {tab === "inbox" && !loading && inbox.length > 0 && (
        <div className="shrink-0 border-t border-ink-120 p-1.5 dark:border-ink-780">
          <button
            onClick={() => update([...archived, ...inbox.map(keyOf)])}
            className={`flex h-9 w-full items-center justify-center gap-2 rounded-lg text-body-sm font-medium text-fg-muted transition-colors hover:bg-ink-55 hover:text-fg dark:hover:bg-ink-820 ${focusRing}`}
          >
            <Archive size={15} />
            {t("archiveAll")}
          </button>
        </div>
      )}
    </>
  );
};

interface NotificationsPopoverProps {
  /** New since the owner last looked: shows the dot on the bell. */
  unread: number;
  testMode: boolean;
  anchor: PopoverPanelProps["anchor"];
  label: string;
  className?: string;
}

/** The bell and its popover: an inbox of what the chatbots picked up. */
const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ unread, testMode, anchor, label, className = "" }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // "View all" elsewhere opens it; only the bell that's on screen answers.
  useEffect(() => {
    const open = () => {
      const button = buttonRef.current;
      if (button?.offsetParent && button.getAttribute("aria-expanded") !== "true") button.click();
    };
    window.addEventListener(OPEN_NOTIFICATIONS_EVENT, open);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS_EVENT, open);
  }, []);

  return (
    <Popover className={className}>
      <PopoverButton
        ref={buttonRef}
        title={label}
        aria-label={unread > 0 ? `${label} (${unread})` : label}
        className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-ink-70 hover:text-fg data-[open]:bg-ink-70 data-[open]:text-fg dark:hover:bg-ink-820 dark:data-[open]:bg-ink-820 ${focusRing}`}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-ink-55 dark:ring-ink-865" />
        )}
      </PopoverButton>
      <PopoverPanel
        anchor={anchor}
        transition
        className="z-[60] flex h-[min(480px,70vh)] w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-ink-120 bg-ink-25 shadow-lg transition duration-100 ease-out [--anchor-gap:10px] data-[closed]:scale-95 data-[closed]:opacity-0 focus:outline-none dark:border-ink-780 dark:bg-ink-850"
      >
        {({ close }) => <Panel testMode={testMode} close={close} />}
      </PopoverPanel>
    </Popover>
  );
};

export default NotificationsPopover;
