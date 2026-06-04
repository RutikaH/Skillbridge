# SkillBridge — Complete Codebase Walkthrough

---

## 1. Project Overview

### What problem does SkillBridge solve?

SkillBridge eliminates the resume-first hiring bottleneck. Instead of judging candidates by degrees or work history, it assesses their **actual skills** through an AI-powered conversational assessment engine. The platform:

1. Asks users about their skills via a guided AI chatbot
2. Gives them a practical coding/logic task
3. Evaluates their answer and assigns a **verified skill score**
4. Matches verified scores to real job/internship opportunities
5. Produces a **skill passport** (profile) that proves capability

### Who are the users?

- **Job seekers / students** who want to prove their skills without a traditional resume
- **Career changers** who need a verified skill portfolio
- **Entry-level candidates** (fresh graduates, interns) with no work history

### Main workflows

1. **Signup → Login → Dashboard** — Onboarding and daily engagement
2. **Assessment Flow** — 7-step guided AI conversation (Step 1: About You → Step 2: Skill Test → Step 3: Evaluation → Step 4: Project Choice → Step 5: Build → Step 6: Summary → Step 7: Job Matches)
3. **Skills Management** — View, filter, search, and verify skills
4. **Opportunity Discovery** — Browse and filter job/internship matches
5. **Profile Building** — View verified skills, assessment history, badges, preferences

### Core business logic

- Skills have levels: Beginner → Intermediate → Advanced → Expert
- Assessment scores (0-100) determine skill level thresholds: <60 = Beginner, 60-79 = Intermediate, 80-99 = Advanced, 100 = Expert
- Opportunities have `required_score` and `match_pct` fields
- Badges are auto-created on first access (Verified Developer, Fast Learner, Assessment Champion)

---

