from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class MatchPlayerState(BaseModel):
    """State of a player in a competitive match"""
    user_id: str
    username: str
    code: str = ""
    completed: bool = False
    time_elapsed: float = 0.0
    used_hints: bool = False
    submission_time: Optional[datetime] = None
    score: int = 0  # For multiplayer ranking
    rank: Optional[int] = None  # Final rank in multiplayer match
    # For Code Shuffle mode
    shuffled_lines: Optional[List[str]] = None
    arranged_code: Optional[str] = None
    # For Test Master mode
    test_cases_created: Optional[List[Dict[str, str]]] = None
    test_cases_score: Optional[int] = None

class LobbyCreate(BaseModel):
    """Create a new multiplayer lobby"""
    problem_id: Optional[str] = None  # Optional - will be auto-generated if not provided
    game_mode: str = "standard"  # standard, bug_hunt, code_shuffle, test_master
    time_limit_seconds: int = 1500  # 25 minutes default
    max_players: int = 15  # Maximum 15 players
    lobby_name: Optional[str] = None  # Optional lobby name

class LobbyJoin(BaseModel):
    """Join an existing lobby"""
    game_id: str  # The lobby code/ID

class LobbyPublic(BaseModel):
    """Public lobby information"""
    game_id: str  # Short, shareable game code
    lobby_name: Optional[str] = None
    host_id: str
    host_username: str
    problem_id: str
    game_mode: str
    time_limit_seconds: int
    max_players: int
    players: List[MatchPlayerState]
    status: str  # waiting, starting, active, completed
    match_id: Optional[str] = None  # Match ID when game starts
    created_at: datetime
    started_at: Optional[datetime] = None

class MatchCreate(BaseModel):
    """Create a new competitive match (legacy 1v1)"""
    problem_id: str
    player1_id: str
    player2_id: str
    time_limit_seconds: int = 1500  # 25 minutes default
    game_mode: str = "standard"  # standard, bug_hunt, code_shuffle, test_master
    
class MatchBase(BaseModel):
    """Base match information"""
    problem_id: str
    # Legacy 1v1 support
    player1: Optional[MatchPlayerState] = None
    player2: Optional[MatchPlayerState] = None
    # Multiplayer support
    players: Optional[List[MatchPlayerState]] = None
    game_id: Optional[str] = None  # Lobby game code
    host_id: Optional[str] = None
    max_players: int = 2  # Default to 1v1, can be up to 15
    time_limit_seconds: int
    game_mode: str = "standard"  # standard, bug_hunt, code_shuffle, test_master
    buggy_code: Optional[str] = None  # For bug_hunt mode - the buggy code to fix
    status: str = "waiting"  # waiting, active, completed, cancelled
    winner_id: Optional[str] = None
    winners: Optional[List[str]] = None  # For multiplayer - top 3 players
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class MatchInDB(MatchBase):
    id: str

class MatchPublic(MatchBase):
    id: str

class MatchJoin(BaseModel):
    """Join an existing match"""
    match_id: str

class MatchSubmit(BaseModel):
    """Submit code for a match"""
    match_id: str
    code: str
    language: str
    # For Bug Hunt mode
    bug_report: Optional[str] = None
    # For Code Shuffle mode
    arranged_lines: Optional[List[str]] = None
    # For Test Master mode
    test_cases: Optional[List[Dict[str, str]]] = None

class MatchResult(BaseModel):
    """Result of a competitive match"""
    match_id: str
    winner_id: str
    winner_username: str
    loser_id: str
    loser_username: str
    winner_time: float
    loser_time: Optional[float]
    rating_change: int  # How much rating changed (positive for winner, negative for loser)
    xp_bonus: int  # Bonus XP awarded
