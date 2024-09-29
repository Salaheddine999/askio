import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [userInitial, setUserInitial] = useState<string>("");

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.displayName) {
      setUserInitial(currentUser.displayName.charAt(0).toUpperCase());
    } else {
      setUserInitial("");
    }
  }, [auth.currentUser]);

  return (
    <nav
      className={`bg-white dark:bg-gray-800 h-screen fixed left-0 top-0 shadow-lg transition-all duration-200 z-50 ${
        sidebarOpen ? "w-64" : "w-20"
      } lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <Link
            to="/"
            className={`flex items-center text-2xl font-bold text-black dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 ${
              !sidebarOpen && "justify-center"
            }`}
          >
            <img src="/icon.svg" alt="Askio Chatbot" className="w-8 h-8 mr-2" />
            {sidebarOpen && <span>Askio</span>}
          </Link>
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleDarkMode}
            className={`flex items-center w-full p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 ${
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
            className={`flex items-center w-full mt-2 p-2 rounded-md text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 transition-colors duration-200 ${
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
      className={`flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 ${
        location.pathname === to
          ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
          : ""
      } ${!sidebarOpen && "justify-center"}`}
    >
      <Icon size={20} className={sidebarOpen ? "mr-3" : ""} />
      {sidebarOpen && text}
    </Link>
  </li>
);

export default Navbar;
