import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { auth } from "./utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Dashboard from "./pages/Dashboard";
import EditChatbot from "./components/EditChatbot";
import Home from "./pages/Home";
import Auth from "./components/Auth";
import ChatbotEmbed from "./pages/ChatbotEmbed";
import Documentation from "./pages/Documentation";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import Settings from "./pages/Settings";
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
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

  if (loading) {
    return <div>Loading...</div>;
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
            />
          )}
          <div
            className={`flex-1 transition-all duration-300 ${
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
                    />
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
              />
              <Route
                path="/configure/:id?"
                element={
                  user ? (
                    <EditChatbot toggleSidebar={toggleSidebar} />
                  ) : (
                    <Navigate to="/auth" />
                  )
                }
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
            </Routes>
            <Toaster position="top-center" />
          </div>
        </div>
      </Router>
    </HelmetProvider>
  );
};

export default App;
