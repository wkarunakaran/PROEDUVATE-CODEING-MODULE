import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";

export default function Competitive({ attempts, problems, stats }) {
  const rating = 1200 + Math.floor(stats.xp / 10);

  return (
    <div>
      <div className="border border-emerald-500/50 rounded-2xl p-4 bg-slate-950/90">
        <h1 className="text-xl font-semibold mb-1">
          Competitive mode{" "}
          <span className="text-[11px] uppercase text-emerald-300 bg-emerald-500/10 px-2 py-[2px] rounded-full">
            beta
          </span>
        </h1>
        <p className="text-xs text-slate-400 mb-4">
          A preview of your rating based on your current XP. In the future this
          can match you against other students in real-time duels.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-4 text-xs">
          <div className="border border-slate-700 rounded-xl p-3">
            <div className="text-slate-400 mb-1">Estimated rating</div>
            <div className="text-2xl font-semibold">{rating}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Higher XP → higher rating. XP comes from solving problems and
              rounds.
            </div>
          </div>
          <div className="border border-slate-700 rounded-xl p-3">
            <div className="text-slate-400 mb-1">
              Level progress (Level {stats.level})
            </div>
            <ProgressBar value={stats.levelProgress} big />
            <div className="text-[11px] text-slate-400 mt-1">
              XP: {stats.xp}. Keep solving to reach the next level.
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <button
            disabled
            className="px-4 py-2 rounded-full bg-slate-700 text-slate-300 cursor-not-allowed"
          >
            Start 1v1 duel (coming soon)
          </button>
          <Link
            to="/problems"
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-200 hover:border-emerald-400"
          >
            Practice more problems
          </Link>
        </div>
      </div>

      <div className="border border-slate-700 rounded-2xl p-4 mt-4 text-xs">
        <h2 className="text-sm font-semibold mb-2">How competitive mode works</h2>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li>Timed challenges on the same problem against another student.</li>
          <li>Rating increases when you win and decreases when you lose.</li>
          <li>Bonus XP for solving without hints and within a strict time limit.</li>
        </ul>
      </div>
    </div>
  );
}
