import BrandLogo from "./BrandLogo";
import React, { Fragment, useEffect, useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../utils/db";
import BotAvatar from "./BotAvatar";
import { DUMMY_CHATBOTS } from "../utils/dummyData";
import { usePlanAccess } from "../hooks/usePlanAccess";
import { AI_USAGE_WARNING_RATIO, PRO_AI_REPLY_LIMIT } from "../utils/pricing";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { useT } from "../i18n";
import { navMessages } from "../i18n/messages/nav";
import { fetchAiUsage, fetchSidebarCounts, SEEN_EVENT, type AiUsage, type SidebarCounts } from "../utils/sidebarCounts";

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
type NavItem = { title: NavKey; href: string; icon: LucideIcon; count?: keyof SidebarCounts };

// Titles are keys into navMessages. `count` shows how many new items wait there.
const WORKSPACE: NavItem[] = [
  { title: "dashboard", href: "/dashboard", icon: LayoutDashboard, count: "dashboard" },
  { title: "analytics", href: "/analytics", icon: BarChart2 },
  { title: "conversations", href: "/conversations", icon: MessagesSquare, count: "conversations" },
  { title: "integrations", href: "/integrations", icon: Blocks },
];

// Pinned above the account card.
const FOOTER_LINKS: NavItem[] = [
  { title: "helpCenter", href: "/documentation", icon: LifeBuoy },
  { title: "settings", href: "/settings", icon: Settings },
];

const NO_COUNTS: SidebarCounts = { dashboard: 0, conversations: 0 };

// The owner's chatbots, most recently edited first; the rest are on the dashboard.
const MAX_SIDEBAR_BOTS = 5;
type SidebarBot = { id: string; title: string; isActive: boolean; primaryColor?: string; launcherStyle?: string; updated: number };

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#101723]/25 dark:focus-visible:ring-[#D7DFE5]/40";

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
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[#101723] text-[11px] font-semibold text-white dark:bg-[#D7DFE5] dark:text-[#141D2B]`}
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
        ? "bg-[#F9FCFF] text-[#101723] ring-1 ring-[#D8DFE9] dark:bg-[#243040] dark:text-[#F3F7FC] dark:ring-[#2B3646]"
        : "text-[#566273] hover:bg-[#E0E7F0] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#1F2B3A] dark:hover:text-[#D7DFE5]"
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
    const card = `rounded-xl bg-[#F9FCFF] p-3 ring-1 ring-[#D8DFE9] dark:bg-[#1F2B3A] dark:ring-[#2B3646] ${collapsed ? "lg:hidden" : ""}`;
    const button = `mt-2.5 flex h-8 items-center justify-center rounded-lg bg-[#101723] text-caption font-medium text-white transition-colors hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6] ${focusRing}`;
    if (!canUseAi) {
      // Free, or a Pro whose payment failed.
      const lapsed = plan !== "free";
      return (
        <div className={card}>
          <p className="flex items-center gap-1.5 text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
            <Sparkles size={14} className="shrink-0" />
            {t(lapsed ? "proPlan" : "freePlan")}
          </p>
          <p className="mt-1 text-caption text-[#647184] dark:text-[#87909D]">{t(lapsed ? "paymentIssue" : "freePlanBody")}</p>
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
          : "bg-[#101723] dark:bg-[#D7DFE5]";
    return (
      <Link to="/settings" className={`block transition-colors hover:ring-[#B8C2CF] dark:hover:ring-[#39485B] ${card} ${focusRing}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="flex items-center gap-1.5 text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
            <Sparkles size={14} className="shrink-0" />
            {t("proPlan")}
          </p>
          <span className="shrink-0 text-caption font-medium tabular-nums text-[#101723] dark:text-[#D7DFE5]">
            {limit === null
              ? t("repliesUsedUnlimited", { used: used.toLocaleString(t.lang) })
              : t("repliesUsed", { used: used.toLocaleString(t.lang), limit: limit.toLocaleString(t.lang) })}
          </span>
        </div>
        {limit !== null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E0E7F0] dark:bg-[#2B3646]">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(ratio * 100, used > 0 ? 2 : 0)}%` }} />
          </div>
        )}
        <p className="mt-1.5 text-caption text-[#647184] dark:text-[#87909D]">{t("aiReplies")}</p>
      </Link>
    );
  };

  const renderLink = ({ title, href, icon: Icon, count }: NavItem) => {
    const n = count ? counts[count] : 0;
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
                  <span className="absolute -right-1 -top-1 hidden h-2 w-2 rounded-full bg-[#101723] ring-2 ring-[#EDF2F8] lg:block dark:bg-[#D7DFE5] dark:ring-[#17212F]" />
                )}
              </span>
              <span className={`flex-1 truncate ${hideWhenCollapsed}`}>{t(title)}</span>
              {n > 0 && (
                <span
                  className={`min-w-[22px] rounded-full bg-[#101723] px-1.5 text-center text-[11px] font-semibold leading-5 text-white dark:bg-[#D7DFE5] dark:text-[#141D2B] ${hideWhenCollapsed}`}
                >
                  <span aria-hidden>{n > 99 ? "99+" : n}</span>
                  <span className="sr-only">{t.plural("newCount", n)}</span>
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
        ? "bg-[#F3F7FC] text-[#101723] dark:bg-[#273444] dark:text-[#D7DFE5]"
        : "text-[#566273] dark:text-[#9BAABD]"
    }`;

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b border-[#D8DFE9]/80 bg-[#F3F7FC]/85 px-3 backdrop-blur-md lg:hidden dark:border-[#2B3646] dark:bg-[#141D2B]/85">
        <button
          onClick={toggleSidebar}
          aria-label={t("openNavigation")}
          className={`rounded-lg p-2 text-[#566273] hover:bg-[#E7EDF6] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
        >
          <MenuIcon size={20} />
        </button>
        <Link to="/dashboard" className={`flex items-center rounded-lg ${focusRing}`}>
          <BrandLogo size={18} className="text-[#101723] dark:text-[#D7DFE5]" />
        </Link>
        {testMode && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Test mode
          </span>
        )}
        <Link
          to="/configure"
          aria-label={t("newChatbot")}
          className={`ml-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#101723] text-white dark:bg-[#D7DFE5] dark:text-[#141D2B] ${focusRing}`}
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
        <div className="fixed inset-0 z-40 bg-[#101723]/40 backdrop-blur-[2px] lg:hidden" onClick={closeSidebar} />
      </Transition>

      <nav
        aria-label={t("mainNavigation")}
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-[#D8DFE9] bg-[#EDF2F8] transition-[width,transform] duration-300 ease-in-out dark:border-[#2B3646] dark:bg-[#17212F] ${
          sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-[72px] lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className={`flex h-16 shrink-0 items-center px-4 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link to="/dashboard" className={`flex items-center rounded-lg ${focusRing}`} title="Askio">
            <BrandLogo size={20} className="text-[#101723] dark:text-[#D7DFE5]" wordClassName={hideWhenCollapsed} />
          </Link>
          <button
            onClick={toggleSidebar}
            aria-label={t("collapseSidebar")}
            title={t("collapseSidebar")}
            className={`ml-auto hidden rounded-lg p-1.5 text-[#647184] hover:bg-[#E0E7F0] hover:text-[#101723] lg:block dark:text-[#87909D] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing} ${hideWhenCollapsed}`}
          >
            <PanelLeftClose size={17} />
          </button>
          <button
            onClick={closeSidebar}
            aria-label={t("closeNavigation")}
            className={`ml-auto rounded-lg p-1.5 text-[#566273] lg:hidden dark:text-[#9BAABD] ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary action */}
        <div className={`px-3 pb-2 ${collapsed ? "lg:px-3.5" : ""}`}>
          <Link
            to="/configure"
            title={collapsed ? t("newChatbot") : undefined}
            className={`flex h-9 items-center justify-center gap-2 rounded-lg bg-[#101723] text-button text-white shadow-sm transition-colors hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6] ${focusRing}`}
          >
            <Plus size={16} className="shrink-0" />
            <span className={hideWhenCollapsed}>{t("newChatbot")}</span>
          </Link>
          {collapsed && (
            <button
              onClick={toggleSidebar}
              aria-label={t("expandSidebar")}
              title={t("expandSidebar")}
              className={`mt-2 hidden h-9 w-full items-center justify-center rounded-lg text-[#647184] hover:bg-[#E0E7F0] hover:text-[#101723] lg:flex dark:text-[#87909D] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <h2 className={`mb-1.5 px-2.5 text-caption font-medium text-[#87909D] dark:text-[#647184] ${hideWhenCollapsed}`}>
            {t("workspace")}
          </h2>
          <ul className="space-y-0.5">{WORKSPACE.map(renderLink)}</ul>

          {bots.length > 0 && (
            <div className="mt-5">
              <h2 className={`mb-1.5 px-2.5 text-caption font-medium text-[#87909D] dark:text-[#647184] ${hideWhenCollapsed}`}>
                {t("chatbots")}
              </h2>
              {collapsed && <div className="mx-auto mb-2 hidden h-px w-6 bg-[#D8DFE9] lg:block dark:bg-[#2B3646]" />}
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
                        <span className={`shrink-0 text-caption font-normal text-[#87909D] ${hideWhenCollapsed}`}>{t("paused")}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {bots.length > MAX_SIDEBAR_BOTS && (
                <Link
                  to="/dashboard"
                  className={`mt-1 flex h-8 items-center rounded-lg px-2.5 text-caption font-medium text-[#647184] transition-colors hover:text-[#101723] dark:text-[#87909D] dark:hover:text-[#D7DFE5] ${focusRing} ${hideWhenCollapsed}`}
                >
                  {t("viewAll", { count: bots.length })}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 space-y-2 p-3">
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
              <span className={`flex-1 text-left ${hideWhenCollapsed}`}>{t("testModeOn")}</span>
              <span className={`opacity-70 ${hideWhenCollapsed}`}>{t("turnOff")}</span>
            </button>
          )}

          <Menu as="div" className="relative">
            <Menu.Button
              className={`flex w-full items-center gap-2.5 rounded-xl bg-[#F9FCFF] p-2 text-left ring-1 ring-[#D8DFE9] transition-colors hover:ring-[#B8C2CF] dark:bg-[#1F2B3A] dark:ring-[#2B3646] dark:hover:ring-[#39485B] ${focusRing} ${
                collapsed ? "lg:justify-center lg:bg-transparent lg:p-1.5 lg:ring-0 dark:lg:bg-transparent" : ""
              }`}
              title={collapsed ? user?.displayName || t("account") : undefined}
            >
              <Avatar />
              <span className={`min-w-0 flex-1 ${hideWhenCollapsed}`}>
                <span className="block truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                  {user?.displayName || t("yourAccount")}
                </span>
                <span className="block truncate text-caption text-[#647184] dark:text-[#87909D]">
                  {user?.email}
                </span>
              </span>
              <ChevronsUpDown size={15} className={`shrink-0 text-[#87909D] ${hideWhenCollapsed}`} />
            </Menu.Button>
                          <Menu.Items
                anchor={collapsed && isDesktop() ? "right end" : "top start"}
                modal={false}
                transition
                className={`z-[60] rounded-xl border border-[#D8DFE9] bg-[#F9FCFF] p-1.5 shadow-xl transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 [--anchor-gap:8px] focus:outline-none dark:border-[#2B3646] dark:bg-[#1A2533] ${
                  collapsed ? "w-60" : "w-[var(--button-width)]"
                }`}
              >
                <div className="flex items-center gap-2.5 px-2.5 py-2">
                  <Avatar size="h-9 w-9" />
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                      {user?.displayName || t("yourAccount")}
                    </p>
                    <p className="truncate text-caption text-[#647184] dark:text-[#87909D]">{user?.email}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-[#E7EDF6] dark:bg-[#2B3646]" />
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
                      <span className="flex-1 text-left">{t("testMode")}</span>
                      <span
                        className={`relative h-4 w-7 rounded-full transition-colors ${
                          testMode ? "bg-amber-500" : "bg-[#D7DFE5] dark:bg-[#39485B]"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left] ${
                            testMode ? "left-[14px]" : "left-0.5"
                          }`}
                        />
                      </span>
                    </button>
                  )}
                </Menu.Item>
                <div className="my-1 h-px bg-[#E7EDF6] dark:bg-[#2B3646]" />
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
        </div>
      </nav>
    </>
  );
};

export default Navbar;
