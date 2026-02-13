# ProEduVate Coding Module - AI Project Analysis Report

## Project Overview
**Project Name:** codoAI (ProEduVate Coding Module)  
**Type:** Full-stack competitive programming and coding practice platform  
**Architecture:** FastAPI (Backend) + React (Frontend) + MongoDB Atlas (Database)  
**Primary Purpose:** Educational platform for coding practice with competitive multiplayer features

---

## Technology Stack

### Backend
- **Framework:** FastAPI 0.110.0
- **Runtime:** Python 3.x with Uvicorn ASGI server
- **Database:** MongoDB Atlas (NoSQL) via Motor (async driver)
- **Authentication:** JWT tokens (python-jose) with bcrypt password hashing
- **AI Integration:** Google Gemini API for problem generation
- **Code Execution:** Local subprocess execution (Python support)
- **Cloud Services:** AWS Lambda (optional, currently disabled)

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 5.0.0
- **Routing:** React Router DOM 6.22.3
- **Styling:** TailwindCSS 3.4.4
- **Code Editor:** Monaco Editor (@monaco-editor/react 4.6.0)
- **Drag & Drop:** @hello-pangea/dnd 18.0.1
- **Icons:** Lucide React 0.563.0

### Development Tools
- **Package Manager:** npm (frontend), pip (backend)
- **Containerization:** Docker + docker-compose
- **Deployment:** Render.yaml, Vercel.json configurations
- **Testing:** Postman collections included

---

## Project Structure

```
PROEDUVATE-CODEING-MODULE/
├── app/                          # Backend (FastAPI)
│   ├── core/
│   │   └── config.py            # Settings & environment config
│   ├── db/
│   │   └── mongo.py             # MongoDB connection management
│   ├── routers/                 # API endpoints
│   │   ├── auth.py              # Login/register
│   │   ├── users.py             # User management
│   │   ├── problems.py          # Problem CRUD
│   │   ├── attempts.py          # User attempt tracking
│   │   ├── leaderboard.py       # Rankings
│   │   ├── execute.py           # Code execution
│   │   └── competitive.py       # Competitive mode (lobbies, matches)
│   ├── schemas/                 # Pydantic models
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── problem.py
│   │   ├── attempt.py
│   │   └── competitive.py
│   ├── security/
│   │   └── auth.py              # JWT & password utilities
│   ├── services/
│   │   ├── code_executor.py     # Code execution service
│   │   └── problem_generator.py # AI problem generation
│   └── main.py                  # FastAPI app entry point
│
├── src/                         # Frontend (React)
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── MonacoEditorWrapper.jsx
│   │   ├── LanguageSelector.jsx
│   │   ├── LeaderboardTable.jsx
│   │   ├── ProgressBar.jsx
│   │   └── AchievementsPanel.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Profile.jsx
│   │   ├── Problems.jsx
│   │   ├── Workspace.jsx       # Code editor workspace
│   │   ├── Competitive.jsx     # Competitive mode hub
│   │   ├── CompetitiveMatch.jsx
│   │   ├── LobbyCreate.jsx
│   │   ├── LobbyJoin.jsx
│   │   ├── LobbyRoom.jsx
│   │   ├── Admin.jsx
│   │   └── NotFound.jsx
│   ├── data/
│   │   └── problems.js          # Initial problem data
│   ├── utils/
│   │   ├── api.js               # API base URL config
│   │   └── stats.js             # User stats computation
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
│
├── postman/                     # API testing collections
├── .env.example                 # Environment template
├── requirements.txt             # Python dependencies
├── package.json                 # Node dependencies
├── Dockerfile                   # Container config
├── docker-compose.yml
└── [Multiple .md documentation files]
```

---

## Core Features

### 1. User Management
- **Registration/Login:** JWT-based authentication
- **User Roles:** Admin and regular users
- **User Profile:** XP, level, rating, achievements, preferred language
- **Session Management:** Token stored in localStorage

### 2. Problem Management
- **CRUD Operations:** Admin can create/edit problems
- **Problem Attributes:**
  - Title, description, difficulty (Easy/Medium/Hard)
  - Test cases (input/expected output)
  - Examples with explanations
  - Hints
  - Starter code (Python, C++, Java)
  - Reference solutions
  - Buggy code (for Bug Hunt mode)
  - Topics/tags
  - Video URL
