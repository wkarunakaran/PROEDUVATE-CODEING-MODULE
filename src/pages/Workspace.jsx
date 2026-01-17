import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import MonacoEditorWrapper from "../components/MonacoEditorWrapper";
import ProgressBar from "../components/ProgressBar";
import LeaderboardTable from "../components/LeaderboardTable";

export default function Workspace({
  user,
  problems,
  attempts,
  setAttempts,
  currentLanguage,
  setCurrentLanguage,
}) {
  const { id } = useParams();
  const problemId = Number(id);

  const problem = useMemo(
    () => problems.find((p) => p.id === problemId),
    [problems, problemId]
  );

  const [currentRound, setCurrentRound] = useState(1);
  const [roundState, setRoundState] = useState({
    1: { code: "", completed: false, time: 0 },
    2: { code: "", completed: false, time: 0 },
    3: { code: "", completed: false, time: 0 },
    4: { code: "", completed: false, time: 0 },
  });
  const [roundStartTimes, setRoundStartTimes] = useState({});
  const [globalStartTime, setGlobalStartTime] = useState(null);
  const [now, setNow] = useState(Date.now());

  const key = `${problemId}_${currentLanguage}`;
  const existingAttempt = attempts[key];

  useEffect(() => {
    if (existingAttempt) {
      setRoundState(existingAttempt.roundState || roundState);
      setCurrentRound(existingAttempt.lastRound || 1);
      setGlobalStartTime(existingAttempt.globalStartTime || null);
    } else {
      setRoundState({
        1: { code: "", completed: false, time: 0 },
        2: { code: "", completed: false, time: 0 },
        3: { code: "", completed: false, time: 0 },
        4: { code: "", completed: false, time: 0 },
      });
      setCurrentRound(1);
      setGlobalStartTime(null);
    }
    setRoundStartTimes({});
  }, [problemId, currentLanguage]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!problem) {
    return (
      <div>
        <h1 className="text-lg font-semibold mb-2">Problem not found</h1>
        <p className="text-xs text-slate-400">Please go back and select again.</p>
      </div>
    );
  }

  const handleCodeChange = (value) => {
    setRoundState((prev) => ({
      ...prev,
      [currentRound]: { ...prev[currentRound], code: value },
    }));
    if (!roundStartTimes[currentRound]) {
      const ts = Date.now();
      setRoundStartTimes((prev) => ({ ...prev, [currentRound]: ts }));
      if (!globalStartTime) setGlobalStartTime(ts);
    }
  };

  const handleSubmitRound = () => {
    const tsNow = Date.now();
    const roundStart = roundStartTimes[currentRound] || tsNow;
    const elapsedSeconds = (tsNow - roundStart) / 1000;

    setRoundState((prev) => ({
      ...prev,
      [currentRound]: {
        ...prev[currentRound],
        completed: true,
        time: elapsedSeconds,
      },
    }));

    setAttempts((prev) => {
      const prevAttempt = prev[key] || {
        roundCompleted: {},
        roundState: {},
        finalCompleted: false,
        totalTimeSeconds: 0,
        globalStartTime: globalStartTime || roundStart,
      };

      const newRoundCompleted = {
        ...prevAttempt.roundCompleted,
        [currentRound]: true,
      };

      const newRoundState = {
        ...prevAttempt.roundState,
        [currentRound]: {
          ...roundState[currentRound],
          completed: true,
          time: elapsedSeconds,
        },
      };

      const total = Object.values(newRoundState).reduce(
        (sum, r) => sum + (r.time || 0),
        0
      );

      const allRoundsDone =
        newRoundCompleted[1] &&
        newRoundCompleted[2] &&
        newRoundCompleted[3] &&
        newRoundCompleted[4];
      const finalCompleted =
        currentRound === 4 ? Boolean(allRoundsDone) : prevAttempt.finalCompleted;

      if (finalCompleted && !prevAttempt.finalCompleted) {
        alert(
          `Finished "${problem.title}" in ${total.toFixed(
            1
          )}s (${currentLanguage.toUpperCase()}).`
        );
      }

      return {
        ...prev,
        [key]: {
          ...prevAttempt,
          roundCompleted: newRoundCompleted,
          roundState: newRoundState,
          totalTimeSeconds: total,
          finalCompleted,
          lastRound: currentRound,
          globalStartTime:
            prevAttempt.globalStartTime || globalStartTime || roundStart,
        },
      };
    });

    if (currentRound < 4) setCurrentRound((r) => r + 1);
  };

  const attempt = attempts[key];
  const roundsCompletedCount = attempt
    ? Object.values(attempt.roundCompleted || {}).filter(Boolean).length
    : 0;
  const overallProgress = (roundsCompletedCount / 4) * 100;

  const currentRoundData = roundState[currentRound];
  const currentRoundStart = roundStartTimes[currentRound];
  let liveRoundTime = currentRoundData.time || 0;
  if (!currentRoundData.completed && currentRoundStart) {
    liveRoundTime = (now - currentRoundStart) / 1000;
  }

  let overallTime = 0;
  for (let r = 1; r <= 4; r++) {
    if (r === currentRound && !roundState[r].completed && roundStartTimes[r]) {
      overallTime += (now - roundStartTimes[r]) / 1000;
    } else {
      overallTime += roundState[r].time || 0;
    }
  }

  const referenceCode = problem.referenceCode[currentLanguage];
  const explanations = problem.explanations[currentLanguage];

  const leaderboardEntries = [];
  Object.entries(attempts).forEach(([k, a]) => {
    if (!k.startsWith(problemId + "_")) return;
    if (!a.finalCompleted) return;
    const lang = k.split("_")[1];
    leaderboardEntries.push({
      name: user?.name || "Student",
      time: a.totalTimeSeconds || 0,
      language: lang,
    });
  });
  leaderboardEntries.sort((a, b) => a.time - b.time);

  const roundTitleMap = {
    1: "Round 1 – Type from reference",
    2: "Round 2 – Debug the code",
    3: "Round 3 – Blind typing (no reference)",
    4: "Round 4 – Test cases & final submission",
  };

  const elapsedSeconds = liveRoundTime || 0;
  const totalSeconds = overallTime || 0;

  const roundProgress =
    referenceCode && (currentRound === 1 || currentRound === 3)
      ? Math.min(100, (currentRoundData.code.length / referenceCode.length) * 100)
      : currentRound === 2
      ? currentRoundData.completed
        ? 100
        : 30
      : currentRound === 4
      ? currentRoundData.completed
        ? 100
        : 50
      : 0;

  return (
    <div className="space-y-4 text-xs">
      <div className="border border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold mb-1">{problem.title}</h1>
          <p className="text-[11px] text-slate-400">
            Problem #{problem.id} • Difficulty{" "}
            <span>{problem.difficulty}</span> • Language{" "}
            <span className="font-semibold">
              {currentLanguage.toUpperCase()}
            </span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Topics: {problem.topics.join(", ")} •{" "}
            <a
              href={problem.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sky-400 underline"
            >
              Watch learning video ↗
            </a>
          </p>
        </div>
        <div className="w-full md:w-64 space-y-2">
          <ProgressBar value={overallProgress} label="Overall progress" />
          <div className="flex flex-wrap gap-1">
            {[1, 2, 3, 4].map((r) => {
              const done = attempt?.roundCompleted?.[r];
              return (
                <button
                  key={r}
                  onClick={() => setCurrentRound(r)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] ${
                    currentRound === r
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-200"
                      : "border-slate-600 bg-slate-900 text-slate-300"
                  } ${done ? "border-dashed" : ""}`}
                >
                  R{r}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-400">
            Overall time: <span className="text-slate-100">{totalSeconds.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="border border-slate-700 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-center flex-1">
            <div className="text-base md:text-lg font-bold mb-1">
              {roundTitleMap[currentRound]}
            </div>
          </div>
          <div className="w-full md:w-64 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 px-2 py-1 rounded-lg border border-emerald-500/60 bg-slate-950 text-[11px] text-center">
                <div className="text-slate-400">Round time</div>
                <div className="text-sm font-semibold">
                  {elapsedSeconds.toFixed(1)}s
                </div>
              </div>
              <div className="flex-1 px-2 py-1 rounded-lg border border-emerald-500/60 bg-slate-950 text-[11px] text-center">
                <div className="text-slate-400">Overall</div>
                <div className="text-sm font-semibold">
                  {totalSeconds.toFixed(1)}s
                </div>
              </div>
            </div>
            <ProgressBar value={roundProgress} label="Round progress" big />
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>Language</span>
              <select
                className="bg-slate-900 border border-slate-700 rounded-full px-2 py-1 text-[11px]"
                value={currentLanguage}
                onChange={(e) => setCurrentLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <MonacoEditorWrapper
              language={currentLanguage}
              value={currentRoundData.code}
              onChange={handleCodeChange}
              height="260px"
            />
          </div>
          <div className="space-y-2">
            <div className="text-[11px] font-semibold mb-1">
              Line-by-line explanation
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
              {explanations.map((exp, idx) => (
                <li key={idx}>{exp}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center text-[11px] text-slate-400">
          <span>
            In production, this would compile &amp; run your code in a secure
            sandbox.
          </span>
          <button
            onClick={handleSubmitRound}
            className="px-4 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-semibold hover:bg-emerald-400"
          >
            {currentRound === 4 ? "Submit final answer" : "Submit round"}
          </button>
        </div>
      </div>

      <div className="border border-slate-700 rounded-2xl p-4">
        <h2 className="text-sm font-semibold mb-1">
          Leaderboard — {problem.title}
        </h2>
        <p className="text-[11px] text-slate-400 mb-2">
          Local-only scoreboard. A backend can later store this across all
          students.
        </p>
        <LeaderboardTable entries={leaderboardEntries} />
      </div>
    </div>
  );
}
