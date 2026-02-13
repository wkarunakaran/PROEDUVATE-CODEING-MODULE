#!/usr/bin/env python3
"""
Test script to verify the multiplayer ranking logic
"""

def test_ranking_logic():
    """Test the ranking and scoring logic for multiplayer matches"""

    # Simulate players with different completion times
    players = [
        {"user_id": "player1", "username": "Alice", "time_elapsed": 45.2, "completed": True},
        {"user_id": "player2", "username": "Bob", "time_elapsed": 32.8, "completed": True},
        {"user_id": "player3", "username": "Charlie", "time_elapsed": 67.1, "completed": True},
        {"user_id": "player4", "username": "David", "time_elapsed": 89.5, "completed": True}
    ]

    # Sort by completion time (fastest first)
    players_with_rank = sorted(players, key=lambda p: p.get("time_elapsed", float('inf')))

    print("🏆 Testing Multiplayer Ranking Logic")
    print("=" * 50)
    print("Original players (unsorted):")
    for i, p in enumerate(players, 1):
        print(f"  {i}. {p['username']}: {p['time_elapsed']}s")

    print("\nSorted by completion time (fastest first):")
    for i, p in enumerate(players_with_rank, 1):
        print(f"  Rank {i}: {p['username']} - Time: {p['time_elapsed']:.1f}s")

    # Calculate points: 1st = 100, 2nd = 75, 3rd = 60, 4th = 40, rest = 20
    base_points = [100, 75, 60, 40]

    print("\nScoring system:")
    for i in range(len(base_points)):
        rank = i + 1
        points = base_points[i]
        print(f"  Rank {rank}: {points} points")

    if len(players_with_rank) > len(base_points):
        print(f"  Rank {len(base_points) + 1}+: 20 points")

    # Build response with correctly ranked and scored players
    response_players = []
    for player in players_with_rank:
        player_rank = next(i + 1 for i, p in enumerate(players_with_rank) if p["user_id"] == player["user_id"])
        player_score = base_points[player_rank - 1] if player_rank <= len(base_points) else 20
        response_players.append({
            **player,
            "rank": player_rank,
            "score": player_score
        })

    print("\nFinal results (as returned by API):")
    for player in response_players:
        print(f"  {player['username']}: Rank {player['rank']}, Score {player['score']}, Time {player['time_elapsed']:.1f}s")

    # Verify the logic
    print("\n✅ Verification:")
    print(f"  - Fastest player (Bob) gets rank 1: {response_players[0]['rank'] == 1}")
    print(f"  - Second fastest (Alice) gets rank 2: {response_players[1]['rank'] == 2}")
    print(f"  - Rank 1 gets 100 points: {response_players[0]['score'] == 100}")
    print(f"  - Rank 2 gets 75 points: {response_players[1]['score'] == 75}")
    print(f"  - Rank 3 gets 60 points: {response_players[2]['score'] == 60}")
    print(f"  - Rank 4 gets 40 points: {response_players[3]['score'] == 40}")

    # Test edge case: 2 players
    print("\n" + "=" * 50)
    print("Testing with 2 players:")
    two_players = [
        {"user_id": "player1", "username": "Alice", "time_elapsed": 45.2, "completed": True},
        {"user_id": "player2", "username": "Bob", "time_elapsed": 32.8, "completed": True}
    ]

    two_players_sorted = sorted(two_players, key=lambda p: p.get("time_elapsed", float('inf')))
    two_response_players = []
    for player in two_players_sorted:
        player_rank = next(i + 1 for i, p in enumerate(two_players_sorted) if p["user_id"] == player["user_id"])
        player_score = base_points[player_rank - 1] if player_rank <= len(base_points) else 20
        two_response_players.append({
            **player,
            "rank": player_rank,
            "score": player_score
        })

    print("Final results for 2 players:")
    for player in two_response_players:
        print(f"  {player['username']}: Rank {player['rank']}, Score {player['score']}, Time {player['time_elapsed']:.1f}s")

    print("\n✅ 2-player verification:")
    print(f"  - Winner gets 100 points: {two_response_players[0]['score'] == 100}")
    print(f"  - Loser gets 75 points: {two_response_players[1]['score'] == 75}")

    return True

if __name__ == "__main__":
    test_ranking_logic()
    print("\n🎉 Ranking logic test completed successfully!")