- **Problem Types:**
  - Standard coding problems
  - Competitive problems (AI-generated)
  - Bug Hunt problems
  - Code Shuffle problems

### 3. Code Workspace
- **Monaco Editor Integration:** Full-featured code editor
- **Multi-language Support:** Python, C++, Java
- **Round-based System:** Problems divided into rounds
- **Timer Tracking:** Global and per-round timing
- **Test Execution:** Run code against test cases
- **Progress Saving:** Attempts stored in database
- **Hints System:** Optional hints (affects XP bonus)

### 4. Competitive Mode (Multiplayer)

#### Game Modes:
1. **Standard (Code Sprint):** Race to solve problems fastest
2. **Bug Hunt:** Find and fix bugs in provided code
3. **Code Shuffle:** Rearrange shuffled code lines correctly
4. **Test Master:** Create comprehensive test cases

#### Lobby System:
- **Create Lobby:** Host creates game with 6-character Game ID
- **Join Lobby:** Players join using Game ID
- **Player Capacity:** 2-15 players per lobby
- **Game Configuration:**
  - Game mode selection
  - Time limit (default 900s)
  - Problem selection (5 random problems per match)
- **Host Controls:** Only host can start the game

#### Match System:
- **1v1 Matches:** Direct competitive matches
- **Multiplayer Matches:** Up to 15 players
- **Multi-problem Races:** 5 problems per match
- **Real-time Progress:** Track problems solved
- **Ranking System:** Score-based with time tiebreaker
- **Bot Opponents:** Auto-matched if no human opponent found
- **Rating System:** ELO-style rating changes
- **XP Rewards:** Based on performance and rank

### 5. AI Problem Generation
- **Google Gemini Integration:** Generates unique problems
- **Fallback System:** Predefined problems if API unavailable
- **Difficulty Levels:** Easy, Medium, Hard
- **Complete Solutions:** Reference code included
- **Test Cases:** Auto-generated with problems
- **Competitive Pool:** Problems stored for reuse

### 6. Code Execution
- **Local Execution:** Subprocess-based (Python only)
- **AWS Lambda Support:** Optional cloud execution (disabled)
- **Auto-wrapping:** Handles function definitions automatically
- **Input Parsing:** Multiple input formats supported
- **Timeout Protection:** 10-second default timeout
- **Error Handling:** Captures stdout, stderr, return codes

### 7. Leaderboard & Stats
- **Global Leaderboard:** Rating-based rankings
- **Problem Leaderboard:** Per-problem fastest times
- **User Stats:**
  - Total problems solved
  - XP and level
  - Rating (competitive)
  - Achievements
  - Completion rates

---

## Database Schema (MongoDB)

### Collections:

#### users
```javascript
{
  _id: ObjectId,
  username: String,
  hashed_password: String,
  preferred_language: String,
  is_admin: Boolean,
  xp: Number,
  level: Number,
  rating: Number (default: 1200),
  achievements: Array
}
```

