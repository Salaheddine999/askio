import brandLogo from "../assets/logo.svg";
import React, { Fragment, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  FileText,
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
} from "lucide-react";
import { useIsAdmin } from "../hooks/useIsAdmin";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  testMode: boolean;
  toggleTestMode: () => void;
}

const NAV_GROUPS: { title: string; items: { title: string; href: string; icon: LucideIcon }[] }[] = [
  {
    title: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Analytics", href: "/analytics", icon: BarChart2 },
      { title: "Integrations", href: "/integrations", icon: Blocks },
    ],
  },
  {
    title: "Resources",
    items: [{ title: "Documentation", href: "/documentation", icon: FileText }],
  },
  {
    title: "Account",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
];

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
  // The Admin link is only shown to admins; /admin itself checks on the server.
  const navGroups = isAdmin
    ? NAV_GROUPS.map((g) =>
        g.title === "Account" ? { ...g, items: [...g.items, { title: "Admin", href: "/admin", icon: ShieldCheck }] } : g
      )
    : NAV_GROUPS;
  const hideWhenCollapsed = collapsed ? "lg:hidden" : "";

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
          aria-label="Open navigation"
          className={`rounded-lg p-2 text-[#566273] hover:bg-[#E7EDF6] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
        >
          <MenuIcon size={20} />
        </button>
        <Link to="/dashboard" className="flex items-center gap-1.5">
          <img src={brandLogo} alt="" className="h-6 w-6 dark:brightness-0 dark:invert" />
          <span className="text-body font-semibold tracking-tight text-[#101723] dark:text-[#D7DFE5]">Askio</span>
        </Link>
        {testMode && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            Test mode
          </span>
        )}
        <Link
          to="/configure"
          aria-label="New chatbot"
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
        aria-label="Main"
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-[#D8DFE9] bg-[#EDF2F8] transition-[width,transform] duration-300 ease-in-out dark:border-[#2B3646] dark:bg-[#17212F] ${
          sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-[72px] lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className={`flex h-16 shrink-0 items-center px-4 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link to="/dashboard" className={`flex items-center gap-2 rounded-lg ${focusRing}`} title="Askio">
            <img src={brandLogo} alt="Askio" className="h-7 w-7 shrink-0 dark:brightness-0 dark:invert" />
            <span
              className={`text-body-lg font-semibold tracking-tight text-[#101723] dark:text-[#D7DFE5] ${hideWhenCollapsed}`}
            >
              Askio
            </span>
          </Link>
          <button
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className={`ml-auto hidden rounded-lg p-1.5 text-[#647184] hover:bg-[#E0E7F0] hover:text-[#101723] lg:block dark:text-[#87909D] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing} ${hideWhenCollapsed}`}
          >
            <PanelLeftClose size={17} />
          </button>
          <button
            onClick={closeSidebar}
            aria-label="Close navigation"
            className={`ml-auto rounded-lg p-1.5 text-[#566273] lg:hidden dark:text-[#9BAABD] ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary action */}
        <div className={`px-3 pb-2 ${collapsed ? "lg:px-3.5" : ""}`}>
          <Link
            to="/configure"
            title={collapsed ? "New chatbot" : undefined}
            className={`flex h-9 items-center justify-center gap-2 rounded-lg bg-[#101723] text-button text-white shadow-sm transition-colors hover:bg-[#243040] dark:bg-[#D7DFE5] dark:text-[#141D2B] dark:hover:bg-[#E7EDF6] ${focusRing}`}
          >
            <Plus size={16} className="shrink-0" />
            <span className={hideWhenCollapsed}>New chatbot</span>
          </Link>
          {collapsed && (
            <button
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className={`mt-2 hidden h-9 w-full items-center justify-center rounded-lg text-[#647184] hover:bg-[#E0E7F0] hover:text-[#101723] lg:flex dark:text-[#87909D] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] ${focusRing}`}
            >
              <PanelLeftOpen size={17} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h2
                className={`mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-[#87909D] dark:text-[#647184] ${hideWhenCollapsed}`}
              >
                {group.title}
              </h2>
              {collapsed && <div className="mx-auto mb-2 hidden h-px w-6 bg-[#D8DFE9] lg:block dark:bg-[#2B3646]" />}
              <ul className="space-y-0.5">
                {group.items.map(({ title, href, icon: Icon }) => (
                  <li key={href}>
                    <NavLink
                      to={href}
                      title={collapsed ? title : undefined}
                      className={({ isActive }) =>
                        `relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-body-sm font-medium transition-colors ${focusRing} ${
                          collapsed ? "lg:justify-center lg:px-0" : ""
                        } ${
                          isActive
                            ? "bg-[#F9FCFF] text-[#101723] shadow-[0_1px_2px_rgba(16,23,35,0.06)] ring-1 ring-[#D8DFE9] dark:bg-[#243040] dark:text-[#F3F7FC] dark:ring-[#2B3646]"
                            : "text-[#566273] hover:bg-[#E0E7F0] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#1F2B3A] dark:hover:text-[#D7DFE5]"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={17}
                            strokeWidth={isActive ? 2.1 : 1.8}
                            className={`shrink-0 ${isActive ? "" : "opacity-80"}`}
                          />
                          <span className={hideWhenCollapsed}>{title}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-[#D8DFE9] p-3 dark:border-[#2B3646]">
          {testMode && (
            <button
              onClick={toggleTestMode}
              title="Test mode is on: the dashboard shows sample data. Click to turn off."
              className={`flex h-8 w-full items-center gap-2 rounded-lg bg-amber-100 px-2.5 text-caption font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-200 ${
                collapsed ? "lg:justify-center lg:px-0" : ""
              }`}
            >
              <Beaker size={14} className="shrink-0" />
              <span className={`flex-1 text-left ${hideWhenCollapsed}`}>Test mode on</span>
              <span className={`opacity-70 ${hideWhenCollapsed}`}>Turn off</span>
            </button>
          )}

          <Menu as="div" className="relative">
            <Menu.Button
              className={`flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-[#E0E7F0] dark:hover:bg-[#1F2B3A] ${focusRing} ${
                collapsed ? "lg:justify-center" : ""
              }`}
              title={collapsed ? user?.displayName || "Account" : undefined}
            >
              <Avatar />
              <span className={`min-w-0 flex-1 ${hideWhenCollapsed}`}>
                <span className="block truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                  {user?.displayName || "Your account"}
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
                      {user?.displayName || "Your account"}
                    </p>
                    <p className="truncate text-caption text-[#647184] dark:text-[#87909D]">{user?.email}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-[#E7EDF6] dark:bg-[#2B3646]" />
                <Menu.Item>
                  {({ active }) => (
                    <Link to="/settings" className={menuItem(active)}>
                      <Settings size={15} />
                      Settings
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={toggleDarkMode} className={menuItem(active)}>
                      {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                      {darkMode ? "Light mode" : "Dark mode"}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button onClick={toggleTestMode} className={menuItem(active)}>
                      <Beaker size={15} />
                      <span className="flex-1 text-left">Test mode</span>
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
                      Sign out
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
