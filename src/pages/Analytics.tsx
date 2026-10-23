import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format, formatDistanceToNowStrict, isAfter, startOfDay, subDays } from "date-fns";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Bar } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import {
  BarChart3,
  Bot,
  Check,
  ChevronsUpDown,
  CircleHelp,
  Download,
  Inbox,
  MessageSquareText,
  Percent,
  Plus,
  UserPlus,
} from "lucide-react";
import { auth } from "../utils/firebase";
import { db } from "../utils/db";
import { useSiteDarkMode } from "../utils/useSiteDarkMode";
import { DUMMY_CHATBOTS } from "../utils/dummyData";
import StatsCard from "../components/StatsCard";
import BotAvatar from "../components/BotAvatar";
import { Skeleton, SkeletonCard, StatTilesSkeleton } from "../components/Skeleton";
import { CardHeader, CreateChatbotLink, EmptyState, SearchInput, focusRing, secondaryButton, surface } from "./dashboard/ui";
import { downloadCsv } from "./dashboard/data";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type EventType = "faq_matched" | "suggestion_clicked" | "ai_generated";

interface AnalyticsEvent {
  id: string;
  chatbotId: string;
  type: EventType;
  question?: string;
  userQuery?: string;
  timestamp: Date;
}

interface UnansweredQuery {
  id: string;
  chatbotId: string;
  query: string;
  timestamp: Date;
}

interface Lead {
  id: string;
  chatbotId: string;
  email: string;
  timestamp: Date;
}

interface ChatbotInfo {
  id: string;
  title: string;
  primaryColor?: string;
}

type RangeId = "7d" | "30d" | "90d" | "all";
const RANGES: { id: RangeId; label: string; days: number | null }[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];
// "All time" still charts a recent window, so the bars stay readable.
const ALL_TIME_CHART_DAYS = 90;
const LEADS_PREVIEW = 8;

// ---------------------------------------------------------------------------
// Test-mode sample data: deterministic, so the page looks the same each visit.

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const SAMPLE_QUESTIONS = [
  "How long does shipping take?",
  "Do you ship internationally?",
  "Can I return an order?",
  "What are your opening hours?",
  "Do you have a discount code?",
  "How do I track my order?",
];
const SAMPLE_UNANSWERED = [
  "Do you offer gift wrapping?",
  "Can I change my delivery address?",
  "Is there a student discount?",
  "Do you have a physical store in Rotterdam?",
  "Can I pay with PayPal?",
];
const SAMPLE_EMAILS = [
  "emma@northshop.co",
  "jonas@studiorue.com",
  "aylin@kettleandco.nl",
  "dev@brightdesk.io",
  "maria@lumenhome.com",
  "tom@fieldnotes.org",
  "sara@bloomandco.de",
  "lucas@atelierpaul.fr",
];

function sampleData() {
  const rand = seeded(42);
  const now = Date.now();
  const bots = DUMMY_CHATBOTS.map((c) => c.id);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  // Spread over ~100 days with a gentle lean towards recent days, so trends are modest.
  const at = () => new Date(now - Math.pow(rand(), 1.15) * 100 * 86_400_000);
  const types: EventType[] = ["faq_matched", "faq_matched", "faq_matched", "suggestion_clicked", "ai_generated", "ai_generated"];

  const events: AnalyticsEvent[] = Array.from({ length: 420 }, (_, i) => {
    const type = pick(types);
    return {
      id: `e${i}`,
      chatbotId: pick(bots),
      type,
      question: type === "ai_generated" ? undefined : pick(SAMPLE_QUESTIONS),
      userQuery: pick(SAMPLE_QUESTIONS),
      timestamp: at(),
    };
  });
  const unanswered: UnansweredQuery[] = Array.from({ length: 38 }, (_, i) => ({
    id: `u${i}`,
    chatbotId: pick(bots),
    // Skewed so a few questions repeat a lot, like real gaps do.
    query: SAMPLE_UNANSWERED[Math.floor(rand() * rand() * SAMPLE_UNANSWERED.length)],
    timestamp: at(),
  }));
  const leads: Lead[] = Array.from({ length: 27 }, (_, i) => ({
    id: `l${i}`,
    chatbotId: pick(bots),
    email: i < SAMPLE_EMAILS.length ? SAMPLE_EMAILS[i] : `visitor${i + 1}@example.com`,
    timestamp: at(),
  }));
  return { events, unanswered, leads };
}

