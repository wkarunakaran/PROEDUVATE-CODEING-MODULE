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

import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
const STORAGE_KEY = "codoai_v3_state";

export default function App() {
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
    // Only save user, problems, and language to localStorage
    // Attempts are stored in database
    // Theme is handled by ThemeContext
    const state = { user, problems, currentLanguage };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to persist state", err);
    }
  }, [user, problems, currentLanguage]);



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

          // Store userId and username in localStorage for lobby/match checks
          localStorage.setItem("userId", userData.id);
          localStorage.setItem("username", userData.username);

          console.log("✅ User logged in:", { id: userData.id, username: userData.username });

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
    const fallbackUsername = username.trim();
    localStorage.setItem("username", fallbackUsername);

    setUser({
      name: fallbackUsername,
      isAdmin,
      preferredLanguage: "python",
      level: 1,
    });
    return true; // Success with fallback
  };

  const handleLogout = () => {
    setUser(null);
    setAttempts({});

    // Clear user session data
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

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
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col font-sans">
            <Navbar user={user} onLogout={handleLogout} />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home user={user} />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<Register onLogin={handleLogin} />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth user={user}>
                      <Dashboard
                        user={user}
                        stats={stats}
                        problems={problems}
                        attempts={attempts}
                        currentLanguage={currentLanguage}
                      />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth user={user}>
                      <Profile
                        user={user}
                        stats={stats}
                        attempts={attempts}
                        problems={problems}
                        currentLanguage={currentLanguage}
                      />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/problems"
                  element={
                    <RequireAuth user={user}>
                      <Problems
                        problems={problems}
                        attempts={attempts}
                        currentLanguage={currentLanguage}
                      />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/solve/:id"
                  element={
                    <RequireAuth user={user}>
                      <Workspace
                        user={user}
                        problems={problems}
                        attempts={attempts}
                        setAttempts={setAttempts}
                        currentLanguage={currentLanguage}
                        setCurrentLanguage={setCurrentLanguage}
                      />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RequireAuth user={user}>
                      {user?.isAdmin ? (
                        <Admin problems={problems} setProblems={setProblems} />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )}
                    </RequireAuth>
                  }
                />

                {/* Competitive Routes */}
                <Route
                  path="/competitive"
                  element={
                    <RequireAuth user={user}>
                      <Competitive attempts={attempts} problems={problems} stats={stats} />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/competitive/match/:matchId"
                  element={
                    <RequireAuth user={user}>
                      <CompetitiveMatch />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/lobby/create"
                  element={
                    <RequireAuth user={user}>
                      <LobbyCreate />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/lobby/join"
                  element={
                    <RequireAuth user={user}>
                      <LobbyJoin />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/lobby/:gameId"
                  element={
                    <RequireAuth user={user}>
                      <LobbyRoom />
                    </RequireAuth>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

function RequireAuth({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
