import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";

export default function Problems({ problems, attempts, currentLanguage }) {
  return (
    <div>
      <h1 className="text-lg font-semibold mb-2">All problems</h1>
      <p className="text-xs text-slate-400 mb-4">
        Practice step by step in {currentLanguage.toUpperCase()}.
      </p>
      <div className="space-y-3 text-xs">
        {problems.map((p) => {
          const key = `${p.id}_${currentLanguage}`;
          const att = attempts[key];
          const roundsDone = att
            ? Object.values(att.roundCompleted || {}).filter(Boolean).length
            : 0;
          const progress = (roundsDone / 4) * 100;
          const completed = att?.finalCompleted;

          return(
            <Link
              key={p.id}
              to={`/workspace/${p.id}`}
              className="block rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 hover:border-emerald-500/80"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-100">
                    {p.title}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span
                      className={`px-2 py-[2px] rounded-full text-[10px] ${
                        p.difficulty === "Easy"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : p.difficulty === "Medium"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-rose-500/15 text-rose-300"
                      }`}
                    >
                      {p.difficulty}
                    </span>
                    {p.topics.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-[2px] rounded-full text-[10px] border border-slate-700 text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-28">
                  <ProgressBar value={progress} />
                  <div className="text-[10px] text-slate-400 mt-1 text-right">
                    {completed ? "Completed ✓" : "In progress"}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
