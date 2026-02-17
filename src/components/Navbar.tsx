import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import {
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Home,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  toggleDarkMode,
  sidebarOpen,
  toggleSidebar,
}) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav
      className={`bg-[#FAFAF9] dark:bg-[#292524] h-screen fixed left-0 top-0 shadow-[1px_0_0_0_rgba(55,50,47,0.08)] transition-all duration-200 z-50 ${
        sidebarOpen ? "w-64" : "w-20"
      } lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-[rgba(55,50,47,0.08)] dark:border-[#44403C] flex justify-between items-center">
          <Link
            to="/"
            className={`flex items-center text-2xl font-bold text-[#37322F] dark:text-[#F5F5F4] hover:text-[#000] dark:hover:text-white transition-colors duration-200 ${
              !sidebarOpen && "justify-center"
            }`}
          >
            <img src="/icon.svg" alt="Askio Chatbot" className="w-8 h-8 mr-2" />
            {sidebarOpen && <span className="font-serif tracking-tight">Askio</span>}
          </Link>
          <button
            onClick={toggleSidebar}
            className="text-[#605A57] hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:text-[#F5F5F4]"
          >
            {sidebarOpen ? (
              <ChevronLeft size={24} />
            ) : (
              <ChevronRight size={24} />
            )}
          </button>
        </div>
        <div className="flex-grow p-4">
          <ul className="space-y-2">
            <NavItem
              to="/dashboard"
              icon={Home}
              text="Dashboard"
              sidebarOpen={sidebarOpen}
            />
            <NavItem
              to="/documentation"
              icon={HelpCircle}
              text="Documentation"
              sidebarOpen={sidebarOpen}
            />
            <NavItem
              to="/settings"
              icon={Settings}
              text="Settings"
              sidebarOpen={sidebarOpen}
            />
          </ul>
        </div>
        <div className="p-4 border-t border-[rgba(55,50,47,0.08)] dark:border-[#44403C]">
          <button
            onClick={toggleDarkMode}
            className={`flex items-center w-full p-2 rounded-[9px] text-[#605A57] hover:bg-[#E0DEDB]/50 hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C] transition-colors duration-200 ${
              !sidebarOpen && "justify-center"
            }`}
          >
            {darkMode ? (
              <Sun size={20} className={sidebarOpen ? "mr-3" : ""} />
            ) : (
              <Moon size={20} className={sidebarOpen ? "mr-3" : ""} />
            )}
            {sidebarOpen && (darkMode ? "Light Mode" : "Dark Mode")}
          </button>
          <button
            onClick={handleSignOut}
            className={`flex items-center w-full mt-2 p-2 rounded-[9px] text-[#605A57] hover:bg-[#E0DEDB]/50 hover:text-[#37322F] dark:text-red-400 dark:hover:bg-red-900/30 transition-colors duration-200 ${
              !sidebarOpen && "justify-center"
            }`}
          >
            <LogOut size={20} className={sidebarOpen ? "mr-3" : ""} />
            {sidebarOpen && "Sign Out"}
          </button>
        </div>
      </div>
    </nav>
  );
};

const NavItem: React.FC<{
  to: string;
  icon: React.ElementType;
  text: string;
  sidebarOpen: boolean;
}> = ({ to, icon: Icon, text, sidebarOpen }) => (
  <li>
    <Link
      to={to}
      className={`flex items-center p-2 rounded-[9px] transition-colors duration-200 font-medium font-sans ${
        location.pathname === to
          ? "bg-[#E0DEDB] text-[#37322F] dark:bg-[#44403C] dark:text-[#F5F5F4]"
          : "text-[#605A57] hover:bg-[#E0DEDB]/50 hover:text-[#37322F] dark:text-[#A8A29E] dark:hover:bg-[#44403C]"
      } ${!sidebarOpen && "justify-center"}`}
    >
      <Icon size={20} className={sidebarOpen ? "mr-3" : ""} />
      {sidebarOpen && text}
    </Link>
  </li>
);

export default Navbar;
