from pydantic import BaseModel, Field
from typing import List, Dict

class SampleTest(BaseModel):
    id: int
    input: str
    expected: str

class ProblemBase(BaseModel):
    title: str
    difficulty: str = Field(..., pattern="^(Easy|Medium|Hard)$")
    topics: List[str] = []
    videoUrl: str
    referenceCode: Dict[str, str]  # python, cpp, java
    explanations: Dict[str, List[str]]
    sampleTests: List[SampleTest]

class ProblemCreate(ProblemBase):
    pass

class ProblemInDB(ProblemBase):
    id: str

class ProblemPublic(ProblemBase):
    id: str
