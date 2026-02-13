import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { API_BASE } from "../utils/api";
import { useToast } from "../context/ToastContext";

export default function LobbyJoin() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinLobby = async (e) => {
    e.preventDefault();
    if (!gameId.trim()) {
      showToast("Please enter a Game ID", "warning");
      return;
    }

    // Check authentication first
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("You must be logged in to join a lobby. Please login first.", "error");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      console.log("🎮 Attempting to join lobby:", gameId.toUpperCase().trim());

      const res = await fetch(`${API_BASE}/competitive/lobby/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ game_id: gameId.toUpperCase().trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("❌ Join error:", error);

        // Handle specific error cases
        if (res.status === 401) {
          showToast("Your session has expired. Please login again.", "error");
          navigate("/login");
          return;
        }

        throw new Error(error.detail || "Failed to join lobby");
      }

      const data = await res.json();
      console.log("✅ Successfully joined lobby:", data.lobby.game_id);

      // Navigate to lobby room
      navigate(`/lobby/${data.lobby.game_id}`);
    } catch (err) {
      console.error("Error joining lobby:", err);
      showToast(err.message || "Failed to join lobby. Check the Game ID and try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          <div className="text-center mb-8">
            <Gamepad2 size={64} className="text-purple-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Join Game</h1>
            <p className="text-muted-foreground">Enter the Game ID to join a lobby</p>
          </div>

          <form onSubmit={handleJoinLobby} className="space-y-6">
            <div>
              <label className="block text-foreground font-semibold mb-2">
                Game ID
              </label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength="6"
                className="w-full px-6 py-4 rounded-xl bg-input border border-input text-foreground text-center text-3xl font-mono font-bold tracking-widest placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                required
              />
              <p className="text-muted-foreground text-sm mt-2 text-center">
                Enter the 6-character code shared by the host
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !gameId.trim()}
                className="flex-1 bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? "Joining..." : "Join Game"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/competitive")}
                className="px-6 py-4 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-gray-400 mb-3">Don't have a Game ID?</p>
              <button
                onClick={() => navigate("/lobby/create")}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 font-semibold underline"
              >
                Create Your Own Game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
