from pydantic import BaseModel
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb+srv://<username>:<password>@cluster.mongodb.net/codoai")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "codoai")

    jwt_secret: str = os.getenv("JWT_SECRET", "changeme")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    @property
    def cors_origins(self) -> list[str]:
        raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        return [o.strip() for o in raw.split(",") if o.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
