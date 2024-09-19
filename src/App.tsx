import React, { useState, useEffect } from "react";
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
import Home from "./pages/Home";
import Auth from "./components/Auth";
import ChatbotEmbed from "./pages/ChatbotEmbed";
import Documentation from "./pages/Documentation";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";
import { Toaster } from "react-hot-toast";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Check for user's dark mode preference
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
    setDarkMode(!darkMode);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className={`min-h-screen flex flex-col ${darkMode ? "dark" : ""}`}>
        {user && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
        <div className="flex-grow bg-gray-50 dark:bg-gray-900">
          <div className="mx-auto">
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
                element={user ? <Dashboard /> : <Navigate to="/auth" />}
              />
              <Route
                path="/configure/:id?"
                element={user ? <EditChatbot /> : <Navigate to="/auth" />}
              />
              <Route path="/chatbot/:id" element={<ChatbotEmbed />} />
              <Route
                path="/documentation"
                element={user ? <Documentation /> : <Navigate to="/auth" />}
              />
              <Route
                path="/profile"
                element={user ? <Profile /> : <Navigate to="/auth" />}
              />
            </Routes>
            <Toaster position="top-center" />
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
