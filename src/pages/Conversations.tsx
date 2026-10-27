import React, { useEffect, useMemo, useRef, useState } from "react";
import { markConversationsSeen } from "../utils/sidebarCounts";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "react-hot-toast";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";
import { ArrowLeft, Bot, Check, ChevronsUpDown, Copy, Mail, MessagesSquare, Send, Trash2 } from "lucide-react";
import { auth } from "../utils/firebase";
import { apiRequest } from "../utils/api";
import type { LiveStatus } from "../utils/liveChat";
import { db } from "../utils/db";
import { DUMMY_CHATBOTS } from "../utils/dummyData";
import BotAvatar from "../components/BotAvatar";
import { Skeleton } from "../components/Skeleton";
import { usePlanAccess } from "../hooks/usePlanAccess";
import { PAGE_SIZE, usePaged } from "../hooks/usePaged";
import { dateLocale, useT } from "../i18n";
import { conversationsMessages } from "../i18n/messages/conversations";
import { EmptyState, Pagination, focusRing, primaryButton, secondaryButton, surface } from "./dashboard/ui";

interface ChatbotInfo {
  id: string;
  title: string;
  primaryColor?: string;
  secondaryColor?: string;
  launcherStyle?: string;
  saveConversations: boolean;
}

interface ChatMessage {
  role: "visitor" | "bot" | "agent";
  text: string;
  at: number;
  /** For "agent": the first name the visitor saw. */
  name?: string;
}

interface Conversation {
  id: string;
  chatbotId: string;
  preview: string | null;
  messageCount: number;
  startedAt: Date | null;
  lastMessageAt: Date | null;
  leadEmail: string | null;
  messages: ChatMessage[];
  liveStatus: LiveStatus | null;
  liveRequestedAt: Date | null;
}

const toDate = (value: unknown) => (value instanceof Timestamp ? value.toDate() : null);

function toConversation(d: DocumentSnapshot<DocumentData>): Conversation {
  const data = d.data() ?? {};
  const messages: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
  return {
    id: d.id,
    chatbotId: data.chatbotId,
    preview: data.preview ?? null,
    messageCount: Number(data.messageCount) || messages.length,
    startedAt: toDate(data.startedAt),
    lastMessageAt: toDate(data.lastMessageAt),
    leadEmail: data.leadEmail ?? null,
    // arrayUnion keeps insertion order, but sort by time to be safe.
    messages: [...messages].sort((a, b) => a.at - b.at),
    liveStatus: data.liveStatus ?? null,
    liveRequestedAt: toDate(data.liveRequestedAt),
  };
}

const isLive = (c: Conversation | null | undefined) => c?.liveStatus === "waiting" || c?.liveStatus === "active";

// Test mode: a few believable chats so the page can be seen without real data.
function sampleConversations(): Conversation[] {
  const now = Date.now();
  const chat = (minutesAgo: number, lines: [ChatMessage["role"], string][]) =>
    lines.map(([role, text], i) => ({ role, text, at: now - minutesAgo * 60_000 + i * 40_000 }));
  const make = (id: string, chatbotId: string, minutesAgo: number, lines: [ChatMessage["role"], string][], leadEmail: string | null = null) => {
    const messages = chat(minutesAgo, lines);
    return {
      id,
      chatbotId,
      preview: messages.find((m) => m.role === "visitor")?.text ?? null,
      messageCount: messages.length,
      startedAt: new Date(messages[0].at),
      lastMessageAt: new Date(messages[messages.length - 1].at),
      leadEmail,
      messages,
      liveStatus: null,
      liveRequestedAt: null,
    };
  };
  return [
    make("s1", "dummy-1", 4, [
      ["visitor", "Hi, how long does shipping to Rotterdam take?"],
      ["bot", "Orders ship within 1 business day and usually arrive in 2–3 days in the Netherlands."],
      ["visitor", "And can I return it if it doesn't fit?"],
      ["bot", "Yes, you can return unused items within 30 days. Start a return from your order email."],
      ["visitor", "Great, thanks!"],
    ]),
    make("s2", "dummy-1", 52, [
      ["visitor", "Do you offer gift wrapping?"],
      ["bot", "I'm sorry, I don't have an answer for that. Please leave your email below and our team will get back to you."],
      ["visitor", "sure"],
      ["bot", "Thank you! Our team will be in touch soon."],
    ], "nadia.k@example.com"),
    make("s3", "dummy-2", 180, [
      ["visitor", "What are your opening hours on Sunday?"],
      ["bot", "We're closed on Sundays. From Monday to Saturday we're open 9am–6pm."],
    ]),
    make("s4", "dummy-1", 60 * 26, [
      ["visitor", "Can I change my delivery address after ordering?"],
      ["bot", "Yes, as long as the order hasn't shipped. Reply to your confirmation email with the new address."],
      ["visitor", "It says shipped already"],
      ["bot", "Then the carrier can help: use the tracking link in your shipping email to request a change."],
    ]),
  ];
}

