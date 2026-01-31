import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Problems from "./pages/Problems";
import Workspace from "./pages/Workspace";
import Competitive from "./pages/Competitive";
import CompetitiveMatch from "./pages/CompetitiveMatch";
import LobbyCreate from "./pages/LobbyCreate";
import LobbyJoin from "./pages/LobbyJoin";
import LobbyRoom from "./pages/LobbyRoom";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

import Navbar from "./components/Navbar";
import LanguageSelector from "./components/LanguageSelector";

import { initialProblems } from "./data/problems";
import { computeUserStats } from "./utils/stats";
import { API_BASE } from "./utils/api";

const STORAGE_KEY = "codoai_v3_state";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [problems, setProblems] = useState(initialProblems);
  const [currentLanguage, setCurrentLanguage] = useState("python");
  const [attempts, setAttempts] = useState({});
  const [attemptsLoaded, setAttemptsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.user) setUser(parsed.user);
      if (parsed.problems) setProblems(parsed.problems);
      if (parsed.currentLanguage) setCurrentLanguage(parsed.currentLanguage);
      // Don't load attempts from localStorage anymore - will load from API
      if (parsed.theme) {
        setTheme(parsed.theme);
        if (parsed.theme === "light") {
          document.documentElement.classList.add("light-theme");
        }
      }
    } catch (err) {
      console.error("Failed to load state", err);
    } finally {
      // Always set loading to false, even if there's an error
      setIsLoading(false);
    }
  }, []);

  // Load attempts from API when user is logged in
  useEffect(() => {
    const fetchAttempts = async () => {
      if (!user) {
        setAttempts({});
        setAttemptsLoaded(true);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setAttemptsLoaded(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/attempts/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Convert array of attempts to object keyed by problemId_language
          const attemptsObj = {};
          data.forEach(att => {
            const key = `${att.problem_id}_${att.language}`;
            attemptsObj[key] = {
              roundCompleted: att.roundCompleted || {},
              roundState: att.roundState || {},
              totalTimeSeconds: att.totalTimeSeconds || 0,
              finalCompleted: att.finalCompleted || false,
              lastRound: att.lastRound || 1,
              globalStartTime: att.globalStartTime || null
            };
          });
          setAttempts(attemptsObj);
        }
      } catch (err) {
        console.error("Failed to load attempts from API", err);
      } finally {
        setAttemptsLoaded(true);
      }
    };

    fetchAttempts();
  }, [user]);

  useEffect(() => {
    // Only save user, problems, language, and theme to localStorage
    // Attempts are stored in database
    const state = { user, problems, currentLanguage, theme };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to persist state", err);
    }
  }, [user, problems, currentLanguage, theme]);

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

  const handleLogin = async (username) => {
    const isAdmin = username.trim().toLowerCase() === "admin";

    // Fetch user details from API to get user ID
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await fetch(`${API_BASE}/users/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.id,
            name: userData.username,
            isAdmin: userData.is_admin,
            preferredLanguage: userData.preferred_language || "python",
            level: userData.level || 1,
          });
          return true; // Success
        }
      } catch (err) {
        console.error("Failed to fetch user details", err);
        return false; // Failed
      }
    }

    // Fallback to basic user object if API fails
    setUser({
      name: username.trim(),
      isAdmin,
      preferredLanguage: "python",
      level: 1,
    });
    return true; // Success with fallback
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

  // Show loading screen while checking for existing session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-100 text-lg">Loading...</div>
      </div>
    );
  }

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
              path="/register"
              element={<Register onLogin={handleLogin} />}
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
              path="/competitive/match/:matchId"
              element={requireAuth(
                <CompetitiveMatch />
              )}
            />
            <Route
              path="/lobby/create"
              element={requireAuth(<LobbyCreate />)}
            />
            <Route
              path="/lobby/join"
              element={requireAuth(<LobbyJoin />)}
            />
            <Route
              path="/lobby/:gameId"
              element={requireAuth(<LobbyRoom />)}
            />
            <Route
              path="/competitive/:matchId"
              element={requireAuth(<CompetitiveMatch />)}
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
