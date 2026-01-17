import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Problems from "./pages/Problems";
import Workspace from "./pages/Workspace";
import Competitive from "./pages/Competitive";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

import Navbar from "./components/Navbar";
import LanguageSelector from "./components/LanguageSelector";

import { initialProblems } from "./data/problems";
import { computeUserStats } from "./utils/stats";

const STORAGE_KEY = "codoai_v3_state";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [problems, setProblems] = useState(initialProblems);
  const [currentLanguage, setCurrentLanguage] = useState("python");
  const [attempts, setAttempts] = useState({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.user) setUser(parsed.user);
      if (parsed.problems) setProblems(parsed.problems);
      if (parsed.currentLanguage) setCurrentLanguage(parsed.currentLanguage);
      if (parsed.attempts) setAttempts(parsed.attempts);
      if (parsed.theme) {
        setTheme(parsed.theme);
        if (parsed.theme === "light") {
          document.documentElement.classList.add("light-theme");
        }
      }
    } catch (err) {
      console.error("Failed to load state", err);
    }
  }, []);

  useEffect(() => {
    const state = { user, problems, currentLanguage, attempts, theme };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to persist state", err);
    }
  }, [user, problems, currentLanguage, attempts, theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (next === "light") {
        document.documentElement.classList.add("light-theme");
      } else {
        document.documentElement.classList.remove("light-theme");
      }
      return next;
    });
  };

  const handleLogin = (username) => {
    const isAdmin = username.trim().toLowerCase() === "admin";
    setUser({
      name: username.trim(),
      isAdmin,
      preferredLanguage: "python",
      level: "beginner",
    });
  };

  const handleLogout = () => {
    setUser(null);
    setAttempts({});
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const keep = { theme: parsed.theme };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const stats = computeUserStats(attempts, problems);

  const requireAuth = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    return element;
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors duration-300">
        {window.location.pathname !== "/" && (
          <Navbar
            user={user}
            onLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}

        {user && (
          <div className="fixed top-16 right-4 z-30">
            <LanguageSelector
              current={currentLanguage}
              onChange={setCurrentLanguage}
            />
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home user={user} stats={stats} />} />
            <Route
              path="/login"
              element={<Login onLogin={handleLogin} />}
            />
            <Route
              path="/dashboard"
              element={requireAuth(
                <Dashboard
                  user={user}
                  problems={problems}
                  attempts={attempts}
                  currentLanguage={currentLanguage}
                  stats={stats}
                />
              )}
            />
            <Route
              path="/profile"
              element={requireAuth(
                <Profile
                  user={user}
                  attempts={attempts}
                  problems={problems}
                  currentLanguage={currentLanguage}
                  stats={stats}
                />
              )}
            />
            <Route
              path="/problems"
              element={requireAuth(
                <Problems
                  problems={problems}
                  attempts={attempts}
                  currentLanguage={currentLanguage}
                />
              )}
            />
            <Route
              path="/workspace/:id"
              element={requireAuth(
                <Workspace
                  user={user}
                  problems={problems}
                  attempts={attempts}
                  setAttempts={setAttempts}
                  currentLanguage={currentLanguage}
                  setCurrentLanguage={setCurrentLanguage}
                />
              )}
            />
            <Route
              path="/competitive"
              element={requireAuth(
                <Competitive attempts={attempts} problems={problems} stats={stats} />
              )}
            />
            <Route
              path="/admin"
              element={requireAuth(
                user?.isAdmin ? (
                  <Admin problems={problems} setProblems={setProblems} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              )}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