const ChatbotPicker: React.FC<{ chatbots: ChatbotInfo[]; value: string; onChange: (id: string) => void }> = ({
  chatbots,
  value,
  onChange,
}) => {
  const t = useT(conversationsMessages);
  const selected = chatbots.find((c) => c.id === value);
  const options = [{ id: "all", title: t("allChatbots") } as ChatbotInfo, ...chatbots];
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        aria-label={t("chatbotFilter")}
        className={`inline-flex h-9 w-56 items-center gap-2 rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] pl-2.5 pr-2.5 text-left text-[13px] font-medium text-[#101723] transition-colors hover:border-[#B8C3D1] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5] ${focusRing}`}
      >
        {selected ? <BotAvatar color={selected.primaryColor} launcherStyle={selected.launcherStyle} size={18} /> : <Bot size={15} className="shrink-0 text-[#647184]" />}
        <span className="min-w-0 flex-1 truncate">{selected ? selected.title || t("untitled") : t("allChatbots")}</span>
        <ChevronsUpDown size={14} className="ml-1 shrink-0 text-[#87909D]" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom end"
        modal={false}
        transition
        className="z-50 max-h-72 w-[var(--button-width)] min-w-56 overflow-auto rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-1.5 shadow-xl transition duration-100 ease-out [--anchor-gap:6px] focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0 dark:border-[#2B3646] dark:bg-[#1A2533]"
      >
        {options.map((bot) => (
          <ListboxOption
            key={bot.id}
            value={bot.id}
            className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-body-sm text-[#101723] data-[focus]:bg-[#F3F7FC] dark:text-[#D7DFE5] dark:data-[focus]:bg-[#273444]"
          >
            {bot.id === "all" ? <Bot size={16} className="shrink-0 text-[#647184]" /> : <BotAvatar color={bot.primaryColor} launcherStyle={bot.launcherStyle} size={20} />}
            <span className="min-w-0 flex-1 truncate group-data-[selected]:font-medium">{bot.title || t("untitled")}</span>
            <Check size={14} className="invisible shrink-0 group-data-[selected]:visible" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
};

const Transcript: React.FC<{
  conversation: Conversation;
  chatbot?: ChatbotInfo;
  onBack: () => void;
  onDelete: () => void;
}> = ({ conversation, chatbot, onBack, onDelete }) => {
  const t = useT(conversationsMessages);
  const locale = dateLocale(t.lang);
  const [confirming, setConfirming] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const visitorColor = chatbot?.secondaryColor || chatbot?.primaryColor || "#243040";
  const live = isLive(conversation);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setConfirming(false);
    setReply("");
    bottom.current?.scrollIntoView({ block: "end" });
  }, [conversation.id]);
  // New live messages scroll into view.
  useEffect(() => {
    if (live) bottom.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [conversation.messages.length, live]);

  const send = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await apiRequest("/api/account/live-reply", { authRequired: true, body: { conversationId: conversation.id, text } });
      setReply("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("replyFailed"));
    } finally {
      setSending(false);
    }
  };
  const endChat = async () => {
    try {
      await apiRequest("/api/account/live-end", { authRequired: true, body: { conversationId: conversation.id } });
      toast.success(t("chatEnded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("endFailed"));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-start gap-3 border-b border-[#E7EDF6] px-5 py-4 dark:border-[#2B3646]">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("back")}
          className={`-ml-1 mt-0.5 rounded-lg p-1.5 text-[#566273] hover:bg-[#E7EDF6] lg:hidden dark:text-[#9BAABD] dark:hover:bg-[#273444] ${focusRing}`}
        >
          <ArrowLeft size={16} />
        </button>
        <BotAvatar color={chatbot?.primaryColor} launcherStyle={chatbot?.launcherStyle} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold text-[#101723] dark:text-[#E7EDF6]">{chatbot?.title || t("untitled")}</p>
          <p className="mt-0.5 text-caption text-[#647184] dark:text-[#87909D]">
            {conversation.startedAt ? t("started", { date: format(conversation.startedAt, t("dateTimeFormat"), { locale }) }) : ""}
            {" · "}
            {t.plural("messages", conversation.messageCount)}
          </p>
        </div>
        {confirming ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={() => setConfirming(false)} className={`${secondaryButton} h-8 px-2.5`}>
              {t("cancel")}
            </button>
            <button type="button" onClick={onDelete} className={`${primaryButton} h-8 px-2.5 !bg-red-600 !text-white hover:!bg-red-700`}>
              {t("delete")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={t("delete")}
            title={t("delete")}
            className={`shrink-0 rounded-lg p-2 text-[#87909D] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 ${focusRing}`}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      {confirming && (
        <p className="border-b border-red-100 bg-red-50 px-5 py-2 text-caption text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <span className="font-medium">{t("deleteTitle")}</span> {t("deleteBody")}
        </p>
      )}

      {conversation.leadEmail && (
        <div className="flex items-center gap-2 border-b border-[#E7EDF6] bg-emerald-50/60 px-5 py-2.5 text-caption text-emerald-800 dark:border-[#2B3646] dark:bg-emerald-950/20 dark:text-emerald-300">
          <Mail size={14} className="shrink-0" />
          <span className="shrink-0">{t("leftEmail")}:</span>
          <span className="min-w-0 truncate font-medium">{conversation.leadEmail}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(conversation.leadEmail!).then(() => toast.success(t("copied")), () => undefined)}
            aria-label={t("copyEmail")}
            title={t("copyEmail")}
            className={`ml-auto shrink-0 rounded p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 ${focusRing}`}
          >
            <Copy size={13} />
          </button>
        </div>
      )}

      {live && (
        <div className="flex items-center gap-3 border-b border-[#E7EDF6] bg-emerald-50/70 px-5 py-2.5 text-caption text-emerald-900 dark:border-[#2B3646] dark:bg-emerald-950/25 dark:text-emerald-200">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="min-w-0 flex-1">
            {conversation.liveStatus === "waiting"
              ? t("waitingBanner", {
                  time: conversation.liveRequestedAt
                    ? formatDistanceToNowStrict(conversation.liveRequestedAt, { addSuffix: true, locale })
                    : t("justNow"),
                })
              : t("activeBanner")}
          </span>
          <button type="button" onClick={endChat} className={`${secondaryButton} h-7 shrink-0 px-2.5 text-caption`}>
            {t("endChat")}
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F3F7FC] px-5 py-5 [scrollbar-width:thin] dark:bg-[#141D2B]">
        {conversation.messages.map((m, i) => {
          const isVisitor = m.role === "visitor";
          const isAgent = m.role === "agent";
          return (
            <div key={`${m.at}-${i}`} className={`flex ${isVisitor ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                <div
                  className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-body-sm leading-relaxed ${
                    isVisitor
                      ? "rounded-br-md text-white dark:ring-1 dark:ring-white/15"
                      : isAgent
                        ? "rounded-bl-md bg-emerald-50 text-[#101723] ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:text-[#D7DFE5] dark:ring-emerald-900/60"
                        : "rounded-bl-md bg-[#F9FCFF] text-[#101723] ring-1 ring-[#E7EDF6] dark:bg-[#1A2533] dark:text-[#D7DFE5] dark:ring-[#2B3646]"
                  }`}
                  style={isVisitor ? { background: visitorColor } : undefined}
                >
                  {m.text}
                </div>
                <p className={`mt-1 text-[11px] text-[#87909D] ${isVisitor ? "text-right" : ""}`}>
                  {isVisitor ? t("visitor") : isAgent ? t("you") : chatbot?.title || "Bot"} · {format(new Date(m.at), t("timeFormat"), { locale })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {live && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-end gap-2 border-t border-[#E7EDF6] px-4 py-3 dark:border-[#2B3646]"
        >
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder={t("replyPlaceholder")}
            aria-label={t("replyPlaceholder")}
            className={`min-h-[38px] flex-1 resize-none rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] px-3 py-2 text-body-sm text-[#101723] placeholder:text-[#87909D] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5] ${focusRing}`}
          />
          <button type="submit" disabled={!reply.trim() || sending} className={`${primaryButton} h-[38px] shrink-0`} aria-label={t("send")}>
            <Send size={15} />
            <span className="hidden sm:inline">{t("send")}</span>
          </button>
        </form>
      )}
    </div>
  );
};

const Conversations: React.FC<{ testMode?: boolean }> = ({ testMode = false }) => {
  const t = useT(conversationsMessages);
  const locale = dateLocale(t.lang);
  const { canUseAi: isPro, loading: planLoading } = usePlanAccess();
  const uid = auth.currentUser?.uid ?? "";
  const [chatbots, setChatbots] = useState<ChatbotInfo[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [samples, setSamples] = useState<Conversation[]>(() => sampleConversations());
  const [searchParams, setSearchParams] = useSearchParams();

  // A notification links here with ?open=<id>.
  useEffect(() => {
    const target = searchParams.get("open");
    if (!target) return;
    setOpenId(target);
    searchParams.delete("open");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Opening this page clears the sidebar's "new conversations" count.
  useEffect(() => {
    if (!testMode) markConversationsSeen();
  }, [testMode]);

  useEffect(() => {
    if (testMode) {
      setChatbots(
        DUMMY_CHATBOTS.map((c) => ({ id: c.id, title: c.title, primaryColor: c.primaryColor, launcherStyle: c.launcherStyle, saveConversations: true }))
      );
      return;
    }
    if (!uid) return;
    getDocs(query(collection(db, "chatbot_configs"), where("user_id", "==", uid)))
      .then((snap) =>
        setChatbots(
          snap.docs.map((d) => ({
            id: d.id,
            title: d.data().title || d.data().name || "",
            primaryColor: d.data().primaryColor,
            secondaryColor: d.data().secondaryColor,
            launcherStyle: d.data().launcherStyle,
            saveConversations: d.data().saveConversations === true,
          }))
        )
      )
      .catch(() => setChatbots([]));
  }, [uid, testMode]);

  const live = !testMode && isPro && !!uid;
  const list = usePaged(
    `${uid}|${filter}`,
    () =>
      filter === "all"
        ? query(collection(db, "conversations"), where("ownerId", "==", uid), orderBy("lastMessageAt", "desc"))
        : query(
            collection(db, "conversations"),
            where("ownerId", "==", uid),
            where("chatbotId", "==", filter),
            orderBy("lastMessageAt", "desc")
          ),
    toConversation,
    live
  );

  // Visitors waiting for you or chatting with you right now, kept live.
  const [liveItems, setLiveItems] = useState<Conversation[]>([]);
  useEffect(() => {
    if (!live) {
      setLiveItems([]);
      return;
    }
    return onSnapshot(
      query(collection(db, "conversations"), where("ownerId", "==", uid), where("liveStatus", "in", ["waiting", "active"])),
      (snap) =>
        setLiveItems(
          snap.docs
            .map(toConversation)
            .sort((a, b) => (b.liveRequestedAt?.getTime() ?? 0) - (a.liveRequestedAt?.getTime() ?? 0))
        ),
      () => setLiveItems([])
    );
  }, [live, uid]);

  // The open conversation follows Firestore, so new messages and live status
  // changes show at once (also one opened from a notification).
  const [followed, setFollowed] = useState<Conversation | null>(null);
  const followId = openId;
  useEffect(() => {
    if (!live || !followId) {
      setFollowed(null);
      return;
    }
    return onSnapshot(
      doc(db, "conversations", followId),
      (snap) => setFollowed(snap.exists() ? toConversation(snap) : null),
      () => setFollowed(null)
    );
  }, [live, followId]);

  const items = testMode ? samples.filter((c) => filter === "all" || c.chatbotId === filter) : list.items;
  const total = testMode ? items?.length ?? 0 : list.total;
  const byId = useMemo(() => new Map((chatbots || []).map((c) => [c.id, c])), [chatbots]);
  const open = (followed && followed.id === openId ? followed : null) ?? items?.find((c) => c.id === openId) ?? null;
  const anySaving = testMode || (chatbots || []).some((c) => c.saveConversations);
  const firstChatbot = chatbots?.[0];

  // On wide screens, show the newest conversation instead of an empty pane.
  useEffect(() => {
    if (!openId && items && items.length > 0 && window.matchMedia("(min-width: 1024px)").matches) setOpenId(items[0].id);
  }, [items, openId]);

  const remove = async (conversation: Conversation) => {
    try {
      if (testMode) setSamples((list) => list.filter((c) => c.id !== conversation.id));
      else {
        await deleteDoc(doc(db, "conversations", conversation.id));
        await list.reload();
      }
      setOpenId(null);
      toast.success(t("deleted"));
    } catch (error) {
      console.error("Couldn't delete conversation:", error);
      toast.error(t("deleteFailed"));
    }
  };

  const when = (date: Date | null) => {
    if (!date) return "";
    return Date.now() - date.getTime() < 60_000 ? t("justNow") : formatDistanceToNowStrict(date, { addSuffix: true, locale });
  };

  const header = (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">{t("title")}</h1>
        <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">{t("subtitle")}</p>
      </div>
      {(isPro || testMode) && chatbots && chatbots.length > 1 && (
        <ChatbotPicker
          chatbots={chatbots}
          value={filter}
          onChange={(id) => {
            setFilter(id);
            setOpenId(null);
          }}
        />
      )}
    </header>
  );

  let body: React.ReactNode;
  if (planLoading && !testMode) {
    body = <Skeleton className="h-[520px] w-full rounded-xl" />;
  } else if (!isPro && !testMode) {
    body = (
      <div className={surface}>
        <EmptyState
          icon={MessagesSquare}
          title={t("proTitle")}
          description={t("proBody")}
          action={
            <Link to="/plans" className={primaryButton}>
              {t("seePro")}
            </Link>
          }
        />
      </div>
    );
  } else if (list.error && !testMode) {
    body = (
      <p role="alert" className={`${surface} px-6 py-10 text-center text-body-sm text-red-600 dark:text-red-400`}>
        {t("loadFailed", { error: list.error })}
      </p>
    );
  } else if (items === null || chatbots === null) {
    body = <Skeleton className="h-[520px] w-full rounded-xl" />;
  } else if (items.length === 0 && liveItems.length === 0) {
    body = (
      <div className={surface}>
        {anySaving ? (
          <EmptyState kio icon={MessagesSquare} title={t("emptyTitle")} description={t("emptyBody")} />
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title={t("offTitle")}
            description={t("offBody")}
            action={
              firstChatbot ? (
                <Link to={`/configure/${firstChatbot.id}`} className={secondaryButton}>
                  {t("openEditor")}
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    );
  } else {
    body = (
      <div className={`${surface} grid h-[calc(100vh-13rem)] min-h-[480px] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]`}>
        <div className={`flex min-h-0 flex-col border-[#E7EDF6] lg:border-r dark:border-[#2B3646] ${open ? "hidden lg:flex" : "flex"}`}>
          {liveItems.length > 0 && (
            <div className="border-b border-[#E7EDF6] bg-emerald-50/40 dark:border-[#2B3646] dark:bg-emerald-950/15">
              <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                {t("liveNow")}
              </p>
              <ul className="pb-1.5">
                {liveItems.map((c) => {
                  const bot = byId.get(c.chatbotId);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(c.id)}
                        aria-current={c.id === openId ? "true" : undefined}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${focusRing} ${
                          c.id === openId ? "bg-emerald-100/60 dark:bg-emerald-950/40" : "hover:bg-emerald-100/40 dark:hover:bg-emerald-950/30"
                        }`}
                      >
                        <BotAvatar color={bot?.primaryColor} launcherStyle={bot?.launcherStyle} size={24} />
                        <span className="min-w-0 flex-1 truncate text-body-sm text-[#101723] dark:text-[#D7DFE5]">
                          {c.preview || t("noQuestion")}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-px text-[11px] font-semibold ${
                            c.liveStatus === "waiting" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200"
                          }`}
                        >
                          {c.liveStatus === "waiting" ? t("waitingBadge") : t("liveBadge")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <ul className={`min-h-0 flex-1 divide-y divide-[#E7EDF6] overflow-y-auto [scrollbar-width:thin] dark:divide-[#2B3646] ${list.loading ? "opacity-60" : ""}`}>
            {items.map((c) => {
              const bot = byId.get(c.chatbotId);
              const selected = c.id === openId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c.id)}
                    aria-current={selected ? "true" : undefined}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors ${focusRing} ${
                      selected ? "bg-[#F3F7FC] dark:bg-[#141D2B]" : "hover:bg-[#F3F7FC]/70 dark:hover:bg-[#141D2B]/60"
                    }`}
                  >
                    <BotAvatar color={bot?.primaryColor} launcherStyle={bot?.launcherStyle} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-caption font-medium text-[#566273] dark:text-[#9BAABD]">
                          {bot?.title || t("untitled")}
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-[11px] text-[#87909D]">{when(c.lastMessageAt)}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-body-sm text-[#101723] dark:text-[#D7DFE5]">
                        {c.preview || t("noQuestion")}
                      </span>
                      <span className="mt-1 flex items-center gap-2 text-[11px] text-[#87909D]">
                        {t.plural("messages", c.messageCount)}
                        {c.leadEmail && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <Mail size={10} />
                            {t("lead")}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!testMode && list.totalPages > 1 && (
            <div className="border-t border-[#E7EDF6] px-4 py-2.5 dark:border-[#2B3646] [&_p]:hidden">
              <Pagination page={list.page} totalPages={list.totalPages} onChange={(p) => void list.goTo(p)} />
            </div>
          )}
          {total !== null && total > 0 && (
            <p className="border-t border-[#E7EDF6] px-4 py-2 text-[11px] text-[#87909D] dark:border-[#2B3646]">
              {t("summary", {
                from: ((list.page - 1) * PAGE_SIZE + 1).toLocaleString(t.lang),
                to: ((list.page - 1) * PAGE_SIZE + items.length).toLocaleString(t.lang),
                total: total.toLocaleString(t.lang),
              })}
            </p>
          )}
        </div>

        <div className={`min-h-0 ${open ? "flex" : "hidden lg:flex"} flex-col`}>
          {open ? (
            <Transcript conversation={open} chatbot={byId.get(open.chatbotId)} onBack={() => setOpenId(null)} onDelete={() => remove(open)} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState compact icon={MessagesSquare} title={t("selectTitle")} description={t("selectBody")} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>{t("metaTitle")}</title>
      </Helmet>
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        {header}
        {body}
      </div>
    </div>
  );
};

export default Conversations;
