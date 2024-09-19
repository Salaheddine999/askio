import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../utils/firebase";
import { signOut } from "firebase/auth";
import {
  List,
  HelpCircle,
  LogOut,
  Menu,
  X,
  User,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const NavLink: React.FC<{
    to: string;
    icon: React.ReactNode;
    text: string;
  }> = ({ to, icon, text }) => (
    <Link
      to={to}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        isActive(to)
          ? "bg-[#aab2ff] text-black hover:bg-[#8e98ff]"
          : "text-gray-700 hover:bg-[#aab2ff] hover:text-black dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-indigo-100"
      }`}
    >
      {icon}
      <span className="ml-2">{text}</span>
    </Link>
  );

  return (
    <nav className="bg-gray-100 shadow-md dark:bg-gray-800 transition-colors duration-200 top-0 z-10 p-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center text-2xl font-bold text-black dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200"
            >
              <img
                src="/icon.svg"
                alt="Askio Chatbot"
                className="w-12 h-12 mr-2"
              />
              <span>Askio</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/dashboard"
              icon={<List size={18} />}
              text="Dashboard"
            />
            <NavLink
              to="/documentation"
              icon={<HelpCircle size={18} />}
              text="Documentation"
            />
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#aab2ff] hover:text-black transition-all duration-200 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-indigo-100"
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
              >
                <User size={18} />
                <span className="ml-2">Profile</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700 flex items-center"
                  >
                    <User size={16} className="mr-2" />
                    View Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 p-2 rounded-md transition-all duration-200"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden" ref={menuRef}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <NavLink
              to="/dashboard"
              icon={<List size={18} />}
              text="Dashboard"
            />
            <NavLink
              to="/documentation"
              icon={<HelpCircle size={18} />}
              text="Documentation"
            />
            <NavLink to="/profile" icon={<User size={18} />} text="Profile" />
            <button
              onClick={toggleDarkMode}
              className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {darkMode ? (
                <Sun size={18} className="mr-2" />
              ) : (
                <Moon size={18} className="mr-2" />
              )}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900 transition-all duration-200"
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
