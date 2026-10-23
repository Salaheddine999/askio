import brandLogo from "../assets/logo.svg";
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Sun,
  Moon,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart2,
  Blocks,
  Beaker,
} from "lucide-react";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  testMode: boolean;
  toggleTestMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  toggleDarkMode,
  sidebarOpen,
  toggleSidebar,
  testMode,
  toggleTestMode,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    {
      title: "Platform",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Analytics",
          href: "/analytics",
          icon: BarChart2,
        },
        {
          title: "Integrations",
          href: "/integrations",
          icon: Blocks,
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          title: "Documentation",
          href: "/documentation",
          icon: FileText,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <nav
        className={`h-screen fixed left-0 top-0 z-50 flex flex-col border-r transition-all duration-300 ease-in-out bg-[#EEF2F9] dark:bg-[#17212F] border-[rgba(16,23,35,0.08)] dark:border-[#2B3646]
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 w-64 lg:w-[70px]"}
        `}
      >
        {/* Header */}
        <div className="flex h-[60px] items-center px-4 border-b border-[rgba(16,23,35,0.08)] dark:border-[#2B3646]">
          <Link
            to="/"
            className={`flex items-center gap-1 ${
              !sidebarOpen && "lg:justify-center lg:w-full"
            }`}
          >
            <img src={brandLogo} alt="Askio" className="w-8 h-8 flex-shrink-0 dark:brightness-0 dark:invert" />
            <span className={`font-sans text-body-lg font-bold tracking-tight text-[#101723] dark:text-[#D7DFE5] leading-none ${!sidebarOpen && "lg:hidden"}`}>
              Askio
            </span>
          </Link>
          {/* Mobile Close Button */}
          <button 
             onClick={toggleSidebar}
             className="ml-auto lg:hidden text-[#566273] dark:text-[#9BAABD]"
          >
             <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          {navItems.map((group, groupIndex) => (
            <div key={groupIndex} className="px-3 mb-6 last:mb-0">
              {(sidebarOpen) && (
                <h2 className="mb-2 px-4 text-caption font-semibold tracking-tight text-[#566273] dark:text-[#9BAABD] uppercase">
                  {group.title}
                </h2>
              )}
              {/* Desktop collapsed group title specific handling if needed, or just hide */}
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  // @ts-ignore
                  const badge = item.badge;
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={!sidebarOpen ? item.title : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium transition-colors ${
                        isActive
                          ? "bg-[#E7EDF6] text-[#101723] dark:bg-[#243040] dark:text-[#D7DFE5]"
                          : "text-[#566273] hover:bg-[#D8DFE9]/50 hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5]"
                      } ${!sidebarOpen && "lg:justify-center lg:px-2"}`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className={`flex flex-1 items-center justify-between ${!sidebarOpen && "lg:hidden"}`}>
                          <span>{item.title}</span>
                          {badge && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#D8DFE9] dark:bg-[#273444] text-[#566273] dark:text-[#9BAABD] font-medium leading-none">
                              {badge}
                            </span>
                          )}
                        </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-[rgba(16,23,35,0.08)] dark:border-[#2B3646] p-4 space-y-1">
          {/* Test Mode Toggle */}
          <button
              onClick={toggleTestMode}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium transition-colors ${
                testMode
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                  : "text-[#566273] hover:bg-[#D8DFE9]/50 hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5]"
              } ${!sidebarOpen && "lg:justify-center lg:px-2"}`}
              title={!sidebarOpen ? (testMode ? "Test Mode On" : "Test Mode Off") : undefined}
            >
              <Beaker className="h-4 w-4" />
              <div className={`flex flex-1 items-center justify-between ${!sidebarOpen && "lg:hidden"}`}>
                  <span>Test Mode</span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${testMode ? "bg-amber-500" : "bg-[#D7DFE5] dark:bg-[#566273]"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-[#F9FCFF] transition-all ${testMode ? "left-4.5" : "left-0.5"}`} style={{ left: testMode ? "18px" : "2px" }} />
                  </div>
                </div>
          </button>

          {/* Theme Toggle */}
          <button
              onClick={toggleDarkMode}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium text-[#566273] hover:bg-[#D8DFE9]/50 hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] transition-colors ${
                !sidebarOpen && "lg:justify-center lg:px-2"
              }`}
              title={!sidebarOpen ? (darkMode ? "Light Mode" : "Dark Mode") : undefined}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className={`${!sidebarOpen && "lg:hidden"}`}>Appearance</span>
          </button>

          {/* Collapse Toggle */}
          <button
              onClick={toggleSidebar}
              className={`hidden lg:flex w-full items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium text-[#566273] hover:bg-[#D8DFE9]/50 hover:text-[#101723] dark:text-[#9BAABD] dark:hover:bg-[#273444] dark:hover:text-[#D7DFE5] transition-colors ${
                  !sidebarOpen && "lg:justify-center lg:px-2"
              }`}
              title={!sidebarOpen ? "Expand Sidebar" : "Collapse Sidebar"}
          >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
              <span className={`${!sidebarOpen && "lg:hidden"}`}>Collapse</span>
          </button>

          {/* User Profile */}
          <div className={`flex items-center gap-3 pt-2 mt-2 border-t border-[rgba(16,23,35,0.08)] dark:border-[#2B3646] ${!sidebarOpen && "lg:justify-center"}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8DFE9] dark:bg-[#273444] text-[#101723] dark:text-[#D7DFE5]">
                  <User className="h-4 w-4" />
              </div>
              <div className={`flex flex-col overflow-hidden ${!sidebarOpen && "lg:hidden"}`}>
                      <span className="truncate text-body-sm font-medium text-[#101723] dark:text-[#D7DFE5]">
                          {auth.currentUser?.displayName || "User"}
                      </span>
                      <button
                          onClick={handleSignOut}
                          className="truncate text-caption text-[#566273] hover:text-[#101723] dark:text-[#9BAABD] dark:hover:text-[#D7DFE5] text-left"
                      >
                          Sign out
                      </button>
                  </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
