import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../utils/firebase"; // Import Firebase auth
import { signOut } from "firebase/auth"; // Import signOut function
import {
  List,
  HelpCircle,
  LogOut,
  Menu,
  X,
  User,
  Moon,
  Sun,
} from "lucide-react";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink: React.FC<{
    to: string;
    icon: React.ReactNode;
    text: string;
  }> = ({ to, icon, text }) => (
    <Link
      to={to}
      className={`text-sm font-normal transition-colors duration-200 flex items-center px-3 py-2 rounded-md ${
        isActive(to)
          ? "bg-[#aab2ff] text-black dark:bg-[#aab2ff] hover:bg-indigo-400"
          : "text-black hover:bg-[#aab2ff] hover:text-black dark:text-gray-100 dark:hover:bg-[#aab2ff] dark:hover:text-black"
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span className="ml-2">{text}</span>
    </Link>
  );

  return (
    <nav className="bg-gray-100 shadow-lg dark:bg-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-1 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold text-black dark:text-gray-200 flex items-center"
            >
              <img
                src={"./icon.svg"}
                alt="Askio Chatbot"
                className="w-14 h-14 mr-2"
              />
              <span className="text-black">Askio</span>
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
            <NavLink to="/profile" icon={<User size={18} />} text="Profile" />
            <button
              onClick={toggleDarkMode}
              className="text-black dark:text-gray-100 p-2 rounded-full hover:bg-[#aab2ff] hover:text-black dark:hover:text-indigo-900 dark:hover:bg-[#aab2ff] transition-colors duration-200"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </button>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-indigo-800 dark:text-gray-300 hover:text-indigo-200 dark:hover:text-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
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
              className="w-full text-left text-black dark:text-gray-300 text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center mt-2 hover:bg-indigo-300 dark:hover:bg-gray-700"
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
              className="w-full text-left bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center mt-2"
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
