import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Zap, Bug, Target, Trophy, Lightbulb, CheckCircle2, XCircle, AlertTriangle, Play, Shuffle, Medal, Award, Clock as ClockIcon } from "lucide-react";
import MonacoEditorWrapper from "../components/MonacoEditorWrapper";
import { API_BASE } from "../utils/api";

export default function CompetitiveMatch() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [usedHints, setUsedHints] = useState(false);
  const timerRef = useRef(null);

  // For Code Shuffle mode
  const [shuffledLines, setShuffledLines] = useState([]);
  const [arrangedLines, setArrangedLines] = useState([]);

  // For Test Master mode
  const [testCases, setTestCases] = useState([{ input: "", expected: "" }]);

  // For Match Completion Leaderboard
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState(null);

  useEffect(() => {
    fetchMatch();
    startTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [matchId]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  };

  const fetchMatch = async () => {
    try {
      const token = localStorage.getItem("token");
      const currentUserId = localStorage.getItem("userId");

      // 1. Fetch Match Details
      const res = await fetch(`${API_BASE}/competitive/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Match not found");
        throw new Error("Failed to load match");
      }

      const data = await res.json();
      console.log("Match data:", data);
      setMatch(data);

      // 2. Determine Correct Problem ID (Multi-problem support)
      let problemIdToFetch = data.problem_id; // Default to legacy single ID
      let currentProblemIndex = 0;

      // Find current player to check progress
      let currentPlayer = null;
      if (data.players) {
        currentPlayer = data.players.find(p => p.user_id === currentUserId);
      } else if (data.player1 && data.player1.user_id === currentUserId) {
        currentPlayer = data.player1;
      } else if (data.player2 && data.player2.user_id === currentUserId) {
        currentPlayer = data.player2;
      }

      // If multi-problem match, use progress to pick ID
      if (currentPlayer && data.problem_ids && data.problem_ids.length > 0) {
        currentProblemIndex = currentPlayer.current_problem_index || 0;

        // Safety check: Don't go out of bounds
        if (currentProblemIndex >= data.problem_ids.length) {
          currentProblemIndex = data.problem_ids.length - 1;
        }

        problemIdToFetch = data.problem_ids[currentProblemIndex];
        console.log(`📡 Resuming at Problem ${currentProblemIndex + 1}/${data.problem_ids.length} (ID: ${problemIdToFetch})`);
      }

      // 3. Fetch Problem Details
      if (problemIdToFetch) {
        const problemRes = await fetch(`${API_BASE}/problems/${problemIdToFetch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const problemData = await problemRes.json();

        if (!problemRes.ok || problemData.detail) {
          console.error("❌ Problem fetch failed:", problemData);
          setProblem({ error: "Problem data missing or deleted. This match may be invalid." });
          return; // Stop loading
        }

        console.log("✅ Problem loaded:", problemData.title);
        setProblem(problemData);

        // Load Code / Game Mode Specifics
        loadGameModeContent(data, problemData, currentUserId);
      } else {
        setProblem({ error: "No problem ID found for this match." });
      }

    } catch (err) {
      console.error("Error fetching match:", err);
      alert("Failed to load match: " + err.message);
      navigate("/competitive");
    }
  };

  // Helper to fix escaped newlines from seed data
  const sanitizeCode = (codeStr) => {
    if (!codeStr) return "";
    return codeStr.replace(/\\n/g, '\n');
  };

  const loadGameModeContent = (matchData, problemData, currentUserId) => {
    const gameMode = matchData.game_mode || "standard";
    console.log("🎮 Game Mode:", gameMode);

    if (gameMode === "bug_hunt") {
      // Load buggy code for Bug Hunt mode
      const buggyFromMatch = matchData.buggy_code || "";
      const buggyFromProblem = problemData.buggyCode?.[language] || "";
      const starterFallback = problemData.starterCode?.[language] || "";
      const buggyCodeToUse = buggyFromMatch || buggyFromProblem || starterFallback;

      if (buggyCodeToUse) {
        setCode(sanitizeCode(buggyCodeToUse));
      } else {
        setCode("// No buggy code available");
      }
    } else if (gameMode === "code_shuffle") {
      // Load shuffled lines
      let shuffled = [];
      if (matchData.players && matchData.players.length > 0) {
        const p = matchData.players.find(user => user.user_id === currentUserId);
        shuffled = p?.shuffled_lines || [];
      } else {
        // Legacy 1v1
        const pKey = matchData.player1.user_id === currentUserId ? "player1" : "player2";
        shuffled = matchData[pKey]?.shuffled_lines || [];
      }
      setShuffledLines(shuffled);
      setArrangedLines([...shuffled]);
    } else {
      // Standard mode - load starter code
      const starter = problemData.starterCode?.[language] || "";
      setCode(sanitizeCode(starter));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setOutput("Running tests...");

    try {
      const token = localStorage.getItem("token");
      const gameMode = match.game_mode || "standard";

      let submissionBody = {
        match_id: matchId,
        code,
        language,
      };

      // Add game mode specific data
      if (gameMode === "code_shuffle") {
        submissionBody.arranged_lines = arrangedLines;
      } else if (gameMode === "test_master") {
        submissionBody.test_cases = testCases.filter(tc => tc.input || tc.expected);
      }
      // Bug Hunt mode just sends the fixed code

      const res = await fetch(`${API_BASE}/competitive/matches/${matchId}/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionBody),
      });

      const data = await res.json();
      console.log("📥 Submission response:", data); // Debug log

      if (res.ok) {
        // Multi-problem race: Check if there's a next problem
        if (data.next_problem) {
          console.log("🎯 Next problem detected! Auto-loading...");
          // Player solved current problem, load next one immediately
          setProblem(data.next_problem);
          setCode(data.next_problem.starterCode?.[language] || "");
          setOutput(`✅ Problem ${data.problems_solved}/${data.total_problems} solved! Loading next problem...\n\nTime: ${data.time_elapsed?.toFixed(2) || 0}s | Score: ${data.score || 0}`);

          // Update progress tracking if needed
          if (data.progress) {
            console.log(`Progress: ${data.progress.current}/${data.progress.total}`);
          }

          setLoading(false);
          return; // Exit early, don't show leaderboard
        }

        // Check if all problems solved but waiting for others
        if (data.all_problems_complete && !data.winner_id && !data.winners) {
          setOutput(`✅ All ${data.total_problems || 5} problems solved! Waiting for other players to finish...\n\nYour Score: ${data.score || 0}\nTime: ${data.time_elapsed?.toFixed(2) || 0}s`);
          setLoading(false);
          return;
        }

        if (data.winner_id || data.winners) {
          // Match completed - store results and show leaderboard
          const currentUserId = localStorage.getItem("userId");

          if (data.winners) {
            // Multiplayer match completed
            const rank = data.rank || players.findIndex(p => p.user_id === currentUserId) + 1;

            setFinalResults({
              type: 'multiplayer',
              rank,
              score: data.final_score || data.score || 0,
              winners: data.winners,
              players: data.players || players,
              currentUserId
            });
          } else {
            // 1v1 match completed
            const isWinner = data.winner_id === currentUserId;

            setFinalResults({
              type: '1v1',
              isWinner,
              winnerId: data.winner_id,
              winnerUsername: data.winner_username,
              winnerTime: data.winner_time,
              player1: {
                userId: match.player1?.user_id || '',
                username: match.player1?.username || 'Player 1',
                completed: true,
                completionTime: data.winner_id === match.player1?.user_id ? data.winner_time : data.loser_time,
                isWinner: data.winner_id === match.player1?.user_id
              },
              player2: {
                userId: match.player2?.user_id || '',
                username: match.player2?.username || 'Player 2',
                completed: true,
                completionTime: data.winner_id === match.player2?.user_id ? data.winner_time : data.loser_time,
                isWinner: data.winner_id === match.player2?.user_id
              },
              ratingChange: data.rating_change,
              xpBonus: data.xp_bonus,
              currentUserId
            });
          }

          setMatchCompleted(true);

          // Still redirect after 5 seconds
          setTimeout(() => navigate("/competitive"), 5000);

          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        } else {
          const waitMsg = data.message || "✅ Solution submitted! Waiting for other players to finish...";
          if (data.score) {
            setOutput(`${waitMsg}\n\nYour Score: ${data.score}`);
          } else {
            setOutput(waitMsg);
          }
        }

        if (timerRef.current && (data.winner_id || data.winners)) {
          clearInterval(timerRef.current);
        }
      } else {
        setOutput(`❌ ${data.detail || "Submission failed"}`);
      }
    } catch (err) {
      console.error("Error submitting solution:", err);
      setOutput("❌ Error submitting solution");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    const gameMode = match.game_mode || "standard";

    if (gameMode === "code_shuffle") {
      // For Code Shuffle, execute the arranged code to test if it works
      const arrangedCode = arrangedLines.join('\n');

      if (!arrangedCode.trim()) {
        setOutput("⚠️ Please arrange some code lines first!");
        return;
      }

      setLoading(true);
      setOutput("Testing your arranged code...");

      try {
        const token = localStorage.getItem("token");

        // Use the first example or test case as a sample
        const sampleInput = problem.examples?.[0]?.input || problem.testCases?.[0]?.input || "";
        const expectedOutput = problem.examples?.[0]?.output || problem.testCases?.[0]?.expected || "";

        const res = await fetch(`${API_BASE}/execute`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: arrangedCode,
            language: language,
            input: sampleInput,
          }),
        });

        const data = await res.json();

        if (data.success) {
          const actualOutput = data.output.trim();
          const expected = expectedOutput.trim();
          const passed = actualOutput === expected;

          setOutput(
            `📋 Your Arranged Code:\n${arrangedCode}\n\n` +
            `🧪 Sample Test Result:\n\n` +
            `Input:\n${sampleInput}\n\n` +
            `Expected Output:\n${expected}\n\n` +
            `Your Output:\n${actualOutput}\n\n` +
            `Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n\n` +
            `💡 This is just a sample test. Submit to check arrangement accuracy!`
          );
        } else {
          setOutput(
            `📋 Your Arranged Code:\n${arrangedCode}\n\n` +
            `❌ Runtime Error:\n\n${data.error || data.output}\n\n` +
            `💡 The code arrangement might be incorrect or have syntax errors!`
          );
        }
      } catch (err) {
        console.error("Error running arranged code:", err);
        setOutput("❌ Error running code. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (gameMode === "test_master") {
      // For Test Master, show created test cases
      const validTestCases = testCases.filter(tc => tc.input || tc.expected);
      if (validTestCases.length === 0) {
        setOutput("⚠️ No test cases created yet. Add some test cases to review.");
        return;
      }
      let output = `📋 Your Test Cases (${validTestCases.length} total):\n\n`;
      validTestCases.forEach((tc, idx) => {
        output += `Test Case ${idx + 1}:\n`;
        output += `  Input: ${tc.input || '(empty)'}\n`;
        output += `  Expected: ${tc.expected || '(empty)'}\n\n`;
      });
      output += "💡 Tip: Make sure to include edge cases!";
      setOutput(output);
      return;
    }

    // For Standard and Bug Hunt modes - run code with sample tests
    if (!code.trim()) {
      setOutput("⚠️ Please write some code first!");
      return;
    }

    setLoading(true);
    setOutput("Running sample tests...");

    try {
      const token = localStorage.getItem("token");

      // Use the first example or test case as a sample
      const sampleInput = problem.examples?.[0]?.input || problem.testCases?.[0]?.input || "";
      const expectedOutput = problem.examples?.[0]?.output || problem.testCases?.[0]?.expected || "";

      const res = await fetch(`${API_BASE}/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          input: sampleInput,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const actualOutput = data.output.trim();
        const expected = expectedOutput.trim();
        const passed = actualOutput === expected;

        setOutput(
          `🧪 Sample Test Result:\n\n` +
          `Input:\n${sampleInput}\n\n` +
          `Expected Output:\n${expected}\n\n` +
          `Your Output:\n${actualOutput}\n\n` +
          `Status: ${passed ? '✅ PASSED' : '❌ FAILED'}\n\n` +
          `💡 This is just a sample test. Submit to run all test cases!`
        );
      } else {
        setOutput(
          `❌ Runtime Error:\n\n${data.error || data.output}\n\n` +
          `💡 Fix the error and try again!`
        );
      }
    } catch (err) {
      console.error("Error running code:", err);
      setOutput("❌ Error running code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseHint = async () => {
    if (usedHints) {
      alert("You have already used a hint in this match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/competitive/matches/${matchId}/hint`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsedHints(true);
      alert("Hint used! Note: This reduces your potential XP bonus.");
    } catch (err) {
      console.error("Error using hint:", err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLineMove = (fromIndex, direction) => {
    const newLines = [...arrangedLines];
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= newLines.length) return;

    [newLines[fromIndex], newLines[toIndex]] = [newLines[toIndex], newLines[fromIndex]];
    setArrangedLines(newLines);
  };

  const handleDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const items = Array.from(arrangedLines);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setArrangedLines(items);
  };

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected: "" }]);
  };

  const removeTestCase = (index) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const getGameModeInfo = () => {
    const mode = match?.game_mode || "standard";
    const modes = {
      standard: { name: "Code Sprint", icon: <Zap size={20} />, color: "emerald" },
      bug_hunt: { name: "Bug Hunt", icon: <Bug size={20} />, color: "red" },
      code_shuffle: { name: "Code Shuffle", icon: <Shuffle size={20} />, color: "purple" },
    };
    return modes[mode] || modes.standard;
  };

  if (!match || !problem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400"></div>
          <div>Loading match...</div>
        </div>
      </div>
    );
  }

  // Error State - Problem Missing or Match Invalid
  if (problem?.error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center p-8 bg-slate-900 rounded-lg border border-red-900/50 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Match Validation Failed</h2>
          <p className="text-slate-400 mb-6">{problem.error}</p>
          <p className="text-xs text-slate-500 mb-6">
            This usually happens if the problem database was updated while you were in a match.
          </p>
          <button
            onClick={() => navigate('/competitive')}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors"
          >
            ← Back to Competitive
          </button>
        </div>
      </div>
    );
  }

  const timeLimit = match.time_limit_seconds;
  const timeRemaining = Math.max(0, timeLimit - timeElapsed);
  const timeProgress = (timeElapsed / timeLimit) * 100;
  const gameMode = match.game_mode || "standard";
  const modeInfo = getGameModeInfo();

  // Check if this is a multiplayer match
  const isMultiplayer = match.players && match.players.length > 2;
  const players = match.players || [match.player1, match.player2].filter(p => p);
  const currentUserId = localStorage.getItem("userId");
  const currentPlayer = players.find(p => p.user_id === currentUserId);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-700 p-4 bg-slate-900">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <span>{modeInfo.icon}</span>
              <span>{modeInfo.name}</span>
              {isMultiplayer ? (
                <span className="text-sm text-slate-400">
                  {players.length} Players
                  {match.game_id && <span className="ml-2 font-mono text-purple-400">{match.game_id}</span>}
                </span>
              ) : (
                <span className="text-sm text-slate-400">
                  {match.player1?.username || 'Player 1'} vs {match.player2?.username || "Waiting..."}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">{problem.title}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`text-right ${timeRemaining < 60 ? 'text-red-400' : 'text-slate-300'}`}>
              <div className="text-xs text-slate-400">Time Remaining</div>
              <div className="text-xl font-mono font-bold">
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Player Status */}
            {isMultiplayer ? (
              <div className="text-right">
                <div className="text-xs text-slate-400">Completed</div>
                <div className="text-sm font-medium text-slate-300">
                  {players.filter(p => p.completed).length} / {players.length}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Player Progress Bars for 1v1 */}
        {!isMultiplayer && match.player2 && (
          <div className="mb-3 space-y-2">
            {/* Player 1 (Current User) */}
            <div className="flex items-center gap-3">
              <div className="w-32 text-xs text-slate-300 font-medium truncate">
                {match.player1?.username || 'Player 1'}
                {match.player1?.user_id === currentUserId && (
                  <span className="ml-1 text-purple-400">(You)</span>
                )}
              </div>
              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden relative">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${match.player1?.completed ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  style={{
                    width: `${Math.max(5, ((match.player1?.problems_solved || 0) / (match.total_problems || 5)) * 100)}%`
                  }}
                />
              </div>
              <div className="w-20 text-xs text-right">
                {match.player1?.completed ? (
                  <span className="text-emerald-400 font-medium">✓ Done</span>
                ) : (
                  <span className="text-blue-400">
                    {match.player1?.problems_solved || 0}/{match.total_problems || 5} solved
                  </span>
                )}
              </div>
            </div>

            {/* Player 2 (Opponent) */}
            <div className="flex items-center gap-3">
              <div className="w-32 text-xs text-slate-300 font-medium truncate">
                {match.player2?.username || 'Player 2'}
                {match.player2?.user_id === currentUserId && (
                  <span className="ml-1 text-purple-400">(You)</span>
                )}
              </div>
              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden relative">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${match.player2?.completed ? 'bg-emerald-500' : 'bg-purple-500'
                    }`}
                  style={{
                    width: `${Math.max(5, ((match.player2?.problems_solved || 0) / (match.total_problems || 5)) * 100)}%`
                  }}
                />
              </div>
              <div className="w-20 text-xs text-right">
                {match.player2.completed ? (
                  <span className="text-emerald-400 font-medium">✓ Done</span>
                ) : (
                  <span className="text-purple-400">
                    {match.player2.problems_solved || 0}/{match.total_problems || 5} solved
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Players List for Multiplayer */}
        {isMultiplayer && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
            {players.map((player, idx) => (
              <div
                key={player?.user_id || idx}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border ${player?.user_id === currentUserId
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : player?.completed
                    ? 'border-green-500 bg-green-500/20 text-green-300'
                    : 'border-slate-600 bg-slate-800 text-slate-400'
                  }`}
              >
                {player?.rank && <span className="font-bold mr-1">#{player.rank}</span>}
                {player?.username || `Player ${idx + 1}`}
                {player?.completed && <span className="ml-1">✓</span>}
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all ${timeProgress > 90 ? 'bg-red-500' :
              timeProgress > 70 ? 'bg-orange-500' :
                'bg-emerald-500'
              }`}
            style={{ width: `${timeProgress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Description */}
        <div className="w-1/3 border-r border-slate-700 overflow-y-auto p-4 bg-slate-950">
          <div className="mb-4">
            <h2 className="text-sm font-semibold mb-2 text-emerald-400">Problem</h2>
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded ${problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                {problem.difficulty}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{problem.description}</p>
          </div>

          {problem.examples && problem.examples.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-blue-400">Examples</h3>
              {problem.examples.map((ex, idx) => (
                <div key={idx} className="mb-3 p-3 bg-slate-900 rounded border border-slate-700">
                  <div className="text-xs mb-1 text-slate-500">Example {idx + 1}</div>
                  <div className="text-xs space-y-2">
                    <div>
                      <div className="text-slate-400 font-semibold mb-1">Input:</div>
                      <div className="font-mono text-xs text-emerald-400 bg-slate-800 p-2 rounded whitespace-pre">{ex.input}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-semibold mb-1">Output:</div>
                      <div className="font-mono text-xs text-blue-400 bg-slate-800 p-2 rounded whitespace-pre">{ex.output}</div>
                    </div>
                    {ex.explanation && (
                      <div>
                        <div className="text-slate-400 font-semibold mb-1">Explanation:</div>
                        <div className="text-xs text-slate-300">{ex.explanation}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {problem.hint && (
            <div className="mb-4">
              <button
                onClick={handleUseHint}
                disabled={usedHints}
                className={`text-xs px-3 py-1 rounded ${usedHints
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                  }`}
              >
                <span className="flex items-center gap-1">
                  <Lightbulb size={14} />
                  {usedHints ? 'Hint Used' : 'Use Hint (reduces XP bonus)'}
                </span>
              </button>
              {usedHints && (
                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
                  {problem.hint}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Code Editor & Output */}
        <div className="flex-1 flex flex-col">
          {/* Bug Hunt Mode Banner */}
          {gameMode === "bug_hunt" && (
            <div className="bg-red-500/10 border-b border-red-500/30 p-3">
              <div className="flex items-center gap-3">
                <Bug size={32} className="text-red-400" />
                <div>
                  <h3 className="text-sm font-bold text-red-400">Bug Hunt Challenge</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    The code below contains bugs! Find and fix all errors to make it pass the test cases.
                    <span className="text-red-300 font-semibold"> Copy/Paste is disabled</span> - you must manually edit the code.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Game Mode Specific UI */}
          {gameMode === "code_shuffle" ? (
            /* Code Shuffle Mode */
            <div className="flex-1 overflow-hidden p-4">
              <div className="h-full flex flex-col">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-purple-400 mb-2">
                    🔀 Arrange the code lines in the correct order
                  </h3>
                  <p className="text-xs text-slate-400">
                    Drag lines to reorder or use arrow buttons. At least 80% accuracy required.
                  </p>
                </div>

                {arrangedLines.length === 0 ? (
                  /* No lines available - show error */
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-red-400 mb-2">No Code Lines Available</h3>
                      <p className="text-sm text-slate-400 mb-4">
                        This problem doesn't have reference code for shuffling.
                      </p>
                      <p className="text-xs text-slate-500">
                        Please try a different problem or contact an administrator.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Code lines available - show drag & drop interface */
                  <>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="code-lines">
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex-1 overflow-y-auto space-y-2 mb-4"
                            style={{
                              backgroundColor: snapshot.isDraggingOver ? 'rgba(139, 92, 246, 0.05)' : 'transparent',
                            }}
                          >
                            {arrangedLines.map((line, idx) => (
                              <Draggable key={`line-${idx}`} draggableId={`line-${idx}`} index={idx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-2 bg-slate-900 border rounded p-2 transition-all ${snapshot.isDragging
                                      ? 'border-purple-500 shadow-lg shadow-purple-500/20 scale-105'
                                      : 'border-slate-700'
                                      }`}
                                  >
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-800 rounded"
                                      title="Drag to reorder"
                                    >
                                      <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <button
                                        onClick={() => handleLineMove(idx, "up")}
                                        disabled={idx === 0}
                                        className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                                        title="Move up"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        onClick={() => handleLineMove(idx, "down")}
                                        disabled={idx === arrangedLines.length - 1}
                                        className="text-xs px-2 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-30 transition-colors"
                                        title="Move down"
                                      >
                                        ↓
                                      </button>
                                    </div>
                                    <div className="text-xs font-bold text-slate-500 w-8 text-center">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1 font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-x-auto whitespace-pre">
                                      {line}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    <div className="flex gap-2">
                      <button
                        onClick={handleRun}
                        disabled={loading}
                        className={`px-4 py-2 rounded font-medium ${loading
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                      >
                        {loading ? 'Running...' : '▶ Run & Preview'}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`flex-1 px-4 py-2 rounded font-medium ${loading
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                          }`}
                      >
                        {loading ? 'Submitting...' : 'Submit Arrangement'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : gameMode === "test_master" ? (
            /* Test Master Mode */
            <div className="flex-1 overflow-hidden p-4">
              <div className="h-full flex flex-col">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-blue-400 mb-2">
                    <span className="flex items-center gap-2"><Target size={16} /> Create comprehensive test cases</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create diverse test cases covering edge cases. Minimum score: 60/100.
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="border border-slate-700 rounded p-3 bg-slate-900">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-slate-400">Test Case {idx + 1}</div>
                        {testCases.length > 1 && (
                          <button
                            onClick={() => removeTestCase(idx)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Input</label>
                          <textarea
                            value={tc.input}
                            onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-600 rounded p-2 text-xs font-mono"
                            rows="2"
                            placeholder='e.g., [1, 2, 3]'
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Expected Output</label>
                          <textarea
                            value={tc.expected}
                            onChange={(e) => updateTestCase(idx, "expected", e.target.value)}
                            className="w-full bg-slate-950 border border-slate-600 rounded p-2 text-xs font-mono"
                            rows="2"
                            placeholder='e.g., 6'
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleRun}
                    disabled={loading}
                    className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600"
                  >
                    ▶ Review Test Cases
                  </button>
                  <button
                    onClick={addTestCase}
                    className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-600"
                  >
                    + Add Test Case
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`flex-1 px-4 py-2 rounded font-medium ${loading
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                  >
                    {loading ? 'Submitting...' : 'Submit Test Cases'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Standard and Bug Hunt Mode - Code Editor with copy-paste disabled */
            <>
              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="p-2 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-600"
                      >
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                      </select>
                      {gameMode === "bug_hunt" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-400 font-semibold">🐛 Bug Hunt Mode</span>
                          <span className="text-xs text-slate-400">
                            | Fix all bugs in the code below | ⚠️ Copy/Paste Disabled
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">⚠️ Copy/Paste Disabled</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleRun}
                        disabled={loading || !code.trim()}
                        className={`px-4 py-1 rounded text-xs font-medium ${loading || !code.trim()
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                      >
                        {loading ? 'Running...' : '▶ Run'}
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !code.trim()}
                        className={`px-4 py-1 rounded text-xs font-medium ${loading || !code.trim()
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : `bg-${modeInfo.color}-500 text-white hover:bg-${modeInfo.color}-600`
                          }`}
                      >
                        {loading ? 'Submitting...' : 'Submit Solution'}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <MonacoEditorWrapper
                      value={code}
                      onChange={setCode}
                      language={language}
                      disableCopyPaste={true}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Output */}
          {output && (
            <div className="h-32 border-t border-slate-700 bg-slate-950 p-3 overflow-y-auto">
              <div className="text-xs font-semibold text-slate-400 mb-1">Output</div>
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Match Completion Leaderboard Overlay */}
      {matchCompleted && finalResults && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/30">
            {finalResults.type === '1v1' ? (
              /* 1v1 Leaderboard */
              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                  <h1 className="text-4xl font-bold text-white mb-2">Match Complete!</h1>
                  <p className="text-xl text-slate-300">
                    {finalResults.isWinner ? '🎉 Victory!' : 'Better luck next time!'}
                  </p>
                </div>

                {/* Player Comparison */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {/* Player 1 */}
                  <div className={`p-6 rounded-xl border-2 ${finalResults.player1.isWinner
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-slate-700 bg-slate-800/50'
                    }`}>
                    <div className="text-center">
                      {finalResults.player1.isWinner && (
                        <Trophy size={32} className="text-yellow-400 mx-auto mb-2" />
                      )}
                      <div className={`text-2xl font-bold mb-2 ${finalResults.player1.isWinner ? 'text-yellow-400' : 'text-slate-300'
                        }`}>
                        {finalResults.player1.username}
                      </div>
                      {finalResults.player1.userId === finalResults.currentUserId && (
                        <div className="text-sm text-purple-400 mb-2">(You)</div>
                      )}
                      <div className={`text-sm font-medium mb-1 ${finalResults.player1.isWinner ? 'text-yellow-300' : 'text-slate-400'
                        }`}>
                        {finalResults.player1.isWinner ? '🏆 Winner' : '2nd Place'}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-slate-300 mt-3">
                        <ClockIcon size={16} />
                        <span>{finalResults.player1.completionTime?.toFixed(1) || 'N/A'}s</span>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className={`p-6 rounded-xl border-2 ${finalResults.player2.isWinner
                    ? 'border-yellow-500 bg-yellow-500/10'
                    : 'border-slate-700 bg-slate-800/50'
                    }`}>
                    <div className="text-center">
                      {finalResults.player2.isWinner && (
                        <Trophy size={32} className="text-yellow-400 mx-auto mb-2" />
                      )}
                      <div className={`text-2xl font-bold mb-2 ${finalResults.player2.isWinner ? 'text-yellow-400' : 'text-slate-300'
                        }`}>
                        {finalResults.player2.username}
                      </div>
                      {finalResults.player2.userId === finalResults.currentUserId && (
                        <div className="text-sm text-purple-400 mb-2">(You)</div>
                      )}
                      <div className={`text-sm font-medium mb-1 ${finalResults.player2.isWinner ? 'text-yellow-300' : 'text-slate-400'
                        }`}>
                        {finalResults.player2.isWinner ? '🏆 Winner' : '2nd Place'}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-slate-300 mt-3">
                        <ClockIcon size={16} />
                        <span>{finalResults.player2.completionTime?.toFixed(1) || 'N/A'}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Change */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Rating Change</div>
                      <div className={`text-2xl font-bold ${finalResults.isWinner ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {finalResults.isWinner ? '+' : '-'}{finalResults.ratingChange || 0}
                      </div>
                    </div>
                    {finalResults.isWinner && finalResults.xpBonus && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">XP Bonus</div>
                        <div className="text-2xl font-bold text-emerald-400">
                          +{finalResults.xpBonus}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate("/competitive")}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Back to Competitive
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">
                  Redirecting in 5 seconds...
                </p>
              </div>
            ) : (
              /* Multiplayer Leaderboard */
              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <Award size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce" />
                  <h1 className="text-4xl font-bold text-white mb-2">Match Complete!</h1>
                  <p className="text-xl text-slate-300">
                    Your Rank: #{finalResults.rank}
                  </p>
                </div>

                {/* Leaderboard */}
                <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                  <h2 className="text-xl font-bold text-white mb-4">Final Rankings</h2>
                  <div className="space-y-3">
                    {(finalResults.players || []).map((player, idx) => {
                      const rank = idx + 1;
                      const isCurrentUser = player?.user_id === finalResults.currentUserId;
                      const getMedalIcon = () => {
                        if (rank === 1) return <Trophy size={24} className="text-yellow-400" />;
                        if (rank === 2) return <Medal size={24} className="text-gray-400" />;
                        if (rank === 3) return <Medal size={24} className="text-orange-600" />;
                        return <div className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">{rank}</div>;
                      };

                      return (
                        <div
                          key={player?.user_id || idx}
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 ${isCurrentUser
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-slate-700 bg-slate-900/50'
                            }`}
                        >
                          <div className="flex-shrink-0">
                            {getMedalIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
                                {player?.username || `Player ${idx + 1}`}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs text-purple-400">(You)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span>Score: {player.score || finalResults.score || 0}</span>
                              {player.completion_time && (
                                <span className="flex items-center gap-1">
                                  <ClockIcon size={12} />
                                  {player.completion_time.toFixed(1)}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Your Stats */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <div className="text-xs text-slate-400 mb-1">Your Final Score</div>
                    <div className="text-3xl font-bold text-emerald-400">
                      {finalResults.score}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate("/competitive")}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Back to Competitive
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">
                  Redirecting in 5 seconds...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