// ---------------------------------------------------------------------------

const pctChange = (current: number, previous: number) =>
  previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

type Trend = { trend?: string; trendDirection?: "up" | "down" };

function trendProps(diff: number, unit: "%" | "pts"): Trend {
  if (!Number.isFinite(diff) || Math.round(diff) === 0) return {};
  const rounded = Math.round(diff);
  return {
    trend: `${rounded > 0 ? "+" : ""}${rounded}${unit === "%" ? "%" : " pts"}`,
    trendDirection: rounded > 0 ? "up" : "down",
  };
}

interface AnalyticsProps {
  testMode?: boolean;
}

export default function Analytics({ testMode = false }: AnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [chatbots, setChatbots] = useState<ChatbotInfo[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredQuery[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [range, setRange] = useState<RangeId>("30d");
  const [chatbotFilter, setChatbotFilter] = useState<string>("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [showAllLeads, setShowAllLeads] = useState(false);

  useEffect(() => {
    if (testMode) {
      const sample = sampleData();
      setChatbots(DUMMY_CHATBOTS.map((c) => ({ id: c.id, title: c.title, primaryColor: c.primaryColor })));
      setEvents(sample.events);
      setUnanswered(sample.unanswered);
      setLeads(sample.leads);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;
        const botsSnap = await getDocs(query(collection(db, "chatbot_configs"), where("user_id", "==", user.uid)));
        const bots = botsSnap.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "Untitled chatbot",
          primaryColor: d.data().primaryColor,
        }));
        setChatbots(bots);
        if (bots.length === 0) return;

        const ids = new Set(bots.map((b) => b.id));
        const owned = async (name: string) =>
          (await getDocs(query(collection(db, name), where("ownerId", "==", user.uid)))).docs
            .filter((d) => ids.has(d.data().chatbotId))
            .map((d) => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate?.() || new Date(0) }));

        const [eventDocs, unansweredDocs, leadDocs] = await Promise.all([
          owned("analytics_events"),
          owned("unanswered_queries"),
          owned("leads"),
        ]);
        setEvents(eventDocs as AnalyticsEvent[]);
        setUnanswered(unansweredDocs as UnansweredQuery[]);
        setLeads(leadDocs as Lead[]);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testMode]);

  const botById = useMemo(() => new Map(chatbots.map((c) => [c.id, c])), [chatbots]);
  const days = RANGES.find((r) => r.id === range)!.days;

  // The selected period, and the one just before it for comparisons.
  const scoped = useMemo(() => {
    const periodStart = days ? startOfDay(subDays(new Date(), days - 1)) : null;
    const previousStart = days && periodStart ? subDays(periodStart, days) : null;
    const byBot = <T extends { chatbotId: string }>(items: T[]) =>
      chatbotFilter === "all" ? items : items.filter((i) => i.chatbotId === chatbotFilter);
    const inPeriod = <T extends { timestamp: Date }>(items: T[]) =>
      periodStart ? items.filter((i) => !isAfter(periodStart, i.timestamp)) : items;
    const inPrevious = <T extends { timestamp: Date }>(items: T[]) =>
      periodStart && previousStart
        ? items.filter((i) => !isAfter(previousStart, i.timestamp) && isAfter(periodStart, i.timestamp))
        : [];
    const e = byBot(events);
    const u = byBot(unanswered);
    const l = byBot(leads);
    return {
      events: inPeriod(e),
      unanswered: inPeriod(u),
      leads: inPeriod(l),
      previous: { events: inPrevious(e), unanswered: inPrevious(u), leads: inPrevious(l) },
      allEvents: e,
      allUnanswered: u,
    };
  }, [events, unanswered, leads, chatbotFilter, days]);

  const stats = useMemo(() => {
    const answered = scoped.events.length;
    const missed = scoped.unanswered.length;
    const rate = answered + missed > 0 ? (answered / (answered + missed)) * 100 : null;
    const prevAnswered = scoped.previous.events.length;
    const prevMissed = scoped.previous.unanswered.length;
    const prevRate = prevAnswered + prevMissed > 0 ? (prevAnswered / (prevAnswered + prevMissed)) * 100 : null;
    return {
      answered,
      missed,
      rate,
      leads: scoped.leads.length,
      trends: days
        ? {
            answered: trendProps(pctChange(answered, prevAnswered), "%"),
            missed: trendProps(pctChange(missed, prevMissed), "%"),
            rate: rate !== null && prevRate !== null ? trendProps(rate - prevRate, "pts") : {},
            leads: trendProps(pctChange(scoped.leads.length, scoped.previous.leads.length), "%"),
          }
        : null,
    };
  }, [scoped, days]);

  const breakdown = useMemo(() => {
    const count = (type: EventType) => scoped.events.filter((e) => e.type === type).length;
    const rows = [
      { key: "faq", label: "Matched an FAQ", value: count("faq_matched"), color: "bg-[#101723] dark:bg-[#D7DFE5]" },
      { key: "suggestion", label: "Picked a suggested question", value: count("suggestion_clicked"), color: "bg-[#647184] dark:bg-[#87909D]" },
      { key: "ai", label: "Answered by AI", value: count("ai_generated"), color: "bg-violet-500 dark:bg-violet-400" },
      { key: "missed", label: "Couldn't answer", value: scoped.unanswered.length, color: "bg-amber-500 dark:bg-amber-400" },
    ];
    return { rows, total: rows.reduce((sum, r) => sum + r.value, 0) };
  }, [scoped]);

  const topQuestions = useMemo(() => {
    const counts = new Map<string, number>();
    scoped.events.forEach((e) => {
      if (e.type !== "ai_generated" && e.question) counts.set(e.question, (counts.get(e.question) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([question, count]) => ({ question, count }));
  }, [scoped]);

  // Repeated questions are grouped, so the most-asked gaps come first.
  const unansweredGroups = useMemo(() => {
    const groups = new Map<string, { text: string; count: number; latest: Date; chatbotId: string }>();
    scoped.unanswered.forEach((u) => {
      const text = (u.query || "").trim();
      if (!text) return;
      const key = text.toLowerCase();
      const g = groups.get(key);
      if (!g) {
        groups.set(key, { text, count: 1, latest: u.timestamp, chatbotId: u.chatbotId });
      } else {
        g.count++;
        if (u.timestamp > g.latest) {
          g.latest = u.timestamp;
          g.chatbotId = u.chatbotId;
        }
      }
    });
    return [...groups.values()].sort((a, b) => b.count - a.count || b.latest.getTime() - a.latest.getTime()).slice(0, 6);
  }, [scoped]);

  const visibleLeads = useMemo(() => {
    const term = leadSearch.trim().toLowerCase();
    return [...scoped.leads]
      .filter((l) => (l.email || "").toLowerCase().includes(term))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [scoped, leadSearch]);

  const exportLeads = () =>
    downloadCsv(
      "askio_leads",
      ["Email", "Chatbot", "Captured at"],
      visibleLeads.map((l) => [l.email, botById.get(l.chatbotId)?.title || "Unknown chatbot", l.timestamp.toISOString()])
    );

  if (loading) return <AnalyticsSkeleton />;

  const rangeLabel = days ? `last ${days} days` : "all time";
  const statIcon = "h-3.5 w-3.5 text-[#566273] dark:text-[#9BAABD]";

  return (
    <div className="min-h-screen bg-[#F3F7FC] font-sans text-[#101723] dark:bg-[#141D2B]">
      <Helmet>
        <title>Analytics | Askio</title>
      </Helmet>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-h2 tracking-tight text-[#101723] sm:text-h1 dark:text-[#D7DFE5]">Analytics</h1>
            <p className="mt-1 text-body-sm text-[#566273] dark:text-[#9BAABD]">
              What visitors ask, how your chatbots answer, and who leaves their email.
            </p>
          </div>
          {chatbots.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <ChatbotFilter chatbots={chatbots} value={chatbotFilter} onChange={setChatbotFilter} />
              <div
                role="radiogroup"
                aria-label="Date range"
                className="inline-flex h-9 items-center rounded-lg border border-[#D8DFE9] bg-[#F3F7FC] p-0.5 dark:border-[#2B3646] dark:bg-[#141D2B]"
              >
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={range === r.id}
                    onClick={() => setRange(r.id)}
                    className={`h-full whitespace-nowrap rounded-md px-2.5 text-[13px] font-medium transition-colors ${focusRing} ${
                      range === r.id
                        ? "bg-[#F9FCFF] text-[#101723] shadow-sm dark:bg-[#273444] dark:text-[#D7DFE5]"
                        : "text-[#647184] hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {chatbots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#C9D3E0] bg-[#F9FCFF]/60 dark:border-[#39485B] dark:bg-[#1A2533]/40">
            <EmptyState
              icon={BarChart3}
              title="No chatbots yet"
              description="Create a chatbot and add it to your website. Questions, answers and leads show up here as visitors chat."
              action={<CreateChatbotLink label="Create chatbot" />}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatsCard
                title="Answered"
                value={stats.answered.toLocaleString()}
                description="From FAQs, suggestions and AI"
                icon={<MessageSquareText className={statIcon} />}
                {...stats.trends?.answered}
              />
              <StatsCard
                title="Answer rate"
                value={stats.rate === null ? "—" : `${Math.round(stats.rate)}%`}
                description="Questions your chatbots could answer"
                icon={<Percent className={statIcon} />}
                {...stats.trends?.rate}
              />
              <StatsCard
                title="Unanswered"
                value={stats.missed.toLocaleString()}
                description="Questions to add answers for"
                icon={<CircleHelp className={statIcon} />}
                goodWhen="down"
                {...stats.trends?.missed}
              />
              <StatsCard
                title="Leads captured"
                value={stats.leads.toLocaleString()}
                description="Visitors who left their email"
                icon={<UserPlus className={statIcon} />}
                {...stats.trends?.leads}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ActivityChart
                  events={scoped.allEvents}
                  unanswered={scoped.allUnanswered}
                  days={days ?? ALL_TIME_CHART_DAYS}
                  allTime={!days}
                />
              </div>
              <div className={surface}>
                <CardHeader title="How questions were answered" description={`${breakdown.total.toLocaleString()} questions, ${rangeLabel}`} />
                <div className="px-5 pb-5 sm:px-6">
                  {breakdown.total > 0 ? (
                    <>
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-[#E7EDF6] dark:bg-[#243040]">
                        {breakdown.rows.map((r) =>
                          r.value > 0 ? (
                            <div key={r.key} className={r.color} style={{ width: `${(r.value / breakdown.total) * 100}%` }} title={r.label} />
                          ) : null
                        )}
                      </div>
                      <ul className="mt-5 space-y-3">
                        {breakdown.rows.map((r) => (
                          <li key={r.key} className="flex items-center gap-3 text-body-sm">
                            <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${r.color}`} />
                            <span className="flex-1 text-[#566273] dark:text-[#9BAABD]">{r.label}</span>
                            <span className="tabular-nums font-medium text-[#101723] dark:text-[#D7DFE5]">{r.value.toLocaleString()}</span>
                            <span className="w-10 text-right tabular-nums text-caption text-[#87909D]">
                              {Math.round((r.value / breakdown.total) * 100)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="py-8 text-center text-body-sm text-[#647184] dark:text-[#87909D]">No questions in this period.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className={surface}>
                <CardHeader title="Most asked" description="Questions answered from your FAQs" />
                {topQuestions.length > 0 ? (
                  <ol className="space-y-3 px-5 pb-5 sm:px-6">
                    {topQuestions.map((q, i) => (
                      <li key={q.question}>
                        <div className="flex items-baseline justify-between gap-4 text-body-sm">
                          <span className="min-w-0 truncate text-[#101723] dark:text-[#D7DFE5]">
                            <span className="mr-2 tabular-nums text-[#87909D]">{i + 1}</span>
                            {q.question}
                          </span>
                          <span className="shrink-0 tabular-nums font-medium text-[#566273] dark:text-[#9BAABD]">{q.count}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E7EDF6] dark:bg-[#243040]">
                          <div
                            className="h-full rounded-full bg-[#101723] dark:bg-[#D7DFE5]"
                            style={{ width: `${(q.count / topQuestions[0].count) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <EmptyState
                    compact
                    icon={MessageSquareText}
                    title="No FAQ answers yet"
                    description="When visitors' questions match your FAQs, the most common ones appear here."
                  />
                )}
              </div>

              <div className={surface}>
                <CardHeader title="Couldn't answer" description="Add these to your FAQs so your chatbot can answer next time" />
                {unansweredGroups.length > 0 ? (
                  <ul className="divide-y divide-[#E7EDF6] border-t border-[#E7EDF6] dark:divide-[#2B3646] dark:border-[#2B3646]">
                    {unansweredGroups.map((g) => {
                      const bot = botById.get(g.chatbotId);
                      return (
                        <li key={g.text} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/25 dark:text-amber-400">
                            <CircleHelp size={15} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">“{g.text}”</p>
                            <p className="mt-0.5 truncate text-caption text-[#647184] dark:text-[#87909D]">
                              {g.count > 1 ? `Asked ${g.count}× · ` : ""}
                              {bot?.title || "Unknown chatbot"} · {formatDistanceToNowStrict(g.latest, { addSuffix: true })}
                            </p>
                          </div>
                          {bot && (
                            <Link
                              to={`/configure/${bot.id}`}
                              title={`Add an answer in ${bot.title}`}
                              className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#D8DFE9] px-2.5 text-caption font-medium text-[#101723] transition-colors hover:bg-[#F3F7FC] dark:border-[#2B3646] dark:text-[#D7DFE5] dark:hover:bg-[#273444] ${focusRing}`}
                            >
                              <Plus size={13} />
                              <span className="hidden sm:inline">Add answer</span>
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState compact icon={Check} title="Nothing missed" description="Every question in this period got an answer." />
                )}
              </div>
            </div>

            <div className={surface}>
              <CardHeader
                title="Leads"
                description={`${visibleLeads.length.toLocaleString()} email${visibleLeads.length === 1 ? "" : "s"}, ${rangeLabel}`}
                action={
                  scoped.leads.length > 0 && (
                    <button type="button" onClick={exportLeads} className={secondaryButton}>
                      <Download size={15} />
                      <span className="hidden sm:inline">Export CSV</span>
                    </button>
                  )
                }
              />
              {scoped.leads.length > 0 ? (
                <>
                  <div className="px-5 pb-3 sm:px-6">
                    <SearchInput value={leadSearch} onChange={setLeadSearch} placeholder="Search emails" />
                  </div>
                  {visibleLeads.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="border-y border-[#E7EDF6] bg-[#F3F7FC]/70 dark:border-[#2B3646] dark:bg-[#141D2B]/60">
                          <tr>
                            {["Email", "Chatbot", "Captured"].map((h, i) => (
                              <th
                                key={h}
                                scope="col"
                                className={`px-5 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[#647184] sm:px-6 dark:text-[#87909D] ${
                                  i === 1 ? "hidden sm:table-cell" : ""
                                }`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7EDF6] dark:divide-[#2B3646]">
                          {(showAllLeads ? visibleLeads : visibleLeads.slice(0, LEADS_PREVIEW)).map((lead) => {
                            const bot = botById.get(lead.chatbotId);
                            return (
                              <tr key={lead.id} className="transition-colors hover:bg-[#F3F7FC] dark:hover:bg-[#1F2B3A]">
                                <td className="max-w-[12rem] truncate px-5 py-3 text-body-sm font-medium text-[#101723] sm:max-w-none sm:px-6 dark:text-[#D7DFE5]">
                                  {lead.email}
                                </td>
                                <td className="hidden px-6 py-3 sm:table-cell">
                                  <span className="flex items-center gap-2 text-body-sm text-[#566273] dark:text-[#9BAABD]">
                                    <BotAvatar color={bot?.primaryColor} size={20} />
                                    {bot?.title || "Unknown chatbot"}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-5 py-3 text-body-sm text-[#566273] sm:px-6 dark:text-[#9BAABD]">
                                  <span title={format(lead.timestamp, "MMM d, yyyy 'at' h:mm a")}>
                                    {formatDistanceToNowStrict(lead.timestamp, { addSuffix: true })}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="border-t border-[#E7EDF6] py-10 text-center text-body-sm text-[#647184] dark:border-[#2B3646] dark:text-[#87909D]">
                      No emails match “{leadSearch.trim()}”.
                    </p>
                  )}
                  {visibleLeads.length > LEADS_PREVIEW && (
                    <div className="border-t border-[#E7EDF6] px-5 py-3 text-center sm:px-6 dark:border-[#2B3646]">
                      <button
                        type="button"
                        onClick={() => setShowAllLeads((v) => !v)}
                        className={`rounded text-body-sm font-medium text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] ${focusRing}`}
                      >
                        {showAllLeads ? "Show fewer" : `Show all ${visibleLeads.length}`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  compact
                  icon={Inbox}
                  title="No leads in this period"
                  description="Turn on lead capture in a chatbot's settings to ask visitors for their email."
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChatbotFilter({
  chatbots,
  value,
  onChange,
}: {
  chatbots: ChatbotInfo[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = chatbots.find((c) => c.id === value);
  const options: ChatbotInfo[] = [{ id: "all", title: "All chatbots" }, ...chatbots];
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        className={`inline-flex h-9 w-48 items-center gap-2 rounded-lg border border-[#D8DFE9] bg-[#F9FCFF] px-2.5 text-left text-[13px] font-medium text-[#101723] transition-colors hover:border-[#B8C3D1] dark:border-[#2B3646] dark:bg-[#1A2533] dark:text-[#D7DFE5] ${focusRing}`}
      >
        {selected ? <BotAvatar color={selected.primaryColor} size={18} /> : <Bot size={15} className="shrink-0 text-[#647184]" />}
        <span className="min-w-0 flex-1 truncate">{selected?.title || "All chatbots"}</span>
        <ChevronsUpDown size={14} className="shrink-0 text-[#87909D]" />
      </ListboxButton>
      {/* Anchored and non-modal, like the other pickers, so the page doesn't lock or shift. */}
      <ListboxOptions
        anchor="bottom start"
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
            {bot.id === "all" ? <Bot size={16} className="shrink-0 text-[#647184]" /> : <BotAvatar color={bot.primaryColor} size={20} />}
            <span className="min-w-0 flex-1 truncate group-data-[selected]:font-medium">{bot.title}</span>
            <Check size={14} className="invisible shrink-0 group-data-[selected]:visible" />
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

const CHART_COLORS = {
  light: { faq: "#101723", ai: "#8B5CF6", missed: "#F59E0B", tick: "#647184", grid: "rgba(16,23,35,0.06)" },
  dark: { faq: "#D7DFE5", ai: "#A78BFA", missed: "#FBBF24", tick: "#9BAABD", grid: "rgba(215,223,229,0.08)" },
};

function ActivityChart({
  events,
  unanswered,
  days,
  allTime,
}: {
  events: AnalyticsEvent[];
  unanswered: UnansweredQuery[];
  days: number;
  allTime: boolean;
}) {
  const dark = useSiteDarkMode();
  const colors = dark ? CHART_COLORS.dark : CHART_COLORS.light;

  const series = useMemo(() => {
    const today = startOfDay(new Date());
    const dayList = Array.from({ length: days }, (_, i) => subDays(today, days - 1 - i));
    const index = new Map(dayList.map((d, i) => [d.getTime(), i]));
    const faq = new Array(days).fill(0);
    const ai = new Array(days).fill(0);
    const missed = new Array(days).fill(0);
    const slot = (date: Date) => index.get(startOfDay(date).getTime());
    events.forEach((e) => {
      const i = slot(e.timestamp);
      if (i === undefined) return;
      if (e.type === "ai_generated") ai[i]++;
      else faq[i]++;
    });
    unanswered.forEach((u) => {
      const i = slot(u.timestamp);
      if (i !== undefined) missed[i]++;
    });
    return { labels: dayList.map((d) => format(d, "MMM d")), faq, ai, missed };
  }, [events, unanswered, days]);

  const total = [...series.faq, ...series.ai, ...series.missed].reduce((a, b) => a + b, 0);
  const tickFont = { family: '"Inter", sans-serif', size: 12 };
  const legend = [
    { label: "FAQ answers", color: colors.faq },
    { label: "AI answers", color: colors.ai },
    { label: "Unanswered", color: colors.missed },
  ];

  return (
    <div className={`${surface} flex h-full flex-col`}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-2 sm:px-6">
        <div>
          <h3 className="text-body font-semibold tracking-tight text-[#101723] dark:text-[#D7DFE5]">Questions per day</h3>
          <p className="mt-0.5 text-body-sm text-[#566273] dark:text-[#9BAABD]">
            {allTime ? `Showing the last ${days} days` : `${total.toLocaleString()} questions in the last ${days} days`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-caption text-[#566273] dark:text-[#9BAABD]">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex-1 px-3 pb-4 sm:px-4">
        {total > 0 ? (
          <div className="h-[260px] w-full lg:h-[300px]">
            <Bar
              data={{
                labels: series.labels,
                datasets: [
                  { label: "FAQ answers", data: series.faq, backgroundColor: colors.faq, borderRadius: 2, maxBarThickness: 18 },
                  { label: "AI answers", data: series.ai, backgroundColor: colors.ai, borderRadius: 2, maxBarThickness: 18 },
                  { label: "Unanswered", data: series.missed, backgroundColor: colors.missed, borderRadius: 2, maxBarThickness: 18 },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#141D2B",
                    titleColor: "#F3F7FC",
                    bodyColor: "#D7DFE5",
                    padding: 10,
                    cornerRadius: 8,
                    boxPadding: 4,
                    usePointStyle: true,
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                    grid: { display: false },
                    border: { display: false },
                    ticks: { color: colors.tick, font: tickFont, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
                  },
                  y: {
                    stacked: true,
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: colors.grid },
                    ticks: { color: colors.tick, font: tickFont, precision: 0 },
                  },
                },
              }}
            />
          </div>
        ) : (
          <div className="flex h-[260px] flex-col items-center justify-center text-center lg:h-[300px]">
            <BarChart3 size={28} className="text-[#87909D]" strokeWidth={1.5} />
            <p className="mt-3 text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">No questions in this period</p>
            <p className="mt-1 max-w-xs text-caption text-[#647184] dark:text-[#87909D]">
              Activity appears here once visitors start chatting with your chatbots.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const BAR_HEIGHTS = [40, 65, 30, 55, 80, 45, 70, 35, 60, 85, 50, 75, 40, 65];

function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3F7FC] dark:bg-[#141D2B]" aria-busy="true" aria-label="Loading analytics">
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-48 rounded-lg" />
            <Skeleton className="h-9 w-64 rounded-lg" />
          </div>
        </div>
        <StatTilesSkeleton />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <SkeletonCard className="p-5 xl:col-span-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-52" />
            <div className="mt-6 flex h-[260px] items-end gap-2 lg:h-[300px]">
              {BAR_HEIGHTS.map((h, i) => (
                <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard className="p-5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-6 h-2.5 w-full rounded-full" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </SkeletonCard>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[0, 1].map((i) => (
            <SkeletonCard key={i} className="p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-60 max-w-full" />
              <div className="mt-5 space-y-4">
                {[0, 1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </div>
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  );
}
