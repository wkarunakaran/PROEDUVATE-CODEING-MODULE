# codoAI Backend (FastAPI + MongoDB Atlas)

This is the backend service for **codoAI**, built with FastAPI and MongoDB Atlas.

## Features

- FastAPI async backend
- MongoDB Atlas integration via `motor`
- JWT-based authentication (login/register)
- Admin & user roles
- Problems CRUD API
- Attempts tracking (round state, timers, completion)
- Leaderboard per problem
- XP/level/achievements ready (to be computed by frontend or future backend logic)
- CORS enabled for `http://localhost:5173`
- Dockerfile + docker-compose template
- Postman collection for testing

## Setup

### 1. Clone & install

```bash
pip install -r requirements.txt
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill:

```bash
cp .env.example .env
```

Edit `.env`:

- `MONGODB_URI` → your MongoDB Atlas connection string
- `JWT_SECRET` → any strong random string

### 3. Run locally

```bash
uvicorn app.main:app --reload
```

API docs:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Docker (optional)

```bash
docker build -t codoai-backend .
docker run -p 8000:8000 --env-file .env codoai-backend
```

## Postman

Use the included `postman/codoai-backend.postman_collection.json` to try:

- `POST /auth/register`
- `POST /auth/login`
- `GET /users/me`
- `GET /problems`
- `POST /problems` (admin only)
- `POST /attempts`
- `GET /leaderboard/problem/{problem_id}`

