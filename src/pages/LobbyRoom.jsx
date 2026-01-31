import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Zap, Bug, Target, Crown, User, CheckCircle2, Copy, Clock, Gamepad2, Megaphone, Shuffle } from "lucide-react";
import { API_BASE } from "../utils/api";

export default function LobbyRoom() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    setCurrentUserId(userId);
    fetchLobby();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchLobby, 2000);
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchLobby = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/competitive/lobby/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Lobby not found");
      }

      const data = await res.json();
      setLobby(data);
      setLoading(false);

      // If game started, navigate to match
      if (data.status === "active" && data.match_id) {
        navigate(`/competitive/${data.match_id}`);
      }
    } catch (err) {
      console.error("Error fetching lobby:", err);
      setLoading(false);
      alert("Lobby not found or has been closed");
      navigate("/competitive");
    }
  };

  const handleStartGame = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/competitive/lobby/${gameId}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to start game");
      }

      const data = await res.json();
      // Will be redirected by the polling when status changes to active
      setTimeout(() => navigate(`/competitive/${data.match_id}`), 500);
    } catch (err) {
      console.error("Error starting game:", err);
      alert(err.message || "Failed to start game");
    }
  };

  const handleLeaveLobby = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE}/competitive/lobby/${gameId}/leave`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/competitive");
    } catch (err) {
      console.error("Error leaving lobby:", err);
      navigate("/competitive");
    }
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading lobby...</div>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Lobby not found</div>
      </div>
    );
  }

  const isHost = lobby.host_id === currentUserId;
  const playerCount = lobby.players.length;
  const maxPlayers = lobby.max_players;

  const gameModeIcons = {
    standard: <Zap size={32} />,
    bug_hunt: <Bug size={32} />,
    code_shuffle: <Shuffle size={32} />
  };

  const gameModeNames = {
    standard: "Code Sprint",
    bug_hunt: "Bug Hunt",
    code_shuffle: "Code Shuffle"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{lobby.lobby_name}</h1>
              <div className="flex items-center gap-4 text-gray-300">
                <span className="text-3xl">{gameModeIcons[lobby.game_mode] || <Gamepad2 size={32} />}</span>
                <span className="text-lg">{gameModeNames[lobby.game_mode]}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-gray-400 text-sm mb-1">Game ID</div>
              <div className="flex items-center gap-2">
                <div className="bg-purple-600/30 px-6 py-3 rounded-lg font-mono text-3xl font-bold text-white tracking-wider border-2 border-purple-500">
                  {gameId}
                </div>
                <button
                  onClick={copyGameId}
                  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                  title="Copy Game ID"
                >
                  {copySuccess ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                </button>
              </div>
              {copySuccess && (
                <div className="text-green-400 text-sm mt-1">Copied to clipboard!</div>
              )}
            </div>
          </div>

          {/* Game Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Host</div>
              <div className="text-white font-semibold">{lobby.host_username}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Players</div>
              <div className="text-white font-semibold">{playerCount} / {maxPlayers}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Time Limit</div>
              <div className="text-white font-semibold">{lobby.time_limit_seconds / 60} min</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Status</div>
              <div className="text-yellow-400 font-semibold">
                {lobby.status === "waiting" ? (
                  <span className="flex items-center gap-1"><Clock size={16} /> Waiting</span>
                ) : (
                  <span className="flex items-center gap-1"><Gamepad2 size={16} /> Starting</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={playerCount < 2}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {playerCount < 2 ? "Need at least 2 players" : "Start Game"}
              </button>
            ) : (
              <div className="flex-1 bg-yellow-600/20 border-2 border-yellow-600 text-yellow-300 font-semibold py-4 rounded-lg text-center">
                Waiting for host to start...
              </div>
            )}
            <button
              onClick={handleLeaveLobby}
              className="px-8 py-4 bg-red-600/20 border-2 border-red-600 text-red-300 font-semibold rounded-lg hover:bg-red-600/30 transition-all"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Players in Lobby</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lobby.players.map((player, index) => (
              <div
                key={player.user_id}
                className={`p-4 rounded-lg border-2 ${player.user_id === currentUserId
                  ? "border-purple-500 bg-purple-500/20"
                  : "border-white/20 bg-white/5"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-lg">
                      {player.username}
                      {player.user_id === lobby.host_id && (
                        <span className="ml-2 text-yellow-400"><Crown size={18} /></span>
                      )}
                      {player.user_id === currentUserId && (
                        <span className="ml-2 text-purple-400">(You)</span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">Player #{index + 1}</div>
                  </div>
                  <CheckCircle2 className="text-green-400" size={24} />
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: maxPlayers - playerCount }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="p-4 rounded-lg border-2 border-dashed border-white/10 bg-white/5"
              >
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-500 text-center">
                    <User size={32} className="text-gray-500 mx-auto mb-2" />
                    <div className="text-sm">Waiting for player...</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-500/10 backdrop-blur-md rounded-xl p-6 border-2 border-blue-500/30">
          <h3 className="text-xl font-bold text-blue-300 mb-3 flex items-center gap-2">
            <Megaphone size={24} /> How to Invite Players
          </h3>
          <ol className="text-gray-300 space-y-2 list-decimal list-inside">
            <li>Share the Game ID <span className="font-mono font-bold text-white">{gameId}</span> with your friends</li>
            <li>They can join by clicking "Join Game" and entering the Game ID</li>
            <li>Once enough players join, the host can start the game</li>
            <li>Everyone competes to solve the same problem - fastest wins!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
