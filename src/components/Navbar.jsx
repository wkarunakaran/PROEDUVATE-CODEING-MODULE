import { Link, NavLink, useLocation } from "react-router-dom";

export default function Navbar({ user, onLogout, theme, toggleTheme }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            ProEduvate
          </div>
          {!isLanding && (
            <div className="hidden sm:block text-lg font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              codoAI
            </div>
          )}
        </div>

        {!isLanding && (
          <nav className="hidden md:flex items-center gap-4 text-xs">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-3 py-1 rounded-full border ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                    : "border-transparent text-slate-300 hover:border-slate-600"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/problems"
              className={({ isActive }) =>
                `px-3 py-1 rounded-full border ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                    : "border-transparent text-slate-300 hover:border-slate-600"
                }`
              }
            >
              Problems
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 py-1 rounded-full border ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                    : "border-transparent text-slate-300 hover:border-slate-600"
                }`
              }
            >
              Profile
            </NavLink>
            <NavLink
              to="/competitive"
              className={({ isActive }) =>
                `px-3 py-1 rounded-full border ${
                  isActive
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                    : "border-transparent text-slate-300 hover:border-slate-600"
                }`
              }
            >
              Competitive
            </NavLink>
            {user?.isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-1 rounded-full border ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                      : "border-transparent text-slate-300 hover:border-slate-600"
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-600 text-xs text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
            title="Toggle theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/80">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-400 to-sky-400 flex items-center justify-center text-xs font-bold text-slate-900">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-slate-100">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {user.preferredLanguage?.toUpperCase() || "PYTHON"}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs px-3 py-1 rounded-full border border-slate-600 hover:border-rose-500 hover:text-rose-300"
              >
                Sign out
              </button>
            </>
          ) : (
            !isLanding && (
              <Link
                to="/login"
                className="text-xs px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
