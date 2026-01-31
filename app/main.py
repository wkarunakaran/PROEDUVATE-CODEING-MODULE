from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.routers import auth, users, problems, attempts, leaderboard, execute, competitive

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await connect_to_mongo()
    except Exception as e:
        print(f"Warning: MongoDB connection failed: {e}")
        print("Continuing without database connection...")
    yield
    # Shutdown
    try:
        await close_mongo_connection()
    except Exception as e:
        print(f"Warning: Error closing MongoDB connection: {e}")

app = FastAPI(title="codoAI Backend", version="1.0.0", lifespan=lifespan)

# CORS configuration
# Temporarily allow all origins to debug dev-tunnel CORS issues.
# Switch back to `settings.cors_origins` in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TEMPORARY: allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers to ensure CORS headers are present even on errors
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(problems.router)
app.include_router(attempts.router)
app.include_router(leaderboard.router)
app.include_router(execute.router)
app.include_router(competitive.router)

# Test endpoint for CORS
@app.get("/test")
async def test_endpoint():
    return {"message": "CORS test successful"}
