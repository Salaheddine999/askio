import BrandLogo from "./BrandLogo";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  Settings,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart2,
  Blocks,
  Beaker,
  Plus,
  LogOut,
  ChevronsUpDown,
  Menu as MenuIcon,
  X,
  LucideIcon,
  ShieldCheck,
  MessagesSquare,
  LifeBuoy,
} from "./icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { PRESENCE_HEARTBEAT_MS, PUSH_AVAILABLE_MS, playChime, readOnlineChoice, saveOnlineChoice, writePresence } from "../utils/liveChat";
import { pushTokenOnThisDevice } from "../utils/push";
import { db } from "../utils/db";
import BotAvatar from "./BotAvatar";
import { DUMMY_CHATBOTS } from "../utils/dummyData";
import { usePlanAccess } from "../hooks/usePlanAccess";
import { AI_USAGE_WARNING_RATIO, PRO_AI_REPLY_LIMIT } from "../utils/pricing";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { dirFor, useLanguage, useT } from "../i18n";
import { navMessages } from "../i18n/messages/nav";
import { fetchAiUsage, fetchSidebarCounts, SEEN_EVENT, type AiUsage, type SidebarCounts } from "../utils/sidebarCounts";
import { FreeIcon, ProIcon } from "./icons";
import NotificationsPopover from "./NotificationsPopover";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  testMode: boolean;
  toggleTestMode: () => void;
}

type NavKey = "dashboard" | "analytics" | "conversations" | "integrations" | "helpCenter" | "settings" | "admin";
type NavItem = { title: NavKey; href: string; icon: LucideIcon; count?: "conversations" };

// Titles are keys into navMessages. `count` shows how many new items wait there.
const WORKSPACE: NavItem[] = [
  { title: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "analytics", href: "/analytics", icon: BarChart2 },
  { title: "conversations", href: "/conversations", icon: MessagesSquare, count: "conversations" },
  { title: "integrations", href: "/integrations", icon: Blocks },
];

// Pinned above the account card.
const FOOTER_LINKS: NavItem[] = [
  { title: "helpCenter", href: "/documentation", icon: LifeBuoy },
  { title: "settings", href: "/settings", icon: Settings },
];

const NO_COUNTS: SidebarCounts = { notifications: 0, conversations: 0 };

// The owner's chatbots, most recently edited first; the rest are on the dashboard.
const MAX_SIDEBAR_BOTS = 5;
type SidebarBot = { id: string; title: string; isActive: boolean; primaryColor?: string; launcherStyle?: string; updated: number };

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/25 dark:focus-visible:ring-ink-130/40";

const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2)).toUpperCase();
}

