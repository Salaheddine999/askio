import React, { useState, useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { auth } from "./utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Dashboard from "./pages/Dashboard";
import EditChatbot from "./components/EditChatbot";
import Home from "./pages/home";
import Auth from "./components/Auth";
import ChatbotEmbed from "./pages/ChatbotEmbed";
import Documentation from "./pages/Documentation";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { HelmetProvider } from "react-helmet-async";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    const isDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDarkMode);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prevOpen) => !prevOpen);
  };

  const toggleTestMode = () => {
    setTestMode((prev) => !prev);
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? "dark" : ""} flex justify-center items-center bg-[#F7F5F3] dark:bg-[#1C1917]`}>
        <LoaderCircle className="animate-spin text-[#37322F] dark:text-[#F5F5F4]" size={48} />
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Router>
        <div className={`min-h-screen ${darkMode ? "dark" : ""} flex`}>
          {user && (
            <Navbar
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              sidebarOpen={sidebarOpen}
              toggleSidebar={toggleSidebar}
              testMode={testMode}
              toggleTestMode={toggleTestMode}
            />
          )}
          <div
            className={`flex-1 min-w-0 transition-all duration-300 ${
              user ? (sidebarOpen ? "lg:ml-64" : "lg:ml-20") : ""
            }`}
          >
            <Routes>
              <Route
                path="/"
                element={user ? <Navigate to="/dashboard" /> : <Home />}
              />
              <Route
                path="/auth"
                element={!user ? <Auth /> : <Navigate to="/dashboard" />}
              />
              <Route
                path="/dashboard"
                element={
                  user ? (
                    <Dashboard
                      sidebarOpen={sidebarOpen}
                      toggleSidebar={toggleSidebar}
                      testMode={testMode}
                    />
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/configure/:id?"
                element={user ? <EditChatbot /> : <Navigate to="/auth" />}
              />
              <Route path="/chatbot/:id" element={<ChatbotEmbed />} />
              <Route
                path="/documentation"
                element={
                  user ? (
                    <Documentation toggleSidebar={toggleSidebar} />
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/settings"
                element={
                  user ? (
                    <Settings toggleSidebar={toggleSidebar} />
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/analytics"
                element={user ? <Analytics /> : <Navigate to="/auth" />}
              />
              <Route
                path="/integrations"
                element={user ? <Integrations /> : <Navigate to="/auth" />}
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
            <Toaster position="top-center" />
          </div>
        </div>
      </Router>
    </HelmetProvider>
  );
};

export default App;
