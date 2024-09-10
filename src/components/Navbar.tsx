import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../utils/supabase";
import {
  MessageSquare,
  List,
  HelpCircle,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink: React.FC<{
    to: string;
    icon: React.ReactNode;
    text: string;
  }> = ({ to, icon, text }) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors duration-200 flex items-center ${
        isActive(to) ? "text-gray-200" : "text-white hover:text-gray-200"
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {icon}
      <span className="ml-1">{text}</span>
    </Link>
  );

  return (
    <nav className="bg-indigo-900 text-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-xl font-bold text-white flex items-center"
            >
              <MessageSquare className="mr-2" />
              Askio Chatbot
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
              onClick={handleSignOut}
              className="bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center"
            >
              <LogOut size={18} className="mr-1" />
              Sign Out
            </button>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-indigo-200"
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
              onClick={handleSignOut}
              className="w-full text-left bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 flex items-center mt-2"
            >
              <LogOut size={18} className="mr-1" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