#### problems
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  difficulty: String (Easy/Medium/Hard),
  testCases: [{input: String, expected: String}],
  examples: [{input: String, output: String, explanation: String}],
  hint: String,
  starterCode: {python: String, cpp: String, java: String},
  referenceCode: {python: String, cpp: String, java: String},
  buggyCode: {python: String, cpp: String, java: String},
  topics: [String],
  videoUrl: String,
  created_for_competitive: Boolean,
  competitive_mode: String,
  explanations: {approach: [String], complexity: [String]},
  sampleTests: Array
}
```

#### attempts
```javascript
{
  _id: ObjectId,
  user_id: String,
  problem_id: String,
  language: String,
  roundCompleted: {1: Boolean, 2: Boolean, 3: Boolean},
  roundState: {1: String, 2: String, 3: String},
  totalTimeSeconds: Number,
  finalCompleted: Boolean,
  lastRound: Number,
  globalStartTime: Date
}
```

#### matches (Competitive)
```javascript
{
  _id: ObjectId,
  game_id: String (6-char, for lobbies),
  problem_id: String,
  problem_ids: [String], // Multi-problem support
  total_problems: Number,
  game_mode: String,
  buggy_code: String,
  player1: {
    user_id: String,
    username: String,
    code: String,
    completed: Boolean,
    time_elapsed: Number,
    used_hints: Boolean,
    submission_time: Date,
    score: Number,
    rank: Number,
    current_problem_index: Number,
    problems_solved: Number,
    submissions: Array
  },
  player2: {...}, // Same structure
  players: [PlayerObject], // For multiplayer
  time_limit_seconds: Number,
  status: String (waiting/active/completed),
  winner_id: String,
  winners: [String],
  created_at: Date,
  started_at: Date,
  completed_at: Date
}
```

#### lobbies
```javascript
{
  _id: ObjectId,
  game_id: String (6-char unique),
  lobby_name: String,
  host_id: String,
  host_username: String,
  problem_id: String,
  problem_ids: [String],
  total_problems: Number,
  game_mode: String,
  time_limit_seconds: Number,
  max_players: Number (2-15),
  players: [PlayerObject],
  buggy_code: String,
  shuffled_lines: [String],
  status: String (waiting/starting/active/completed),
  created_at: Date,
  started_at: Date,
  completed_at: Date,
  match_id: String
}
```

---

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Users (`/users`)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update user profile

### Problems (`/problems`)
- `GET /problems/` - List all problems
- `GET /problems/{id}` - Get specific problem
- `POST /problems/` - Create problem (admin only)

### Attempts (`/attempts`)
- `GET /attempts/me` - Get user's attempts
- `POST /attempts/` - Create/update attempt
- `GET /attempts/problem/{id}` - Get attempts for problem

### Leaderboard (`/leaderboard`)
- `GET /leaderboard/problem/{id}` - Problem-specific leaderboard
- `GET /leaderboard/global` - Global leaderboard

### Execute (`/execute`)
- `POST /execute/run` - Execute code with test cases

### Competitive (`/competitive`)
- `POST /competitive/lobby/create` - Create multiplayer lobby
- `POST /competitive/lobby/join` - Join lobby by Game ID
- `GET /competitive/lobby/list` - List available lobbies
- `GET /competitive/lobby/{game_id}` - Get lobby details
- `POST /competitive/lobby/{game_id}/start` - Start game (host only)
- `POST /competitive/lobby/{game_id}/leave` - Leave lobby
- `POST /competitive/matches` - Create 1v1 match
- `GET /competitive/matches` - List user's matches
- `GET /competitive/matches/{id}` - Get match details
- `POST /competitive/matches/{id}/start` - Start match
- `POST /competitive/matches/{id}/submit` - Submit solution
- `POST /competitive/matches/{id}/hint` - Use hint
- `POST /competitive/matchmaking` - Find/create match
- `GET /competitive/leaderboard` - Competitive leaderboard
- `POST /competitive/generate-problem` - Generate AI problem (admin)

---

## Key Workflows

### 1. User Registration & Login
1. User submits credentials to `/auth/register` or `/auth/login`
2. Backend validates and creates/verifies user in MongoDB
3. JWT token generated and returned
4. Frontend stores token in localStorage
5. Token included in Authorization header for protected routes

### 2. Solving a Problem (Practice Mode)
1. User selects problem from Problems page
2. Navigate to Workspace with problem ID
3. Monaco editor loads with starter code
4. User writes solution
5. Click "Run Tests" → POST to `/execute/run`
6. Backend executes code against test cases
7. Results displayed to user
8. Progress saved to attempts collection
9. XP/achievements updated on completion

### 3. Competitive Match (Multiplayer)
1. **Create Lobby:**
   - Host clicks "Create Lobby"
   - Selects game mode, time limit, max players
   - Backend generates 6-char Game ID
   - Backend selects 5 random problems from pool
   - Lobby created with "waiting" status

2. **Join Lobby:**
   - Players enter Game ID
   - POST to `/competitive/lobby/join`
   - Player added to lobby's players array
   - Real-time updates via polling

3. **Start Game:**
   - Host clicks "Start Game"
   - POST to `/competitive/lobby/{game_id}/start`
   - Match document created
   - Lobby status → "active"
   - All players redirected to match page

4. **During Match:**
   - Players solve problems sequentially
   - Submit solution → POST to `/competitive/matches/{match_id}/submit`
   - Backend validates solution against test cases
   - If correct: increment problems_solved, load next problem
   - Track time, score, rank

5. **Match Completion:**
   - All players finish all problems OR time expires
   - Backend calculates final rankings
   - Update ratings (ELO-style)
   - Award XP based on rank
   - Display results

### 4. AI Problem Generation
1. Admin triggers problem generation OR automatic during lobby creation
2. Backend calls Google Gemini API with prompt
3. Gemini returns JSON with problem details
4. Backend validates and stores in problems collection
5. Problem available for competitive matches

### 5. Code Shuffle Mode
1. Backend retrieves problem's referenceCode
2. Shuffle lines randomly
3. Store shuffled_lines in match/lobby
4. Frontend displays draggable lines
5. User rearranges lines
6. Submit arranged code
7. Backend executes arranged code against test cases
8. Calculate score based on correctness

### 6. Bug Hunt Mode
1. Backend generates buggy code from reference solution
2. Introduce 1-3 bugs (syntax, logic, off-by-one, etc.)
3. Store buggy_code in match
4. User identifies and fixes bugs
5. Submit fixed code
6. Must pass all test cases to complete

---

## Configuration & Environment

### Backend (.env)
```
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=codoai
JWT_SECRET=<secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
GOOGLE_API_KEY=<optional>
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=<optional>
AWS_SECRET_ACCESS_KEY=<optional>
AWS_LAMBDA_FUNCTION_NAME=python-code-executor
```

### Frontend (utils/api.js)
```javascript
export const API_BASE = "http://localhost:8000";
```

---

## Security Features

1. **Password Hashing:** Bcrypt with salt
2. **JWT Authentication:** Secure token-based auth
3. **CORS Protection:** Configurable origins
4. **Admin Authorization:** Role-based access control
5. **Input Validation:** Pydantic schemas
6. **Code Execution Sandboxing:** Timeout limits, subprocess isolation
7. **Rate Limiting:** (Not implemented, recommended)

---

## Known Limitations & Issues

1. **Code Execution:**
   - Only Python supported locally
   - AWS Lambda disabled due to output capture issues
   - No support for C++/Java execution currently

2. **Real-time Updates:**
   - No WebSocket implementation
   - Lobby updates require polling
   - Match progress not real-time

3. **Scalability:**
   - Local code execution not scalable
   - No load balancing configured
   - Single MongoDB instance

4. **Testing:**
   - No automated test suite
   - Manual testing via Postman only

5. **Security:**
   - No rate limiting
   - No input sanitization for code execution
   - Potential for resource exhaustion

---

## Deployment

### Local Development
```bash
# Backend
cd PROEDUVATE-CODEING-MODULE
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up --build
```

### Production
- Backend: Render.com (render.yaml)
- Frontend: Vercel (vercel.json)
- Database: MongoDB Atlas

---

## Documentation Files

The project includes extensive documentation:
- `README.md` - Main project overview
- `QUICK_START.md` - Getting started guide
- `COMPETITIVE_MODE.md` - Competitive features
- `MULTIPLAYER_QUICKSTART.md` - Multiplayer setup
- `CODE_SHUFFLE_GUIDE.md` - Code Shuffle mode
- `BUG_HUNT_MODE.md` - Bug Hunt mode
- `AI_PROBLEM_GENERATION.md` - AI integration
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `LOBBY_JOIN_TROUBLESHOOTING.md` - Common issues
- Multiple implementation summaries and troubleshooting guides

---

## Future Enhancements (Recommended)

1. **WebSocket Integration:** Real-time lobby/match updates
2. **Multi-language Execution:** C++, Java support
3. **Cloud Code Execution:** Fix AWS Lambda or use Judge0 API
4. **Automated Testing:** Unit and integration tests
5. **Rate Limiting:** Prevent abuse
6. **Caching:** Redis for leaderboards and sessions
7. **Analytics:** Track user behavior and problem difficulty
8. **Social Features:** Friends, teams, tournaments
9. **Mobile App:** React Native version
10. **Code Review:** AI-powered code feedback

---

## Summary

codoAI is a comprehensive competitive programming platform with:
- **Dual Modes:** Practice and Competitive
- **Multiplayer Support:** Up to 15 players per match
- **Multiple Game Modes:** Standard, Bug Hunt, Code Shuffle, Test Master
- **AI Integration:** Automatic problem generation
- **Full-stack Architecture:** React + FastAPI + MongoDB
- **Educational Focus:** XP, levels, achievements, leaderboards

The platform is production-ready for small-scale deployment but requires enhancements for enterprise-level scalability and security.

---

**Report Generated:** 2024
**Project Status:** Active Development
**License:** Not specified
