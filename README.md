# SkillBridge AI

> **Hackathon demo** — zero to job-ready in under 4 minutes.  
> No resume needed. Just show up and type.

## What it does

A single AI agent guides a user through a strict 7-step flow:

| Step | What happens |
|------|-------------|
| 1 | 3 onboarding questions (opportunity, skills, language) |
| 2 | One practical skill test task |
| 3 | JSON evaluation with score + feedback |
| 4 | 2 tailored beginner projects |
| 5 | Guided build of Step 1 |
| 6 | Show-your-work summary |
| 7 | Job/internship matches |

## Tech stack

- **Frontend** — React 18 + Vite (chat UI)
- **Backend** — FastAPI + Python
- **AI** — OpenAI GPT-4o (primary) with Groq Llama 3.1 8B Instant (fallback).
  The service can also run in **Groq-only** mode with no OpenAI dependency.

## LLM provider modes

The backend (`backend/llm_router.py`) picks a provider based on the
environment variables you set:

| `OPENAI_API_KEY` | `GROQ_API_KEY` | Behaviour |
|------------------|----------------|-----------|
| ✅ set           | ✅ set          | OpenAI (GPT-4o) is primary, Groq is the automatic runtime fallback |
| ❌ empty         | ✅ set          | **Groq-only mode** — OpenAI is skipped entirely, Groq is the only provider |
| ✅ set           | ❌ empty        | OpenAI only (no fallback — model calls will fail if OpenAI errors) |
| ❌ empty         | ❌ empty        | App starts, but model calls return a clear runtime error |

> **Cheapest / simplest deployment:** set `GROQ_API_KEY` only and leave
> `OPENAI_API_KEY` empty. The app will start normally and run entirely
> on Groq.

Check which mode is active at runtime:

```bash
curl http://localhost:8000/health
# { "status": "ok", "llm": { "openai_configured": false, "groq_configured": true, "active_provider": "Groq only" } }
```

## Setup

### 1. Get an LLM API key

Pick **one** of the two:

- **Groq (recommended for low cost / free tier):** <https://console.groq.com/keys>
- **OpenAI:** <https://platform.openai.com/api-keys>

> If you supply **both** keys, OpenAI is used as the primary model and
> Groq becomes the automatic fallback.

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and paste your GROQ_API_KEY (recommended) or OPENAI_API_KEY
# For a Groq-only deployment, leave OPENAI_API_KEY empty.

uvicorn main:app --reload
# Runs on http://localhost:8000
```

On startup you should see a banner like:

```
================================================================
[llm_router] LLM provider status
[llm_router]   OPENAI_API_KEY: disabled
[llm_router]   GROQ_API_KEY : ENABLED
[llm_router]   Mode         : Groq only (no OpenAI dependency)
================================================================
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) — done.

## Project structure

```
SkillBridge/
├── backend/
│   ├── agent.py          # SkillBridge AI agent (7-step workflow)
│   ├── llm_router.py     # LLM provider router (OpenAI + Groq, with Groq-only mode)
│   ├── main.py           # FastAPI endpoints (/start, /chat, /health)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx        # Chat shell + session management
    │   ├── App.css        # Dark theme
    │   └── components/
    │       ├── ChatBubble.jsx  # Message renderer (text + markdown)
    │       └── JsonCard.jsx    # Typed cards for eval/projects/jobs
    ├── package.json
    └── vite.config.js
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/start` | Create session → returns `session_id` + opening message |
| POST | `/chat` | `{ session_id, message }` → `{ message, json_data, session_id }` |
| GET | `/health` | Liveness + active LLM provider info |

## Deployment (Render / Railway / Fly / etc.)

The only **required** environment variables for the backend are:

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET_KEY` | **yes** | Generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `DATABASE_URL` | recommended | Defaults to local SQLite if unset |
| `CORS_ORIGINS` | recommended | Comma-separated list of allowed frontend origins |
| `FRONTEND_URL` | recommended | Public URL of the frontend |
| `GROQ_API_KEY` | **yes (for AI)** | Get a key at <https://console.groq.com/keys> |
| `OPENAI_API_KEY` | optional | Leave empty for a Groq-only deployment |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Only if you want Google OAuth |

See `render.yaml` for a working Render blueprint.

## Demo flow (3–4 min)

1. User opens the app — AI asks 3 questions
2. User types something like: *"I want a job, I know a bit of Python, English"*
3. AI gives a task: *"Write a function to reverse a string"*
4. User writes a rough answer
5. AI evaluates → shows JSON score card
6. AI shows 2 projects → user picks one step to attempt
7. AI generates build summary + job matches
