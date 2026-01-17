from pydantic import BaseModel
from typing import Dict

class RoundState(BaseModel):
    code: str
    completed: bool = False
    time: float = 0.0

class AttemptBase(BaseModel):
    user_id: str
    problem_id: str
    language: str  # python|cpp|java
    roundState: Dict[str, RoundState] = {}
    roundCompleted: Dict[str, bool] = {}
    totalTimeSeconds: float = 0.0
    finalCompleted: bool = False

class AttemptCreate(AttemptBase):
    pass

class AttemptInDB(AttemptBase):
    id: str

class AttemptPublic(AttemptBase):
    id: str