## 2. Full Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
│                                                                  │
│  main.jsx → App.jsx → BrowserRouter                             │
│    ├── /login        → Login.jsx                                 │
│    ├── /signup       → Signup.jsx                                │
│    ├── /oauth-success → OAuthCallback.jsx                        │
│    └── / (ProtectedRoute) → SaaSLayout.jsx                      │
│          ├── Sidebar.jsx (navigation)                            │
│          ├── TopNavbar.jsx (page title + "New Assessment" btn)   │
│          └── <Outlet/> renders:                                  │
│                ├── /dashboard  → Dashboard.jsx                   │
│                ├── /skills     → Skills.jsx                      │
│                ├── /assessments → Assessments.jsx                │
│                │                  └── AssessmentChatbot.jsx       │
│                │                      └── ChatBubble.jsx         │
│                │                          └── JsonCard.jsx       │
│                ├── /opportunities → Opportunities.jsx            │
│                ├── /profile     → Profile.jsx                    │
│                └── /settings    → Settings.jsx                   │
│                                                                  │
│  Services:                                                       │
│    ├── authService.js  (signup, login, logout, getToken)         │
│    └── apiService.js   (getDashboard, getProfile, getSkills...)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    fetch() with Bearer JWT
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VITE DEV SERVER (port 3000)                   │
│                                                                  │
│  Proxy rules:                                                    │
│    /api    → http://127.0.0.1:8000  (all data endpoints)        │
│    /auth   → http://127.0.0.1:8000  (signup, login, OAuth)      │
│    /start  → http://127.0.0.1:8000  (assessment session)        │
│    /chat   → http://127.0.0.1:8000  (assessment messages)       │
│    /health → http://127.0.0.1:8000  (health check)              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND (port 8000)                     │
│                                                                  │
│  main.py (app entry point)                                       │
│    ├── CORSMiddleware (allow_origins=["*"])                       │
│    ├── Base.metadata.create_all() (auto-create tables)           │
│    ├── seed_default_data() (30 skills + 9 opportunities)         │
│    ├── POST /start → create assessment session                   │
│    ├── POST /chat  → send message, get AI response               │
│    ├── GET  /health → {"status": "ok"}                           │
│    │                                                              │
│    ├── auth.py router (prefix="/auth")                           │
│    │   ├── POST /auth/signup  → create user, return JWT          │
│    │   ├── POST /auth/login   → verify password, return JWT      │
│    │   ├── GET  /auth/me      → return current user              │
│    │   ├── POST /auth/logout  → return message                   │
│    │   ├── POST /auth/forgot-password → return message           │
│    │   ├── GET  /auth/google/login → redirect to Google OAuth    │
│    │   └── GET  /auth/google/callback → exchange code, redirect  │
│    │                                                              │
│    └── routes.py router (prefix="/api")                          │
│        ├── GET  /api/dashboard     → full dashboard data         │
│        ├── GET  /api/skills        → user's skills (filtered)    │
│        ├── POST /api/skills        → add a skill                 │
│        ├── PUT  /api/skills/{id}/verify → verify a skill         │
│        ├── GET  /api/assessments   → assessment timeline          │
│        ├── POST /api/assessments/save → save assessment result   │
│        ├── GET  /api/activities    → user's activities            │
│        ├── GET  /api/opportunities → all opportunities (filtered)│
│        ├── GET  /api/profile       → full profile data           │
│        ├── PUT  /api/profile       → update name/avatar          │
│        ├── GET  /api/profile/preferences → get preferences       │
│        ├── PUT  /api/profile/preferences → update preferences    │
│        └── GET  /api/badges        → user's badges               │
└─────────────────────────────────────────────────────────────────┘
                              │
                    SQLAlchemy ORM
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                                  │
│                                                                  │
│  agent.py (SkillBridgeAgent)                                     │
│    ├── Maintains in-memory session state                         │
│    ├── 7-step assessment workflow via SYSTEM_PROMPT               │
│    ├── extract_json() — parses AI response for structured data   │
│    ├── _strip_step_bleed() — cleans response text                │
│    ├── _user_provided_attempt() — detects if user gave solution  │
│    └── Auto-chains steps (e.g., Step 3 → Step 4)                │
│                                                                  │
│  llm_router.py (ModelRouter)                                     │
│    ├── Primary: GPT-4o via OpenAI API                            │
│    └── Fallback: Llama 3.1 8B via Groq API                       │
│                                                                  │
│  jwt_utils.py                                                    │
│    ├── create_access_token() — JWT with email as subject         │
│    ├── decode_access_token() — verify and extract email          │
│    ├── get_current_user() — FastAPI dependency                   │
│    └── Password hashing via argon2 (passlib)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    SQLAlchemy ORM
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SQLite DATABASE (skillbridge_v2.db)              │
│                                                                  │
│  Tables:                                                         │
│    users, user_preferences, skills, user_skills,                 │
│    assessment_results, activities, badges, opportunities          │
└─────────────────────────────────────────────────────────────────┘
```

### Actual Request Flow Example: Loading the Dashboard

```
1. User navigates to /dashboard in browser
2. App.jsx routes → ProtectedRoute checks isAuthenticated() (token in localStorage)
3. SaaSLayout renders Sidebar + TopNavbar + <Outlet/>
4. <Outlet/> renders Dashboard.jsx
5. Dashboard.jsx useEffect → calls getDashboard() from apiService.js
6. getDashboard() → fetch("/api/dashboard", { headers: { Authorization: "Bearer <token>" }})
7. Vite dev server intercepts /api/* → proxies to http://127.0.0.1:8000/api/dashboard
8. FastAPI receives request → OAuth2PasswordBearer extracts token → get_current_user() dependency
9. get_current_user() decodes JWT → finds user by email → returns User object
10. get_dashboard() endpoint queries: UserSkill, Activity, Opportunity, Badge, AssessmentResult
11. Returns DashboardResponse JSON
12. Vite proxies response back to browser
13. Dashboard.jsx receives data → setDashboardData(data) → renders UI
```

---

## 3. Folder-by-Folder Breakdown

### `frontend/src/` — React application source

#### `frontend/src/pages/` — Route-level page components

| File | Purpose | Key Logic |
|------|---------|-----------|
| `Login.jsx` | Email/password login form + Google OAuth popup | Calls `login()` from authService → stores JWT → navigates to `/dashboard`. Listens for `postMessage` from OAuth popup. |
| `Signup.jsx` | Registration form (name, email, password) + Google OAuth | Calls `signup()` from authService → stores JWT → navigates to `/dashboard`. Same OAuth popup listener. |
| `ForgotPassword.jsx` | Email input for password recovery | Calls `forgotPassword()` → shows success message. Currently commented out in App.jsx routing. |
| `OAuthCallback.jsx` | Handles OAuth redirect at `/oauth-success` | Extracts `?token=` from URL → stores in localStorage → navigates to `/dashboard`. |
| `Dashboard.jsx` | Main dashboard with KPIs, skills, activities, opportunities | Calls `getDashboard()` → renders hero section, skill progress cards, activity feed, opportunity cards. |
| `Skills.jsx` | Skill management with search, filter, sort | Calls `getSkills(params)` with query/level/verified/sort params → renders skill cards with progress bars. |
| `Assessments.jsx` | Wrapper for AssessmentChatbot | Simply renders `<AssessmentChatbot />`. |
| `Opportunities.jsx` | Opportunity browsing with multi-filter | Calls `getOpportunities(params)` with type/location/min_match/skill/search filters → renders opportunity cards. |
| `Profile.jsx` | Full profile with skills, history, badges, preferences | Calls `getProfile()`, `getBadges()`, `getPreferences()` in parallel → renders profile hero, KPIs, skills grid, assessment timeline, badges, preferences, activities. |
| `Settings.jsx` | Account, appearance, notifications, preferences | Calls `getProfile()` and `getPreferences()` → shows account details, theme toggle, notification toggles, password change (UI only), preference editor with save to database. |

#### `frontend/src/components/` — Reusable UI components

| File | Purpose | Key Logic |
|------|---------|-----------|
| `ProtectedRoute.jsx` | Auth gate — redirects to `/login` if no token | Checks `isAuthenticated()` from authService (just checks localStorage). |
| `Sidebar.jsx` | Left navigation with NavLink items | 6 items: Dashboard, Skills, Assessments, Opportunities, Profile, Settings. Highlights active route. Logout button at bottom. |
| `TopNavbar.jsx` | Top bar with page title + "New Assessment" button | Derives title from `currentPath` string matching. |
| `AuthLayout.jsx` | Split-screen auth page layout | Left panel (branding + title), right panel (children = form). |
| `AuthCard.jsx` | Animated card for auth forms | Uses `framer-motion` for fade-in animation. |
| `InputField.jsx` | Styled label + input + optional hint | Generic form input component. |
| `LoadingButton.jsx` | Button with loading state | Shows "Loading…" text when `loading` prop is true. |
| `SocialButton.jsx` | Google sign-in button with icon | Generic social auth button. |
| `AssessmentChatbot.jsx` | **Core assessment UI** — chat interface + AI interaction | Manages session via `/start` and `/chat` endpoints. Tracks skill name from user's first message. Auto-saves evaluation results via `saveAssessmentResult()`. |
| `ChatBubble.jsx` | Chat message renderer | Handles markdown (bold, code, lists, headings). Strips JSON code blocks from text when a JsonCard renders the data. |
| `JsonCard.jsx` | Structured data renderer for AI responses | Detects data shape: EvaluationCard (score), ProjectsCard (array of projects), SummaryCard (build summary), JobMatchCard (job roles). |

#### `frontend/src/services/` — API communication layer

| File | Purpose | Key Logic |
|------|---------|-----------|
| `authService.js` | Authentication operations | `getToken()`, `setToken()`, `removeToken()`, `isAuthenticated()` — all localStorage. `signup()`, `login()`, `forgotPassword()`, `getProfile()` (via `/auth/me`). `logout()` just removes token. `fetchWithAuth()` wraps request with JWT. |
| `apiService.js` | All data API calls | `getDashboard()`, `getSkills(params)`, `addSkill()`, `verifySkill()`, `getAssessments()`, `saveAssessmentResult()`, `getActivities()`, `getOpportunities(params)`, `getProfile()`, `updateProfile()`, `getPreferences()`, `updatePreferences()`, `getBadges()`. All attach Bearer token via `buildHeaders()`. |

#### `frontend/src/layouts/`

| File | Purpose |
|------|---------|
| `SaaSLayout.jsx` | Main app shell — renders `<Sidebar>`, `<TopNavbar>`, and `<Outlet/>` (child routes). Wires logout handler. |

#### Other frontend files

| File | Purpose |
|------|---------|
| `main.jsx` | React entry point — `ReactDOM.createRoot()` renders `<App/>` in StrictMode |
| `App.jsx` | React Router setup — defines all routes, wraps protected routes in `ProtectedRoute` |
| `App.css` | All styles (single CSS file for entire app) |

### `backend/` — FastAPI application

| File | Purpose | Key Logic |
|------|---------|-----------|
| `main.py` | App entry point | Creates FastAPI app, adds CORS middleware (`allow_origins=["*"]`), creates all tables via `Base.metadata.create_all()`, seeds default data, defines `/start` and `/chat` endpoints, includes auth and api routers. |
| `config.py` | Environment variable loading | Loads `.env` via `python-dotenv`. Exports: `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRATION_MINUTES`, Google OAuth credentials, `FRONTEND_URL`. |
| `database.py` | SQLAlchemy engine setup | Creates engine from `DATABASE_URL`, configures `check_same_thread=False` for SQLite, creates `SessionLocal` factory, defines `Base`, provides `get_db()` dependency. |
| `models.py` | SQLAlchemy ORM models | 8 tables: `User`, `UserPreference`, `Skill`, `UserSkill`, `AssessmentResult`, `Activity`, `Badge`, `Opportunity`. All with proper foreign keys and relationships. |
| `schemas.py` | Pydantic models for request/response | `UserCreate`, `UserLogin`, `Token`, `UserResponse`, `UserSkillResponse`, `AssessmentResultResponse`, `ActivityResponse`, `BadgeResponse`, `OpportunityResponse`, `DashboardResponse`, `ProfileResponse`, `SkillsDashboardResponse`, `AssessmentTimelineResponse`, `PreferencesUpdateRequest`, `ProfileUpdateRequest`. |
| `auth.py` | Authentication router (`/auth/*`) | Signup (hash password, create user, return JWT), login (verify password, return JWT), forgot-password (placeholder), `/auth/me` (return current user), Google OAuth login/callback. |
| `jwt_utils.py` | JWT token utilities | `create_access_token()` — JWT with `sub=email`, expiration. `decode_access_token()` — verify and extract email. `get_current_user()` — FastAPI dependency that extracts token, decodes, looks up user. Password hashing via argon2. |
| `routes.py` | API router (`/api/*`) | 12 endpoints for dashboard, skills, assessments, activities, opportunities, profile, preferences, badges. All require `get_current_user` dependency. |
| `agent.py` | AI assessment agent | `SkillBridgeAgent` class — manages sessions, 7-step workflow via system prompt, calls LLM, extracts JSON from responses, auto-chains steps, detects user attempts. |
| `llm_router.py` | LLM provider routing | `ModelRouter.generate()` — tries GPT-4o first, falls back to Groq Llama 3.1 8B on failure. |
| `.env` | Environment secrets | API keys, database URL, JWT secret, Google OAuth credentials. |
| `requirements.txt` | Python dependencies | fastapi, uvicorn, openai, groq, python-dotenv, pydantic, sqlalchemy, passlib, argon2-cffi, python-jose, httpx, email-validator. |

---

## 4. Authentication Flow

### Signup Flow (traced through actual code)

```
1. User fills form in Signup.jsx: { name, email, password }
2. handleSubmit() → calls signup(payload) from authService.js
3. authService.signup():
   a. POST /auth/signup with JSON body
   b. Backend auth.py signup() handler:
      - Extracts email, lowercases it
      - Checks if User with this email exists → 400 if yes
      - Creates User with:
        - name = payload.name.strip()
        - email = email.lower()
        - password_hash = create_password_hash(payload.password)  [argon2 hash]
        - provider = "local"
      - db.add(user) → db.commit() → db.refresh(user)
      - Returns { access_token: create_access_token(user.email), token_type: "bearer" }
   c. JWT creation (jwt_utils.py):
      - payload = { "sub": user.email, "exp": utcnow + 60 minutes }
      - jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
4. authService.signup() receives response → setToken(data.access_token)
5. setToken() → localStorage.setItem("skillbridge_token", token)
6. navigate("/dashboard")
```

### Login Flow

```
1. User fills form in Login.jsx: { email, password }
2. handleSubmit() → calls login(payload) from authService.js
3. authService.login():
   a. POST /auth/login with JSON body
   b. Backend auth.py login() handler:
      - Extracts email, lowercases it
      - Looks up User by email
      - If not found OR no password_hash OR password doesn't match → 401
      - verify_password() uses argon2: pwd_context.verify(password, user.password_hash)
      - Returns { access_token: create_access_token(user.email) }
4. authService.login() → setToken(data.access_token)
5. navigate("/dashboard")
```

### Protected Route Flow

```
1. User navigates to /dashboard
2. App.jsx: <Route path="/" element={<ProtectedRoute><SaaSLayout /></ProtectedRoute>}>
3. ProtectedRoute.jsx checks: isAuthenticated() → Boolean(getToken())
4. If token exists → renders children (SaaSLayout + Outlet)
5. If no token → <Navigate to="/login" replace />
```

### Authenticated API Request Flow

```
1. Any apiService.js function (e.g., getDashboard())
2. request("/api/dashboard", { method: "GET" })
3. buildHeaders() → {
     "Content-Type": "application/json",
     "Authorization": "Bearer <token from localStorage>"
   }
4. fetch("/api/dashboard", { headers: { Authorization: "Bearer ..." } })
5. Backend OAuth2PasswordBearer extracts token from Authorization header
6. get_current_user() dependency:
   a. decode_access_token(token) → extracts email from JWT "sub" claim
   b. db.query(User).filter(User.email == email).first()
   c. If user not found or not active → 401
   d. Returns User object
7. Endpoint handler receives current_user: User = Depends(get_current_user)
```

### Google OAuth Flow

```
1. Login.jsx handleGoogle():
   a. Opens popup window to "/auth/google/login"
2. Backend auth.py google_login():
   a. Constructs Google OAuth URL with client_id, redirect_uri, scope, etc.
   b. Redirects to Google accounts page
3. User authenticates with Google
4. Google redirects back to "http://localhost:8000/auth/google/callback?code=..."
5. Backend auth.py google_callback():
   a. Exchanges code for access_token via Google Token endpoint
   b. Fetches user info from Google UserInfo endpoint
   c. Extracts: email, google_id, name, avatar
   d. Looks up user by google_id OR email
   e. Creates new user or updates existing one
   f. Generates JWT: create_access_token(user.email)
   g. Redirects to "http://localhost:3000/oauth-success?token=<encoded_token>"
6. Frontend OAuthCallback.jsx:
   a. Extracts token from URL query parameter
   b. Calls setToken(token) → stores in localStorage
   c. Navigates to /dashboard
```

### Logout Flow

```
1. Sidebar.jsx logout button → calls onLogout → handleLogout in SaaSLayout
2. handleLogout() → logout() from authService → removeToken() → localStorage.removeItem("skillbridge_token")
3. navigate("/login")
4. Note: Backend /auth/logout is a no-op (just returns message). JWT is stateless — no server-side revocation.
```

### Current Security Model

- **Password hashing**: argon2 via passlib (strong, memory-hard)
- **JWT**: HS256, 60-minute expiration, email as subject
- **User isolation**: All `/api/*` endpoints filter by `current_user.id`
- **Token storage**: localStorage (vulnerable to XSS but standard for SPA)
- **CORS**: `allow_origins=["*"]` — wide open (development mode)
- **No rate limiting**: No request throttling on any endpoint
- **No refresh tokens**: Single short-lived token, no rotation

---

## 5. Database Deep Dive

### `users` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | Auto-increment user ID |
| `name` | String(128) | Display name |
| `email` | String(256) UNIQUE | Login identifier, JWT subject |
| `password_hash` | String(256) NULL | argon2 hash (null for Google users) |
| `provider` | String(32) | "local" or "google" |
| `google_id` | String(256) NULL | Google's unique user ID |
| `avatar` | String(512) NULL | Profile picture URL |
| `is_active` | Boolean | Account status (default True) |
| `created_at` | DateTime | Registration timestamp |

**Relationships**: has many UserSkills, AssessmentResults, Activities, has one UserPreference.

### `user_preferences` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | |
| `user_id` | Integer FK→users | One-to-one with User |
| `preferred_language` | String(32) | "English", "Hindi", etc. |
| `preferred_roles` | JSON | Array of role strings |
| `preferred_work_modes` | JSON | ["Remote", "Hybrid"] |
| `preferred_industries` | JSON | ["SaaS", "FinTech"] |
| `preferred_locations` | JSON | ["Bengaluru", "Remote"] |
| `created_at` / `updated_at` | DateTime | Timestamps |

**Why it exists**: Stores per-user preference settings that persist across sessions.

### `skills` table (Master skills catalog)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | |
| `name` | String(128) UNIQUE | Skill name (e.g., "Python") |
| `category` | String(64) NULL | Optional grouping |
| `created_at` | DateTime | |

**Why it exists**: Global catalog of all possible skills. Seeded with 30 defaults (Python, JavaScript, React, etc.). UserSkill records reference this.

### `user_skills` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | |
| `user_id` | Integer FK→users | |
| `skill_id` | Integer FK→skills | Links to master skill |
| `verified_score` | Integer | 0-100 score from assessment |
| `level` | String(32) | "Beginner"/"Intermediate"/"Advanced"/"Expert" |
| `assessment_count` | Integer | How many times assessed |
| `last_evaluated_date` | DateTime NULL | When last assessed |
| `verified` | Boolean | Whether skill is verified |
| `created_at` / `updated_at` | DateTime | |

**Why it exists**: Junction table tracking a user's skill levels. Created/updated when an assessment is saved.

### `assessment_results` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | |
| `user_id` | Integer FK→users | |
| `skill_id` | Integer FK→skills NULL | Associated skill |
| `session_id` | String(256) NULL | Chat session ID |
| `assessment_name` | String(256) | e.g., "AI Skill Assessment — Python" |
| `score` | Integer | 0-100 |
| `strengths` | JSON | Array of strength strings |
| `improvements` | JSON | Array of improvement strings |
| `status` | String(32) | "In review" or "Verified" |
| `message` | Text NULL | Optional notes |
| `created_at` | DateTime | |

**Why it exists**: Complete history of every assessment taken. Powers the assessment timeline on Profile page.

### `activities` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | |
| `user_id` | Integer FK→users | |
| `title` | String(256) | "Assessment completed", "New skill added" |
| `detail` | String(512) | Descriptive text |
| `activity_type` | String(64) | "assessment", "skill_added", "general" |
| `created_at` | DateTime | |

**Why it exists**: Activity feed on Dashboard and Profile pages.

### `badges` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | |
| `user_id` | Integer FK→users | |
| `title` | String(256) | "Verified Developer", "Fast Learner", "Assessment Champion" |
| `icon` | String(16) | Emoji icon |
| `tone` | String(32) | CSS class: "success", "primary", "warning" |
| `created_at` | DateTime | |

**Why it exists**: Achievement badges. Auto-created (3 defaults) when user hits `/api/badges` with no existing badges.

### `opportunities` table

| Column | Type | Purpose |
|--------|------|---------|
| `id` | Integer PK | |
| `title` | String(256) | Job title |
| `company` | String(128) | Company name |
| `location` | String(128) | "Remote", "Hyderabad", etc. |
| `type` | String(32) | "Internship" or "Job" |
| `required_skills` | JSON | Array of skill name strings |
| `required_score` | Integer | Minimum score needed |
| `description` | Text | Job description |
| `match_pct` | Integer | Match percentage (seeded values) |
| `is_active` | Boolean | Whether opportunity is live |
| `created_at` | DateTime | |

**Why it exists**: Pre-seeded catalog of 9 opportunities. Match percentages are static (not computed from user skills).

---

## 6. API Deep Dive

### `POST /auth/signup`

- **Input**: `{ name: str, email: EmailStr, password: str (min 8) }`
- **Output**: `{ access_token: str, token_type: "bearer" }`
- **Logic**: Check email uniqueness → hash password (argon2) → create User → commit → generate JWT
- **DB**: INSERT INTO users

### `POST /auth/login`

- **Input**: `{ email: EmailStr, password: str }`
- **Output**: `{ access_token: str, token_type: "bearer" }`
- **Logic**: Find user by email → verify password with argon2 → generate JWT
- **DB**: SELECT FROM users WHERE email = ?

### `GET /auth/me`

- **Input**: Bearer token
- **Output**: `{ id, name, email, provider, avatar, created_at }`
- **Logic**: get_current_user dependency → return user as UserResponse
- **DB**: SELECT FROM users WHERE email = ? (via JWT decode)

### `GET /api/dashboard`

- **Input**: Bearer token
- **Output**: `{ user: UserResponse, skills: [UserSkillResponse], recent_activities: [ActivityResponse], top_opportunities: [OpportunityResponse], badges: [BadgeResponse], overall_skill_score: int, assessments_completed: int, verified_skills_count: int, opportunity_matches: int }`
- **Logic**: Queries 5 tables — UserSkills (user's skills), Activities (last 5), Opportunities (top 5 by match_pct), Badges (all), AssessmentResults (count). Calculates avg score from UserSkills.
- **DB**: 5 SELECT queries + 1 COUNT + 1 AVG calculation

### `GET /api/skills`

- **Input**: Query params: `query`, `level_filter`, `verified_only`, `sort_by`
- **Output**: `{ skills: [UserSkillResponse] }`
- **Logic**: Queries UserSkill filtered by user_id, optionally by level and verified. Post-query filters by name search. Sorts by score or name.
- **DB**: SELECT FROM user_skills JOIN skills WHERE user_id = ?

### `POST /api/skills`

- **Input**: Query param `skill_name`
- **Output**: `UserSkillResponse`
- **Logic**: Find or create Skill by name → check if user already has it → create UserSkill → create Activity → commit
- **DB**: SELECT/INSERT skills, INSERT user_skills, INSERT activities

### `PUT /api/skills/{skill_id}/verify`

- **Input**: Query params `verified_score`, `level`, `verified`
- **Output**: `UserSkillResponse`
- **Logic**: Find UserSkill by id + user_id → update score, level, verified, assessment_count, last_evaluated_date → commit
- **DB**: UPDATE user_skills

### `GET /api/assessments`

- **Input**: Bearer token
- **Output**: `{ current_progress: {}, stats: {}, recent_results: [], timeline: [], skills_earned: [] }`
- **Logic**: Queries AssessmentResults (all, ordered by date), UserSkills (verified only). Calculates stats: total, avg score, best score, verified count.
- **DB**: SELECT FROM assessment_results, SELECT FROM user_skills

### `POST /api/assessments/save`

- **Input**: `{ assessment_name, score, skill_name?, strengths: [], improvements: [], status }`
- **Output**: `AssessmentResultResponse`
- **Logic**: Create AssessmentResult. If skill_name provided: find/create Skill → find/create/update UserSkill (set score, level based on thresholds, mark verified). Create Activity. Commit.
- **DB**: INSERT assessment_results, SELECT/INSERT skills, SELECT/INSERT/UPDATE user_skills, INSERT activities

### `GET /api/activities`

- **Input**: Query param `limit` (1-100, default 20)
- **Output**: `[ActivityResponse]`
- **Logic**: Query Activity by user_id, ordered by created_at desc, limited.
- **DB**: SELECT FROM activities

### `GET /api/opportunities`

- **Input**: Query params: `type_filter`, `location_filter`, `min_match`, `skill_filter`, `search`, `sort_by`
- **Output**: `[OpportunityResponse]`
- **Logic**: Query active Opportunities. SQL filters for type and min_match. Post-query Python filters for location (string matching), skill (JSON array search), and text search across title/company/location/skills. Sorts by match_pct or title.
- **DB**: SELECT FROM opportunities WHERE is_active = True

### `GET /api/profile`

- **Input**: Bearer token
- **Output**: `{ user: UserResponse, skills: [], assessment_history: [], badges: [], preferences: {}, recent_activities: [], overall_skill_score, assessments_completed, verified_skills_count, opportunity_matches }`
- **Logic**: Queries all related tables for the user. Creates preferences if none exist via `_ensure_preferences()`. Calculates aggregate metrics.
- **DB**: 6+ SELECT queries

### `PUT /api/profile`

- **Input**: `{ name?, avatar? }`
- **Output**: `ProfileResponse` (calls get_profile)
- **Logic**: Validates name length → updates User fields → commits → returns full profile
- **DB**: UPDATE users, then SELECT (via get_profile)

### `GET /api/profile/preferences`

- **Output**: `{ preferred_language, preferred_roles, preferred_work_modes, preferred_industries, preferred_locations }`
- **Logic**: Find or create UserPreference → return as dict

### `PUT /api/profile/preferences`

- **Input**: `{ preferred_language?, preferred_roles?, preferred_work_modes?, preferred_industries?, preferred_locations? }`
- **Output**: Updated preferences dict
- **Logic**: Find or create UserPreference → update non-null fields → commit

### `GET /api/badges`

- **Output**: `[BadgeResponse]`
- **Logic**: Query user's badges. If none exist, create 3 defaults (Verified Developer, Fast Learner, Assessment Champion) and return them.
- **DB**: SELECT FROM badges, possibly INSERT 3 badges

---

## 7. Dashboard Flow

### Data Flow (traced through actual code)

```
Dashboard.jsx mounts → useEffect → loadDashboard()

loadDashboard():
  1. setLoading(true)
  2. const data = await getDashboard()  // apiService.js → GET /api/dashboard
  3. setDashboardData(data)
  4. setLoading(false)

useMemo derivations:
  userName     = dashboardData?.user?.name
  skills       = dashboardData?.skills || []
  activities   = dashboardData?.recent_activities || []
  opportunities = dashboardData?.top_opportunities || []

KPIs computed from:
  kpi[0] = dashboardData.verified_skills_count  ("Verified Skills")
  kpi[1] = dashboardData.overall_skill_score    ("Average Skill Score")
  kpi[2] = dashboardData.assessments_completed  ("Assessments Completed")
  kpi[3] = dashboardData.opportunity_matches    ("Opportunity Matches")
```

### How metrics are calculated (backend routes.py)

```
overall_skill_score = sum(user_skill.verified_score for all user_skills) / count(user_skills)
assessments_completed = COUNT(assessment_results WHERE user_id = ?)
verified_skills_count = COUNT(user_skills WHERE user_id = ? AND verified = True)
opportunity_matches = COUNT(opportunities WHERE is_active = True)  [static, not personalized]
```

---

## 8. Assessment Engine Deep Dive

### How assessment starts

1. User navigates to `/assessments` → `Assessments.jsx` → renders `<AssessmentChatbot />`
2. `AssessmentChatbot` mounts:
   - `useEffect` 1: Calls `getProfile()` from authService (`GET /auth/me`) to load user info
   - `useEffect` 2: Calls `fetchWithAuth('/start?language=English', { method: 'POST' })` → `POST /start` on backend
3. Backend `/start`:
   - Creates UUID session_id
   - Calls `agent.start_session(session_id)` → creates session in memory: `{ history: [], step: 1, language: "English" }`
   - Calls `agent._call_model(session)` → sends initial greeting via LLM
   - Returns `{ session_id, message }` (the AI's greeting)
4. Frontend stores session_id and renders the greeting message

### How chatbot works

1. User types message → `sendMessage()` in AssessmentChatbot
2. Skill tracking: First message is scanned for known skill names (python, javascript, react, etc.) → stored in `trackedSkill` state
3. User message added to local `messages` array
4. `fetchWithAuth('/chat', { method: 'POST', body: { session_id, message, language } })` sent to backend
5. Backend `/chat` → `agent.chat(session_id, message)`:
   - Appends user message to session history
   - Increments user_turn counter
   - Calls `agent._call_model(session)` → LLM generates response
   - `extract_json(response)` → parses any ```json blocks
   - `_get_step_from_text(response)` → detects step number from `## Step N` heading
   - Auto-chaining logic:
     - **After Step 3 (evaluation with score)**: Automatically generates Step 4 (project choices) by appending a prompt to history and calling LLM again → returns as `extra_messages`
     - **After Step 6 (build summary)**: Automatically generates Step 7 (job matches) similarly
   - Returns `{ message, json_data, extra_messages, session_id }`
6. Frontend processes response:
   - Creates message array with main response + any extra messages
   - **For each message with json_data containing `score`**: Calls `saveAssessmentResult()` to persist to database
   - Appends all messages to `messages` state

### How AI evaluates answers

The evaluation is driven by the `SYSTEM_PROMPT` in `agent.py`:

```
Step 3 — Skill Evaluation:
1. LLM writes 1-2 plain text sentences about strengths/improvements
2. LLM outputs JSON: { "score": 7, "strengths": [...], "improvements": [...] }
3. Score is on a 0-10 scale from the AI
```

### How score is generated and saved

```
Frontend receives: { score: 7, strengths: [...], improvements: [...] }
↓
AssessmentChatbot detects: typeof msg.jsonData.score === 'number'
↓
Converts to 0-100 scale: score100 = Math.min(100, score * 10) = 70
↓
Calls saveAssessmentResult(
  assessment_name = "AI Skill Assessment — Python",
  score = 70,
  skill_name = "Python",          // from trackedSkill
  strengths = ["clear logic", ...],
  improvements = ["add error handling", ...],
  status = "Verified"
)
```

### How UserSkill is updated (backend routes.py save_assessment_result)

```
1. If skill_name provided:
   a. Find or create Skill in master skills table
   b. Find existing UserSkill for this user + skill
   c. If no UserSkill exists:
      - Create new UserSkill with level based on score threshold
        - score >= 80 → "Advanced"
        - score >= 60 → "Intermediate"
        - else → "Beginner"
      - Set verified=True, assessment_count=1
   d. If UserSkill exists:
      - Update verified_score, increment assessment_count
      - Set verified=True
      - Update level based on new score
   e. Set last_evaluated_date = now
2. Create AssessmentResult record
3. Create Activity record ("Assessment completed")
4. db.commit()
```

### How dashboard updates afterward

After `saveAssessmentResult()` succeeds:
- `user_skills` table now has/updated a record
- `assessment_results` table now has a new record
- `activities` table now has a new record
- Next time Dashboard loads → `GET /api/dashboard` queries these tables → shows the skill, assessment count, and activity

---

## 9. Profile Page Deep Dive

### Profile.jsx API calls

```javascript
const [profile, badgeData, prefData] = await Promise.all([
  getProfile(),      // GET /api/profile → ProfileResponse
  getBadges(),       // GET /api/badges  → [BadgeResponse]
  getPreferences(),  // GET /api/profile/preferences → { preferred_language, ... }
])
```

### Where each data point comes from

| UI Element | Data Path | Source |
|------------|-----------|--------|
| Name | `profile.user.name` | `users.name` |
| Email | `profile.user.email` | `users.email` |
| Avatar text | `initials(user.name)` | Computed from name |
| Member since | `new Date(user.created_at).getFullYear()` | `users.created_at` |
| Overall skill score | `profile.overall_skill_score` | AVG(user_skills.verified_score) |
| Assessments completed | `profile.assessments_completed` | COUNT(assessment_results) |
| Verified skills | `profile.verified_skills_count` | COUNT(user_skills WHERE verified=True) |
| Opportunity matches | `profile.opportunity_matches` | COUNT(opportunities WHERE active) |
| Skills grid | `profile.skills` | user_skills JOIN skills |
| Assessment history | `profile.assessment_history` | assessment_results ordered by date |
| Badges | `badges` (separate API call) | badges table |
| Preferences | `preferences` (separate API call) | user_preferences table |
| Recent activities | `profile.recent_activities` | activities ordered by date, limit 10 |

---

## 10. Skills System

### Master skills table

- 30 pre-seeded skills in `skillbridge_v2.db`: Python, JavaScript, TypeScript, React, Node.js, SQL, HTML/CSS, Data Analysis, Machine Learning, Git/GitHub, Problem Solving, UI/UX, FastAPI, Django, Flask, C++, Java, Go, Rust, AWS, Docker, Kubernetes, State Management, APIs, Testing, Communication, Attention to Detail, Data Structures, Prototyping, Business Analysis
- Created by `seed_default_data()` in main.py on startup

### User skills table

- Links users to skills via `user_skills` junction table
- Each record tracks: verified_score (0-100), level, assessment_count, verified status
- Created when: assessment is saved with a skill_name, or user manually adds skill via POST /api/skills

### Verification process

1. Assessment chatbot completes Step 3 → saves assessment with score
2. Backend `save_assessment_result`:
   - Creates or updates `UserSkill`
   - Sets `verified=True` if score >= threshold
   - Updates level based on score
3. Skill appears as "Verified" in Skills page and Profile page

### Skill levels and thresholds

| Score Range | Level |
|-------------|-------|
| 0-59 | Beginner |
| 60-79 | Intermediate |
| 80-99 | Advanced |
| 100 | Expert |

### Verified status

- `verified=False`: Skill added but not yet assessed
- `verified=True`: At least one assessment completed with a passing score

---

## 11. Opportunities System

### Where opportunities come from

- Pre-seeded in `seed_default_data()` (main.py) — 9 static opportunities:
  1. Frontend Developer Intern — NovaWorks, Bengaluru (86% match)
  2. React Developer Intern — PulseStack, Remote (82% match)
  3. Full Stack Developer Intern — KiteCloud, Hyderabad (79% match)
  4. Python Backend Intern — DataForge Labs, Remote (84% match)
  5. Data Analyst — Pulse Analytics, Remote (77% match)
  6. AI/ML Intern — AstraMind, Chennai (81% match)
  7. UI/UX Design Intern — DesignSpring, Hybrid Bengaluru (75% match)
  8. Junior Software Engineer — ByteHarbor, Remote (78% match)
  9. Business Analyst Intern — LedgerWise, Hybrid Delhi (74% match)

### How matching works

- **Current implementation**: Match percentages are **static** (hardcoded in seed data). The `match_pct` field is not dynamically computed from user skills.
- Backend returns opportunities sorted by `match_pct` descending
- Frontend displays them in order with no personalized matching

### How scores influence recommendations

- **They don't currently**. The `required_score` field exists on opportunities but is never compared against user scores. The `match_pct` is a pre-set value.
- The assessment chatbot (Step 7) does generate **personalized** job recommendations via the LLM based on the conversation, but these are not stored in the database.

### Current limitations

1. No dynamic skill-to-opportunity matching algorithm
2. Opportunities are static, not user-specific
3. No save/apply functionality (buttons exist but do nothing)
4. The LLM-generated job matches in Step 7 are ephemeral (displayed in chat but not persisted)

---

## 12. State Management

### React state (no global state management)

The app uses **no Redux, no Context API, no Zustand** — purely local component state via `useState` and `useCallback`.

- **Auth state**: `localStorage.getItem("skillbridge_token")` — checked by `isAuthenticated()`
- **Each page manages its own data**: Dashboard has `dashboardData`, Profile has `profileData`, Skills has `skills`, etc.
- **No shared state between pages**: Each page fetches its own data on mount

### API service layer

- `authService.js`: Low-level `request()` function that wraps `fetch()` with JWT headers. Used for auth operations.
- `apiService.js`: Higher-level functions (getDashboard, getSkills, etc.) that call `request()` from authService.
- Both services parse JSON responses and throw on non-OK status.

### Protected routes

- `ProtectedRoute.jsx`: Simple token check → redirect to `/login` if no token
- No token refresh or validation on mount (assumes token is valid until API call fails)

### Data flow through components

```
Component mounts
  → useEffect triggers
    → async function calls apiService
      → apiService calls fetch with JWT
        → Response parsed
          → setState(data)
            → Component re-renders with data
              → useMemo derives computed values
                → JSX renders final UI
```

---

## 13. Key Features

### 1. Email/Password Authentication
- **Files**: Login.jsx, Signup.jsx, authService.js, auth.py, jwt_utils.py
- **APIs**: POST /auth/signup, POST /auth/login, GET /auth/me
- **Tables**: users

### 2. Google OAuth
- **Files**: Login.jsx (popup), OAuthCallback.jsx, authService.js, auth.py
- **APIs**: GET /auth/google/login, GET /auth/google/callback
- **Tables**: users (create or update with google_id, avatar)

### 3. AI Assessment Chatbot
- **Files**: AssessmentChatbot.jsx, ChatBubble.jsx, JsonCard.jsx, agent.py, llm_router.py
- **APIs**: POST /start, POST /chat, POST /api/assessments/save
- **Tables**: assessment_results, user_skills, activities, skills

### 4. Dashboard with KPIs
- **Files**: Dashboard.jsx, apiService.js, routes.py
- **APIs**: GET /api/dashboard
- **Tables**: users, user_skills, activities, opportunities, badges, assessment_results

### 5. Skills Management
- **Files**: Skills.jsx, apiService.js, routes.py
- **APIs**: GET /api/skills, POST /api/skills, PUT /api/skills/{id}/verify
- **Tables**: skills, user_skills

### 6. Opportunity Browsing
- **Files**: Opportunities.jsx, apiService.js, routes.py
- **APIs**: GET /api/opportunities
- **Tables**: opportunities

### 7. Profile with Verified Skills
- **Files**: Profile.jsx, apiService.js, routes.py
- **APIs**: GET /api/profile, GET /api/badges, GET /api/profile/preferences
- **Tables**: users, user_skills, assessment_results, badges, user_preferences, activities

### 8. Preferences (Persisted)
- **Files**: Settings.jsx, apiService.js, routes.py
- **APIs**: GET /api/profile/preferences, PUT /api/profile/preferences
- **Tables**: user_preferences

### 9. Achievement Badges
- **Files**: Profile.jsx, apiService.js, routes.py
- **APIs**: GET /api/badges
- **Tables**: badges (auto-created defaults)

### 10. Activity Feed
- **Files**: Dashboard.jsx, Profile.jsx, apiService.js, routes.py
- **APIs**: GET /api/activities, GET /api/dashboard, GET /api/profile
- **Tables**: activities (auto-created on assessment save and skill add)

---

## 14. Security Review

### JWT Security
- **Algorithm**: HS256 (symmetric) — adequate for single-server
- **Expiration**: 60 minutes — reasonable
- **Subject**: User email — stable identifier
- **Secret**: Hardcoded in .env as `your-secure-jwt-secret` — **WEAK, should be random**
- **No refresh tokens**: Users must re-login after 60 minutes

### Password Storage
- **Algorithm**: argon2 via passlib — **strong choice**, memory-hard
- **Minimum length**: 8 characters — acceptable

### User Isolation
- **All /api/* endpoints** use `Depends(get_current_user)` — each query filters by `current_user.id`
- Users cannot access other users' data through the API
- **Exception**: No ownership check on the `/api/skills` POST endpoint's `skill_name` query param

### Authorization Checks
- Every protected endpoint requires a valid JWT
- `get_current_user()` verifies: token is valid, email exists in DB, user is active
- **Missing**: No role-based access control (all users are equal)

### Potential Vulnerabilities
1. **CORS `allow_origins=["*"]`**: Any origin can make API requests — fine for dev, dangerous in production
2. **No rate limiting**: Brute-force login attempts are possible
3. **JWT secret is weak**: `your-secure-jwt-secret` is guessable
4. **localStorage for tokens**: Vulnerable to XSS attacks
5. **No CSRF protection**: Not critical for JWT-based API but worth noting
6. **Google client secret in .env**: Standard practice but should be rotated if exposed
7. **No input sanitization**: Pydantic validates types but no XSS protection on stored strings
8. **Agent sessions in memory**: Lost on server restart, no persistence

---

## 15. End-to-End User Journey

### Scenario: User signs up, takes Python assessment, sees results

```
STEP 1: SIGNUP
───────────────
Frontend: Signup.jsx → signup({ name: "Alice", email: "alice@example.com", password: "pass1234" })
Service:  authService.js → POST /auth/signup
Backend:  auth.py signup() → User(name="Alice", email="alice@example.com", password_hash=argon2("pass1234"))
Database: INSERT INTO users (name, email, password_hash, provider) → id=3
Response: { access_token: "eyJ..." }
Frontend: setToken("eyJ...") → localStorage.setItem("skillbridge_token", "eyJ...")
Navigate: /dashboard

STEP 2: DASHBOARD LOAD
───────────────────────
Frontend: Dashboard.jsx → useEffect → getDashboard()
Service:  apiService.js → GET /api/dashboard (Authorization: Bearer eyJ...)
Vite:     Proxy /api/* → http://127.0.0.1:8000/api/dashboard
Backend:  routes.py get_dashboard() → get_current_user() → User(id=3)
Database: SELECT user_skills WHERE user_id=3 → [] (empty, new user)
          SELECT activities WHERE user_id=3 → [] (empty)
          SELECT opportunities WHERE is_active=True → [9 rows]
          SELECT badges WHERE user_id=3 → [] (empty)
          SELECT assessment_results WHERE user_id=3 → count=0
Response: { user: {name:"Alice"}, skills:[], top_opportunities:[9 items], badges:[], ... }
Frontend: Renders welcome message, "No skills yet", 9 opportunities, "No recent activity"

STEP 3: START ASSESSMENT
─────────────────────────
Navigate: /assessments → Assessments.jsx → AssessmentChatbot.jsx
Chatbot:  useEffect → getProfile() via GET /auth/me → stores user
Chatbot:  useEffect → fetchWithAuth('/start?language=English', POST) → POST /start
Backend:  main.py start_session() → agent.start_session(uuid) → LLM greeting
Response: { session_id: "abc-123", message: "Hi! I'm SkillBridge AI..." }
Frontend: Renders AI greeting bubble

STEP 4: USER ANSWERS STEP 1 QUESTIONS
──────────────────────────────────────
User types: "I'm looking for an internship, I know Python, English"
Chatbot:  sendMessage() → tracks "python" → setTrackedSkill("Python")
          POST /chat { session_id, message, language }
Backend:  agent.chat() → appends to history → LLM processes → returns response
          Agent detects Step 1 answers all provided → chains to Step 2
Response: { message: "Great! Here's a coding task...", json_data: null }
Frontend: Renders AI response with Step 2 task

STEP 5: USER SUBMITS SOLUTION
─────────────────────────────
User types: "def fibonacci(n): a,b = 0,1; return [fibonacci(i) for i in range(n)]"
Chatbot:  POST /chat with solution
Backend:  agent.chat() → LLM evaluates → Step 3 response with JSON
          extract_json() → { score: 8, strengths: ["clean code"], improvements: ["add docs"] }
          Agent auto-chains: generates Step 4 (project choices) as extra_messages
Response: { message: "Your solution...", json_data: {score:8,...}, extra_messages: [{Step 4}] }

STEP 6: ASSESSMENT RESULT SAVED
────────────────────────────────
Frontend: AssessmentChatbot detects json_data.score === 8
          score100 = 8 * 10 = 80
          saveAssessmentResult("AI Skill Assessment — Python", 80, "Python", [...], [...], "Verified")
Service:  apiService.js → POST /api/assessments/save
Backend:  routes.py save_assessment_result():
          - CREATE AssessmentResult(user_id=3, skill_name="Python", score=80, ...)
          - FIND Skill WHERE name="Python" → id=5
          - CREATE UserSkill(user_id=3, skill_id=5, verified_score=80, level="Intermediate", verified=True)
          - CREATE Activity(user_id=3, title="Assessment completed", detail="AI Skill Assessment — Python — Score: 80% — Verified")
          - COMMIT all 3 records

STEP 7: DASHBOARD UPDATES
──────────────────────────
Navigate: /dashboard
Frontend: getDashboard() → GET /api/dashboard
Backend:  Queries now return:
          - user_skills: [{ name: "Python", verified_score: 80, level: "Intermediate" }]
          - activities: [{ title: "Assessment completed", detail: "..." }]
          - overall_skill_score: 80
          - verified_skills_count: 1
          - assessments_completed: 1
Frontend: Renders skill card "Python 80% Intermediate", activity feed, updated KPIs

STEP 8: PROFILE UPDATES
────────────────────────
Navigate: /profile
Frontend: getProfile() → GET /api/profile
Backend:  Returns full ProfileResponse with user, skills, assessment_history, badges, preferences
Frontend: Shows name, email, Python skill, assessment timeline with score 80, 3 badges
```

---

## 16. Code Quality Review

### Strengths

1. **Clean separation of concerns**: Backend models/schemas/routes/auth are well-separated. Frontend pages/components/services are cleanly organized.
2. **Pydantic validation**: All API inputs validated with Pydantic models (EmailStr, min_length, etc.)
3. **SQLAlchemy ORM**: Proper relationships, foreign keys, cascade deletes
4. **Dual LLM provider**: Automatic GPT-4o → Groq fallback for reliability
5. **Multi-step assessment**: Sophisticated 7-step workflow with auto-chaining and user attempt detection
6. **Backend filtering**: Skills and opportunities support server-side search/filter/sort
7. **Responsive chat UI**: Voice input, markdown rendering, JSON card visualization

### Weaknesses

1. **No global state management**: Every page re-fetches data independently. No shared auth context, no data caching.
2. **In-memory session storage**: Assessment sessions (`agent.sessions`) lost on server restart. Not suitable for multiple workers.
3. **Static opportunity matching**: Match percentages are hardcoded, not computed from user skills.
4. **No error boundary**: React error boundaries are not implemented. A crash in one component brings down the page.
5. **Single CSS file**: All styles in `App.css` — no CSS modules, no component-scoped styles.
6. **No TypeScript**: Entire frontend is plain JavaScript — no type safety.
7. **No tests**: Zero unit tests, integration tests, or end-to-end tests.

### Technical Debt

1. **CORS `allow_origins=["*"]`**: Needs restriction for production
2. **Weak JWT secret**: `your-secure-jwt-secret` in .env
3. **No token refresh**: 60-minute hard timeout
4. **Duplicated code**: `getProfile()` exists in both authService.js and apiService.js (different endpoints)
5. **Agent sessions not persisted**: Would need Redis/DB for production
6. **Frontend has two getProfile functions**: `authService.getProfile()` hits `/auth/me`, `apiService.getProfile()` hits `/api/profile`

### Refactoring Opportunities

1. Add React Context for auth state (avoid repeated localStorage reads)
2. Implement SWR/React Query for data fetching and caching
3. Move opportunity matching to a proper scoring algorithm
4. Add database session storage for assessment sessions (replace in-memory dict)
5. Extract CSS into component-level modules
6. Add TypeScript for type safety
7. Add API documentation (auto-generated from Pydantic schemas)

### Scalability Concerns

1. SQLite doesn't support concurrent writes — would need PostgreSQL for production
2. In-memory agent sessions can't scale horizontally
3. No pagination on list endpoints (opportunities, activities)
4. No CDN for frontend assets
5. No background job queue for assessment processing

---

## 17. Interview Explanation

### 30-Second Explanation

"SkillBridge is an AI-powered skill assessment platform that replaces traditional resumes with verified skill scores. Users have a guided conversation with an AI chatbot that tests their coding abilities, evaluates their solutions, and generates verified skill scores. These scores are used to match users with relevant job and internship opportunities. The stack is React + FastAPI + SQLAlchemy + SQLite, with GPT-4o as the primary AI and Groq Llama as fallback."

### 2-Minute Explanation

"SkillBridge solves the resume-first hiring problem by letting candidates prove their skills through AI assessment rather than listing credentials. The platform has three core systems:

**First**, an AI assessment engine built as a 7-step conversational workflow. The chatbot asks about the user's skills, gives them a practical coding task, evaluates their solution with a scored assessment, then suggests projects and job opportunities. The entire assessment is powered by GPT-4o with automatic fallback to Groq's Llama model for reliability.

**Second**, a verified skills system. When the AI evaluates a user's answer, the score is persisted to the database, creating verified skill records with levels (Beginner through Expert). These verified skills appear on the user's profile as a 'skill passport' — proof of capability that employers can trust.

**Third**, an opportunity matching system with 9 pre-seeded opportunities across different companies and locations, filterable by type, location, skill tags, and match percentage.

On the technical side, I built a React SPA with Vite, a FastAPI backend with SQLAlchemy ORM, JWT authentication with argon2 password hashing, Google OAuth integration, and a dual-provider LLM routing system with automatic failover."

### 5-Minute Deep Technical Explanation

"The architecture follows a clean three-tier pattern:

**Frontend** is a React 18 SPA with React Router v6. The app shell uses a `SaaSLayout` with a sidebar and top navbar. Each page independently fetches its data on mount using `useEffect` + `useState`. There's no global state management — each page manages its own data lifecycle. The Vite dev server proxies all `/api/*` requests to the backend.

**Backend** is FastAPI with two routers: `auth.py` for authentication and `routes.py` for data operations. Authentication uses JWT tokens with email as the subject claim, stored in localStorage. Passwords are hashed with argon2. The `get_current_user` dependency handles token validation on every protected endpoint.

The **most interesting technical challenge** was the AI assessment engine. It's a 7-step conversational workflow defined in a system prompt, managed by `SkillBridgeAgent`. The agent maintains in-memory session state including conversation history and current step number. Key design decisions:

1. **Auto-chaining**: After Step 3 (evaluation), the agent automatically generates Step 4 (project choices) in the same response by calling the LLM twice. This gives users a seamless experience without manual navigation.

2. **User attempt detection**: Before showing the evaluation, the agent checks if the user actually provided a solution. If they say 'I'm stuck', it stays in Step 2 and gives a hint instead of evaluating an empty answer.

3. **JSON extraction**: The agent parses structured data (evaluations, project lists, job matches) from markdown code blocks in the LLM response, allowing the frontend to render rich JSON cards alongside the conversational text.

4. **Dual-provider failover**: `ModelRouter` tries GPT-4o first, catches any exception, and falls back to Groq's Llama 3.1 8B model automatically. This ensures the assessment works even if OpenAI is down.

The **database schema** uses 8 tables with proper relationships. The key junction table is `user_skills` which links users to the master skills catalog and tracks verified scores and levels. When an assessment is saved, it creates an `assessment_result`, updates the `user_skill` record (or creates one), and logs an `activity` — all in a single transaction.

**Opportunity matching** is currently static with pre-seeded match percentages. The next evolution would be a dynamic scoring algorithm that computes match_pct based on the overlap between a user's verified skills and an opportunity's required skills."