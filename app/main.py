from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.routers import auth, users, problems, attempts, leaderboard

settings = get_settings()

app = FastAPI(title="codoAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(problems.router)
app.include_router(attempts.router)
app.include_router(leaderboard.router)
