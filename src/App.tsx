import React, { Suspense, lazy, useState, useEffect } from "react";
import { PageSkeleton, Skeleton } from "./components/Skeleton";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { auth } from "./utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";

// Every page is its own chunk, so visitors only download the page they open.
// That keeps the homepage light, and the chat widget (/chatbot/:id), which
// runs on customers' sites, from pulling in the whole dashboard.
const pages = {
  home: () => import("./pages/home"),
  auth: () => import("./components/Auth"),
  dashboard: () => import("./pages/Dashboard"),
  editor: () => import("./components/EditChatbot"),
  embed: () => import("./pages/ChatbotEmbed"),
  docs: () => import("./pages/Documentation"),
  settings: () => import("./pages/Settings"),
  analytics: () => import("./pages/Analytics"),
  integrations: () => import("./pages/Integrations"),
  plans: () => import("./pages/Plans"),
  privacy: () => import("./pages/PrivacyPolicy"),
  terms: () => import("./pages/TermsOfService"),
  navbar: () => import("./components/Navbar"),
};

const Home = lazy(pages.home);
const Auth = lazy(pages.auth);
const Dashboard = lazy(pages.dashboard);
const EditChatbot = lazy(pages.editor);
const ChatbotEmbed = lazy(pages.embed);
const Documentation = lazy(pages.docs);
const Settings = lazy(pages.settings);
const Analytics = lazy(pages.analytics);
const Integrations = lazy(pages.integrations);
const Plans = lazy(pages.plans);
const PrivacyPolicy = lazy(pages.privacy);
const TermsOfService = lazy(pages.terms);
const Navbar = lazy(pages.navbar);

// Start downloading the current page's chunk right away, in parallel with
// React starting up, instead of waiting until the router asks for it.
function preloadCurrentPage(path: string) {
  const match: [boolean, () => Promise<unknown>][] = [
    [path === "/", pages.home],
    [path === "/auth", pages.auth],
    [path.startsWith("/chatbot/"), pages.embed],
    [path === "/dashboard", pages.dashboard],
    [path.startsWith("/configure"), pages.editor],
    [path === "/plans", pages.plans],
    [path === "/privacy", pages.privacy],
    [path === "/terms", pages.terms],
  ];
  match.find(([hit]) => hit)?.[1]();
}
preloadCurrentPage(window.location.pathname);

const SIDEBAR_KEY = "askio_sidebar";
// Remembers whether this browser was signed in last time, so public pages can
// render straight away instead of waiting for Firebase to restore the session.
const SIGNED_IN_KEY = "askio_signed_in";
const PUBLIC_PATHS = ["/", "/auth", "/plans", "/privacy", "/terms"];

// Pages that render inside the signed-in app shell (sidebar + content).
const isAppRoute = (path: string) => !PUBLIC_PATHS.includes(path) && !path.startsWith("/chatbot/");

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the preference just isn't kept.
  }
}

/** Shown while a page's code downloads: the page skeleton in the app, nothing elsewhere. */
function RouteFallback() {
  return isAppRoute(window.location.pathname) ? (
    <PageSkeleton tiles={4} />
  ) : (
    <div className="min-h-screen bg-[#F3F7FC] dark:bg-[#141D2B]" />
  );
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => readStorage("darkMode") === "true");
  // Phones start with the drawer closed; desktop remembers expanded vs. icon rail.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches && readStorage(SIDEBAR_KEY) !== "collapsed"
  );
  const [testMode, setTestMode] = useState(false);
  const [wasSignedIn] = useState(() => readStorage(SIGNED_IN_KEY) === "1");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      writeStorage(SIGNED_IN_KEY, currentUser ? "1" : "0");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    writeStorage("darkMode", darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prevOpen) => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        writeStorage(SIDEBAR_KEY, prevOpen ? "collapsed" : "expanded");
      }
      return !prevOpen;
    });
  };

  const closeSidebar = () => setSidebarOpen(false);

  const toggleTestMode = () => {
    setTestMode((prev) => !prev);
  };

  // Visitors who weren't signed in get public pages immediately; the app shell
  // (and signed-in visitors heading to the dashboard) wait for the session.
  const waitForAuth = authLoading && (wasSignedIn || isAppRoute(window.location.pathname));

  if (waitForAuth) {
    return (
      <div className={`min-h-screen ${darkMode ? "dark" : ""} bg-[#F3F7FC] dark:bg-[#141D2B]`}>
        {(wasSignedIn || isAppRoute(window.location.pathname)) && (
          <div className="flex">
            <div
              className={`hidden h-screen shrink-0 border-r border-[#D8DFE9] bg-[#EDF2F8] p-3 lg:block dark:border-[#2B3646] dark:bg-[#17212F] ${
                sidebarOpen ? "w-64" : "w-[72px]"
              }`}
            >
              <Skeleton className="mb-4 h-8 w-full" />
              <Skeleton className="mb-6 h-9 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="mb-2 h-8 w-full" />
              ))}
            </div>
            <div className="min-w-0 flex-1 pt-14 lg:pt-0">
              <PageSkeleton tiles={4} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Router>
        <div className={`min-h-screen ${darkMode ? "dark" : ""} flex`}>
          {user && (
            <Suspense fallback={null}>
            <Navbar
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              sidebarOpen={sidebarOpen}
              toggleSidebar={toggleSidebar}
              closeSidebar={closeSidebar}
              testMode={testMode}
              toggleTestMode={toggleTestMode}
            />
            </Suspense>
          )}
          <div
            className={`flex-1 min-w-0 transition-all duration-300 ${
              user ? `pt-14 lg:pt-0 ${sidebarOpen ? "lg:ml-64" : "lg:ml-[72px]"}` : ""
            }`}
          >
            <Suspense fallback={<RouteFallback />}>
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
                element={user ? <Integrations testMode={testMode} /> : <Navigate to="/auth" />}
              />
              <Route
                path="/plans"
                element={<Plans />}
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Routes>
            </Suspense>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: darkMode ? "#1A2533" : "#F9FCFF",
                  color: darkMode ? "#D7DFE5" : "#101723",
                  border: `1px solid ${darkMode ? "#2B3646" : "#D8DFE9"}`,
                },
              }}
            />
          </div>
        </div>
      </Router>
    </HelmetProvider>
  );
};

export default App;
