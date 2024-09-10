import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { supabase } from "./utils/supabase";
import Dashboard from "./pages/Dashboard";
import EditChatbot from "./components/EditChatbot";
import Home from "./pages/Home";
import Auth from "./components/Auth";
import ChatbotEmbed from "./pages/ChatbotEmbed";
import { Session } from "@supabase/supabase-js";
import Documentation from "./pages/Documentation";
import Navbar from "./components/Navbar";
import Profile from "./pages/Profile";

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-indigo-50">
        {session && <Navbar />}
        <div className="flex-grow">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route
                path="/"
                element={session ? <Navigate to="/dashboard" /> : <Home />}
              />
              <Route
                path="/auth"
                element={!session ? <Auth /> : <Navigate to="/dashboard" />}
              />
              <Route
                path="/dashboard"
                element={session ? <Dashboard /> : <Navigate to="/auth" />}
              />
              <Route
                path="/configure/:id?"
                element={session ? <EditChatbot /> : <Navigate to="/auth" />}
              />
              <Route path="/chatbot/:id" element={<ChatbotEmbed />} />
              <Route
                path="/documentation"
                element={session ? <Documentation /> : <Navigate to="/auth" />}
              />
              <Route
                path="/profile"
                element={session ? <Profile /> : <Navigate to="/auth" />}
              />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
