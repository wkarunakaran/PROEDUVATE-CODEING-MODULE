from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.db.mongo import db
from app.schemas.problem import ProblemCreate, ProblemPublic
from app.security.auth import get_current_admin, get_current_user

router = APIRouter(prefix="/problems", tags=["problems"])

@router.get("/", response_model=list[ProblemPublic])
async def list_problems(current_user = Depends(get_current_user)):
    cursor = db.problems.find({})
    results = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        results.append(ProblemPublic(**doc))
    return results

@router.post("/", response_model=ProblemPublic)
async def create_problem(
    problem_in: ProblemCreate,
    admin = Depends(get_current_admin),
):
    doc = problem_in.model_dump()
    res = await db.problems.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return ProblemPublic(**doc)

@router.get("/{problem_id}", response_model=ProblemPublic)
async def get_problem(problem_id: str, current_user = Depends(get_current_user)):
    try:
        oid = ObjectId(problem_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid problem id")
    doc = await db.problems.find_one({ "_id": oid })
    if not doc:
        raise HTTPException(status_code=404, detail="Problem not found")
    doc["id"] = str(doc["_id"])
    return ProblemPublic(**doc)