const Avatar: React.FC<{ size?: string }> = ({ size = "h-8 w-8" }) => {
  const user = auth.currentUser;
  return user?.photoURL ? (
    <img
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
      className={`${size} shrink-0 rounded-full object-cover ring-1 ring-black/5`}
    />
  ) : (
    <span
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-ink-900 text-caption font-semibold text-white dark:bg-ink-130 dark:text-ink-875`}
    >
      {initials(user?.displayName, user?.email)}
    </span>
  );
};

const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  toggleDarkMode,
  sidebarOpen,
  toggleSidebar,
  closeSidebar,
  testMode,
  toggleTestMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // On desktop the closed state is the icon rail; on mobile it is off-screen.
  const collapsed = !sidebarOpen;

  // The mobile drawer closes once you pick a page.
  useEffect(() => {
    if (!isDesktop()) closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const user = auth.currentUser;
  const isAdmin = useIsAdmin();
  const t = useT(navMessages);
  // Pop-ups open away from the sidebar: to its right, or its left when the
  // app reads right to left and the sidebar sits on the right.
  const outward = dirFor(useLanguage().lang) === "rtl" ? "left" : "right";
  // The Admin link is only shown to admins; /admin itself checks on the server.
  const footerLinks: NavItem[] = isAdmin ? [...FOOTER_LINKS, { title: "admin", href: "/admin", icon: ShieldCheck }] : FOOTER_LINKS;
  const hideWhenCollapsed = collapsed ? "lg:hidden" : "";

  // New leads, questions and conversations since the owner last looked.
  // Refreshed on every page change, when the tab regains focus, and right
  // after the owner opens the place they're counted.
  const [counts, setCounts] = useState<SidebarCounts>(NO_COUNTS);
  const uid = user?.uid;
  useEffect(() => {
    if (!uid || testMode) {
      setCounts(NO_COUNTS);
      return;
    }
    let cancelled = false;
    const refresh = () =>
      fetchSidebarCounts(uid).then((next) => {
        if (!cancelled) setCounts(next);
      });
    refresh();
    window.addEventListener(SEEN_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(SEEN_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [uid, testMode, location.pathname]);

  const rowClass = (isActive: boolean) =>
    `relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-body-sm font-medium transition-colors ${focusRing} ${
      collapsed ? "lg:justify-center lg:px-0" : ""
    } ${
      isActive
        ? "bg-ink-25 text-ink-900 ring-1 ring-ink-120 dark:bg-ink-805 dark:text-ink-30 dark:ring-ink-780"
        : "text-ink-605 hover:bg-ink-95 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-825 dark:hover:text-ink-130"
    }`;

  // Live list of the owner's chatbots, so a rename or a new bot shows at once.
  const [bots, setBots] = useState<SidebarBot[]>([]);
  useEffect(() => {
    if (testMode) {
      setBots(
        DUMMY_CHATBOTS.map((b) => ({
          id: b.id,
          title: b.title,
          isActive: b.isActive ?? true,
          primaryColor: b.primaryColor,
          launcherStyle: b.launcherStyle,
          updated: 0,
        }))
      );
      return;
    }
    if (!uid) {
      setBots([]);
      return;
    }
    return onSnapshot(
      query(collection(db, "chatbot_configs"), where("user_id", "==", uid)),
      (snap) =>
        setBots(
          snap.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                title: data.title || "Chatbot",
                isActive: data.isActive ?? true,
                primaryColor: data.primaryColor,
                launcherStyle: data.launcherStyle,
                updated: data.lastUpdated?.toMillis?.() ?? data.createdAt?.toMillis?.() ?? 0,
              };
            })
            .sort((a, b) => b.updated - a.updated)
        ),
      () => setBots([])
    );
  }, [uid, testMode]);

  // Plan card: an upgrade prompt on Free, this month's AI replies on Pro.
  const { plan, canUseAi, loading: planLoading } = usePlanAccess();

  // Live chat (Pro): while the switch is on, the dashboard keeps your
  // "online" status fresh, and tells you when a visitor asks for a person.
  const [liveOnline, setLiveOnline] = useState(readOnlineChoice);
  const liveOn = liveOnline && canUseAi && !!uid && !testMode;
  useEffect(() => {
    if (!liveOn || !uid) return;
    // A device with push notifications rings when someone asks, so you stay
    // reachable for a few hours after closing the tab.
    const pushHere = !!pushTokenOnThisDevice();
    const beat = () => void writePresence(uid, true, pushHere ? PUSH_AVAILABLE_MS : 0).catch(() => undefined);
    beat();
    const timer = window.setInterval(beat, PRESENCE_HEARTBEAT_MS);
    const leave = () => {
      if (!pushHere) void writePresence(uid, false).catch(() => undefined);
    };
    window.addEventListener("pagehide", leave);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", leave);
      leave();
    };
  }, [liveOn, uid]);

  const [waiting, setWaiting] = useState(0);
  const seenWaiting = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!liveOn || !uid) {
      setWaiting(0);
      seenWaiting.current = null;
      return;
    }
    return onSnapshot(
      query(collection(db, "conversations"), where("ownerId", "==", uid), where("liveStatus", "==", "waiting")),
      (snap) => {
        setWaiting(snap.size);
        const ids = new Set(snap.docs.map((d) => d.id));
        // The first snapshot is who's already waiting; alert only for new ones.
        const fresh = seenWaiting.current ? snap.docs.filter((d) => !seenWaiting.current!.has(d.id)) : [];
        seenWaiting.current = ids;
        if (fresh.length === 0) return;
        playChime();
        // Shown in the dashboard too, in case browser notifications are blocked.
        const first = fresh[0];
        toast(
          (item) => (
            <span className="flex items-center gap-3 text-body-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              <span className="min-w-0">
                <span className="block font-medium">{t("liveNotifyTitle")}</span>
                {first.data().preview && <span className="block truncate text-caption opacity-70">{first.data().preview}</span>}
              </span>
              <button
                className="shrink-0 rounded-md bg-ink-900 px-2.5 py-1 text-caption font-medium text-white dark:bg-ink-130 dark:text-ink-875"
                onClick={() => {
                  toast.dismiss(item.id);
                  navigate(`/conversations?open=${first.id}`);
                }}
              >
                {t("liveReply")}
              </button>
            </span>
          ),
          { id: `live-${first.id}`, duration: 15_000 }
        );
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          const preview = fresh[0].data().preview;
          const note = new Notification(t("liveNotifyTitle"), { body: preview || t("liveNotifyBody"), tag: fresh[0].id });
          note.onclick = () => {
            window.focus();
            navigate(`/conversations?open=${fresh[0].id}`);
            note.close();
          };
        }
      },
      () => setWaiting(0)
    );
  }, [liveOn, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLive = () => {
    const next = !liveOnline;
    setLiveOnline(next);
    saveOnlineChoice(next);
    // Going offline on purpose ends the push window too.
    if (!next && uid) void writePresence(uid, false).catch(() => undefined);
    if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  };
  const [usage, setUsage] = useState<AiUsage | null>(null);
  useEffect(() => {
    if (!uid || !canUseAi) {
      setUsage(null);
      return;
    }
    let cancelled = false;
    fetchAiUsage(uid, PRO_AI_REPLY_LIMIT)
      .then((next) => !cancelled && setUsage(next))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [uid, canUseAi, location.pathname]);

  const renderPlanCard = () => {
    if (planLoading) return null;
    const card = `rounded-xl bg-ink-25 p-3 ring-1 ring-ink-120 dark:bg-ink-825 dark:ring-ink-780 ${collapsed ? "lg:hidden" : ""}`;
    const button = `mt-2.5 flex h-8 items-center justify-center rounded-lg bg-ink-900 text-caption font-medium text-white transition-colors hover:bg-ink-805 dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70 ${focusRing}`;
    if (!canUseAi) {
      // Free, or a Pro whose payment failed.
      const lapsed = plan !== "free";
      return (
        <div className={card}>
          <p className="flex items-center gap-1.5 text-body-sm font-medium text-fg">
            {lapsed ? <ProIcon size={15} className="shrink-0" /> : <FreeIcon size={15} className="shrink-0" />}
            {t(lapsed ? "proPlan" : "freePlan")}
          </p>
          <p className="mt-1 text-caption text-fg-subtle">{t(lapsed ? "paymentIssue" : "freePlanBody")}</p>
          <Link to={lapsed ? "/settings" : "/plans"} className={button}>
            {t(lapsed ? "updateBilling" : "upgrade")}
          </Link>
        </div>
      );
    }
    if (!usage) return null;
    const { used, limit } = usage;
    const ratio = limit ? Math.min(used / limit, 1) : 0;
    const bar =
      limit !== null && used >= limit
        ? "bg-[#C2410C]"
        : ratio >= AI_USAGE_WARNING_RATIO
          ? "bg-[#D7A43B]"
          : "bg-ink-900 dark:bg-ink-130";
    return (
      <Link to="/settings" className={`block transition-colors hover:ring-ink-235 dark:hover:ring-ink-710 ${card} ${focusRing}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1.5 text-body-sm font-medium text-fg">
            <ProIcon size={15} className="shrink-0" />
            {t("proPlan")}
          </p>
          <span className="shrink-0 text-caption font-medium tabular-nums text-fg">
            {limit === null
              ? t("repliesUsedUnlimited", { used: used.toLocaleString(t.lang) })
              : t("repliesUsed", { used: used.toLocaleString(t.lang), limit: limit.toLocaleString(t.lang) })}
          </span>
        </div>
        {limit !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-95 dark:bg-ink-780">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(ratio * 100, used > 0 ? 2 : 0)}%` }} />
          </div>
        )}
        <p className="mt-1.5 text-caption text-fg-subtle">{t("aiReplies")}</p>
      </Link>
    );
  };

  const renderLink = ({ title, href, icon: Icon, count }: NavItem) => {
    const live = count === "conversations" && waiting > 0;
    const n = live ? waiting : count ? counts[count] : 0;
    return (
      <li key={href}>
        <NavLink
          to={href}
          title={collapsed ? t(title) : undefined}
          className={({ isActive }) => rowClass(isActive)}
        >
          {({ isActive }) => (
            <>
              <span className="relative shrink-0">
                <Icon size={18} strokeWidth={isActive ? 2.1 : 1.8} className={isActive ? "" : "opacity-80"} />
                {n > 0 && collapsed && (
                  <span
                    className={`absolute -end-1 -top-1 hidden h-2 w-2 rounded-full ring-2 ring-ink-55 lg:block dark:ring-ink-865 ${
                      live ? "bg-emerald-500" : "bg-ink-900 dark:bg-ink-130"
                    }`}
                  />
                )}
              </span>
              <span className={`flex-1 truncate ${hideWhenCollapsed}`}>{t(title)}</span>
              {n > 0 && (
                <span
                  className={`inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-caption font-semibold leading-none tabular-nums ${hideWhenCollapsed} ${
                    live
                      ? "bg-emerald-500 text-white"
                      : "bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875"
                  }`}
                >
                  <span aria-hidden>{n > 99 ? "99+" : n}</span>
                  <span className="sr-only">{live ? t.plural("waitingCount", n) : t.plural("newCount", n)}</span>
                </span>
              )}
            </>
          )}
        </NavLink>
      </li>
    );
  };

  const menuItem = (active: boolean) =>
    `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-body-sm ${
      active
        ? "bg-ink-55 text-ink-900 dark:bg-ink-790 dark:text-ink-130"
        : "text-fg-muted"
    }`;

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-ink-120/80 bg-ink-30 px-3 lg:hidden dark:border-ink-780 dark:bg-ink-875">
        <button
          onClick={toggleSidebar}
          aria-label={t("openNavigation")}
          className={`rounded-lg p-2 text-ink-605 hover:bg-ink-70 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-790 dark:hover:text-ink-130 ${focusRing}`}
        >
          <MenuIcon size={20} />
        </button>
        <Link to="/dashboard" className={`flex items-center rounded-lg ${focusRing}`}>
          <BrandLogo size={18} className="text-fg" />
        </Link>
        {testMode && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-caption font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Test mode
          </span>
        )}
        <NotificationsPopover
          unread={counts.notifications}
          testMode={testMode}
          anchor="bottom end"
          label={t("notifications")}
          className="ms-auto"
        />
        <Link
          to="/configure"
          aria-label={t("newChatbot")}
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-white dark:bg-ink-130 dark:text-ink-875 ${focusRing}`}
        >
          <Plus size={18} />
        </Link>
      </header>

      {/* Mobile backdrop */}
      <Transition
        show={sidebarOpen}
        as={Fragment}
        enter="transition-opacity duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden" onClick={closeSidebar} />
      </Transition>

      <nav
        aria-label={t("mainNavigation")}
        className={`fixed start-0 top-0 z-50 flex h-[100dvh] flex-col border-e border-ink-120 bg-ink-55 transition-[width,transform] duration-300 ease-in-out dark:border-ink-780 dark:bg-ink-865 ${
          sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full rtl:translate-x-full lg:w-[72px] lg:translate-x-0 rtl:lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className={`flex h-16 shrink-0 items-center px-4 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link to="/dashboard" className={`flex items-center rounded-lg ${focusRing}`} title="Askio">
            <BrandLogo size={20} className="text-fg" wordClassName={hideWhenCollapsed} />
          </Link>
          <button
            onClick={toggleSidebar}
            aria-label={t("collapseSidebar")}
            title={t("collapseSidebar")}
            className={`ms-auto hidden rounded-lg p-1.5 text-ink-545 hover:bg-ink-95 hover:text-ink-900 lg:block dark:text-ink-425 dark:hover:bg-ink-790 dark:hover:text-ink-130 ${focusRing} ${hideWhenCollapsed}`}
          >
            <PanelLeftClose size={17} />
          </button>
          <button
            onClick={closeSidebar}
            aria-label={t("closeNavigation")}
            className={`ms-auto rounded-lg p-1.5 text-ink-605 lg:hidden dark:text-ink-325 ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary action */}
        <div className={`px-3 pb-2 ${collapsed ? "lg:px-3.5" : ""}`}>
          <Link
            to="/configure"
            title={collapsed ? t("newChatbot") : undefined}
            className={`flex h-9 items-center justify-center gap-2 rounded-lg bg-ink-900 text-button text-white shadow-sm transition-colors hover:bg-ink-805 dark:bg-ink-130 dark:text-ink-875 dark:hover:bg-ink-70 ${focusRing}`}
          >
            <Plus size={16} className="shrink-0" />
            <span className={hideWhenCollapsed}>{t("newChatbot")}</span>
          </Link>
          {collapsed && (
            <button
              onClick={toggleSidebar}
              aria-label={t("expandSidebar")}
              title={t("expandSidebar")}
              className={`mt-2 hidden h-9 w-full items-center justify-center rounded-lg text-ink-545 hover:bg-ink-95 hover:text-ink-900 lg:flex dark:text-ink-425 dark:hover:bg-ink-790 dark:hover:text-ink-130 ${focusRing}`}
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
        </div>

        {/* Navigation, then plan and links. On short screens (laptops) it all
            scrolls together instead of squeezing the chatbot list; the account
            card below stays in view. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pt-3 [scrollbar-color:transparent_transparent] [scrollbar-width:thin] hover:[scrollbar-color:#C9D2DE_transparent] focus-within:[scrollbar-color:#C9D2DE_transparent] dark:hover:[scrollbar-color:#3A4658_transparent] dark:focus-within:[scrollbar-color:#3A4658_transparent]">
          <h2 className={`mb-1.5 px-2.5 text-caption font-medium text-ink-425 dark:text-ink-545 ${hideWhenCollapsed}`}>
            {t("workspace")}
          </h2>
          <ul className="space-y-0.5">{WORKSPACE.map(renderLink)}</ul>

          {bots.length > 0 && (
            <div className="mt-5">
              <h2 className={`mb-1.5 px-2.5 text-caption font-medium text-ink-425 dark:text-ink-545 ${hideWhenCollapsed}`}>
                {t("chatbots")}
              </h2>
              {collapsed && <div className="mx-auto mb-2 hidden h-px w-6 bg-ink-120 lg:block dark:bg-ink-780" />}
              <ul className="space-y-0.5">
                {bots.slice(0, MAX_SIDEBAR_BOTS).map((bot) => (
                  <li key={bot.id}>
                    <NavLink
                      to={`/configure/${bot.id}`}
                      title={collapsed ? bot.title : undefined}
                      className={({ isActive }) => rowClass(isActive)}
                    >
                      <BotAvatar color={bot.primaryColor} launcherStyle={bot.launcherStyle} size={20} muted={!bot.isActive} />
                      <span className={`flex-1 truncate ${hideWhenCollapsed}`}>{bot.title}</span>
                      {!bot.isActive && (
                        <span className={`shrink-0 text-caption font-normal text-ink-425 ${hideWhenCollapsed}`}>{t("paused")}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {bots.length > MAX_SIDEBAR_BOTS && (
                <Link
                  to="/dashboard"
                  className={`mt-1 flex h-8 items-center rounded-lg px-2.5 text-caption font-medium text-ink-545 transition-colors hover:text-ink-900 dark:text-ink-425 dark:hover:text-ink-130 ${focusRing} ${hideWhenCollapsed}`}
                >
                  {t("viewAll", { count: bots.length })}
                </Link>
              )}
            </div>
          )}
          {/* At the bottom when there's room, scrolling with the list when there isn't. */}
          <div className="mt-auto space-y-2 pb-4 pt-4">
          {canUseAi && !testMode && (
            <button
              type="button"
              role="switch"
              aria-checked={liveOnline}
              onClick={toggleLive}
              title={collapsed ? t(liveOnline ? "liveOnline" : "liveOffline") : t("liveHint")}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-body-sm text-ink-605 transition-colors hover:bg-ink-95 hover:text-ink-900 dark:text-ink-325 dark:hover:bg-ink-825 dark:hover:text-ink-130 ${focusRing} ${
                collapsed ? "lg:justify-center lg:px-0" : ""
              }`}
            >
              <span
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${liveOnline ? "bg-emerald-500 ring-4 ring-emerald-500/15" : "bg-ink-235 dark:bg-ink-640"}`}
              />
              <span className={`flex-1 truncate text-start font-medium ${hideWhenCollapsed}`}>
                {t(liveOnline ? "liveOnline" : "liveOffline")}
              </span>
              <span
                aria-hidden
                className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${hideWhenCollapsed} ${
                  liveOnline ? "bg-emerald-500" : "bg-ink-130 dark:bg-ink-710"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left] ${liveOnline ? "start-[14px]" : "start-0.5"}`}
                />
              </span>
            </button>
          )}
          {renderPlanCard()}
          <ul className="space-y-0.5">{footerLinks.map(renderLink)}</ul>
          {testMode && (
            <button
              onClick={toggleTestMode}
              title={t("testModeOnTitle")}
              className={`flex h-8 w-full items-center gap-2 rounded-lg bg-amber-100 px-2.5 text-caption font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-200 ${
                collapsed ? "lg:justify-center lg:px-0" : ""
              }`}
            >
              <Beaker size={14} className="shrink-0" />
              <span className={`flex-1 text-start ${hideWhenCollapsed}`}>{t("testModeOn")}</span>
              <span className={`opacity-70 ${hideWhenCollapsed}`}>{t("turnOff")}</span>
            </button>
          )}

          </div>
          {/* A soft fade where the list scrolls under the account card. */}
          <div aria-hidden className="pointer-events-none sticky bottom-0 -mt-4 h-4 shrink-0 bg-gradient-to-t from-ink-55 dark:from-ink-865" />
        </div>

        {/* The account card, with the notifications bell beside it (above it on the rail). */}
        <div className="shrink-0 px-3 pb-3 pt-1">
          <div className={`flex items-center gap-1 ${collapsed ? "lg:flex-col-reverse lg:gap-2" : ""}`}>
          <Menu as="div" className="relative min-w-0 flex-1 lg:w-full">
            <Menu.Button
              className={`flex w-full items-center gap-2.5 rounded-xl bg-ink-25 p-2 text-start ring-1 ring-ink-120 transition-colors hover:ring-ink-235 dark:bg-ink-825 dark:ring-ink-780 dark:hover:ring-ink-710 ${focusRing} ${
                collapsed ? "lg:justify-center lg:bg-transparent lg:p-1.5 lg:ring-0 dark:lg:bg-transparent" : ""
              }`}
              title={collapsed ? user?.displayName || t("account") : undefined}
            >
              <Avatar />
              <span className={`min-w-0 flex-1 ${hideWhenCollapsed}`}>
                <span className="block truncate text-body-sm font-medium text-fg">
                  {user?.displayName || t("yourAccount")}
                </span>
                <span className="block truncate text-caption text-fg-subtle">
                  {user?.email}
                </span>
              </span>
              <ChevronsUpDown size={15} className={`shrink-0 text-ink-425 ${hideWhenCollapsed}`} />
            </Menu.Button>
                          <Menu.Items
                anchor={collapsed && isDesktop() ? `${outward} end` : "top start"}
                modal={false}
                transition
                className={`z-[60] rounded-xl border border-ink-120 bg-ink-25 p-1.5 shadow-lg transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 [--anchor-gap:8px] focus:outline-none dark:border-ink-780 dark:bg-ink-850 ${
                  collapsed ? "w-60" : "w-[var(--button-width)]"
                }`}
              >
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <Avatar size="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium text-fg">
                      {user?.displayName || t("yourAccount")}
                    </p>
                    <p className="truncate text-caption text-fg-subtle">{user?.email}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-ink-70 dark:bg-ink-780" />
                <Menu.Item>
                  {({ active }) => (
                    <Link to="/settings" className={menuItem(active)}>
                      <Settings size={15} />
                      {t("settings")}
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={toggleDarkMode} className={menuItem(active)}>
                      {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                      {darkMode ? t("lightMode") : t("darkMode")}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={toggleTestMode} className={menuItem(active)}>
                      <Beaker size={15} />
                      <span className="flex-1 text-start">{t("testMode")}</span>
                      <span
                        className={`relative h-4 w-7 rounded-full transition-colors ${
                          testMode ? "bg-amber-500" : "bg-ink-130 dark:bg-ink-710"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left] ${
                            testMode ? "start-[14px]" : "start-0.5"
                          }`}
                        />
                      </span>
                    </button>
                  )}
                </Menu.Item>
                <div className="my-1 h-px bg-ink-70 dark:bg-ink-780" />
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={handleSignOut} className={menuItem(active)}>
                      <LogOut size={15} />
                      {t("signOut")}
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
          </Menu>
          <NotificationsPopover
            unread={counts.notifications}
            testMode={testMode}
            anchor={`${outward} end`}
            label={t("notifications")}
            className="hidden shrink-0 lg:block"
          />
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
